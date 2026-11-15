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

/** Ô màu tròn 36 (design.md §4); đang chọn: vòng 3 px trắng + 2 px màu nhấn. */
export function Swatch({ value, name, selected, onPress }: Props) {
  const white = value.toUpperCase() === '#FFFFFF';
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityLabel={name}
      accessibilityState={{ selected }}
      hitSlop={4}
      onPress={onPress}
      style={[styles.ring, selected && styles.ringOn]}
    >
      <View style={[styles.fill, { backgroundColor: value }, white && styles.edge]} />
    </PressableScale>
  );
}

const RING = 2;
const GAP = 3;

const styles = StyleSheet.create({
  ring: {
    width: size.swatch + (RING + GAP) * 2,
    height: size.swatch + (RING + GAP) * 2,
    borderRadius: radius.full,
    borderWidth: RING,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOn: { borderColor: color.accent },
  fill: { width: size.swatch, height: size.swatch, borderRadius: radius.full },
  edge: { borderWidth: 2, borderColor: color.swatchEdge },
});
