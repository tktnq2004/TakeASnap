import { StyleSheet, View } from 'react-native';

import { color, radius, size } from '@/ui/tokens';

import { PressableScale } from './PressableScale';

type Props = {
  value: string;
  /** Tên màu đọc cho VoiceOver/TalkBack, ví dụ "Cam". */
  name: string;
  selected: boolean;
  onPress: () => void;
};

export function Swatch({ value, name, selected, onPress }: Props) {
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityLabel={name}
      accessibilityState={{ selected }}
      hitSlop={4}
      onPress={onPress}
      style={[styles.ring, selected && styles.ringOn]}
    >
      <View style={[styles.fill, { backgroundColor: value }]} />
    </PressableScale>
  );
}

const RING = 2;
const GAP = 2;

const styles = StyleSheet.create({
  ring: {
    width: size.swatch + (RING + GAP) * 2,
    height: size.swatch + (RING + GAP) * 2,
    borderRadius: radius.sm + RING + GAP,
    borderWidth: RING,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOn: { borderColor: color.ink },
  fill: {
    width: size.swatch,
    height: size.swatch,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.line,
  },
});
