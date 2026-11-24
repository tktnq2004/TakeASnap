/**
 * Hướng dẫn liên tục trên khung ngắm (Phase 5b, design.md §6.15): **chấm người** (trắng), **chấm
 * đích** (`camAccent`) trên đường sáng và **mũi tên** từ chấm người tới chấm đích, chạy theo máy
 * (xoay, dịch chuyển) ngay trên UI thread (phiếu Phase 5b lần 3, mục 11.5; `track.ts`); ô "Bước
 * 2/3" với chấm nhắc; viên hướng dẫn một dòng; viên xanh "Đúng rồi, giữ yên máy" khi chấm người tới đích (đang
 * đợi máy yên để chụp kiểm tra), "Đạt: …" khi qua một bước; viên kết thúc.
 */
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronsDown,
  ChevronsUp,
  Footprints,
  type LucideIcon,
  RotateCcw,
  RotateCw,
  ScanSearch,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SensorType,
  type SharedValue,
  useAnimatedProps,
  useAnimatedSensor,
  useAnimatedStyle,
  useFrameCallback,
} from 'react-native-reanimated';
import Svg, { Line, Polygon } from 'react-native-svg';

import type { Rect } from '@/features/camera/frame';
import { ease } from '@/ui/easing';
import { t } from '@/ui/strings';
import { color, compositionUi, motion, radius, size, space, type } from '@/ui/tokens';

import { type Action, type Dir, GUIDE, guideLine, remindersOf, stepOf } from './guidance';
import { SceneLines } from './SceneLines';
import { type Live, trackFrame, type Xyz } from './track';
import type { GuideEnd, GuideTrack, GuideView } from './useLiveGuide';

/** Icon của viên theo thao tác, khi viên không có chiều riêng. */
const ICONS: Record<Action, LucideIcon> = {
  panLeft: ArrowLeft,
  panRight: ArrowRight,
  tiltUp: ArrowUp,
  tiltDown: ArrowDown,
  closer: Footprints,
  back: Footprints,
  stepLeft: ArrowLeft,
  stepRight: ArrowRight,
  raise: ChevronsUp,
  lower: ChevronsDown,
  rotateCw: RotateCw,
  rotateCcw: RotateCcw,
  find: ScanSearch,
};
const DIR_ICONS: Record<Dir, LucideIcon> = {
  left: ArrowLeft,
  right: ArrowRight,
  up: ArrowUp,
  down: ArrowDown,
};

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

const hintTop = (frame: Rect, maxBottom: number) =>
  Math.min(frame.y + frame.height - space[3], maxBottom) - compositionUi.hintH;

/** Khung neo đáy của viên hướng dẫn: ô bước mọc lên trên, đáy viên không đổi. */
const STACK_H = 120;

/**
 * Đọc con quay, mỗi khung hình tính chấm người theo máy xoay (`trackFrame`). Chỉ mount khi đang
 * hướng dẫn: con quay chỉ chạy lúc đó.
 */
/** iOS: `ACCELEROMETER` của Reanimated là gia tốc thô (có trọng lực); Android đã là gia tốc thẳng. */
const RAW_ACCEL = Platform.OS === 'ios';

function MotionTracker({ track, zoom }: { track: GuideTrack; zoom: SharedValue<number> }) {
  const gyro = useAnimatedSensor(SensorType.GYROSCOPE, { interval: 'auto' });
  const acc = useAnimatedSensor(SensorType.ACCELEROMETER, { interval: 'auto' });
  const grav = useAnimatedSensor(SensorType.GRAVITY, { interval: 'auto' });
  const { live, anchor, epoch } = track;
  useFrameCallback((f) => {
    'worklet';
    const dt = f.timeSincePreviousFrame;
    if (dt == null) return;
    const a = acc.sensor.get();
    let lin: Xyz | null = { x: a.x, y: a.y, z: a.z };
    if (RAW_ACCEL) {
      const g = grav.sensor.get();
      // Chưa có trọng lực để trừ: bỏ khung này.
      lin =
        g.x === 0 && g.y === 0 && g.z === 0 ? null : { x: a.x - g.x, y: a.y - g.y, z: a.z - g.z };
    }
    live.set(
      trackFrame(live.get(), gyro.sensor.get(), lin, dt, epoch.get(), anchor.get(), zoom.get()),
    );
  });
  return null;
}

const clamp01 = (v: number) => {
  'worklet';
  return Math.min(1, Math.max(0, v));
};

