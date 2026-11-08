import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PoseCanvas } from '@/features/pose/PoseCanvas';
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
  { key: 'lines', label: t.editor.tabLines },
  { key: 'image', label: t.editor.tabImage },
] as const;
type Tab = (typeof tabs)[number]['key'];

/**
 * Panel cao CỐ ĐỊNH để đổi tab không làm preview co giãn (design.md §4). Tab cao nhất là Nét:
 * segmented 40 + 2 công tắc 88 + slider 76 + 2 hàng màu 92 + nút 48 + khoảng cách ≈ 440.
 */
const PANEL_HEIGHT = 440;

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
  const [tab, setTab] = useState<Tab>('outline');
  const [saving, setSaving] = useState(false);

  // Bật/tắt và màu đổi bằng chạm → state. Giá trị kéo slider → shared value (không re-render khi
  // kéo, roadmap §3.4).
  const [outlineEnabled, setOutlineEnabled] = useState(DEFAULT_STYLE.outlineEnabled);
  const [outlineColor, setOutlineColor] = useState(DEFAULT_STYLE.outlineColor);
  const [fillEnabled, setFillEnabled] = useState(DEFAULT_STYLE.fillEnabled);
  const [fillColor, setFillColor] = useState(DEFAULT_STYLE.fillColor);
  const [faceEnabled, setFaceEnabled] = useState(DEFAULT_STYLE.faceEnabled);
  const [bodyEnabled, setBodyEnabled] = useState(DEFAULT_STYLE.bodyEnabled);
  const [linesColor, setLinesColor] = useState(DEFAULT_STYLE.linesColor);
  const outlineWidth = useSharedValue(DEFAULT_STYLE.outlineWidth);
  const fillOpacity = useSharedValue(DEFAULT_STYLE.fillOpacity);
  const linesWidth = useSharedValue(DEFAULT_STYLE.linesWidth);
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
      setBodyEnabled(s.bodyEnabled);
      setLinesColor(s.linesColor);
      outlineWidth.set(s.outlineWidth);
      fillOpacity.set(s.fillOpacity);
      linesWidth.set(s.linesWidth);
      subjectOpacity.set(s.subjectOpacity);
      backgroundOpacity.set(s.backgroundOpacity);
    });
    return () => {
      alive = false;
    };
  }, [db, poseId, outlineWidth, fillOpacity, linesWidth, subjectOpacity, backgroundOpacity]);

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
    bodyEnabled,
    linesColor,
    linesWidth: linesWidth.get(),
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

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <IconButton icon={ChevronLeft} label={t.common.back} onPress={() => router.back()} />
        <Text accessibilityRole="header" style={[type.head, styles.ink]}>
          {t.editor.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View
        style={styles.preview}
        onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        {pose && area.w > 0 && (
          <PoseCanvas
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
            bodyEnabled={bodyEnabled}
            linesColor={linesColor}
            linesWidth={linesWidth}
            checker
          />
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
              <ToggleRow
                label={t.editor.showOutline}
                value={outlineEnabled}
                onChange={setOutlineEnabled}
              />
              <Slider
                label={t.editor.thickness}
                value={outlineWidth}
                min={STYLE_LIMITS.outlineWidth.min}
                max={STYLE_LIMITS.outlineWidth.max}
                step={STYLE_LIMITS.outlineWidth.step}
                format={px}
              />
              <SwatchRow label={t.editor.color} value={outlineColor} onChange={setOutlineColor} />
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
          {tab === 'lines' && (
            <>
              {lm === null && (
                <Text style={[type.label, styles.muted]}>{t.editor.noLandmarks}</Text>
              )}
              <ToggleRow label={t.editor.showFace} value={faceEnabled} onChange={setFaceEnabled} />
              {lm && !lm.face && <Text style={[type.label, styles.muted]}>{t.editor.noFace}</Text>}
              <ToggleRow label={t.editor.showBody} value={bodyEnabled} onChange={setBodyEnabled} />
              {lm && !lm.body && <Text style={[type.label, styles.muted]}>{t.editor.noBody}</Text>}
              <Slider
                label={t.editor.linesThickness}
                value={linesWidth}
                min={STYLE_LIMITS.linesWidth.min}
                max={STYLE_LIMITS.linesWidth.max}
                step={STYLE_LIMITS.linesWidth.step}
                format={px}
              />
              <SwatchRow label={t.editor.color} value={linesColor} onChange={setLinesColor} />
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
  actions: { flexDirection: 'row', gap: space[3] },
  action: { flex: 1 },
});
