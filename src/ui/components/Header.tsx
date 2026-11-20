import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { color, size, space, type } from '@/ui/tokens';

import { BackButton } from './BackButton';

/**
 * Đầu màn mở đè lên Camera (design.md §6): tiêu đề to bên trái, nút (thường là Đóng) bên phải.
 */
export function OverlayHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.overlay}>
      <Text accessibilityRole="header" style={[type.title, styles.title]} numberOfLines={1}>
        {title}
      </Text>
      {right && <View style={styles.right}>{right}</View>}
    </View>
  );
}

/**
 * Đầu màn là một bước trong luồng (design.md §6): Quay lại bên trái, tên màn căn giữa màn
 * (không theo bề rộng nút Quay lại).
 */
export function FlowHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.flow}>
      <View pointerEvents="none" style={styles.flowTitle}>
        <Text accessibilityRole="header" style={[type.head, styles.title]}>
          {title}
        </Text>
      </View>
      <BackButton onPress={onBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    minHeight: size.iconButton,
    paddingLeft: size.gutter,
    paddingRight: size.edge + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
  },
  title: { color: color.ink, flexShrink: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  flow: {
    height: size.iconButton + space[3],
    paddingHorizontal: size.edge,
    flexDirection: 'row',
    alignItems: 'center',
  },
  flowTitle: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
