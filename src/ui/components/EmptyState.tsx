import { StyleSheet, Text, View } from 'react-native';

import { color, space, type } from '@/ui/tokens';

import { Button } from './Button';

type Props = {
  /** Một câu nói chuyện gì đã xảy ra. */
  message: string;
  /** Một nút làm tiếp. */
  action?: { label: string; onPress: () => void };
  /** Đặt trên camera (nền tối). */
  dark?: boolean;
};

/**
 * Trạng thái trống, lỗi, thiếu quyền (design.md §4): một câu + một nút. Không icon minh họa,
 * không câu hướng dẫn thêm.
 */
export function EmptyState({ message, action, dark }: Props) {
  return (
    <View style={styles.root}>
      <Text style={[type.body, styles.text, { color: dark ? color.camInk : color.ink }]}>
        {message}
      </Text>
      {action && <Button label={action.label} onPress={action.onPress} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: space[5], paddingHorizontal: space[6] },
  text: { textAlign: 'center' },
});
