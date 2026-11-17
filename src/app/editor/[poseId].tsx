import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Brush,
  Droplet,
  Eraser,
  Image as ImageIcon,
  PenTool,
  Plus,
  Redo2,
  X,
  Undo2,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlphaType, ColorType, useImage } from '@shopify/react-native-skia';
import { Alert, type HostInstance, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  type BrushMode,
  brushSource,
  MaskHistory,
  rasterizeContours,
  REFINE_SIDE,
  refineGridSize,
} from '@/engine/brush';
import { buildContours, type Contour, personAreaRatio } from '@/engine/contour';
import { useCameraStore } from '@/features/camera/cameraStore';
import { MIN_PERSON_RATIO } from '@/features/pose/createFromImage';
import { landmarksForContours } from '@/features/pose/mapping';
import { ColorPopover } from '@/features/pose/ColorPopover';
import { PoseCanvas } from '@/features/pose/PoseCanvas';
import { loadRecentColors, saveRecentColor } from '@/features/pose/recentColors';
import { RefineLayer } from '@/features/pose/RefineLayer';
import { getPose, saveEdits } from '@/features/pose/repository';
import {
  DEFAULT_STYLE,
  isSampleId,
  type Pose,
  type PoseStyle,
  STYLE_LIMITS,
} from '@/features/pose/types';
import { haptic } from '@/lib/haptics';
import { useGoBack } from '@/lib/useGoBack';
import {
  Button,
  Chip,
  FlowHeader,
  IconButton,
  Segmented,
  Slider,
  SwatchRow,
  Toggle,
  ToggleRow,
} from '@/ui/components';
import { rgbToHex } from '@/ui/colorMath';
import type { SlotRect } from '@/ui/components/SwatchRow';
import { t } from '@/ui/strings';
import { color, editor, radius, refineBrush, size, space, type } from '@/ui/tokens';

/** 4 tab Viền · Phủ · Nền · Cọ (design.md §6.9). */
const tabs = [
  { key: 'outline', label: t.editor.tabOutline, icon: PenTool },
  { key: 'fill', label: t.editor.tabFill, icon: Droplet },
  { key: 'image', label: t.editor.tabImage, icon: ImageIcon },
  { key: 'refine', label: t.editor.tabRefine, icon: Brush },
] as const;
type Tab = (typeof tabs)[number]['key'];

/** Trong tab Viền: đang chỉnh viền hay nét mặt (góp ý lần 3: chung tab, chỉnh riêng). */
const lineTargets = [
  { key: 'outline', label: t.editor.targetOutline },
  { key: 'face', label: t.editor.targetFace },
] as const;
type LineTarget = (typeof lineTargets)[number]['key'];

const brushModes = [
  { key: 'add', label: t.editor.brushAdd, icon: Plus },
  { key: 'erase', label: t.editor.brushErase, icon: Eraser },
] as const;

const percent = (v: number) => {
  'worklet';
  return `${Math.round(v * 100)}%`;
};
const px = (v: number) => {
  'worklet';
  return `${v.toFixed(1).replace('.', ',')} px`;
};
const pxInt = (v: number) => {
  'worklet';
  return `${Math.round(v)} px`;
};

type ColorTarget = 'outline' | 'face' | 'fill';
type PaletteState = { target: ColorTarget; initial: string; anchor: SlotRect };

