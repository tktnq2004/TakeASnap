import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Redo2, Undo2 } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  type BrushMode,
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
  BackButton,
  Button,
  IconButton,
  Segmented,
  Slider,
  SwatchRow,
  ToggleRow,
} from '@/ui/components';
import { t } from '@/ui/strings';
import { color, radius, refineBrush, size, space, type } from '@/ui/tokens';

const tabs = [
  { key: 'outline', label: t.editor.tabOutline },
  { key: 'fill', label: t.editor.tabFill },
  { key: 'image', label: t.editor.tabImage },
  { key: 'refine', label: t.editor.tabRefine },
] as const;
type Tab = (typeof tabs)[number]['key'];

/** Trong tab Viền: đang chỉnh viền hay nét mặt (góp ý lần 3: chung tab, chỉnh riêng). */
const lineTargets = [
  { key: 'outline', label: t.editor.targetOutline },
  { key: 'face', label: t.editor.targetFace },
] as const;
type LineTarget = (typeof lineTargets)[number]['key'];

const brushModes = [
  { key: 'add', label: t.editor.brushAdd },
  { key: 'erase', label: t.editor.brushErase },
  { key: 'restore', label: t.editor.brushRestore },
] as const;

/** Hoàn tác tối đa 30 bước (business-flow §5.2). */
const REFINE_UNDO = 30;

/**
 * Panel cao CỐ ĐỊNH để đổi tab không làm preview co giãn (design.md §4). Tab cao nhất là Viền:
 * tab 40 + hàng [Viền | Mặt] + công tắc 44 + slider 76 + 2 hàng màu 92 + ghi chú 26 + nút 48 +
 * khoảng cách ≈ 410.
 */
const PANEL_HEIGHT = 410;

const percent = (v: number) => {
  'worklet';
  return `${Math.round(v * 100)}%`;
};
const px = (v: number) => {
  'worklet';
  return `${v.toFixed(1)} px`;
};
const pxInt = (v: number) => {
  'worklet';
  return `${Math.round(v)} px`;
};

/** Màn Chỉnh pose (business-flow §5.2, design.md §6.4). */
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
      // Dáng người gốc cho cọ Khôi phục: viền lúc tạo pose (chưa sửa lần nào thì là viền hiện tại).
      const source = pose.originalContours
        ? rasterizeContours(pose.originalContours, g.width, g.height)
        : rasterizeContours(pose.contours, g.width, g.height);
      h = new MaskHistory(base, g.width, g.height, REFINE_UNDO, source);
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
  const editingFace = lineTarget === 'face';
  // Ghi chú khi đang chỉnh nét mặt mà ảnh không có mặt.
  const faceNote = !editingFace
    ? null
    : !lm
      ? t.editor.noLandmarks
      : !lm.face
        ? t.editor.noFace
        : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        {/* Tiêu đề căn giữa màn, không theo bề rộng nút Quay lại. */}
        <View pointerEvents="none" style={styles.headerTitle}>
          <Text accessibilityRole="header" style={[type.head, styles.ink]}>
            {t.editor.title}
          </Text>
        </View>
        <BackButton onPress={goBack} />
      </View>

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

      <View
        style={[
          styles.panel,
          { height: PANEL_HEIGHT + insets.bottom, paddingBottom: insets.bottom + space[4] },
        ]}
      >
        <Segmented options={tabs} value={tab} onChange={setTab} />

        <View style={styles.controls}>
          {tab === 'outline' && (
            <>
              {/* Viền và nét mặt chung tab nhưng chỉnh riêng (góp ý lần 3). */}
              <View style={styles.targetRow}>
                <View style={styles.targetSeg}>
                  <Segmented options={lineTargets} value={lineTarget} onChange={setLineTarget} />
                </View>
                <Switch
                  value={editingFace ? faceEnabled : outlineEnabled}
                  onValueChange={editingFace ? setFaceEnabled : setOutlineEnabled}
                  trackColor={{ true: color.accent, false: color.line }}
                  thumbColor={color.ink}
                  accessibilityLabel={editingFace ? t.editor.showFace : t.editor.showOutline}
                />
              </View>
              <Slider
                key={lineTarget}
                label={t.editor.thickness}
                value={editingFace ? faceWidth : outlineWidth}
                min={STYLE_LIMITS[editingFace ? 'faceWidth' : 'outlineWidth'].min}
                max={STYLE_LIMITS[editingFace ? 'faceWidth' : 'outlineWidth'].max}
                step={STYLE_LIMITS[editingFace ? 'faceWidth' : 'outlineWidth'].step}
                format={px}
              />
              <SwatchRow
                label={t.editor.color}
                value={editingFace ? faceColor : outlineColor}
                onChange={editingFace ? setFaceColor : setOutlineColor}
              />
              {faceNote && <Text style={[type.label, styles.muted]}>{faceNote}</Text>}
            </>
          )}
          {tab === 'fill' && (
            <>
              <ToggleRow label={t.editor.showFill} value={fillEnabled} onChange={setFillEnabled} />
              <Slider
                label={t.editor.strength}
                value={fillOpacity}
                min={0}
                max={1}
                step={0.01}
                format={percent}
              />
              <SwatchRow label={t.editor.color} value={fillColor} onChange={setFillColor} />
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
              <View style={styles.targetRow}>
                <View style={styles.targetSeg}>
                  <Segmented options={brushModes} value={brushMode} onChange={setBrushMode} />
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
              <Text style={[type.label, styles.muted]}>
                {isSample ? t.editor.refineHint : `${t.editor.refineHint} ${t.editor.refineShared}`}
              </Text>
            </>
          )}
        </View>

        <View style={styles.actions}>
          {!isSample && (
            <View style={styles.action}>
              <Button
                label={t.editor.saveAsNew}
                variant="secondary"
                onPress={() => save(true)}
                disabled={!pose || saving}
                fullWidth
              />
            </View>
          )}
          <View style={styles.action}>
            <Button
              label={saving ? t.editor.saving : t.editor.save}
              onPress={() => save(false)}
              disabled={!pose || saving}
              fullWidth
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  header: {
    height: 56,
    paddingHorizontal: space[2],
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ink: { color: color.ink },
  muted: { color: color.muted },
  center: { textAlign: 'center', marginTop: space[7] },
  preview: { flex: 1 },
  panel: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: space[4],
    paddingHorizontal: size.gutter,
    gap: space[4],
  },
  controls: { flex: 1, gap: space[2] },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  targetSeg: { flex: 1 },
  actions: { flexDirection: 'row', gap: space[3] },
  action: { flex: 1 },
});
