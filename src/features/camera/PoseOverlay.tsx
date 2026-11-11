import { StyleSheet, View } from 'react-native';
import Animated, {
  type AnimatedStyle,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';

import { PoseCanvas } from '@/features/pose/PoseCanvas';
import type { Pose } from '@/features/pose/types';
import { ease } from '@/ui/easing';
import { color, motion } from '@/ui/tokens';

import { containSize } from './overlayHit';

type Props = {
  pose: Pose;
  /** Kích thước khung ngắm: pose đặt vừa (contain) trong khung, ở tâm. */
  width: number;
  height: number;
  /** Style transform của useTransformGesture. */
  transform: AnimatedStyle<ViewStyle>;
  scale: SharedValue<number>;
  opacity: number;
  mirrored: boolean;
  hidden: boolean;
  /** Hiện khung bao 1 px khi đang kéo/pinch/xoay (design.md §6.2). */
  showBox: SharedValue<boolean>;
};

/**
 * Overlay pose trên khung ngắm (business-flow §4). Dùng chung PoseCanvas với Chỉnh pose, theo
 * đúng style của bản pose. Không nhận chạm: cử chỉ gắn trên cả khung ngắm (roadmap §3.5).
 *
 * Độ dày viền và nét mặt tính theo pixel màn hình (business-flow §5.2), nên chia cho tỉ lệ
 * overlay để phóng to thu nhỏ không làm nét dày mỏng theo.
 */
export function PoseOverlay(p: Props) {
  const s = p.pose.style;
  const box = containSize(p.pose.width, p.pose.height, p.width, p.height);
  const { scale } = p;
  const outlineWidth = useDerivedValue(() => s.outlineWidth / scale.get());
  const faceWidth = useDerivedValue(() => s.faceWidth / scale.get());

  const visible = p.hidden ? 0 : p.opacity;
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: withTiming(visible, { duration: motion.in, easing: ease }),
  }));
  const { showBox } = p;
  const boxStyle = useAnimatedStyle(() => ({
    borderWidth: 1 / scale.get(),
    opacity: withTiming(showBox.get() ? 1 : 0, { duration: motion.in, easing: ease }),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.abs, { width: p.width, height: p.height }, p.transform]}
    >
      <Animated.View
        style={[styles.fill, fadeStyle, p.mirrored && { transform: [{ scaleX: -1 }] }]}
      >
        <PoseCanvas
          source={p.pose.source}
          imageWidth={p.pose.width}
          imageHeight={p.pose.height}
          contours={p.pose.contours}
          landmarks={p.pose.landmarks}
          width={p.width}
          height={p.height}
          outlineEnabled={s.outlineEnabled}
          outlineColor={s.outlineColor}
          outlineWidth={outlineWidth}
          fillEnabled={s.fillEnabled}
          fillColor={s.fillColor}
          fillOpacity={s.fillOpacity}
          subjectOpacity={s.subjectOpacity}
          backgroundOpacity={s.backgroundOpacity}
          faceEnabled={s.faceEnabled}
          faceColor={s.faceColor}
          faceWidth={faceWidth}
        />
      </Animated.View>
      <View style={[styles.abs, styles.center, { width: p.width, height: p.height }]}>
        <Animated.View style={[{ width: box.width, height: box.height }, styles.box, boxStyle]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute', left: 0, top: 0 },
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  box: { borderColor: color.overlayBox },
});
