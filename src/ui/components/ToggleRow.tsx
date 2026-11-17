import { StyleSheet, Switch, Text, View } from 'react-native';

import { color, size, type } from '@/ui/tokens';

type Props = { label: string; value: boolean; onChange: (v: boolean) => void };

/** Một dòng nhãn + công tắc, bật = màu nhấn (design.md §4). */
export function ToggleRow({ label, value, onChange }: Props) {
  return (
    <View style={styles.row}>
      <Text style={[type.label, styles.label]} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      <Toggle value={value} onChange={onChange} label={label} />
    </View>
  );
}

/** Công tắc hệ thống tô theo token, dùng lại ở hàng [Viền | Mặt]. */
export function Toggle({ value, onChange, label }: Props) {
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ true: color.accent, false: color.switchOff }}
      thumbColor={color.knob}
      ios_backgroundColor={color.switchOff}
      accessibilityLabel={label}
    />
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
