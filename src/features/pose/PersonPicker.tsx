import { Canvas, DashPathEffect, Group, Image, Path, useImage } from '@shopify/react-native-skia';
import { Check } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  type GestureResponderEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Contour } from '@/engine/contour';
import { personAt } from '@/engine/regions';
import { haptic } from '@/lib/haptics';
import { Button, Chip, CloseButton, OverlayHeader } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, personPick, radius, size, space, type } from '@/ui/tokens';

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

  // Đầu mỗi người (điểm cao nhất của dáng, chuẩn hóa 0..1) để đặt huy hiệu số.
  const heads = useMemo(
    () =>
      contours.map((cs) => {
        let top = { x: 0.5, y: 1 };
        let minX = 1;
        let maxX = 0;
        for (const c of cs) {
          if (c.isHole) continue;
          for (const p of c.points) {
            if (p.y < top.y) top = p;
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
          }
        }
        return { x: (minX + maxX) / 2, y: top.y };
      }),
    [contours],
  );

  return (
    <View style={styles.root}>
      {/* Như Thư viện: iOS là thẻ dưới thanh trạng thái, Android toàn màn hình. */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === 'ios' ? space[5] : insets.top + space[3] },
        ]}
      >
        <OverlayHeader
          title={t.library.pickTitle}
          right={<CloseButton onPress={onCancel} label={t.common.cancel} />}
        />
        <Text style={[type.hint, styles.muted, styles.hint]}>{t.library.pickHint}</Text>
      </View>

      <View style={styles.card}>
        <Pressable
          accessibilityRole="image"
          accessibilityLabel={t.library.pickHint}
          accessibilityValue={{ text: t.library.pickedCount(chosen.length, people.length) }}
          style={styles.preview}
          onLayout={(e) =>
            setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
          }
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
                    {/* Chưa chọn: viền nét đứt như dáng mẫu; đã chọn: viền trắng liền. */}
                    <Path
                      path={p}
                      color={color.surface}
                      style="stroke"
                      strokeWidth={on ? personPick.strokeOn : personPick.strokeOff}
                      strokeJoin="round"
                    >
                      {!on && <DashPathEffect intervals={[8, 6]} />}
                    </Path>
                  </Group>
                );
              })}
            </Canvas>
          )}
          {w > 0 &&
            heads.map((hd, i) => {
              const on = chosen.includes(i);
              const left = Math.min(area.w - BADGE - 4, Math.max(4, ox + hd.x * w - BADGE / 2));
              const top = Math.max(4, oy + hd.y * h - BADGE - 6);
              return (
                <View
                  key={i}
                  pointerEvents="none"
                  style={[styles.badge, on && styles.badgeOn, { left, top }]}
                >
                  {on ? (
                    <Check size={16} strokeWidth={3} color={color.accentInk} />
                  ) : (
                    <Text style={[type.caption, styles.badgeText]}>{i + 1}</Text>
                  )}
                </View>
              );
            })}
        </Pressable>
      </View>

      {/* Chọn bằng tên, cho người khó chạm trúng trên ảnh nhỏ. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chips}
      >
        {people.map((_, i) => (
          <Chip
            key={i}
            label={t.library.personN(i + 1)}
            icon={chosen.includes(i) ? Check : undefined}
            selected={chosen.includes(i)}
            onPress={() => toggle(i)}
          />
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space[3] }]}>
        <View style={styles.action}>
          <Button
            label={t.library.pickAll}
            variant="secondary"
            onPress={() => onConfirm(people.map((_, i) => i))}
            fullWidth
          />
        </View>
        <View style={styles.actionPrimary}>
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

const BADGE = 30;

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: color.bg },
  header: { paddingBottom: space[3] },
  hint: { paddingHorizontal: size.gutter, marginTop: space[1] },
  muted: { color: color.muted },
  card: {
    flex: 1,
    marginHorizontal: size.edge,
    padding: space[3],
    borderRadius: radius.xl,
    backgroundColor: color.surface,
  },
  preview: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: color.surfaceAlt,
  },
  badge: {
    position: 'absolute',
    width: BADGE,
    height: BADGE,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: color.surface,
    backgroundColor: 'rgba(16,33,63,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOn: { backgroundColor: color.accent },
  badgeText: { color: color.surface },
  chipsScroll: { flexGrow: 0 },
  chips: { gap: space[2], paddingHorizontal: size.edge, paddingTop: space[3] },
  footer: {
    flexDirection: 'row',
    gap: space[2],
    paddingHorizontal: size.edge,
    paddingTop: space[3],
  },
  action: { flex: 1 },
  actionPrimary: { flex: 1.4 },
});
