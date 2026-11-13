import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import { color, radius, size } from '@/ui/tokens';

import { PressableScale } from './PressableScale';

type Props = {
  icon: LucideIcon;
  /** Nhãn VoiceOver/TalkBack, bắt buộc vì nút không có chữ (design.md §3.7). */
  label: string;
  onPress: () => void;
  /** Đang bật: glyph màu nhấn. */
  active?: boolean;
  /** Đặt trên khung ngắm: thêm đĩa scrim để đọc được trên mọi cảnh. */
  onScrim?: boolean;
  disabled?: boolean;
};

export function IconButton({ icon: Icon, label, onPress, active, onScrim, disabled }: Props) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active, disabled: !!disabled }}
      hitSlop={4}
      disabled={disabled}
      onPress={onPress}
      style={[styles.base, onScrim && styles.scrim, disabled && styles.disabled]}
    >
      <Icon size={size.icon} strokeWidth={1.75} color={active ? color.accent : color.ink} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    width: size.iconButton,
    height: size.iconButton,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: { backgroundColor: color.scrim },
  disabled: { opacity: 0.4 },
});
