import { CornerUpLeft } from 'lucide-react-native';
import { StyleSheet, Text } from 'react-native';

import { t } from '@/ui/strings';
import { color, size, space, type } from '@/ui/tokens';

import { PressableScale } from './PressableScale';

/**
 * Nút quay lại ở đầu màn: mũi tên quay đầu + chữ "Quay lại" (góp ý Phase 3: chỉ có dấu "<" khó
 * nhận ra). Cao bằng IconButton.
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
      <CornerUpLeft size={size.icon} strokeWidth={1.75} color={color.ink} />
      <Text style={[type.button, styles.ink]} maxFontSizeMultiplier={1.3}>
        {t.common.back}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    height: size.iconButton,
    paddingHorizontal: space[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
  },
  ink: { color: color.ink },
});
