import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text } from 'react-native';

import { color, elevation, radius, size, space, type } from '@/ui/tokens';

import { PressableScale } from './PressableScale';

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'danger' | 'dangerText' | 'text';

type Props = {
  label: string;
  onPress: () => void;
  /**
   * design.md §4. Mỗi màn chỉ một nút `primary`. `danger`: xóa hàng loạt không hoàn tác được.
   * `dangerText`: thao tác xóa phụ (chữ đỏ trên nền trắng).
   */
  variant?: ButtonVariant;
  icon?: LucideIcon;
  /** Nút nhỏ trong đầu màn hoặc trong card. */
  small?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
};

const BG: Record<ButtonVariant, string | undefined> = {
  primary: color.accent,
  secondary: color.surface,
  soft: color.accentSoft,
  danger: color.danger,
  dangerText: color.surface,
  text: undefined,
};

const INK: Record<ButtonVariant, string> = {
  primary: color.accentInk,
  secondary: color.accent,
  soft: color.accent,
  danger: color.dangerInk,
  dangerText: color.danger,
  text: color.accent,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  small,
  disabled,
  fullWidth,
}: Props) {
  const ink = INK[variant];
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.base,
        small && styles.small,
        { backgroundColor: BG[variant] },
        variant === 'primary' && !disabled && styles.primaryShadow,
        variant === 'text' && styles.textOnly,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
      ]}
    >
      {Icon && <Icon size={size.iconSmall} strokeWidth={2} color={ink} />}
      <Text style={[small ? type.label : type.button, { color: ink }]} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: size.button,
    paddingHorizontal: space[6],
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
  },
  small: { minHeight: size.buttonSm, paddingHorizontal: space[4] },
  primaryShadow: { ...elevation.primary, shadowColor: color.accent },
  textOnly: { paddingHorizontal: space[2], minHeight: size.tap },
  fullWidth: { alignSelf: 'stretch', flexGrow: 1 },
  disabled: { opacity: 0.4 },
});
