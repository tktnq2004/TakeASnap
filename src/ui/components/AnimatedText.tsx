import type { ComponentProps } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import Animated, { type SharedValue, useAnimatedProps } from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type Props = {
  text: SharedValue<string>;
  /** Nhận cả style động (vd màu đổi theo shared value). */
  style?: ComponentProps<typeof AnimatedTextInput>['style'];
};

/**
 * Chữ cập nhật từ shared value trên UI thread, không re-render React.
 * Dùng cho giá trị slider, zoom, FPS.
 */
export function AnimatedText({ text, style }: Props) {
  // Chỉ đọc shared value trên UI thread; đọc lúc render làm Reanimated cảnh báo (phiếu Phase 4).
  const animatedProps = useAnimatedProps(() => ({ text: text.get() }) as never);
  return (
    <AnimatedTextInput
      editable={false}
      underlineColorAndroid="transparent"
      animatedProps={animatedProps}
      style={[styles.reset, style]}
    />
  );
}

const styles = StyleSheet.create({
  reset: { padding: 0, margin: 0 },
});
