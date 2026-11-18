import { CameraView, type CameraType, type PictureRef, useCameraPermissions } from 'expo-camera';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { base64ToBytes } from '@/engine/base64';
import { groupPeople, labelRegions } from '@/engine/regions';
import { type PoseProgress, useSegmenter } from '@/engine/segmentation/SegmenterProvider';
import type { FrameOptions } from '@/engine/segmentation/types';
import { photoFeatures } from '@/features/composition/features';
import { reviewPhoto } from '@/features/composition/review';
import type { TechniqueId } from '@/features/composition/techniques';
import { MIN_PERSON_RATIO } from '@/features/pose/createFromImage';
import { useLiveSpikeCamera } from '@/features/spike/liveCameraLock';
import { Button, IconButton, Segmented } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, radius, space, type } from '@/ui/tokens';

/**
 * Spike gợi ý lúc ngắm (roadmap Phase 5 Bước 3): chụp ảnh nhỏ liên tục bằng
 * `takePictureAsync({ shutterSound: false })` (Expo Go không có frame processor), thu nhỏ, gửi
 * vào WebView tách người đang có (bản nhẹ `analyzeFrame`), rút đặc trưng và áp quy tắc nhận xét
 * như sau khi chụp. Đo lần / giây, độ trễ từng bước, số lần dòng gợi ý đổi. Pin và nhiệt người
 * thử tự ghi. Kết quả vào docs/phase5-test.md, quyết định ở cổng cuối tuần 2. Xóa sau cổng.
 */

type Facing = 'back' | 'front';
type SizeMode = 'default' | 'small';
type Capture = 'ref' | 'file';
type Mode = 'body' | 'both' | 'seg';
type Side = '192' | '256' | '384';
type Delegate = 'cpu' | 'gpu';
type Tech = Extract<TechniqueId, 'thirds' | 'center' | 'fill'>;

type Sample = {
  start: number;
  end: number;
  capture: number;
  resize: number;
  decode: number;
  seg: number;
  body: number;
  web: number;
  rule: number;
};

type Overlay = {
  eye: { x: number; y: number } | null;
  box: [number, number, number, number] | null;
  text: string;
};

type Stats = {
  frames: number;
  rate: number;
  latency: number;
  latencyMax: number;
  capture: number;
  resize: number;
  decode: number;
  seg: number;
  body: number;
  rule: number;
};

const NONE: Stats = {
  frames: 0,
  rate: 0,
  latency: 0,
  latencyMax: 0,
  capture: 0,
  resize: 0,
  decode: 0,
  seg: 0,
  body: 0,
  rule: 0,
};

/** Cửa sổ tính lần / giây và trung bình. */
const WINDOW_MS = 10_000;

function summarize(all: Sample[]): Stats {
  // Khung đầu tiên gồm cả nạp model: không tính.
  const warm = all.slice(1);
  if (!warm.length) return { ...NONE, frames: all.length };
  const last = warm[warm.length - 1]!;
  const recent = warm.filter((s) => s.end >= last.end - WINDOW_MS);
  const span = (last.end - recent[0]!.start) / 1000;
  const avg = (f: (s: Sample) => number) => recent.reduce((a, s) => a + f(s), 0) / recent.length;
  return {
    frames: all.length,
    rate: span > 0 ? recent.length / span : 0,
    latency: avg((s) => s.end - s.start),
    latencyMax: Math.max(...warm.map((s) => s.end - s.start)),
    capture: avg((s) => s.capture),
    resize: avg((s) => s.resize),
    decode: avg((s) => s.decode),
    seg: avg((s) => s.seg),
    body: avg((s) => s.body),
    rule: avg((s) => s.rule),
  };
}

/** Cỡ nhỏ nhất tỉ lệ 4:3 (để khung xem không đổi), cạnh dài từ 640. */
function smallestSize(sizes: string[]): string | null {
  let best: { s: string; area: number } | null = null;
  for (const s of sizes) {
    const m = /(\d+)x(\d+)/.exec(s);
    if (!m) continue;
    const a = Number(m[1]);
    const b = Number(m[2]);
    const long = Math.max(a, b);
    if (long < 640 || Math.abs(long / Math.min(a, b) - 4 / 3) > 0.02) continue;
    if (!best || a * b < best.area) best = { s, area: a * b };
  }
  return best?.s ?? null;
}

const deleteFile = (uri: string) => {
  try {
    new File(uri).delete();
  } catch {
    // File tạm trong cache; xóa hụt không sao.
  }
};

