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
  Undo2,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
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
import { PoseCanvas } from '@/features/pose/PoseCanvas';
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
  const targets = lineTargets.map((o) => (o.key === 'face' ? { ...o, disabled: !hasFace } : o));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
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
            outlineColor={outlineColor}
            outlineWidth={outlineWidth}
            fillEnabled={fillEnabled}
            fillColor={fillColor}
            fillOpacity={fillOpacity}
            subjectOpacity={subjectOpacity}
            backgroundOpacity={backgroundOpacity}
            faceEnabled={faceEnabled}
            faceColor={faceColor}
            faceWidth={faceWidth}
            checker
          />
        )}
        {pose && area.w > 0 && tab === 'refine' && (
          <RefineLayer mode={brushMode} size={brushSize} live={live} onStroke={onStroke} />
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
            <SwatchRow label={t.editor.color} value={fillColor} onChange={setFillColor} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  muted: { color: color.muted },
  center: { textAlign: 'center', marginTop: space[8] },
  // Preview co theo chiều cao còn lại; panel cao cố định để đổi tab không làm preview nhảy.
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
