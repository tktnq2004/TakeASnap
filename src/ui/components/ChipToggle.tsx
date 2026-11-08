import { StyleSheet, Text, View } from 'react-native';

import { color, radius, size, space, type } from '@/ui/tokens';

import { PressableScale } from './PressableScale';

type Item = { key: string; label: string; value: boolean; onChange: (v: boolean) => void };

/**
 * Hàng chip bật/tắt độc lập (chọn nhiều). Bật = nền accent. Gọn hơn nhiều dòng công tắc, dùng
 * khi panel cao cố định (design.md §4).
 */
export function ChipToggleRow({ items }: { items: Item[] }) {
  return (
    <View style={styles.row}>
      {items.map((it) => (
        <PressableScale
          key={it.key}
          accessibilityRole="switch"
          accessibilityLabel={it.label}
          accessibilityState={{ checked: it.value }}
          onPress={() => it.onChange(!it.value)}
          hitSlop={4}
          style={[styles.chip, it.value && styles.chipOn]}
        >
          <Text
            style={[type.label, { color: it.value ? color.accentInk : color.ink }]}
            maxFontSizeMultiplier={1.3}
          >
            {it.label}
          </Text>
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[2], flexWrap: 'wrap' },
  chip: {
    height: size.tap - 8,
    paddingHorizontal: space[4],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: color.line,
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: color.accent, borderColor: color.accent },
});
