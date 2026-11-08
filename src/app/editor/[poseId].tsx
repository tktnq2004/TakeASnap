import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PoseCanvas } from '@/features/pose/PoseCanvas';
import { coverScale } from '@/gestures/transformMath';
import { usePanZoom } from '@/gestures/usePanZoom';
import { createVariant, getPose, updateStyle } from '@/features/pose/repository';
import {
  DEFAULT_STYLE,
  isSampleId,
  type Pose,
  type PoseStyle,
  STYLE_LIMITS,
} from '@/features/pose/types';
import { haptic } from '@/lib/haptics';
import { Button, IconButton, Segmented, Slider, SwatchRow, ToggleRow } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, radius, size, space, type } from '@/ui/tokens';

const tabs = [
  { key: 'outline', label: t.editor.tabOutline },
  { key: 'fill', label: t.editor.tabFill },
  { key: 'image', label: t.editor.tabImage },
] as const;
type Tab = (typeof tabs)[number]['key'];

/** Trong tab Viền: đang chỉnh viền hay nét mặt (góp ý lần 3: chung tab, chỉnh riêng). */
const lineTargets = [
  { key: 'outline', label: t.editor.targetOutline },
  { key: 'face', label: t.editor.targetFace },
] as const;
type LineTarget = (typeof lineTargets)[number]['key'];

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

/** Màn Chỉnh pose (business-flow §5.2, design.md §6.4). */
export default function EditorScreen() {
  const { poseId } = useLocalSearchParams<{ poseId: string }>();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [pose, setPose] = useState<Pose | null | undefined>(undefined);
  const [area, setArea] = useState({ w: 0, h: 0 });
  // Ảnh luôn phủ kín khung xem; kéo/pinch để xem phần bị che, chạm đúp để về ban đầu.
  const panZoom = usePanZoom();
  const { setLayout } = panZoom;
  const [tab, setTab] = useState<Tab>('outline');
  const [lineTarget, setLineTarget] = useState<LineTarget>('outline');
  const [saving, setSaving] = useState(false);

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

  const save = async (asNew: boolean) => {
    if (!pose || saving) return;
    setSaving(true);
    try {
      // Pose mẫu chỉ đọc (BR-09): lưu luôn là thêm bản vào "Pose của bạn".
      if (asNew || isSampleId(pose.id)) await createVariant(db, pose, currentStyle());
      else await updateStyle(db, pose.id, currentStyle());
      haptic.saved();
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const isSample = pose ? isSampleId(pose.id) : true;
  const lm = pose?.landmarks ?? null;
  // Báo kích thước khung và ảnh ở mức phủ kín cho usePanZoom (để kẹp không lộ mép ảnh).
  const imgW = pose?.width ?? 0;
  const imgH = pose?.height ?? 0;
  useEffect(() => {
    if (!imgW || !area.w) return;
    const k = coverScale(imgW, imgH, area.w, area.h);
    setLayout(area.w, area.h, imgW * k, imgH * k);
  }, [imgW, imgH, area.w, area.h, setLayout]);

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
        <IconButton icon={ChevronLeft} label={t.common.back} onPress={() => router.back()} />
        <Text accessibilityRole="header" style={[type.head, styles.ink]}>
          {t.editor.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <GestureDetector gesture={panZoom.gesture}>
        <View
          style={styles.preview}
          onLayout={(e) =>
            setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
          }
        >
          {pose && area.w > 0 && (
            <PoseCanvas
              fit="cover"
              view={panZoom}
              source={pose.source}
              imageWidth={pose.width}
              imageHeight={pose.height}
              contours={pose.contours}
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
          {pose === null && (
            <Text style={[type.body, styles.muted, styles.center]}>{t.editor.notFound}</Text>
          )}
        </View>
      </GestureDetector>

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
    justifyContent: 'space-between',
  },
  headerSpacer: { width: size.iconButton },
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
