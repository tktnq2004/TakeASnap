import { StyleSheet, Switch, Text, View } from 'react-native';

import { color, size, type } from '@/ui/tokens';

type Props = { label: string; value: boolean; onChange: (v: boolean) => void };

/** Một dòng nhãn + công tắc, màu bật = accent (design.md §4). */
export function ToggleRow({ label, value, onChange }: Props) {
  return (
    <View style={styles.row}>
      <Text style={[type.body, styles.label]} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: color.accent, false: color.line }}
        thumbColor={color.ink}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: size.tap,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { color: color.ink },
});
