/**
 * Kết quả Kiểm tra bố cục trên khung ngắm (design.md §6.15, Phase 5a): khung người chính, chấm
 * mắt và một dòng gợi ý ở chỗ viên gợi ý, hiện `compositionUi.checkShowMs` rồi tự ẩn.
 */
import { Check, ScanSearch } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import type { Rect } from '@/features/camera/frame';
import { ease } from '@/ui/easing';
import { t } from '@/ui/strings';
import { color, compositionUi, motion, radius, size, space, type } from '@/ui/tokens';

import type { CheckResult } from './useLayoutCheck';

export function CheckOverlay({
  frame,
  result,
  flip,
  maxBottom,
}: {
  frame: Rect;
  result: CheckResult;
  /** Ảnh chụp không lật như khung ngắm (camera trước, tắt Lật ảnh camera trước): lật x. */
  flip: boolean;
  maxBottom: number;
}) {
  const fx = (x: number) => (flip ? 1 - x : x);
  let box: [number, number, number, number] | null = null;
  let eye: { x: number; y: number } | null = null;
  let text: string;
  let ok = false;
  if (result.kind === 'review') {
    const f = result.features;
    const b = f.people[f.main]?.box;
    if (b) {
      const x0 = fx(b[0]);
      const x1 = fx(b[2]);
      box = [Math.min(x0, x1), b[1], Math.max(x0, x1), b[3]];
    }
    if (f.eye) eye = { x: fx(f.eye.x), y: f.eye.y };
    if (result.note) text = t.review.notes[result.note.id];
    else {
      ok = true;
      text = t.composition.check.ok(t.composition.names[result.technique]);
    }
  } else text = result.kind === 'none' ? t.composition.check.noPerson : t.composition.check.failed;

  const top = Math.min(frame.y + frame.height - space[3], maxBottom) - compositionUi.hintH;
  const enter = FadeIn.duration(motion.in).easing(ease);
  const exit = FadeOut.duration(motion.in).easing(ease);
  const Icon = ok ? Check : ScanSearch;

  return (
    <>
      <Animated.View
        pointerEvents="none"
        entering={enter}
        exiting={exit}
        style={[styles.abs, { left: frame.x, top: frame.y, width: frame.width, height: frame.height }]}
      >
        {box && (
          <View
            style={[
              styles.box,
              {
                left: box[0] * frame.width,
                top: box[1] * frame.height,
                width: (box[2] - box[0]) * frame.width,
                height: (box[3] - box[1]) * frame.height,
              },
            ]}
          />
        )}
        {eye && (
          <View
            style={[
              styles.eye,
              {
                left: eye.x * frame.width - compositionUi.checkEye / 2,
                top: eye.y * frame.height - compositionUi.checkEye / 2,
              },
            ]}
          />
        )}
      </Animated.View>
      <View pointerEvents="none" style={[styles.wrap, { top }]}>
        <Animated.View
          entering={enter}
          exiting={exit}
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
          style={[styles.pill, ok && styles.pillOk]}
        >
          <Icon
            size={size.iconSmall}
            strokeWidth={2.5}
            color={ok ? color.accentInk : color.camAccent}
          />
          <Text
            style={[styles.text, ok && styles.textOk]}
            numberOfLines={2}
            maxFontSizeMultiplier={1.3}
          >
            {text}
          </Text>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  box: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: color.camInk,
    borderRadius: radius.sm,
    opacity: 0.7,
  },
  eye: {
    position: 'absolute',
    width: compositionUi.checkEye,
    height: compositionUi.checkEye,
    borderRadius: radius.full,
    backgroundColor: color.camInk,
    borderWidth: 2,
    borderColor: color.camBg,
  },
  wrap: {
    position: 'absolute',
    left: space[4],
    right: space[4],
    alignItems: 'center',
  },
  pill: {
    minHeight: compositionUi.hintH,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[4],
    paddingVertical: space[1],
    borderRadius: compositionUi.hintH / 2,
    backgroundColor: color.camHint,
  },
  pillOk: { backgroundColor: color.camAccent },
  text: { ...type.label, fontSize: 14, color: color.camInk, flexShrink: 1 },
  textOk: { color: color.accentInk },
});
