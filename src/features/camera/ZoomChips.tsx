import { StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { PressableScale } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, radius, size, space, type } from '@/ui/tokens';

export type ZoomChip = '0.5' | '1' | '2';

type Props = {
  factor: SharedValue<number>;
  /** Đang dùng ống góc rộng (0.5×). */
  ultraWideActive: boolean;
  /** Máy có ống góc rộng (chỉ iPhone, qua `selectedLens`). */
  hasUltraWide: boolean;
  onSelect: (chip: ZoomChip) => void;
};

/**
 * Chip zoom 0.5× / 1× / 2× (business-flow §4.3). Chip sáng theo hệ số zoom trên UI thread nên
 * pinch không làm component này re-render.
 */
export function ZoomChips({ factor, ultraWideActive, hasUltraWide, onSelect }: Props) {
  const chips: ZoomChip[] = hasUltraWide ? ['0.5', '1', '2'] : ['1', '2'];
  return (
    <View style={styles.row}>
      {chips.map((c) => (
        <Chip
          key={c}
          chip={c}
          factor={factor}
          ultraWideActive={ultraWideActive}
          onPress={() => onSelect(c)}
        />
      ))}
    </View>
  );
}

function Chip({
  chip,
  factor,
  ultraWideActive,
  onPress,
}: {
  chip: ZoomChip;
  factor: SharedValue<number>;
  ultraWideActive: boolean;
  onPress: () => void;
}) {
  const label = `${chip.replace('.', ',')}×`;
  const textStyle = useAnimatedStyle(() => {
    const f = factor.get();
    const active = ultraWideActive
      ? chip === '0.5'
      : chip === '1'
        ? f < 1.95
        : chip === '2'
          ? f >= 1.95
          : false;
    return { color: active ? color.accent : color.ink };
  });
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={t.camera.zoom(label)}
      hitSlop={6}
      onPress={onPress}
      style={styles.chip}
    >
      <Animated.Text style={[type.num, textStyle]}>{label}</Animated.Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[2], justifyContent: 'center' },
  chip: {
    minWidth: size.chip + space[3],
    height: size.chip,
    paddingHorizontal: space[2],
    borderRadius: radius.full,
    backgroundColor: color.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
