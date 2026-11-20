import { type ComponentProps, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedProps,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type Props = {
  text: SharedValue<string>;
  /** Nhận cả style động (vd màu đổi theo shared value). */
  style?: ComponentProps<typeof AnimatedTextInput>['style'];
};

/**
 * Chữ cập nhật từ shared value trên UI thread, không re-render React.
 * Dùng cho giá trị slider, zoom, FPS.
 *
 * Chữ ban đầu: `animatedProps` chỉ đẩy `text` khi giá trị đổi, nên ô sẽ trống tới lần đổi đầu tiên
 * (phiếu Phase 4: số zoom, số px mất khi mới vào). Đọc shared value lúc render thì Reanimated cảnh
 * báo, nên giá trị đầu lấy trên UI thread rồi gửi về JS một lần, gắn làm `defaultValue`. Ô dựng lại
 * đúng một lần khi có giá trị đầu (key đổi), vì `defaultValue` chỉ có tác dụng lúc dựng.
 */
export function AnimatedText({ text, style }: Props) {
  const [initial, setInitial] = useState<string | null>(null);
  useAnimatedReaction(
    () => text.get(),
    (v, prev) => {
      if (prev === null) scheduleOnRN(setInitial, v);
    },
  );
  const animatedProps = useAnimatedProps(() => ({ text: text.get() }) as never);
  return (
    <AnimatedTextInput
      key={initial === null ? 'wait' : 'ready'}
      editable={false}
      underlineColorAndroid="transparent"
      defaultValue={initial ?? ''}
      animatedProps={animatedProps}
      style={[styles.reset, style]}
    />
  );
}

const styles = StyleSheet.create({
  reset: { padding: 0, margin: 0 },
});
