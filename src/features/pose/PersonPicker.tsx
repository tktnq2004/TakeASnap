import { Canvas, Group, Image, Path, useImage } from '@shopify/react-native-skia';
import { X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  type GestureResponderEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Contour } from '@/engine/contour';
import { personAt } from '@/engine/regions';
import { haptic } from '@/lib/haptics';
import { Button, IconButton } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, personPick, size, space, type } from '@/ui/tokens';

import { type ImageAnalysis, PERSON_SLOP } from './createFromImage';
import { makePosePath } from './PoseCanvas';

type Props = {
  analysis: ImageAnalysis;
  /** Viền từng người, cùng thứ tự với `analysis.people`. */
  contours: Contour[][];
  onConfirm: (chosen: number[]) => void;
  onCancel: () => void;
};

/**
 * Chọn người khi ảnh có nhiều người (business-flow §5.1, Phase 3): chạm vào từng người để chọn
 * hoặc bỏ chọn, hoặc chọn tất cả. Người đã chọn được phủ màu nhấn; người chưa chọn chỉ có viền.
 */
export function PersonPicker({ analysis, contours, onConfirm, onCancel }: Props) {
  const { seg, labeling, people } = analysis;
  const insets = useSafeAreaInsets();
  const image = useImage(seg.prepared.uri);
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [chosen, setChosen] = useState<number[]>([]);

  const scale = Math.min(area.w / seg.prepared.width, area.h / seg.prepared.height) || 0;
  const w = seg.prepared.width * scale;
  const h = seg.prepared.height * scale;
  const ox = (area.w - w) / 2;
  const oy = (area.h - h) / 2;
  const paths = useMemo(() => contours.map((c) => makePosePath(c, w, h)), [contours, w, h]);

  const toggle = (i: number) => {
    haptic.select();
    setChosen((cur) =>
      cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i].sort((a, b) => a - b),
    );
  };

  const onTap = (e: GestureResponderEvent) => {
    if (w <= 0) return;
    const gx = ((e.nativeEvent.locationX - ox) / w) * labeling.width;
    const gy = ((e.nativeEvent.locationY - oy) / h) * labeling.height;
    const i = personAt(labeling, people, gx, gy, PERSON_SLOP);
    if (i != null) toggle(i);
  };

  return (
    <View style={styles.root}>
      {/* Như Thư viện: iOS là thẻ dưới thanh trạng thái, Android toàn màn hình. */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === 'ios' ? space[4] : insets.top + space[2] },
        ]}
      >
        <Text accessibilityRole="header" style={[type.title, styles.ink]}>
          {t.library.pickTitle}
        </Text>
        <IconButton icon={X} label={t.common.cancel} onPress={onCancel} />
      </View>
      <Text style={[type.body, styles.muted, styles.hint]}>{t.library.pickHint}</Text>

      <Pressable
        accessibilityRole="image"
        accessibilityLabel={t.library.pickHint}
        accessibilityValue={{ text: t.library.pickedCount(chosen.length, people.length) }}
        style={styles.preview}
        onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        onPress={onTap}
      >
        {image && w > 0 && (
          <Canvas style={StyleSheet.absoluteFill}>
            <Image image={image} x={ox} y={oy} width={w} height={h} fit="fill" />
            {paths.map((p, i) => {
              if (!p) return null;
              const on = chosen.includes(i);
              return (
                <Group key={i} transform={[{ translateX: ox }, { translateY: oy }]}>
                  {on && <Path path={p} color={color.accent} opacity={personPick.fill} />}
                  <Path
                    path={p}
                    color={on ? color.ink : color.guide}
                    style="stroke"
                    strokeWidth={on ? personPick.strokeOn : personPick.strokeOff}
                    strokeJoin="round"
                  />
                </Group>
              );
            })}
          </Canvas>
        )}
      </Pressable>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space[3] }]}>
        <View style={styles.action}>
          <Button
            label={t.library.pickAll}
            variant="secondary"
            onPress={() => onConfirm(people.map((_, i) => i))}
            fullWidth
          />
        </View>
        <View style={styles.action}>
          <Button
            label={t.library.pickUse}
            onPress={() => onConfirm(chosen)}
            disabled={!chosen.length}
            fullWidth
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: color.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: size.gutter,
    paddingRight: size.gutter - space[2],
  },
  hint: { paddingHorizontal: size.gutter, paddingBottom: space[3] },
  ink: { color: color.ink },
  muted: { color: color.muted },
  preview: { flex: 1 },
  footer: {
    flexDirection: 'row',
    gap: space[3],
    paddingHorizontal: size.gutter,
    paddingTop: space[3],
  },
  action: { flex: 1 },
});
