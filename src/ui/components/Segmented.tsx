import type { LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, withTiming } from 'react-native-reanimated';

import { easeIO } from '@/ui/easing';
import { color, motion, radius, size, space, type } from '@/ui/tokens';

type Option<K extends string> = {
  key: K;
  label: string;
  icon?: LucideIcon;
  /** Ô tắt: chữ `faint`, không bấm được (vd "Mặt" khi ảnh không có mặt). */
  disabled?: boolean;
};

type Props<K extends string> = {
  options: readonly Option<K>[];
  value: K;
  onChange: (key: K) => void;
  /** `page`: rãnh trắng trên nền màn. `card`: rãnh `surfaceAlt` nhỏ hơn, đặt trong card trắng. */
  tone?: 'page' | 'card';
};

/**
 * Thanh chọn (design.md §4): ô đang chọn nền màu nhấn, chữ trắng; ô chỉ báo trượt 240 ms, bật
 * Reduce Motion thì nhảy ngay (design.md §3.5).
 */
export function Segmented<K extends string>({ options, value, onChange, tone = 'page' }: Props<K>) {
  const [width, setWidth] = useState(0);
  const reduceMotion = useReducedMotion();
  const card = tone === 'card';
  const pad = card ? 3 : 4;
  const index = Math.max(
    0,
    options.findIndex((o) => o.key === value),
  );
  const cell = options.length > 0 ? (width - pad * 2) / options.length : 0;

  const indicator = useAnimatedStyle(() => ({
    width: cell,
    transform: [
      {
        translateX: reduceMotion
          ? index * cell
          : withTiming(index * cell, { duration: motion.slide, easing: easeIO }),
      },
    ],
  }));

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.track,
        { padding: pad, height: card ? size.buttonSm : size.segmented },
        card && styles.trackCard,
      ]}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <Animated.View
          style={[styles.indicator, { top: pad, bottom: pad, left: pad }, indicator]}
        />
      )}
      {options.map((o) => {
        const selected = o.key === value;
        const ink = selected
          ? color.accentInk
          : o.disabled
            ? color.faint
            : card
              ? color.muted
              : color.ink;
        const Icon = o.icon;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityLabel={o.label}
            accessibilityState={{ selected, disabled: !!o.disabled }}
            disabled={o.disabled}
            onPress={() => onChange(o.key)}
            style={styles.cell}
          >
            {Icon && <Icon size={size.iconSmall - 2} strokeWidth={2.25} color={ink} />}
            <Text
              style={[card ? type.caption : type.label, { color: ink }]}
              maxFontSizeMultiplier={1.3}
              numberOfLines={1}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radius.full,
    backgroundColor: color.surface,
  },
  trackCard: { backgroundColor: color.surfaceAlt },
  indicator: {
    position: 'absolute',
    borderRadius: radius.full,
    backgroundColor: color.accent,
  },
  cell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[1] + 2,
    paddingHorizontal: space[2],
  },
});
