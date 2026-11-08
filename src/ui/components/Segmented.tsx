import { useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, withTiming } from 'react-native-reanimated';

import { easeIO } from '@/ui/easing';
import { color, motion, radius, size, space, type } from '@/ui/tokens';

type Option<K extends string> = { key: K; label: string };

type Props<K extends string> = {
  options: readonly Option<K>[];
  value: K;
  onChange: (key: K) => void;
};

/** Thanh chọn tab: vạch chỉ báo trượt 240 ms; bật Reduce Motion thì nhảy ngay (design.md §3.5). */
export function Segmented<K extends string>({ options, value, onChange }: Props<K>) {
  const [width, setWidth] = useState(0);
  const reduceMotion = useReducedMotion();
  const index = Math.max(
    0,
    options.findIndex((o) => o.key === value),
  );
  const cell = options.length > 0 ? (width - PAD * 2) / options.length : 0;

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
      style={styles.track}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && <Animated.View style={[styles.indicator, indicator]} />}
      {options.map((o) => {
        const selected = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityLabel={o.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(o.key)}
            style={styles.cell}
          >
            <Text
              style={[type.label, { color: selected ? color.ink : color.muted }]}
              maxFontSizeMultiplier={1.3}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const PAD = 4;

const styles = StyleSheet.create({
  track: {
    height: size.segmented,
    flexDirection: 'row',
    padding: PAD,
    borderRadius: radius.sm + PAD,
    backgroundColor: color.bg,
    borderWidth: 1,
    borderColor: color.line,
  },
  indicator: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: PAD,
    borderRadius: radius.sm,
    backgroundColor: color.surface,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[2],
  },
});
