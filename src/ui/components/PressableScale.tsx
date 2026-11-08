import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { ease } from '@/ui/easing';
import { motion } from '@/ui/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Mức thu nhỏ khi nhấn; mặc định theo token (design.md §3.5). */
  pressedScale?: number;
};

/**
 * Lớp phản hồi nhấn dùng chung: thu nhỏ trong 90 ms khi nhấn, về lại trong 200 ms khi thả.
 * Không nảy, không vượt đích.
 */
export function PressableScale({ style, pressedScale = motion.pressScale, ...rest }: Props) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - (1 - pressedScale) * pressed.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        pressed.value = withTiming(1, { duration: motion.press, easing: ease });
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withTiming(0, { duration: motion.out, easing: ease });
        rest.onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
    />
  );
}
