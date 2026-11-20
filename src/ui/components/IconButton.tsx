import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import { color, radius, size } from '@/ui/tokens';

import { PressableScale } from './PressableScale';

type Props = {
  icon: LucideIcon;
  /** Nhãn VoiceOver/TalkBack, bắt buộc vì nút không có chữ (design.md §3.7). */
  label: string;
  onPress: () => void;
  /** Đang bật: nền màu nhấn. */
  active?: boolean;
  /** Đặt trên khung ngắm: đĩa tối để đọc được trên mọi cảnh. */
  onScrim?: boolean;
  disabled?: boolean;
};

/** Nút icon tròn 44. Trên màn sáng: nền `surfaceAlt`; tắt thì icon `faint`. */
export function IconButton({ icon: Icon, label, onPress, active, onScrim, disabled }: Props) {
  const ink = onScrim || active ? color.camInk : disabled ? color.faint : color.ink;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active, disabled: !!disabled }}
      hitSlop={4}
      disabled={disabled}
      onPress={onPress}
      style={[styles.base, onScrim && styles.scrim, active && styles.active]}
    >
      <Icon size={size.icon} strokeWidth={2} color={ink} />
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
    backgroundColor: color.surfaceAlt,
  },
  scrim: { backgroundColor: color.camScrim },
  active: { backgroundColor: color.accent },
});
