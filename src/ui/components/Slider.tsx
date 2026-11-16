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
  useAnimatedReaction,
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

/** design.md §4 Slider: rãnh 10, núm 28 trắng viền 4 màu nhấn. */
const THUMB = 28;
const TRACK = 10;
const THUMB_RING = 4;

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

  const [a11yValue, setA11yValue] = useState('');
  // Giá trị đọc cho VoiceOver/TalkBack lấy một lần lúc gắn (trên UI thread, không đọc lúc render);
  // sau đó cập nhật khi thả tay.
  useAnimatedReaction(
    () => value.get(),
    (v, prev) => {
      if (prev === null) scheduleOnRN(setA11yValue, format(v));
    },
  );
  const handleEnd = (v: number) => {
    setA11yValue(format(v));
    onChangeEnd?.(v);
  };
  const commit = () => {
    'worklet';
    scheduleOnRN(handleEnd, value.get());
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

  // Reanimated chỉ theo dõi shared value đọc TRỰC TIẾP trong style; đọc qua hàm phụ thì thanh chỉ
  // vẽ lại khi re-render (lỗi góp ý Phase 2: thanh zoom đứng yên tới lúc thả tay).
  const ratio = (v: number) => {
    'worklet';
    return Math.min(1, Math.max(0, (v - min) / (max - min)));
  };
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: ratio(value.get()) * usable }],
  }));
  const fillStyle = useAnimatedStyle(() => ({ width: ratio(value.get()) * usable }));
  const text = useDerivedValue(() => format(value.get()));

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
          <Text style={[type.label, styles.label]} maxFontSizeMultiplier={1.3}>
            {label}
          </Text>
          <View style={styles.pill}>
            <AnimatedText text={text} style={[type.num, styles.value]} />
          </View>
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
  root: { gap: space[1] },
  compact: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: color.ink },
  pill: {
    minHeight: 26,
    paddingHorizontal: space[3] - 2,
    borderRadius: radius.full,
    backgroundColor: color.accentSoft,
    justifyContent: 'center',
  },
  value: { color: color.accent, minWidth: 44, textAlign: 'center' },
  hit: { height: size.tap, justifyContent: 'center' },
  track: {
    position: 'absolute',
    left: THUMB / 2,
    right: THUMB / 2,
    height: TRACK,
    borderRadius: radius.full,
    backgroundColor: color.accentSoft,
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
    borderWidth: THUMB_RING,
    borderColor: color.accent,
    backgroundColor: color.surface,
  },
});
