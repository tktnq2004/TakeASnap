import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import {
  GestureDetector,
  usePanGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { color, radius, size, space, type } from '@/ui/tokens';

import { AnimatedText } from './AnimatedText';

type Props = {
  label: string;
  value: SharedValue<number>;
  min: number;
  max: number;
  step?: number;
  /** Định dạng giá trị hiển thị, chạy trên UI thread: phải là worklet. */
  format: (v: number) => string;
  /** Gọi một lần khi thả tay (lưu, haptics). Không gọi trong lúc kéo. */
  onChangeEnd?: (v: number) => void;
  /** Chỉ vẽ rãnh, không có dòng nhãn + giá trị (nhãn vẫn đọc cho VoiceOver/TalkBack). */
  compact?: boolean;
};

const THUMB = 24;
const TRACK = 4;

/**
 * Slider chạy hoàn toàn trên UI thread: kéo không gây re-render (roadmap §3.4).
 * Chạm vào rãnh để nhảy tới vị trí đó.
 */
export function Slider({ label, value, min, max, step = 0, format, onChangeEnd, compact }: Props) {
  const [width, setWidth] = useState(0);
  const usable = Math.max(1, width - THUMB);

  const setFromX = (x: number) => {
    'worklet';
    const ratio = Math.min(1, Math.max(0, (x - THUMB / 2) / usable));
    let v = min + ratio * (max - min);
    if (step > 0) v = Math.round(v / step) * step;
    value.set(Math.min(max, Math.max(min, v)));
  };

  const [a11yValue, setA11yValue] = useState(() => format(value.value));
  const handleEnd = (v: number) => {
    setA11yValue(format(v));
    onChangeEnd?.(v);
  };
  const commit = () => {
    'worklet';
    scheduleOnRN(handleEnd, value.value);
  };

  const pan = usePanGesture({
    minDistance: 0,
    onUpdate: (e) => {
      'worklet';
      setFromX(e.x);
    },
    onDeactivate: () => {
      'worklet';
      commit();
    },
  });

  const tap = useTapGesture({
    onActivate: (e) => {
      'worklet';
      setFromX(e.x);
      commit();
    },
  });

  const gesture = useSimultaneousGestures(pan, tap);

  const ratio = () => {
    'worklet';
    return Math.min(1, Math.max(0, (value.value - min) / (max - min)));
  };
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: ratio() * usable }],
  }));
  const fillStyle = useAnimatedStyle(() => ({ width: ratio() * usable }));
  const text = useDerivedValue(() => format(value.value));

  // VoiceOver/TalkBack: vuốt lên/xuống để tăng/giảm một nấc (design.md §7).
  const nudge = (dir: 1 | -1) => {
    const inc = step > 0 ? step : (max - min) / 20;
    const v = Math.min(max, Math.max(min, value.get() + dir * inc));
    value.set(v);
    handleEnd(v);
  };

  return (
    <View style={compact ? styles.compact : styles.root}>
      {!compact && (
        <View style={styles.header}>
          <Text style={[type.body, styles.label]} maxFontSizeMultiplier={1.3}>
            {label}
          </Text>
          <AnimatedText text={text} style={[type.num, styles.value]} />
        </View>
      )}
      <GestureDetector gesture={gesture}>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={label}
          accessibilityValue={{ text: a11yValue }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => nudge(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
          style={styles.hit}
          onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        >
          <View style={styles.track} />
          <Animated.View style={[styles.fill, fillStyle]} />
          <Animated.View style={[styles.thumb, thumbStyle]} />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space[2] },
  compact: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: color.ink },
  value: { color: color.muted, minWidth: 56, textAlign: 'right' },
  hit: { height: size.tap, justifyContent: 'center' },
  track: {
    position: 'absolute',
    left: THUMB / 2,
    right: THUMB / 2,
    height: TRACK,
    borderRadius: radius.full,
    backgroundColor: color.line,
  },
  fill: {
    position: 'absolute',
    left: THUMB / 2,
    height: TRACK,
    borderRadius: radius.full,
    backgroundColor: color.accent,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: radius.full,
    backgroundColor: color.ink,
  },
});