export default function LiveHintSpike() {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const { analyzeFrame } = useSegmenter();
  const camRef = useRef<CameraView>(null);

  const [facing, setFacing] = useState<Facing>('back');
  const [sizeMode, setSizeMode] = useState<SizeMode>('default');
  const [capture, setCapture] = useState<Capture>('ref');
  const [mode, setMode] = useState<Mode>('both');
  const [side, setSide] = useState<Side>('256');
  const [delegate, setDelegate] = useState<Delegate>('cpu');
  const [tech, setTech] = useState<Tech>('thirds');

  const [ready, setReady] = useState(false);
  const [smallSize, setSmallSize] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>(NONE);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [errors, setErrors] = useState<{ count: number; last: string | null }>({
    count: 0,
    last: null,
  });
  const [changes, setChanges] = useState(0);
  const [info, setInfo] = useState<{ picture: string; backend: string }>({
    picture: '',
    backend: '',
  });

  const runningRef = useRef(false);
  /** Dòng gợi ý của khung trước, để đếm số lần đổi (độ nháy của gợi ý). */
  const lastText = useRef<string | null>(null);
  // Cấu hình đọc ở mỗi khung, đổi được khi đang đo.
  const cfg = useRef({ capture, mode, side, delegate, tech, facing });
  useEffect(() => {
    cfg.current = { capture, mode, side, delegate, tech, facing };
  });

  // Camera chính nhường phiên camera cho màn này.
  useEffect(() => {
    useLiveSpikeCamera.getState().setBusy(true);
    return () => {
      runningRef.current = false;
      useLiveSpikeCamera.getState().setBusy(false);
    };
  }, []);

  const camW = screenW - space[4] * 2;
  const camH = (camW * 4) / 3;

  const onReady = async () => {
    setReady(true);
    try {
      const sizes = (await camRef.current?.getAvailablePictureSizesAsync()) ?? [];
      setSmallSize(smallestSize(sizes));
    } catch {
      setSmallSize(null);
    }
  };

  const onProgress = (p: PoseProgress) => {
    setStage(p.stage === 'download' ? t.spike.liveDownload : t.spike.liveLoading);
  };

  const frame = async (cam: CameraView): Promise<Sample> => {
    const c = cfg.current;
    const start = performance.now();
    let src: string | PictureRef;
    let w: number;
    let h: number;
    let picFile: string | null = null;
    let picRef: PictureRef | null = null;
    if (c.capture === 'ref') {
      picRef = await cam.takePictureAsync({ pictureRef: true, shutterSound: false });
      src = picRef;
      w = picRef.width;
      h = picRef.height;
    } else {
      const pic = await cam.takePictureAsync({ quality: 0.5, shutterSound: false });
      src = pic.uri;
      picFile = pic.uri;
      w = pic.width;
      h = pic.height;
    }
    const t1 = performance.now();
    const sidePx = Number(c.side);
    const ctx = ImageManipulator.manipulate(src);
    if (w >= h) ctx.resize({ width: sidePx });
    else ctx.resize({ height: sidePx });
    const img = await ctx.renderAsync();
    const out = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
    ctx.release();
    img.release();
    picRef?.release();
    deleteFile(out.uri);
    if (picFile) deleteFile(picFile);
    if (!out.base64) throw new Error('Không đọc được ảnh nhỏ');
    const t2 = performance.now();

    const opts: FrameOptions = {
      seg: c.mode !== 'body',
      body: c.mode !== 'seg',
      gridSide: 96,
      bodyGpu: c.delegate === 'gpu',
    };
    const r = await analyzeFrame(out.base64, opts, onProgress);
    const t3 = performance.now();

    let people: { bbox: [number, number, number, number]; areaRatio: number }[] = [];
    let gw = 1;
    let gh = 1;
    if (r.grid) {
      const bytes = base64ToBytes(r.grid.base64);
      const prob = new Float32Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) prob[i] = bytes[i]! / 255;
      gw = r.grid.width;
      gh = r.grid.height;
      people = groupPeople(labelRegions({ width: gw, height: gh, data: prob }), MIN_PERSON_RATIO);
    }
    const f = photoFeatures({
      width: r.width,
      height: r.height,
      gridW: gw,
      gridH: gh,
      people,
      body: r.bodyPoints,
    });
    const review = reviewPhoto(c.tech, f);
    const t4 = performance.now();

    const note = review.notes[0];
    const text = note
      ? t.review.notes[note.id]
      : f.main < 0 && !f.eye
        ? t.spike.liveNoPerson
        : t.spike.liveAllGood;
    const flip = c.facing === 'front';
    const box = f.main >= 0 ? f.people[f.main]!.box : null;
    if (lastText.current !== null && lastText.current !== text) setChanges((n) => n + 1);
    lastText.current = text;
    setOverlay({
      eye: f.eye ? { x: flip ? 1 - f.eye.x : f.eye.x, y: f.eye.y } : null,
      box: box ? (flip ? [1 - box[2], box[1], 1 - box[0], box[3]] : box) : null,
      text,
    });
    setInfo({ picture: `${w}×${h}`, backend: r.backend });
    setStage(null);

    return {
      start,
      end: t4,
      capture: t1 - start,
      resize: t2 - t1,
      decode: r.timings.decodeMs,
      seg: r.timings.segMs,
      body: r.timings.bodyMs,
      web: t3 - t2,
      rule: t4 - t3,
    };
  };

  const start = async () => {
    const cam = camRef.current;
    if (!cam || runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setStats(NONE);
    setOverlay(null);
    setChanges(0);
    lastText.current = null;
    setErrors({ count: 0, last: null });
    const samples: Sample[] = [];
    const t0 = performance.now();
    while (runningRef.current) {
      try {
        samples.push(await frame(cam));
        if (samples.length > 2000) samples.splice(1, samples.length - 2000);
        setStats(summarize(samples));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setErrors((x) => ({ count: x.count + 1, last: msg }));
        // Lỗi liên tục (camera bị hệ điều hành lấy lại): nghỉ một chút rồi thử tiếp.
        await new Promise((r) => setTimeout(r, 500));
      }
      setElapsed(performance.now() - t0);
    }
    setStage(null);
  };

  const stop = () => {
    runningRef.current = false;
    setRunning(false);
  };

  const ms = (v: number) => `${Math.round(v)} ms`;
  const mmss = (v: number) => {
    const s = Math.floor(v / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const rows: [string, string][] = [
    [t.spike.liveRate, stats.rate.toFixed(1)],
    [t.spike.liveLatency, ms(stats.latency)],
    [t.spike.liveLatencyMax, ms(stats.latencyMax)],
    [t.spike.liveStepCapture, ms(stats.capture)],
    [t.spike.liveStepResize, ms(stats.resize)],
    [t.spike.liveStepDecode, ms(stats.decode)],
    [t.spike.liveStepSeg, ms(stats.seg)],
    [t.spike.liveStepBody, ms(stats.body)],
    [t.spike.liveStepRule, ms(stats.rule)],
    [t.spike.liveFrames, String(stats.frames)],
    [t.spike.liveElapsed, mmss(elapsed)],
    [t.spike.liveHintChanges, String(changes)],
    [t.spike.liveErrors, errors.last ? `${errors.count} · ${errors.last}` : String(errors.count)],
    [t.spike.livePictureSize, info.picture],
    [t.spike.liveBackend, info.backend],
  ];

  const header = (
    <View style={styles.header}>
      <IconButton icon={ChevronLeft} label={t.common.back} onPress={() => router.back()} />
      <Text style={[type.head, styles.ink]}>{t.spike.liveTitle}</Text>
    </View>
  );

  if (!permission?.granted) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + space[2] }]}>
        {header}
        <View style={styles.pad}>
          <Text style={[type.body, styles.muted]}>{t.spike.liveNeedCamera}</Text>
          <Button label={t.spike.liveGrant} onPress={requestPermission} variant="primary" />
        </View>
      </View>
    );
  }

  const pictureSize = sizeMode === 'small' && smallSize ? smallSize : undefined;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + space[2], paddingBottom: insets.bottom + space[6] }}
    >
      {header}
      <View style={styles.pad}>
        <Text style={[type.caption, styles.muted]}>{t.spike.liveIntro}</Text>

        <View style={[styles.cam, { width: camW, height: camH }]}>
          <CameraView
            // Đổi cỡ chụp / camera thì dựng lại phiên camera cho chắc.
            key={`${facing}-${pictureSize ?? 'default'}`}
            ref={camRef}
            style={StyleSheet.absoluteFill}
            facing={facing as CameraType}
            ratio="4:3"
            pictureSize={pictureSize}
            animateShutter={false}
            onCameraReady={onReady}
          />
          {overlay?.box && (
            <View
              pointerEvents="none"
              style={[
                styles.box,
                {
                  left: overlay.box[0] * camW,
                  top: overlay.box[1] * camH,
                  width: (overlay.box[2] - overlay.box[0]) * camW,
                  height: (overlay.box[3] - overlay.box[1]) * camH,
                },
              ]}
            />
          )}
          {overlay?.eye && (
            <View
              pointerEvents="none"
              style={[styles.eye, { left: overlay.eye.x * camW - 6, top: overlay.eye.y * camH - 6 }]}
            />
          )}
          {/* Đường 1/3 để soi độ trễ của chấm mắt. */}
          {[1 / 3, 2 / 3].map((k) => (
            <View key={`h${k}`} pointerEvents="none" style={[styles.lineH, { top: k * camH }]} />
          ))}
          {[1 / 3, 2 / 3].map((k) => (
            <View key={`v${k}`} pointerEvents="none" style={[styles.lineV, { left: k * camW }]} />
          ))}
          {(stage || overlay) && (
            <View pointerEvents="none" style={styles.pill}>
              <Text style={[type.caption, styles.pillText]}>{stage ?? overlay?.text}</Text>
            </View>
          )}
        </View>

        <Button
          label={running ? t.spike.liveStop : t.spike.liveStart}
          onPress={running ? stop : start}
          variant="primary"
          disabled={!ready}
          fullWidth
        />

        <View style={styles.table}>
          {rows.map(([k, v]) => (
            <View key={k} style={styles.row}>
              <Text style={[type.caption, styles.muted]}>{k}</Text>
              <Text style={[type.caption, styles.ink, styles.value]} numberOfLines={2}>
                {v}
              </Text>
            </View>
          ))}
        </View>

        <Option label={t.spike.liveTech}>
          <Segmented<Tech>
            value={tech}
            onChange={setTech}
            options={[
              { key: 'thirds', label: t.composition.names.thirds },
              { key: 'center', label: t.composition.names.center },
              { key: 'fill', label: t.composition.names.fill },
            ]}
          />
        </Option>
        <Option label={t.spike.liveMode}>
          <Segmented<Mode>
            value={mode}
            onChange={setMode}
            options={[
              { key: 'body', label: t.spike.liveModeBody },
              { key: 'both', label: t.spike.liveModeBoth },
              { key: 'seg', label: t.spike.liveModeSeg },
            ]}
          />
        </Option>
        <Option label={t.spike.liveSide}>
          <Segmented<Side>
            value={side}
            onChange={setSide}
            options={[
              { key: '192', label: '192' },
              { key: '256', label: '256' },
              { key: '384', label: '384' },
            ]}
          />
        </Option>
        <Option label={t.spike.liveCapture}>
          <Segmented<Capture>
            value={capture}
            onChange={setCapture}
            options={[
              { key: 'ref', label: t.spike.liveCaptureRef },
              { key: 'file', label: t.spike.liveCaptureFile },
            ]}
          />
        </Option>
        <Option label={t.spike.liveBodyGpu}>
          <Segmented<Delegate>
            value={delegate}
            onChange={setDelegate}
            options={[
              { key: 'cpu', label: 'CPU' },
              { key: 'gpu', label: 'GPU' },
            ]}
          />
        </Option>
        {/* Đổi camera / cỡ chụp dựng lại camera: chỉ đổi khi đã dừng đo. */}
        <Option label={t.spike.liveSize}>
          <Segmented<SizeMode>
            value={sizeMode}
            onChange={(v) => {
              if (running) return;
              setReady(false);
              setSizeMode(v);
            }}
            options={[
              { key: 'default', label: t.spike.liveSizeDefault },
              { key: 'small', label: t.spike.liveSizeSmall, disabled: !smallSize },
            ]}
          />
        </Option>
        <Option label={t.spike.liveFacing}>
          <Segmented<Facing>
            value={facing}
            onChange={(v) => {
              if (running) return;
              setReady(false);
              setOverlay(null);
              setFacing(v);
            }}
            options={[
              { key: 'back', label: t.spike.liveFacingBack },
              { key: 'front', label: t.spike.liveFacingFront },
            ]}
          />
        </Option>
      </View>
    </ScrollView>
  );
}

function Option({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.option}>
      <Text style={[type.caption, styles.muted]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[2],
    paddingBottom: space[2],
  },
  pad: { paddingHorizontal: space[4], gap: space[4] },
  ink: { color: color.ink },
  muted: { color: color.muted },
  cam: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: color.camBg },
  box: { position: 'absolute', borderWidth: 2, borderColor: color.camAccent, borderRadius: radius.sm },
  eye: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: color.camAccent,
    borderWidth: 2,
    borderColor: color.onImage,
  },
  lineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: color.guide,
  },
  lineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: color.guide,
  },
  pill: {
    position: 'absolute',
    left: space[3],
    right: space[3],
    bottom: space[3],
    paddingVertical: space[2],
    paddingHorizontal: space[3],
    borderRadius: radius.full,
    backgroundColor: color.camHint,
    alignItems: 'center',
  },
  pillText: { color: color.camInk },
  table: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
    paddingHorizontal: space[3],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space[3],
    paddingVertical: space[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.line,
  },
  value: { flexShrink: 1, textAlign: 'right' },
  option: { gap: space[2] },
});