/** Mũi tên từ chấm người tới chấm đích (px), null khi không vẽ. */
function arrowOf(l: Live, on: boolean, W: number, H: number) {
  'worklet';
  if (!on || l.reached) return null;
  const x0 = clamp01(l.px) * W;
  const y0 = clamp01(l.py) * H;
  const x1 = clamp01(l.tx) * W;
  const y1 = clamp01(l.ty) * H;
  const len = Math.hypot(x1 - x0, y1 - y0);
  const r = compositionUi.liveDot / 2 + 2;
  const head = compositionUi.arrowHead;
  if (len < r * 2 + head * 1.5) return null;
  const ux = (x1 - x0) / len;
  const uy = (y1 - y0) / len;
  // Đầu nhọn chạm mép chấm đích; thân từ mép chấm người tới gốc đầu mũi tên.
  const tx = x1 - ux * r;
  const ty = y1 - uy * r;
  const bx = tx - ux * head;
  const by = ty - uy * head;
  const w = head * 0.6;
  return {
    x1: x0 + ux * r,
    y1: y0 + uy * r,
    x2: bx,
    y2: by,
    points: `${tx},${ty} ${bx - uy * w},${by + ux * w} ${bx + uy * w},${by - ux * w}`,
  };
}

/** Chấm người, chấm đích, mũi tên: đọc `live` trên UI thread, không qua React. */
function LiveMarks({ track, width, height }: { track: GuideTrack; width: number; height: number }) {
  const { live, anchor } = track;
  const D = compositionUi.liveDot;
  const on = () => {
    'worklet';
    const a = anchor.get();
    return a != null && live.get().for === a.id;
  };
  const person = useAnimatedStyle(() => {
    const l = live.get();
    return {
      opacity: on() ? 1 : 0,
      transform: [
        { translateX: clamp01(l.px) * width - D / 2 },
        { translateY: clamp01(l.py) * height - D / 2 },
      ],
    };
  });
  const target = useAnimatedStyle(() => {
    const l = live.get();
    return {
      opacity: on() ? 1 : 0,
      transform: [
        { translateX: clamp01(l.tx) * width - D / 2 },
        { translateY: clamp01(l.ty) * height - D / 2 },
      ],
    };
  });
  const lineProps = () => {
    'worklet';
    const a = arrowOf(live.get(), on(), width, height);
    return a
      ? { x1: a.x1, y1: a.y1, x2: a.x2, y2: a.y2, opacity: 1 }
      : { x1: 0, y1: 0, x2: 0, y2: 0, opacity: 0 };
  };
  const headProps = () => {
    'worklet';
    const a = arrowOf(live.get(), on(), width, height);
    return a ? { points: a.points, opacity: 1 } : { points: '0,0 0,0 0,0', opacity: 0 };
  };
  const halo = useAnimatedProps(lineProps);
  const line = useAnimatedProps(lineProps);
  const headHalo = useAnimatedProps(headProps);
  const head = useAnimatedProps(headProps);
  const s = compositionUi.arrowStroke;
  return (
    <>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Viền tối để mũi tên trắng vẫn thấy trên nền sáng. */}
        <AnimatedLine
          animatedProps={halo}
          stroke={color.camBg}
          strokeOpacity={0.45}
          strokeWidth={s + 3}
          strokeLinecap="round"
        />
        <AnimatedPolygon
          animatedProps={headHalo}
          fill={color.camBg}
          fillOpacity={0.45}
          stroke={color.camBg}
          strokeOpacity={0.45}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <AnimatedLine
          animatedProps={line}
          stroke={color.camInk}
          strokeWidth={s}
          strokeLinecap="round"
        />
        <AnimatedPolygon animatedProps={head} fill={color.camInk} />
      </Svg>
      <Animated.View style={[styles.dot, styles.dotTarget, target]} />
      <Animated.View style={[styles.dot, styles.dotPerson, person]} />
    </>
  );
}

/** Viên "Đạt: …" hiện `compositionUi.stepOkMs` sau mỗi bước vừa qua. */
function usePassedFlash(passedAt: number) {
  const [hidden, setHidden] = useState(-Infinity);
  useEffect(() => {
    if (!Number.isFinite(passedAt)) return;
    const id = setTimeout(() => setHidden(passedAt), compositionUi.stepOkMs);
    return () => clearTimeout(id);
  }, [passedAt]);
  return Number.isFinite(passedAt) && hidden !== passedAt;
}

