import { CornerUpLeft } from 'lucide-react-native';
import { StyleSheet, Text } from 'react-native';

import { t } from '@/ui/strings';
import { color, radius, size, space, type } from '@/ui/tokens';

import { PressableScale } from './PressableScale';

/**
 * Nút quay lại ở đầu màn trong luồng (design.md §4): nền trắng, mũi tên quay đầu + chữ
 * "Quay lại" (góp ý Phase 3: chỉ có dấu "<" khó nhận ra).
 */
export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={t.common.back}
      hitSlop={4}
      onPress={onPress}
      style={styles.base}
    >
      <CornerUpLeft size={size.icon} strokeWidth={2.25} color={color.accent} />
      <Text style={[type.label, styles.ink]} maxFontSizeMultiplier={1.3}>
        {t.common.back}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    height: size.iconButton,
    paddingLeft: space[3],
    paddingRight: space[4],
    borderRadius: radius.full,
    backgroundColor: color.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ink: { color: color.ink },
});
