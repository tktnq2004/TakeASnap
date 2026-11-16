import { Canvas, DashPathEffect, Group, Path } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Contour } from '@/engine/contour';
import { color, personPick } from '@/ui/tokens';

import { makePosePath } from './PoseCanvas';

type Props = {
  /** Khung ảnh trong preview (px). */
  rect: { x: number; y: number; w: number; h: number };
  /** Viền gốc của từng người, chuẩn hóa 0..1 theo ảnh. */
  shapes: Contour[][];
  /** Người nào đang có trong pose. */
  present: boolean[];
  /** Chạm vào preview (px của preview). */
  onTap: (x: number, y: number) => void;
};

/**
 * Lớp trên preview ở tab Người (business-flow §5.2, thay màn Chọn người): chạm vào một người để
 * bỏ cả người đó khỏi pose, chạm lần nữa để lấy lại. Người đang bị bỏ có viền trắng nét đứt.
 */
export function PeopleLayer({ rect, shapes, present, onTap }: Props) {
  const paths = useMemo(
    () => shapes.map((cs) => makePosePath(cs, rect.w, rect.h)),
    [shapes, rect.w, rect.h],
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
    </View>
  );
}