/** Màn Chỉnh pose (business-flow §5.2, design.md §6.9). */
export default function EditorScreen() {
  // from=camera: mở từ nút Chỉnh pose trên Camera; lưu thành bản mới thì Camera dùng luôn bản đó.
  const { poseId, from } = useLocalSearchParams<{ poseId: string; from?: string }>();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [pose, setPose] = useState<Pose | null | undefined>(undefined);
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [tab, setTab] = useState<Tab>('outline');
  const [lineTarget, setLineTarget] = useState<LineTarget>('outline');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const goBack = useGoBack();
  const rootRef = useRef<HostInstance>(null);
  const [rootSize, setRootSize] = useState({ width: 0, height: 0 });

  // Bật/tắt và màu đổi bằng chạm → state. Giá trị kéo slider → shared value (không re-render khi
  // kéo, roadmap §3.4).
  const [outlineEnabled, setOutlineEnabled] = useState(DEFAULT_STYLE.outlineEnabled);
  const [outlineColor, setOutlineColor] = useState(DEFAULT_STYLE.outlineColor);
  const [fillEnabled, setFillEnabled] = useState(DEFAULT_STYLE.fillEnabled);
  const [fillColor, setFillColor] = useState(DEFAULT_STYLE.fillColor);
  const [faceEnabled, setFaceEnabled] = useState(DEFAULT_STYLE.faceEnabled);
  const [faceColor, setFaceColor] = useState(DEFAULT_STYLE.faceColor);
  const outlineWidth = useSharedValue(DEFAULT_STYLE.outlineWidth);
  const faceWidth = useSharedValue(DEFAULT_STYLE.faceWidth);
  const fillOpacity = useSharedValue(DEFAULT_STYLE.fillOpacity);
  const subjectOpacity = useSharedValue(DEFAULT_STYLE.subjectOpacity);
  const backgroundOpacity = useSharedValue(DEFAULT_STYLE.backgroundOpacity);

  // Sửa nét: lưới mask + lịch sử chỉ tạo khi vẽ nét đầu tiên. `contours` null = chưa sửa.
  const [contours, setContours] = useState<Contour[] | null>(null);
  const [brushMode, setBrushMode] = useState<BrushMode>('add');
  const [hist, setHist] = useState({ canUndo: false, canRedo: false });
  const brushSize = useSharedValue<number>(refineBrush.initial);
  const live = useSharedValue<number[]>([]);
  const historyRef = useRef<MaskHistory | null>(null);

  // Bảng màu (design.md §6.10): đang mở cho viền, mặt hay phủ. Trong lúc mở, preview đọc màu từ
  // `liveColor` (đổi theo ngón tay trên UI thread); thả tay mới ghi vào state.
  const [palette, setPalette] = useState<PaletteState | null>(null);
  /** Đang lấy màu từ ảnh: bảng tạm ẩn, chạm vào preview để lấy màu, rồi bảng mở lại. */
  const [picking, setPicking] = useState<PaletteState | null>(null);
  const [recent, setRecent] = useState<string[]>(loadRecentColors);
  const liveColor = useSharedValue('#FFFFFF');
  const skImage = useImage(pose?.source);

  // Viền mới đã vẽ xong thì mới xóa nét đang vẽ, để không chớp giữa hai lần vẽ.
  useEffect(() => {
    live.set([]);
  }, [contours, live]);

  useEffect(() => {
    let alive = true;
    getPose(db, String(poseId)).then((p) => {
      if (!alive) return;
      setPose(p);
      if (!p) return;
      const s = p.style;
      setOutlineEnabled(s.outlineEnabled);
      setOutlineColor(s.outlineColor);
      setFillEnabled(s.fillEnabled);
      setFillColor(s.fillColor);
      setFaceEnabled(s.faceEnabled);
      setFaceColor(s.faceColor);
      outlineWidth.set(s.outlineWidth);
      faceWidth.set(s.faceWidth);
      fillOpacity.set(s.fillOpacity);
      subjectOpacity.set(s.subjectOpacity);
      backgroundOpacity.set(s.backgroundOpacity);
    });
    return () => {
      alive = false;
    };
  }, [db, poseId, outlineWidth, faceWidth, fillOpacity, subjectOpacity, backgroundOpacity]);

  const currentStyle = (): PoseStyle => ({
    outlineEnabled,
    outlineWidth: outlineWidth.get(),
    outlineColor,
    fillEnabled,
    fillColor,
    fillOpacity: fillOpacity.get(),
    subjectOpacity: subjectOpacity.get(),
    backgroundOpacity: backgroundOpacity.get(),
    faceEnabled,
    faceColor,
    faceWidth: faceWidth.get(),
  });

  // Ảnh đặt kiểu contain trong vùng preview (cùng phép tính với PoseCanvas).
  const imageRect = () => {
    if (!pose) return { x: 0, y: 0, w: 0, h: 0 };
    const k = Math.min(area.w / pose.width, area.h / pose.height);
    const w = pose.width * k;
    const h = pose.height * k;
    return { x: (area.w - w) / 2, y: (area.h - h) / 2, w, h };
  };

  const colorOf = (target: ColorTarget) =>
    target === 'outline' ? outlineColor : target === 'face' ? faceColor : fillColor;
  const setColorOf = (target: ColorTarget, hex: string) => {
    if (target === 'outline') setOutlineColor(hex);
    else if (target === 'face') setFaceColor(hex);
    else setFillColor(hex);
  };

  const openPalette = (target: ColorTarget, r: SlotRect) =>
    rootRef.current?.measureInWindow((ox, oy) => {
      const initial = colorOf(target);
      liveColor.set(initial);
      setPalette({ target, initial, anchor: { ...r, x: r.x - ox, y: r.y - oy } });
    });

  const closePalette = () => {
    if (palette) {
      const now = colorOf(palette.target);
      if (now.toUpperCase() !== palette.initial.toUpperCase()) setRecent(saveRecentColor(now));
    }
    setPalette(null);
  };

  const cancelPick = () => {
    const back = picking;
    setPicking(null);
    setPalette(back);
  };

  const startPipette = () => {
    setPicking(palette);
    setPalette(null);
  };

  // Lấy màu đúng điểm ảnh gốc dưới ngón tay.
  const pickAt = (x: number, y: number) => {
    const back = picking;
    setPicking(null);
    if (!back) return;
    const r = imageRect();
    if (skImage && r.w > 0 && x >= r.x && y >= r.y && x <= r.x + r.w && y <= r.y + r.h) {
      const px = Math.min(skImage.width() - 1, Math.floor(((x - r.x) / r.w) * skImage.width()));
      const py = Math.min(skImage.height() - 1, Math.floor(((y - r.y) / r.h) * skImage.height()));
      const rgba = skImage.readPixels(px, py, {
        width: 1,
        height: 1,
        colorType: ColorType.RGBA_8888,
        alphaType: AlphaType.Unpremul,
      });
      if (rgba && rgba.length >= 3) {
        const hex = rgbToHex(rgba[0]!, rgba[1]!, rgba[2]!);
        setColorOf(back.target, hex);
        liveColor.set(hex);
      }
    }
    setPalette(back);
  };

  const showHistory = (h: MaskHistory) => {
    setContours(buildContours(h.grid, { maxSide: REFINE_SIDE }));
    setHist({ canUndo: h.canUndo, canRedo: h.canRedo });
  };

  const onStroke = (points: number[], diameter: number) => {
    if (!pose) return;
    const r = imageRect();
    if (r.w <= 0) return;
    const g = refineGridSize(pose.width, pose.height);
    let h = historyRef.current;
    if (!h) {
      const base = rasterizeContours(contours ?? pose.contours, g.width, g.height);
      // Dáng mọi người lúc tạo pose, để cọ Thêm nhận ra người. Ảnh cũ chưa có thì dùng viền hiện tại.
      const source = brushSource(
        rasterizeContours(pose.originalContours ?? pose.contours, g.width, g.height),
        g.width,
        g.height,
      );
      // Hoàn tác không giới hạn trong một lần sửa (góp ý Phase 3, mục 13.3).
      h = new MaskHistory(base, g.width, g.height, Infinity, source);
      historyRef.current = h;
    }
    const kx = g.width / r.w;
    const ky = g.height / r.h;
    h.push({
      mode: brushMode,
      radius: (diameter / 2) * kx,
      points: points.map((v, i) => (i % 2 === 0 ? (v - r.x) * kx : (v - r.y) * ky)),
    });
    showHistory(h);
  };

  const undo = () => {
    const h = historyRef.current;
    if (!h) return;
    h.undo();
    showHistory(h);
  };
  const redo = () => {
    const h = historyRef.current;
    if (!h) return;
    h.redo();
    showHistory(h);
  };

  const save = async (asNew: boolean) => {
    // Ref chứ không phải state: hai lần chạm nhanh chạy trước khi state kịp re-render.
    if (!pose || savingRef.current) return;
    const edited = historyRef.current?.edited ? contours : null;
    if (edited && personAreaRatio(edited) < MIN_PERSON_RATIO) {
      Alert.alert(t.editor.refineTooSmallTitle, t.editor.refineTooSmall);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const savedId = await saveEdits(db, pose, currentStyle(), { asNew, contours: edited });
      if (from === 'camera' && savedId !== pose.id) {
        useCameraStore.getState().replacePose(savedId);
      }
      haptic.saved();
      goBack();
    } catch {
      Alert.alert(t.editor.saveFailedTitle, t.editor.saveFailed);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const isSample = pose ? isSampleId(pose.id) : true;
  // Đang Sửa nét: nét mặt nằm trên vùng vừa xóa thì ẩn ngay, lọc từ nét gốc nên tô lại thì hiện lại.
  const lm = useMemo(
    () =>
      contours
        ? landmarksForContours(pose?.rawLandmarks ?? pose?.landmarks ?? null, contours)
        : (pose?.landmarks ?? null),
    [contours, pose],
  );
  // Ảnh không có mặt: ô "Mặt" tắt thay cho dòng ghi chú (góp ý Phase 4).
  const hasFace = !!lm?.face;
  const editingFace = hasFace && lineTarget === 'face';
  const colorTarget = palette?.target ?? picking?.target ?? null;
  const targets = lineTargets.map((o) => (o.key === 'face' ? { ...o, disabled: !hasFace } : o));

  return (
    <View
      ref={rootRef}
      style={[styles.root, { paddingTop: insets.top }]}
      onLayout={(e) =>
        setRootSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
      }
    >
      <StatusBar style="light" />
      <FlowHeader title={t.editor.title} onBack={goBack} />

      <View
        style={styles.preview}
        onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        {pose && area.w > 0 && (
          <PoseCanvas
            fit="contain"
            source={pose.source}
            imageWidth={pose.width}
            imageHeight={pose.height}
            contours={contours ?? pose.contours}
            landmarks={lm}
            width={area.w}
            height={area.h}
            outlineEnabled={outlineEnabled}
            outlineColor={colorTarget === 'outline' ? liveColor : outlineColor}
            outlineWidth={outlineWidth}
            fillEnabled={fillEnabled}
            fillColor={colorTarget === 'fill' ? liveColor : fillColor}
            fillOpacity={fillOpacity}
            subjectOpacity={subjectOpacity}
            backgroundOpacity={backgroundOpacity}
            faceEnabled={faceEnabled}
            faceColor={colorTarget === 'face' ? liveColor : faceColor}
            faceWidth={faceWidth}
            checker
          />
        )}
        {pose && area.w > 0 && tab === 'refine' && (
          <RefineLayer mode={brushMode} size={brushSize} live={live} onStroke={onStroke} />
        )}
        {picking && (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.editor.pipette}
              style={StyleSheet.absoluteFill}
              onPress={(e) => pickAt(e.nativeEvent.locationX, e.nativeEvent.locationY)}
            />
            {/* Viền vẽ chồng lên, không đổi kích thước preview: ảnh không giật lệch (mục 7.7). */}
            <View pointerEvents="none" style={styles.pickRing} />
            {/* Thoát chế độ lấy màu mà không lấy (mục 7.8): quay lại Bảng màu. */}
            <View style={styles.pickCancel}>
              <IconButton icon={X} label={t.editor.cancelPick} onPress={cancelPick} />
            </View>
          </>
        )}
        {pose === null && (
          <Text style={[type.body, styles.muted, styles.center]}>{t.editor.notFound}</Text>
        )}
      </View>

      <View style={styles.chips} accessibilityRole="tablist">
        {tabs.map((o) => (
          <Chip
            key={o.key}
            label={o.label}
            icon={o.icon}
            selected={tab === o.key}
            onPress={() => setTab(o.key)}
          />
        ))}
      </View>

      <View style={styles.panel}>
        {tab === 'outline' && (
          <>
            {/* Viền và nét mặt chung tab nhưng chỉnh riêng (góp ý lần 3). */}
            <View style={styles.row}>
              <View style={styles.rowSeg}>
                <Segmented
                  tone="card"
                  options={targets}
                  value={editingFace ? 'face' : 'outline'}
                  onChange={setLineTarget}
                />
              </View>
              <Toggle
                value={editingFace ? faceEnabled : outlineEnabled}
                onChange={editingFace ? setFaceEnabled : setOutlineEnabled}
                label={editingFace ? t.editor.showFace : t.editor.showOutline}
              />
            </View>
            <SwatchRow
              label={t.editor.color}
              value={editingFace ? faceColor : outlineColor}
              onChange={editingFace ? setFaceColor : setOutlineColor}
              onOpenPalette={(r) => openPalette(editingFace ? 'face' : 'outline', r)}
            />
            <Slider
              key={editingFace ? 'face' : 'outline'}
              label={t.editor.thickness}
              value={editingFace ? faceWidth : outlineWidth}
              min={STYLE_LIMITS[editingFace ? 'faceWidth' : 'outlineWidth'].min}
              max={STYLE_LIMITS[editingFace ? 'faceWidth' : 'outlineWidth'].max}
              step={STYLE_LIMITS[editingFace ? 'faceWidth' : 'outlineWidth'].step}
              format={px}
            />
          </>
        )}
        {tab === 'fill' && (
          <>
            <ToggleRow label={t.editor.showFill} value={fillEnabled} onChange={setFillEnabled} />
            <SwatchRow
              label={t.editor.color}
              value={fillColor}
              onChange={setFillColor}
              onOpenPalette={(r) => openPalette('fill', r)}
            />
            <Slider
              label={t.editor.strength}
              value={fillOpacity}
              min={0}
              max={1}
              step={0.01}
              format={percent}
            />
          </>
        )}
        {tab === 'image' && (
          <>
            <Slider
              label={t.editor.subjectVisibility}
              value={subjectOpacity}
              min={0}
              max={1}
              step={0.01}
              format={percent}
            />
            <Slider
              label={t.editor.backgroundVisibility}
              value={backgroundOpacity}
              min={0}
              max={1}
              step={0.01}
              format={percent}
            />
          </>
        )}
        {tab === 'refine' && (
          <>
            {/* Hoàn tác / Làm lại chỉ cho nét cọ nên nằm ở đây, không ở đầu màn. */}
            <View style={styles.row}>
              <View style={styles.rowSeg}>
                <Segmented
                  tone="card"
                  options={brushModes}
                  value={brushMode}
                  onChange={setBrushMode}
                />
              </View>
              <IconButton
                icon={Undo2}
                label={t.editor.undo}
                onPress={undo}
                disabled={!hist.canUndo}
              />
              <IconButton
                icon={Redo2}
                label={t.editor.redo}
                onPress={redo}
                disabled={!hist.canRedo}
              />
            </View>
            <Slider
              label={t.editor.brushSize}
              value={brushSize}
              min={refineBrush.min}
              max={refineBrush.max}
              step={refineBrush.step}
              format={pxInt}
            />
          </>
        )}
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + space[3] }]}>
        {!isSample && (
          <View style={styles.actionSecondary}>
            <Button
              label={t.editor.saveAsNew}
              variant="secondary"
              onPress={() => save(true)}
              disabled={!pose || saving}
              fullWidth
            />
          </View>
        )}
        <View style={styles.actionPrimary}>
          <Button
            label={saving ? t.editor.saving : t.editor.save}
            onPress={() => save(false)}
            disabled={!pose || saving}
            fullWidth
          />
        </View>
      </View>

      {palette && (
        <ColorPopover
          anchor={palette.anchor}
          area={rootSize}
          initial={colorOf(palette.target)}
          live={liveColor}
          recent={recent}
          onCommit={(hex) => setColorOf(palette.target, hex)}
          onPipette={startPipette}
          onClose={closePalette}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  muted: { color: color.muted },
  center: { textAlign: 'center', marginTop: space[8] },
  // Preview co theo chiều cao còn lại; panel cao cố định để đổi tab không làm preview nhảy.
  pickRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.xxl,
    borderWidth: 2,
    borderColor: color.accent,
  },
  pickCancel: { position: 'absolute', top: space[3], right: space[3] },
  preview: {
    flex: 1,
    marginHorizontal: size.edge,
    marginTop: space[2],
    borderRadius: radius.xxl,
    overflow: 'hidden',
    backgroundColor: color.surface,
  },
  chips: {
    flexDirection: 'row',
    gap: editor.chipGap,
    paddingHorizontal: size.edge,
    paddingVertical: space[3],
  },
  panel: {
    height: editor.panelHeight,
    marginHorizontal: size.edge,
    padding: editor.panelPad,
    gap: editor.panelGap,
    borderRadius: radius.xxl,
    backgroundColor: color.surface,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  rowSeg: { flex: 1 },
  actions: {
    flexDirection: 'row',
    gap: space[2],
    paddingHorizontal: size.edge,
    paddingTop: space[3],
  },
  actionSecondary: { flex: 1 },
  actionPrimary: { flex: 1.4 },
});
