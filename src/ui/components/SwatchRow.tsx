import { Plus } from 'lucide-react-native';
import { useRef } from 'react';
import { type HostInstance, StyleSheet, View } from 'react-native';

import { t } from '@/ui/strings';
import { color, poseColors, radius, size } from '@/ui/tokens';

import { PressableScale } from './PressableScale';
import { Swatch } from './Swatch';

export type SlotRect = { x: number; y: number; width: number; height: number };

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Ô cuối: mở Bảng màu, nhận vị trí ô trong cửa sổ để bảng chỉ mũi tên vào đúng ô. */
  onOpenPalette?: (rect: SlotRect) => void;
};

/**
 * 7 màu pose có sẵn (design.md §3.2) và một ô màu tự chọn ở cuối. Màu đang dùng không nằm trong
 * 7 màu sẵn thì ô cuối hiện chính màu đó (đang chọn); còn lại là dấu cộng. Chạm ô cuối mở Bảng màu.
 */
export function SwatchRow({ label, value, onChange, onOpenPalette }: Props) {
  const ref = useRef<HostInstance>(null);
  const custom = !poseColors.some((c) => c.value.toLowerCase() === value.toLowerCase());
  const open = () =>
    ref.current?.measureInWindow((x, y, w, h) => onOpenPalette?.({ x, y, width: w, height: h }));

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
      {onOpenPalette && (
        <View ref={ref} collapsable={false}>
          {custom ? (
            <Swatch value={value} name={t.editor.customColor} selected onPress={open} />
          ) : (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={t.editor.openPalette}
              hitSlop={4}
              onPress={open}
              style={styles.plusRing}
            >
              <View style={styles.plus}>
                <Plus size={size.iconSmall} strokeWidth={2.5} color={color.accent} />
              </View>
            </PressableScale>
          )}
        </View>
      )}
    </View>
  );
}

// Cùng cỡ với vòng chọn của Swatch (2 px viền + 2 px khe mỗi bên).
const RING = size.swatch + 8;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plusRing: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  plus: {
    width: size.swatch,
    height: size.swatch,
    borderRadius: radius.full,
    backgroundColor: color.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
