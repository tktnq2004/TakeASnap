import { StyleSheet, View } from 'react-native';

import { poseColors, space } from '@/ui/tokens';

import { Swatch } from './Swatch';

type Props = { label: string; value: string; onChange: (v: string) => void };

/** 8 màu pose có sẵn (design.md §3.2), chọn một. */
export function SwatchRow({ label, value, onChange }: Props) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {poseColors.map((c) => (
        <Swatch
          key={c.value}
          value={c.value}
          name={c.name}
          selected={c.value.toLowerCase() === value.toLowerCase()}
          onPress={() => onChange(c.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space[1] },
});
