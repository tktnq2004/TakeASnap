import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { type SharedValue, useDerivedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { BrushMode } from '@/engine/brush';
import { color, refineBrush } from '@/ui/tokens';

type Props = {
  mode: BrushMode;
  /** Đường kính cọ, px màn hình. */
  size: SharedValue<number>;
  /** Nét đang vẽ [x, y, …] theo px của lớp này. Màn cha xóa sau khi viền mới đã vẽ xong. */
  live: SharedValue<number[]>;
  /** Nhấc ngón tay: nét vừa vẽ (px của lớp này) và đường kính cọ. */
  onStroke: (points: number[], diameter: number) => void;
};

/**
 * Lớp Sửa nét đặt trên preview Chỉnh pose (business-flow §5.2). Nét đang vẽ hiện ngay trên UI
 * thread (màu nhấn = thêm, màu nguy hiểm = xóa, màu chữ = khôi phục); viền chỉ tính lại khi nhấc ngón tay, nên không
 * có setState trong lúc vẽ.
 */
export function RefineLayer({ mode, size, live, onStroke }: Props) {
  const pan = usePanGesture({
    minDistance: 0,
    onActivate: (e) => {
      'worklet';
      live.set([e.x, e.y]);
    },
    onUpdate: (e) => {
      'worklet';
      live.modify((p) => {
        'worklet';
        p.push(e.x, e.y);
        return p;
      });
    },
    onDeactivate: () => {
      'worklet';
      const p = live.get();
      if (p.length >= 2) scheduleOnRN(onStroke, p.slice(), size.get());
    },
  });

  const path = useDerivedValue(() => {
    const p = live.get();
    const b = Skia.PathBuilder.Make();
    if (p.length >= 2) {
      b.moveTo(p[0]!, p[1]!);
      // Một chạm (không kéo) vẫn vẽ một chấm tròn.
      if (p.length === 2) b.lineTo(p[0]! + 0.01, p[1]!);
      for (let i = 2; i + 1 < p.length; i += 2) b.lineTo(p[i]!, p[i + 1]!);
    }
    return b.build();
  });
  const strokeWidth = useDerivedValue(() => size.get());

  return (
    <GestureDetector gesture={pan}>
      <View style={StyleSheet.absoluteFill}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Path
            path={path}
            style="stroke"
            strokeWidth={strokeWidth}
            strokeCap="round"
            strokeJoin="round"
            color={mode === 'add' ? color.accent : mode === 'erase' ? color.danger : color.ink}
            opacity={refineBrush.liveOpacity}
          />
        </Canvas>
      </View>
    </GestureDetector>
  );
}
