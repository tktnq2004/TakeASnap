import { Canvas, DashPathEffect, Group, Path } from '@shopify/react-native-skia';
import { Check } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Contour } from '@/engine/contour';
import { t } from '@/ui/strings';
import { color, personPick, radius, type } from '@/ui/tokens';

import { makePosePath } from './PoseCanvas';

export type PersonShape = {
  /** Viền gốc của người, chuẩn hóa 0..1 theo ảnh. */
  contours: Contour[];
  /** Đỉnh đầu (chuẩn hóa) và tâm ngang, để đặt huy hiệu. */
  head: { x: number; y: number };
};

type Props = {
  /** Khung ảnh trong preview (px). */
  rect: { x: number; y: number; w: number; h: number };
  people: PersonShape[];
  /** Người nào đang có trong pose. */
  present: boolean[];
  /** Chạm vào preview (px của preview). */
  onTap: (x: number, y: number) => void;
  /** Chạm vào huy hiệu của người `k`. */
  onToggle: (k: number) => void;
};

const B = personPick.badge;

/**
 * Chế độ Người ở tab Cọ (business-flow §5.2, thay màn Chọn người từ Phase 4 vòng 3): chạm vào một
 * người để bỏ cả người đó khỏi pose, chạm lần nữa để lấy lại. Người đang bị bỏ có viền nét đứt;
 * mỗi người có huy hiệu trên đầu.
 */
export function PeopleLayer({ rect, people, present, onTap, onToggle }: Props) {
  const paths = useMemo(
    () => people.map((p) => makePosePath(p.contours, rect.w, rect.h)),
    [people, rect.w, rect.h],
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable
        style={StyleSheet.absoluteFill}
        accessible={false}
        onPress={(e) => onTap(e.nativeEvent.locationX, e.nativeEvent.locationY)}
      />
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Group transform={[{ translateX: rect.x }, { translateY: rect.y }]}>
          {paths.map((p, k) =>
            p && !present[k] ? (
              <Path
                key={k}
                path={p}
                color={color.surface}
                style="stroke"
                strokeWidth={personPick.strokeOff}
                strokeJoin="round"
              >
                <DashPathEffect intervals={personPick.dash} />
              </Path>
            ) : null,
          )}
        </Group>
      </Canvas>
      {people.map((p, k) => {
        const on = !!present[k];
        const left = rect.x + Math.min(rect.w - B - 4, Math.max(4, p.head.x * rect.w - B / 2));
        const top = rect.y + Math.max(4, p.head.y * rect.h - B - 6);
        return (
          <Pressable
            key={k}
            accessibilityRole="checkbox"
            accessibilityLabel={t.library.personN(k + 1)}
            accessibilityState={{ checked: on }}
            hitSlop={8}
            onPress={() => onToggle(k)}
            style={[styles.badge, on && styles.badgeOn, { left, top }]}
          >
            {on ? (
              <Check size={16} strokeWidth={3} color={color.accentInk} />
            ) : (
              <Text style={[type.caption, styles.badgeText]}>{k + 1}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Đỉnh đầu của dáng (điểm cao nhất) và tâm ngang của khung, chuẩn hóa 0..1. */
export function headOf(contours: Contour[]) {
  let top = { x: 0.5, y: 1 };
  let minX = 1;
  let maxX = 0;
  for (const c of contours) {
    if (c.isHole) continue;
    for (const p of c.points) {
      if (p.y < top.y) top = p;
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
    }
  }
  return { x: (minX + maxX) / 2, y: top.y };
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    width: B,
    height: B,
    borderRadius: radius.full,
    borderWidth: personPick.badgeBorder,
    borderColor: color.surface,
    backgroundColor: personPick.badgeOffBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOn: { backgroundColor: color.accent },
  badgeText: { color: color.surface },
});
