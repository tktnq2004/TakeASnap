import { X } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import { t } from '@/ui/strings';
import { color, radius, size } from '@/ui/tokens';

import { PressableScale } from './PressableScale';

type Props = { onPress: () => void; label?: string };

/** Nút Đóng của màn mở đè lên Camera (design.md §6): tròn trắng, icon X. */
export function CloseButton({ onPress, label = t.common.close }: Props) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      onPress={onPress}
      style={styles.base}
    >
      <X size={size.icon} strokeWidth={2.25} color={color.ink} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    width: size.iconButton,
    height: size.iconButton,
    borderRadius: radius.full,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
