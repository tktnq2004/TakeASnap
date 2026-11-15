import { StyleSheet, View } from 'react-native';

import { poseColors } from '@/ui/tokens';

import { Swatch } from './Swatch';

type Props = { label: string; value: string; onChange: (v: string) => void };

/** 7 màu pose có sẵn (design.md §3.2), chọn một. Bảng màu tự do thêm ở bước sau của Phase 4. */
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
  // Vòng chọn đã chừa 5 px mỗi bên, nên ô sát nhau vẫn cách 10 px.
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
