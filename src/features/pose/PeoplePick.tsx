import { Canvas, DashPathEffect, Group, Image, Path, useImage } from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { type GestureResponderEvent, Pressable, StyleSheet } from 'react-native';

import type { Contour } from '@/engine/contour';
import { personAt } from '@/engine/regions';
import { t } from '@/ui/strings';
import { color, personPick, radius } from '@/ui/tokens';

import { type ImageAnalysis, PERSON_SLOP } from './createFromImage';
import { makePosePath } from './PoseCanvas';

type Props = {
  analysis: ImageAnalysis;
  /** Viền từng người, cùng thứ tự với `analysis.people`. */
  contours: Contour[][];
  chosen: number[];
  onToggle: (i: number) => void;
};

/**
 * Chọn người ngay trên màn đang xử lý (góp ý Phase 4 vòng 6): ảnh vừa tách thành chỗ chạm để
 * chọn / bỏ từng người. Viền từng người dựng sẵn một lần, chạm chỉ đổi cách vẽ nên tức thì.
 * Người được chọn phủ màu nhấn + viền trắng liền; chưa chọn viền trắng nét đứt.
 */
export function PeoplePick({ analysis, contours, chosen, onToggle }: Props) {
  const { seg, labeling, people } = analysis;
  const image = useImage(seg.prepared.uri);
  const [area, setArea] = useState({ w: 0, h: 0 });

  const scale = Math.min(area.w / seg.prepared.width, area.h / seg.prepared.height) || 0;
  const w = seg.prepared.width * scale;
  const h = seg.prepared.height * scale;
  const ox = (area.w - w) / 2;
  const oy = (area.h - h) / 2;
  const paths = useMemo(() => contours.map((c) => makePosePath(c, w, h)), [contours, w, h]);

  const onTap = (e: GestureResponderEvent) => {
    if (w <= 0) return;
    const gx = ((e.nativeEvent.locationX - ox) / w) * labeling.width;
    const gy = ((e.nativeEvent.locationY - oy) / h) * labeling.height;
    const i = personAt(labeling, people, gx, gy, PERSON_SLOP);
    if (i != null) onToggle(i);
  };

  return (
    <Pressable
      accessibilityRole="image"
      accessibilityLabel={t.status.steps.pick}
      accessibilityValue={{ text: t.library.pickedCount(chosen.length, people.length) }}
      style={styles.root}
      onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      onPress={onTap}
    >
      {image && w > 0 && (
        <Canvas style={StyleSheet.absoluteFill}>
          <Group
            clip={{ rect: { x: ox, y: oy, width: w, height: h }, rx: radius.xl, ry: radius.xl }}
          >
            <Image image={image} x={ox} y={oy} width={w} height={h} fit="fill" />
          </Group>
          {paths.map((p, i) => {
            if (!p) return null;
            const on = chosen.includes(i);
            return (
              <Group key={i} transform={[{ translateX: ox }, { translateY: oy }]}>
                {on && <Path path={p} color={color.accent} opacity={personPick.fill} />}
                <Path
                  path={p}
                  color={color.surface}
                  style="stroke"
                  strokeWidth={on ? personPick.strokeOn : personPick.strokeOff}
                  strokeJoin="round"
                >
                  {!on && <DashPathEffect intervals={personPick.dash} />}
                </Path>
              </Group>
            );
          })}
        </Canvas>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
