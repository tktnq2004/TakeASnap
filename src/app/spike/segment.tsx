import { Asset } from 'expo-asset';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { prepareImage } from '@/engine/image';
import type { SegmentModelId, SegmentTimings } from '@/engine/segmentation/types';
import { useWebSegmenter } from '@/engine/segmentation/WebSegmenterBridge';
import { samplePoses } from '@/features/pose/samples';
import { MaskPreview, type PreviewMode } from '@/features/spike/MaskPreview';
import { Button, IconButton, Segmented } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, radius, size, space, type } from '@/ui/tokens';

/**
 * Spike B (roadmap §4, Phase 0): so 4 model tách người chạy trong WebView ẩn trên máy thật.
 * Ghi thời gian và chất lượng mép vào docs/spikes.md.
 */

const models = [
  { key: 'multiclass', label: 'Multiclass' },
  { key: 'selfie', label: 'Selfie' },
  { key: 'deeplab', label: 'DeepLab' },
  { key: 'rmbg', label: 'RMBG' },
] as const;

const modes = [
  { key: 'cut', label: t.spike.segmentViewCut },
  { key: 'mask', label: t.spike.segmentViewMask },
  { key: 'source', label: t.spike.segmentViewSource },
] as const;

type Row = {
  key: string;
  name: string;
  model: SegmentModelId;
  ok: boolean;
  error?: string;
  photoUri?: string;
  maskBase64?: string;
  width?: number;
  height?: number;
  backend?: string;
  /** Thu nhỏ ảnh + base64 phía RN. */
  rnPrepMs: number;
  timings?: SegmentTimings;
  /** Từ lúc gửi vào WebView tới lúc nhận mask. */
  roundtripMs: number;
};

type Input = { name: string; uri: string; width: number; height: number };