export function GuideOverlay({
  frame,
  view,
  track,
  zoom,
  maxBottom,
}: {
  frame: Rect;
  view: GuideView;
  track: GuideTrack;
  /** Zoom lúc này (góc nhìn thu hẹp thì chấm chạy nhanh hơn khi xoay máy). */
  zoom: SharedValue<number>;
  maxBottom: number;
}) {
  const g = t.composition.guide;
  const s = view.state;
  const c = s.current;
  const used = remindersOf(s);
  const at = stepOf(s);
  const flash = usePassedFlash(s.passedAt) && s.justPassed != null;
  // Viên xanh: vừa qua một bước, hoặc chấm người đã tới đích (đợi máy yên để chụp kiểm tra).
  let ok = false;
  let text: string;
  let Icon: LucideIcon;
  let key: string;
  if (flash) {
    ok = true;
    text = g.passed(g.done[s.justPassed!]);
    Icon = Check;
    key = `passed-${s.passedAt}`;
  } else if (c && view.hold) {
    ok = true;
    text = g.hold;
    Icon = Check;
    key = `hold-${c.id}`;
  } else if (c) {
    const l = guideLine(c, view.front);
    text = l.text;
    Icon = l.dir ? DIR_ICONS[l.dir] : c.action ? ICONS[c.action] : Check;
    key = `${c.id}-${l.dir}`;
  } else {
    text = t.composition.check.running;
    Icon = ScanSearch;
    key = 'wait';
  }
  const top = hintTop(frame, maxBottom) + compositionUi.hintH - STACK_H;
  const W = frame.width;
  const H = frame.height;
  return (
    <>
      <MotionTracker track={track} zoom={zoom} />
      <View
        pointerEvents="none"
        style={[styles.abs, { left: frame.x, top: frame.y, width: W, height: H }]}
      >
        {view.plan.scene && view.snap && (
          <SceneLines width={W} height={H} technique={view.plan.scene} scene={view.snap.scene} />
        )}
        <LiveMarks track={track} width={W} height={H} />
      </View>
      <View pointerEvents="none" style={[styles.stack, { top }]}>
        {at && (
          <View style={styles.step} accessibilityRole="text">
            <Text style={styles.stepText} maxFontSizeMultiplier={1.3}>
              {g.step(at.index, at.total)}
            </Text>
            <View style={styles.dots}>
              {Array.from({ length: GUIDE.reminders }, (_, i) => (
                <View key={i} style={[styles.remind, i < used && styles.remindOn]} />
              ))}
            </View>
          </View>
        )}
        <Animated.View
          key={key}
          entering={FadeIn.duration(motion.in).easing(ease)}
          exiting={FadeOut.duration(motion.in).easing(ease)}
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

/** Viên kết thúc: đạt, hoặc người dùng đã dừng. */
export function GuideEndPill({
  frame,
  end,
  maxBottom,
}: {
  frame: Rect;
  end: GuideEnd;
  maxBottom: number;
}) {
  const g = t.composition.guide;
  const ok = !('stopped' in end);
  let text: string = g.stopped;
  if (!('stopped' in end)) {
    const names = [end.plan.main, end.plan.scene]
      .filter((x) => x != null)
      .map((x) => t.composition.names[x]);
    text = g.reached(names.join(' + '));
  }
  return (
    <View pointerEvents="none" style={[styles.wrap, { top: hintTop(frame, maxBottom) }]}>
      <Animated.View
        entering={FadeIn.duration(motion.in).easing(ease)}
        exiting={FadeOut.duration(motion.in).easing(ease)}
        accessibilityRole="text"
        accessibilityLiveRegion="polite"
        style={[styles.pill, styles.pillEnd, ok && styles.pillOk]}
      >
        {ok && <Check size={size.iconSmall} strokeWidth={2.5} color={color.accentInk} />}
        <Text
          style={[styles.text, ok && styles.textOk]}
          numberOfLines={2}
          maxFontSizeMultiplier={1.3}
        >
          {text}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  dot: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: compositionUi.liveDot,
    height: compositionUi.liveDot,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: color.camBg,
  },
  dotPerson: { backgroundColor: color.camInk },
  dotTarget: { backgroundColor: color.camAccent },
  wrap: { position: 'absolute', left: space[4], right: space[4], alignItems: 'center' },
  stack: {
    position: 'absolute',
    left: space[4],
    right: space[4],
    height: STACK_H,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: space[1],
  },
  step: {
    height: compositionUi.stepChipH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[3],
    borderRadius: compositionUi.stepChipH / 2,
    backgroundColor: color.camHint,
  },
  stepText: { ...type.caption, fontSize: 12, color: color.camInk },
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
  pillEnd: { paddingVertical: space[2] },
  pillOk: { backgroundColor: color.camAccent },
  text: { ...type.label, fontSize: 14, color: color.camInk, flexShrink: 1 },
  textOk: { color: color.accentInk },
  dots: { flexDirection: 'row', gap: compositionUi.remindDot },
  remind: {
    width: compositionUi.remindDot,
    height: compositionUi.remindDot,
    borderRadius: compositionUi.remindDot / 2,
    backgroundColor: color.camInk,
    opacity: 0.3,
  },
  remindOn: { opacity: 1 },
});
