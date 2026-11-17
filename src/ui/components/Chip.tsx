import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text } from 'react-native';

import { color, radius, size, space, type } from '@/ui/tokens';

import { PressableScale } from './PressableScale';

type Props = {
  label: string;
  icon?: LucideIcon;
  selected: boolean;
  onPress: () => void;
};

/** Chip tab của Chỉnh pose (design.md §4): nền trắng; đang chọn nền màu nhấn, chữ trắng. */
export function Chip({ label, icon: Icon, selected, onPress }: Props) {
  return (
    <PressableScale
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.base, selected && styles.on]}
    >
      {Icon && (
        <Icon
          size={size.iconSmall}
          strokeWidth={2}
          color={selected ? color.accentInk : color.accent}
        />
      )}
      <Text
        style={[type.label, { color: selected ? color.accentInk : color.ink }]}
        maxFontSizeMultiplier={1.3}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    height: size.chip,
    paddingHorizontal: space[4],
    borderRadius: radius.full,
    backgroundColor: color.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  on: { backgroundColor: color.accent },
});
