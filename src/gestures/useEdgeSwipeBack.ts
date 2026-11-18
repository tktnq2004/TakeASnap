import { usePanGesture } from 'react-native-gesture-handler';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ease, easeIO } from '@/ui/easing';
import { edgeSwipe, motion } from '@/ui/tokens';

/**
 * Vuốt từ mép trái sang phải để quay lại (phiếu Phase 5 lần 4), cho các màn mở kiểu
 * `fullScreenModal` (iOS không có cử chỉ này sẵn). Chỉ bắt đầu trong dải `edgeSwipe.edge` px sát
 * mép trái; màn trượt theo ngón tay, thả quá `edgeSwipe.distance` hoặc vuốt nhanh thì quay lại,
 * không thì trượt về chỗ cũ. Chạy trên UI thread, chỉ sang JS khi quyết định quay lại.
 */
export function useEdgeSwipeBack(onBack: () => void, width: number) {
  const x = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  const gesture = usePanGesture({
    hitSlop: { left: 0, width: edgeSwipe.edge },
    activeOffsetX: 12,
    failOffsetY: [-14, 14],
    onUpdate: (e) => {
      'worklet';
      x.set(Math.max(0, e.translationX));
    },
    onDeactivate: (e) => {
      'worklet';
      const go = e.translationX > edgeSwipe.distance || e.velocityX > edgeSwipe.velocity;
      if (go) {
        if (reduceMotion) {
          scheduleOnRN(onBack);
          return;
        }
        x.set(
          withTiming(width, { duration: motion.in, easing: ease }, (done) => {
            if (done) scheduleOnRN(onBack);
          }),
        );
      } else {
        x.set(reduceMotion ? 0 : withTiming(0, { duration: motion.panel, easing: easeIO }));
      }
    },
  });

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  return { gesture, style };
}