export default function SegmentSpike() {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const seg = useWebSegmenter();
  const [model, setModel] = useState<SegmentModelId>('multiclass');
  const [rows, setRows] = useState<Row[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [selected, setSelected] = useState<Row | null>(null);
  const [mode, setMode] = useState<PreviewMode>('cut');

  const runOne = async (input: Input, m: SegmentModelId): Promise<Row> => {
    const t0 = performance.now();
    const prepared = await prepareImage(input.uri, input.width, input.height, 1024);
    const t1 = performance.now();
    try {
      const r = await seg.run(m, prepared.base64);
      return {
        key: `${m}-${input.name}-${t0}`,
        name: input.name,
        model: m,
        ok: true,
        photoUri: prepared.uri,
        maskBase64: r.maskBase64,
        width: r.width,
        height: r.height,
        backend: r.backend,
        rnPrepMs: t1 - t0,
        timings: r.timings,
        roundtripMs: performance.now() - t1,
      };
    } catch (e) {
      return {
        key: `${m}-${input.name}-${t0}`,
        name: input.name,
        model: m,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        rnPrepMs: t1 - t0,
        roundtripMs: performance.now() - t1,
      };
    }
  };

  const runAll = async () => {
    setRows([]);
    setSelected(null);
    const out: Row[] = [];
    for (let i = 0; i < samplePoses.length; i++) {
      const s = samplePoses[i]!;
      setProgress(`${t.spike.segmentRunning} ${i + 1}/${samplePoses.length}`);
      const [asset] = await Asset.loadAsync(s.source);
      if (!asset?.localUri || !asset.width || !asset.height) continue;
      const row = await runOne(
        { name: s.id, uri: asset.localUri, width: asset.width, height: asset.height },
        model,
      );
      out.push(row);
      setRows([...out]);
    }
    setProgress(null);
  };

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    const a = res.canceled ? null : res.assets[0];
    if (!a) return;
    setProgress(`${t.spike.segmentRunning} 1/1`);
    const row = await runOne({ name: a.fileName ?? 'ảnh của bạn', ...a }, model);
    setRows((r) => [row, ...r]);
    setSelected(row.ok ? row : null);
    setProgress(null);
  };

  const done = rows.filter((r) => r.ok && r.model === model);
  const avg = (f: (r: Row) => number) =>
    done.length ? done.reduce((s, r) => s + f(r), 0) / done.length : 0;
  const firstLoad = done.find((r) => (r.timings?.loadMs ?? 0) > 0)?.timings?.loadMs ?? 0;
  // Bỏ ảnh đầu khi tính trung bình nếu ảnh đó phải nạp model.
  const warm = done.filter((r) => (r.timings?.loadMs ?? 0) === 0);
  const avgWarm = (f: (r: Row) => number) =>
    warm.length ? warm.reduce((s, r) => s + f(r), 0) / warm.length : avg(f);
  const stats: [string, string][] = [
    [t.spike.segmentBackend, done[0]?.backend ?? '—'],
    [t.spike.segmentLoadModel, ms(firstLoad)],
    [t.spike.segmentAvgInfer, ms(avgWarm((r) => r.timings?.inferMs ?? 0))],
    [t.spike.segmentAvgTotal, ms(avgWarm((r) => r.rnPrepMs + r.roundtripMs))],
    [t.spike.segmentMaxTotal, ms(Math.max(0, ...warm.map((r) => r.rnPrepMs + r.roundtripMs)))],
    [t.spike.segmentErrors, String(rows.filter((r) => !r.ok).length)],
  ];

  const previewW = screenW - size.gutter * 2;
  const previewH = selected?.width ? (previewW * (selected.height ?? 1)) / selected.width : 0;
  const busy = progress !== null || !seg.ready;

  return (
    <View style={[styles.root, { paddingTop: insets.top + space[2] }]}>
      {seg.element}

      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space[5] }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topRow}>
              <IconButton icon={ChevronLeft} label={t.common.back} onPress={() => router.back()} />
              <Text style={[type.head, styles.ink]}>{t.spike.segmentTitle}</Text>
            </View>

            <Segmented options={models} value={model} onChange={setModel} />
            <View style={styles.buttons}>
              <Button label={t.spike.segmentRunAll} onPress={runAll} disabled={busy} fullWidth />
              <Button
                label={t.spike.segmentPick}
                variant="secondary"
                onPress={pick}
                disabled={busy}
                fullWidth
              />
            </View>

            <Text style={[type.label, styles.muted]}>
              {!seg.ready ? t.spike.segmentLoading : (progress ?? ' ')}
            </Text>

            <View style={styles.stats}>
              {stats.map(([k, v]) => (
                <View key={k} style={styles.stat}>
                  <Text style={[type.label, styles.muted]}>{k}</Text>
                  <Text style={[type.num, styles.ink]}>{v}</Text>
                </View>
              ))}
            </View>

            {selected?.maskBase64 && selected.photoUri && (
              <View style={styles.preview}>
                <Segmented options={modes} value={mode} onChange={setMode} />
                <MaskPreview
                  photoUri={selected.photoUri}
                  maskBase64={selected.maskBase64}
                  width={previewW}
                  height={previewH}
                  mode={mode}
                />
              </View>
            )}

            {seg.logs.length > 0 && (
              <Text style={[type.num, styles.muted]}>{seg.logs.slice(-3).join('\n')}</Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.name}
            onPress={() => item.ok && setSelected(item)}
            style={[styles.row, selected?.key === item.key && styles.rowOn]}
          >
            {item.ok && item.photoUri && item.maskBase64 ? (
              <MaskPreview
                photoUri={item.photoUri}
                maskBase64={item.maskBase64}
                width={THUMB_W}
                height={THUMB_H}
                mode="cut"
              />
            ) : (
              <View style={styles.thumbEmpty} />
            )}
            <View style={styles.rowText}>
              <Text style={[type.body, styles.ink]}>
                {item.name} · {item.model}
              </Text>
              {item.ok && item.timings ? (
                <Text style={[type.num, styles.muted]}>
                  {`RN ${ms(item.rnPrepMs)} · model ${ms(item.timings.inferMs)}\n` +
                    `mask ${ms(item.timings.postMs)} · vòng ${ms(item.roundtripMs)}` +
                    (item.timings.loadMs ? `\nnạp ${ms(item.timings.loadMs)}` : '')}
                </Text>
              ) : (
                <Text style={[type.num, { color: color.danger }]}>{item.error}</Text>
              )}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

function ms(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(1)} s` : `${Math.round(v)} ms`;
}

const THUMB_W = 72;
const THUMB_H = 96;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: size.gutter, gap: space[2] },
  header: { gap: space[4], paddingBottom: space[4] },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: space[2], marginLeft: -space[3] },
  buttons: { gap: space[3] },
  ink: { color: color.ink },
  muted: { color: color.muted },
  stats: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line,
    padding: space[4],
    gap: space[2],
  },
  stat: { flexDirection: 'row', justifyContent: 'space-between' },
  preview: { gap: space[3] },
  row: {
    flexDirection: 'row',
    gap: space[3],
    padding: space[2],
    borderRadius: radius.md,
    backgroundColor: color.surface,
  },
  rowOn: { borderWidth: 1, borderColor: color.accent },
  rowText: { flex: 1, gap: space[1], justifyContent: 'center' },
  thumbEmpty: { width: THUMB_W, height: THUMB_H, backgroundColor: color.bg },
});
