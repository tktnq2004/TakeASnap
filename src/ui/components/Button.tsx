import { StyleSheet, Text } from 'react-native';

import { color, radius, size, space, type } from '@/ui/tokens';

import { PressableScale } from './PressableScale';

type Props = {
  label: string;
  onPress: () => void;
  /** Mỗi màn chỉ một nút primary (design.md §4). */
  variant?: 'primary' | 'secondary' | 'text';
  disabled?: boolean;
  fullWidth?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled, fullWidth }: Props) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'text' && styles.textOnly,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          type.button,
          { color: variant === 'primary' ? color.accentInk : color.ink },
          variant === 'text' && styles.underline,
        ]}
        maxFontSizeMultiplier={1.3}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: size.button,
    paddingHorizontal: space[5],
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: color.accent },
  secondary: { borderWidth: 1, borderColor: color.line },
  textOnly: { paddingHorizontal: space[2], minHeight: size.tap },
  underline: { textDecorationLine: 'underline' },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.4 },
});
