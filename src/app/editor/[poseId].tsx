import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PoseCanvas } from '@/features/pose/PoseCanvas';
import { createFromSample, getPose, updateStyle } from '@/features/pose/repository';
import { DEFAULT_STYLE, isSampleId, type Pose, STYLE_LIMITS } from '@/features/pose/types';
import { haptic } from '@/lib/haptics';
import { Button, IconButton, Segmented, Slider, SwatchRow, ToggleRow } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, radius, size, space, type } from '@/ui/tokens';

const tabs = [
  { key: 'outline', label: t.editor.tabOutline },
  { key: 'fill', label: t.editor.tabFill },
  { key: 'subject', label: t.editor.tabSubject },
] as const;
type Tab = (typeof tabs)[number]['key'];

/**
 * Panel cao CỐ ĐỊNH để đổi tab không làm preview co giãn (design.md §4): tab cao nhất là Viền/Phủ
 * (segmented 40 + công tắc 44 + slider 76 + 2 hàng màu 92 + nút 48 + khoảng cách) ≈ 400.
 */
const PANEL_HEIGHT = 400;

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
  const [showOriginal, setShowOriginal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Giá trị bật/tắt và màu đổi bằng chạm → state. Giá trị kéo slider → shared value (không
  // re-render khi kéo, roadmap §3.4).
  const [outlineEnabled, setOutlineEnabled] = useState(DEFAULT_STYLE.outlineEnabled);
  const [outlineColor, setOutlineColor] = useState(DEFAULT_STYLE.outlineColor);
  const [fillEnabled, setFillEnabled] = useState(DEFAULT_STYLE.fillEnabled);
  const [fillColor, setFillColor] = useState(DEFAULT_STYLE.fillColor);
  const outlineWidth = useSharedValue(DEFAULT_STYLE.outlineWidth);
  const fillOpacity = useSharedValue(DEFAULT_STYLE.fillOpacity);
  const subjectOpacity = useSharedValue(DEFAULT_STYLE.subjectOpacity);

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
      outlineWidth.set(s.outlineWidth);
      fillOpacity.set(s.fillOpacity);
      subjectOpacity.set(s.subjectOpacity);
    });
    return () => {
      alive = false;
    };
  }, [db, poseId, outlineWidth, fillOpacity, subjectOpacity]);

  const save = async () => {
    if (!pose || saving) return;
    setSaving(true);
    const style = {
      outlineEnabled,
      outlineWidth: outlineWidth.get(),
      outlineColor,
      fillEnabled,
      fillColor,
      fillOpacity: fillOpacity.get(),
      subjectOpacity: subjectOpacity.get(),
    };
    try {
      // Pose mẫu chỉ đọc (BR-09): lưu = tạo bản sao vào "Pose của bạn".
      if (isSampleId(pose.id)) await createFromSample(db, pose, style);
      else await updateStyle(db, pose.id, style);
      haptic.saved();
      router.back();
    } finally {
      setSaving(false);
    }
  };

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
            width={area.w}
            height={area.h}
            outlineEnabled={outlineEnabled}
            outlineColor={outlineColor}
            outlineWidth={outlineWidth}
            fillEnabled={fillEnabled}
            fillColor={fillColor}
            fillOpacity={fillOpacity}
            subjectOpacity={subjectOpacity}
            showOriginal={showOriginal}
          />
        )}
        {pose === null && (
          <Text style={[type.body, styles.muted, styles.center]}>{t.editor.notFound}</Text>
        )}
        {pose && (
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: showOriginal }}
            accessibilityLabel={t.editor.showOriginal}
            onPress={() => setShowOriginal((v) => !v)}
            style={[styles.chip, showOriginal && styles.chipOn]}
          >
            <Text style={[type.label, { color: showOriginal ? color.accentInk : color.ink }]}>
              {t.editor.showOriginal}
            </Text>
          </Pressable>
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
          {tab === 'subject' && (
            <Slider
              label={t.editor.visibility}
              value={subjectOpacity}
              min={0}
              max={1}
              step={0.01}
              format={percent}
            />
          )}
        </View>

        <Button
          label={saving ? t.editor.saving : t.editor.save}
          onPress={save}
          disabled={!pose || saving}
          fullWidth
        />
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
  chip: {
    position: 'absolute',
    right: size.edge,
    bottom: space[3],
    height: size.chip,
    paddingHorizontal: space[3],
    borderRadius: radius.sm,
    justifyContent: 'center',
    backgroundColor: color.scrim,
  },
  chipOn: { backgroundColor: color.accent },
  panel: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: space[4],
    paddingHorizontal: size.gutter,
    gap: space[4],
  },
  controls: { flex: 1, gap: space[3] },
});
