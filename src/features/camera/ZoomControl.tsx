import { StyleSheet, Text, View } from 'react-native';
import {
  GestureDetector,
  useExclusiveGestures,
  useLongPressGesture,
  usePanGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '@/lib/haptics';
import { AnimatedText } from '@/ui/components';
import { ease } from '@/ui/easing';
import { t } from '@/ui/strings';
import { cameraZoom, color, motion, radius, space, type } from '@/ui/tokens';

import { crossedPreset, factorFromTape, formatZoom, presetIndex, tapeOffset } from './zoom';

type Props = {
  factor: SharedValue<number>;
  /** Tăng lên 1 để CameraLayer đẩy giá trị zoom cuối cùng xuống camera. */
  settle: SharedValue<number>;
  /** 0,5 khi máy có ống góc rộng, còn lại 1. */
  min: number;
  /** Báo ra ngoài khi thước cuộn đang hiện (nút Kiểm tra bố cục cạnh cụm nhường chỗ). */
  expanded?: SharedValue<boolean>;
};

const CHIP = 44;
const GAP = 6;
const PAD = 4;
const TAPE_W = 330;
const TAPE_H = 56;
/** Vạch nhỏ mỗi 0,1 từ 0,5 tới 5; vạch lớn kèm số ở các mốc. */
const MAJORS = [0.5, 1, 2, 3, 5];
const TICKS = Array.from({ length: 46 }, (_, i) => Math.round((0.5 + i * 0.1) * 10) / 10);

/** Bề ngang cụm nút lúc nghỉ (để đặt nút Kiểm tra bố cục ngay bên phải cụm). */
export const zoomChipsWidth = (min: number) => {
  const n = min < 1 ? 4 : 3;
  return n * CHIP + (n - 1) * GAP + 2 * PAD;
};

/**
 * Zoom (design.md §6.1, kiểu B): lúc nghỉ là các nút nhanh 0,5 · 1× · 2 · 3; đặt ngón lên cụm rồi
 * kéo ngang thì thành thước cuộn, kim đứng yên ở giữa, thước chạy dưới kim. Thả tay thì về nút.
 * Mọi thứ chạy trên UI thread; CameraLayer đọc `factor` và đẩy zoom xuống camera.
 */
export function ZoomControl({ factor, settle, min, expanded }: Props) {
  const presets = min < 1 ? [0.5, 1, 2, 3] : [1, 2, 3];
  const dragging = useSharedValue(false);
  const start = useSharedValue(1);

  const pan = usePanGesture({
    activeOffsetX: [-8, 8],
    onActivate: () => {
      'worklet';
      start.set(factor.get());
      dragging.set(true);
    },
    onUpdate: (e) => {
      'worklet';
      const prev = factor.get();
      const next = factorFromTape(start.get(), e.translationX, min, cameraZoom.max);
      if (next !== prev) {
        if (crossedPreset(prev, next, MAJORS)) scheduleOnRN(haptic.select);
        factor.set(next);
      }
    },
    onFinalize: () => {
      'worklet';
      dragging.set(false);
      settle.set(settle.get() + 1);
    },
  });

  const tap = useTapGesture({
    onActivate: (e) => {
      'worklet';
      const i = Math.min(presets.length - 1, Math.max(0, Math.floor((e.x - PAD) / (CHIP + GAP))));
      factor.set(presets[i]!);
      settle.set(settle.get() + 1);
    },
  });

  // Giữ yên trên cụm nút cũng hiện thước (góp ý Phase 4, mục 4.2); giữ rồi kéo thì kéo luôn.
  const holding = useSharedValue(false);
  const hold = useLongPressGesture({
    minDuration: 250,
    maxDistance: 10000,
    onActivate: () => {
      'worklet';
      holding.set(true);
      scheduleOnRN(haptic.select);
    },
    onFinalize: () => {
      'worklet';
      holding.set(false);
    },
  });

  const gesture = useExclusiveGestures(useSimultaneousGestures(pan, hold), tap);

  useAnimatedReaction(
    () => dragging.get() || holding.get(),
    (now, old) => {
      if (now !== old) expanded?.set(now);
    },
  );

  const chipsStyle = useAnimatedStyle(() => ({
    opacity: withTiming(dragging.get() || holding.get() ? 0 : 1, {
      duration: motion.in,
      easing: ease,
    }),
  }));
  const tapeStyle = useAnimatedStyle(() => ({
    opacity: withTiming(dragging.get() || holding.get() ? 1 : 0, {
      duration: motion.in,
      easing: ease,
    }),
  }));
  const stripStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: TAPE_W / 2 - tapeOffset(factor.get()) }],
  }));
  const value = useDerivedValue(() => formatZoom(factor.get()));

  return (
    <View style={styles.root}>
      {/* Thước cuộn: chỉ hiện khi đang kéo, đặt chồng lên đúng chỗ các nút. */}
      <Animated.View pointerEvents="none" style={[styles.tapeWrap, tapeStyle]}>
        <View style={styles.bubble}>
          <AnimatedText text={value} style={[type.label, styles.bubbleText]} />
        </View>
        <View style={styles.tape}>
          <Animated.View style={[styles.strip, stripStyle]}>
            {TICKS.map((z) => {
              const major = MAJORS.includes(z);
              const x = tapeOffset(z);
              return (
                <View key={z} style={[styles.tickBox, { left: x }]}>
                  <View style={major ? styles.tickMajor : styles.tick} />
                  {major && (
                    <Text style={styles.tickLabel} maxFontSizeMultiplier={1.2}>
                      {String(z).replace('.', ',')}
                    </Text>
                  )}
                </View>
              );
            })}
          </Animated.View>
          <View style={styles.needle} />
        </View>
      </Animated.View>

      <GestureDetector gesture={gesture}>
        <Animated.View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={t.camera.zoomLabel}
          style={[styles.chips, chipsStyle]}
        >
          {presets.map((p, i) => (
            <ZoomChip key={p} preset={p} index={i} presets={presets} factor={factor} />
          ))}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

/** Một nút nhanh: nút đang chứa hệ số hiện tại hiện giá trị thật (vd 1,4×), to hơn, xanh nhạt. */
function ZoomChip({
  preset,
  index,
  presets,
  factor,
}: {
  preset: number;
  index: number;
  presets: number[];
  factor: SharedValue<number>;
}) {
  const label = String(preset).replace('.', ',');
  const text = useDerivedValue(() =>
    presetIndex(factor.get(), presets) === index ? formatZoom(factor.get()) : label,
  );
  const style = useAnimatedStyle(() => {
    const on = presetIndex(factor.get(), presets) === index;
    return { transform: [{ scale: withTiming(on ? 1 : 0.86, { duration: motion.in }) }] };
  });
  const textStyle = useAnimatedStyle(() => ({
    color: presetIndex(factor.get(), presets) === index ? color.camAccent : color.camInk,
  }));
  return (
    <Animated.View style={[styles.chip, style]}>
      <AnimatedText text={text} style={[type.num, styles.chipText, textStyle]} />
    </Animated.View>
  );
}

const TICK_BOX = 30;

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center', height: TAPE_H },
  chips: {
    flexDirection: 'row',
    gap: GAP,
    padding: PAD,
    borderRadius: radius.full,
    backgroundColor: color.camGlass,
  },
  chip: {
    width: CHIP,
    height: CHIP,
    borderRadius: radius.full,
    backgroundColor: color.camScrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { textAlign: 'center', minWidth: CHIP - 4 },
  tapeWrap: { position: 'absolute', alignItems: 'center', bottom: 0 },
  bubble: {
    marginBottom: space[2],
    paddingHorizontal: space[3],
    height: 28,
    borderRadius: radius.full,
    backgroundColor: color.accent,
    justifyContent: 'center',
  },
  bubbleText: { color: color.accentInk, textAlign: 'center', minWidth: 44 },
  tape: {
    width: TAPE_W,
    height: TAPE_H,
    borderRadius: radius.full,
    backgroundColor: color.camScrim,
    overflow: 'hidden',
  },
  strip: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  tickBox: {
    position: 'absolute',
    top: 0,
    width: TICK_BOX,
    marginLeft: -TICK_BOX / 2,
    alignItems: 'center',
  },
  tick: { marginTop: 21, width: 1, height: 9, backgroundColor: color.camMuted },
  tickMajor: { marginTop: 12, width: 2, height: 18, backgroundColor: color.camInk },
  tickLabel: {
    marginTop: 4,
    fontFamily: type.num.fontFamily,
    fontSize: 12,
    lineHeight: 14,
    color: color.camInk,
  },
  needle: {
    position: 'absolute',
    left: TAPE_W / 2 - 1.5,
    top: 6,
    width: 3,
    height: 30,
    borderRadius: 2,
    backgroundColor: color.camAccent,
  },
});

export const zoomControlHeight = TAPE_H;
