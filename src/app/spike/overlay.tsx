import { Canvas, Group, Image, Path, Skia, useImage } from '@shopify/react-native-skia';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FpsMeter } from '@/features/spike/FpsMeter';
import { IconButton, Segmented, Slider, Swatch } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, poseColors, radius, size, space, type } from '@/ui/tokens';

/**
 * Spike C (roadmap §4, Phase 0): viền + phủ + người trên MỘT canvas Skia, slider độ dày 1–12 px
 * phải đổi hình ở 60 fps. Dáng ở đây là silhouette vẽ tay; Phase 1 thay bằng contour thật.
 */

// Silhouette trong hộp 100 × 200 (đơn vị tự do), sẽ được phóng vừa canvas.
const SILHOUETTE =
  'M50 6 C58 6 64 12 64 20 C64 28 58 34 50 34 C42 34 36 28 36 20 C36 12 42 6 50 6 Z ' +
  'M36 40 L64 40 C70 40 73 44 74 50 L80 96 L71 98 L63 60 L62 112 L68 194 L57 194 L50 124 ' +
  'L43 194 L32 194 L38 112 L37 60 L29 98 L20 96 L26 50 C27 44 30 40 36 40 Z';
const BOX = { w: 100, h: 200 };

const tabs = [
  { key: 'outline', label: t.editor.tabOutline },
  { key: 'fill', label: t.editor.tabFill },
  { key: 'subject', label: t.editor.tabSubject },
] as const;
type Tab = (typeof tabs)[number]['key'];

export default function OverlaySpike() {
  const insets = useSafeAreaInsets();
  const photo = useImage(require('../../../assets/poses/source/street/street1.jpg'));
  const path = useMemo(() => Skia.Path.MakeFromSVGString(SILHOUETTE), []);
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [tab, setTab] = useState<Tab>('outline');

  const [outlineOn, setOutlineOn] = useState(true);
  const [outlineColor, setOutlineColor] = useState<string>(poseColors[0].value);
  const [fillOn, setFillOn] = useState(true);
  const [fillColor, setFillColor] = useState<string>(poseColors[1].value);

  const outlineWidth = useSharedValue(3);
  const fillOpacity = useSharedValue(0.4);
  const subjectOpacity = useSharedValue(1);

  // Phóng silhouette vừa 80% chiều cao canvas; viền chia cho scale để độ dày trên màn hình đúng px.
  const scale = area.h > 0 ? (area.h * 0.8) / BOX.h : 1;
  const offsetX = (area.w - BOX.w * scale) / 2;
  const offsetY = (area.h - BOX.h * scale) / 2;
  const strokeWidth = useDerivedValue(() => outlineWidth.value / scale);

  return (
    <View style={styles.root}>
      <View
        style={[styles.preview, { marginTop: insets.top }]}
        onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        <Canvas style={StyleSheet.absoluteFill}>
          {photo && (
            <Image
              image={photo}
              x={0}
              y={0}
              width={area.w}
              height={area.h}
              fit="cover"
              opacity={subjectOpacity}
            />
          )}
          {path && (
            <Group transform={[{ translateX: offsetX }, { translateY: offsetY }, { scale }]}>
              {fillOn && <Path path={path} color={fillColor} opacity={fillOpacity} />}
              {outlineOn && (
                <Path
                  path={path}
                  color={outlineColor}
                  style="stroke"
                  strokeWidth={strokeWidth}
                  strokeJoin="round"
                  strokeCap="round"
                />
              )}
            </Group>
          )}
        </Canvas>
        <View style={styles.previewTop}>
          <IconButton
            icon={ChevronLeft}
            label={t.common.back}
            onPress={() => router.back()}
            onScrim
          />
          <FpsMeter />
        </View>
      </View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + space[4] }]}>
        <Segmented options={tabs} value={tab} onChange={setTab} />

        {tab === 'outline' && (
          <>
            <Row label={t.editor.showOutline} value={outlineOn} onChange={setOutlineOn} />
            <Slider
              label={t.editor.thickness}
              value={outlineWidth}
              min={1}
              max={12}
              step={0.5}
              format={(v) => {
                'worklet';
                return `${v.toFixed(1)} px`;
              }}
            />
            <Swatches value={outlineColor} onChange={setOutlineColor} />
          </>
        )}

        {tab === 'fill' && (
          <>
            <Row label={t.editor.showFill} value={fillOn} onChange={setFillOn} />
            <Slider
              label={t.editor.strength}
              value={fillOpacity}
              min={0}
              max={1}
              step={0.01}
              format={(v) => {
                'worklet';
                return `${Math.round(v * 100)}%`;
              }}
            />
            <Swatches value={fillColor} onChange={setFillColor} />
          </>
        )}

        {tab === 'subject' && (
          <Slider
            label={t.editor.visibility}
            value={subjectOpacity}
            min={0}
            max={1}
            step={0.01}
            format={(v) => {
              'worklet';
              return `${Math.round(v * 100)}%`;
            }}
          />
        )}
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={[type.body, { color: color.ink }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: color.accent, false: color.line }}
        thumbColor={color.ink}
        accessibilityLabel={label}
      />
    </View>
  );
}

function Swatches({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View
      style={styles.swatches}
      accessibilityRole="radiogroup"
      accessibilityLabel={t.editor.color}
    >
      {poseColors.map((c) => (
        <Swatch
          key={c.value}
          value={c.value}
          name={c.name}
          selected={c.value === value}
          onPress={() => onChange(c.value)}
        />
      ))}
    </View>
  );
}

// Panel cao cố định để đổi tab không làm preview co giãn (design.md §4).
const PANEL_HEIGHT = 296;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  preview: { flex: 1, overflow: 'hidden' },
  previewTop: {
    position: 'absolute',
    top: space[2],
    left: size.edge,
    right: size.edge,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  panel: {
    minHeight: PANEL_HEIGHT,
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: space[4],
    paddingHorizontal: size.gutter,
    gap: space[4],
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: space[1] },
});
