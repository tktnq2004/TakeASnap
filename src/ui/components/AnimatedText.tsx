import { StyleSheet, TextInput, type TextStyle, type StyleProp } from 'react-native';
import Animated, { type SharedValue, useAnimatedProps } from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type Props = {
  text: SharedValue<string>;
  style?: StyleProp<TextStyle>;
};

/**
 * Chữ cập nhật từ shared value trên UI thread, không re-render React.
 * Dùng cho giá trị slider, zoom, FPS.
 */
export function AnimatedText({ text, style }: Props) {
  const animatedProps = useAnimatedProps(() => ({ text: text.value }) as never);
  return (
    <AnimatedTextInput
      editable={false}
      underlineColorAndroid="transparent"
      defaultValue={text.value}
      animatedProps={animatedProps}
      style={[styles.reset, style]}
    />
  );
}

const styles = StyleSheet.create({
  reset: { padding: 0, margin: 0 },
});
