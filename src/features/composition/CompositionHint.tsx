import {
  ArrowDown,
  ArrowUp,
  Check,
  type LucideIcon,
  RotateCcw,
  RotateCw,
  Smartphone,
  SwitchCamera,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SensorType,
  useAnimatedReaction,
  useAnimatedSensor,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { Rect, Turn } from '@/features/camera/frame';
import { deviceRoll, type Hold, levelUsable, rollFrom } from '@/features/camera/level';
import { haptic } from '@/lib/haptics';
import { t } from '@/ui/strings';
import { color, compositionUi, motion, radius, size, space, type } from '@/ui/tokens';

import { cameraPitchDeg, isAchieved, sensorHint, type SensorHintId } from './sensor';
import type { TechniqueId } from './techniques';

const IOS = Platform.OS === 'ios';

type Hint = { id: SensorHintId; roll: number };

/** "id:độ" để so nhanh trên UI thread; độ chỉ có nghĩa với gợi ý máy nghiêng. */
const parse = (key: string | null): Hint | null => {
  if (!key) return null;
  const [id, roll] = key.split(':');
  return { id: id as SensorHintId, roll: Number(roll) };
};

/**
 * Dòng gợi ý bố cục dưới khung ngắm (design.md §6.15, bản A). Mỗi lúc một dòng:
 * gợi ý từ cảm biến (máy thẳng, góc thấp, selfie) đứng trước dòng hướng dẫn khi vừa chọn kỹ
 * thuật. Cảm biến đọc trên UI thread; chỉ báo về JS khi gợi ý đổi.
 */
export function CompositionHint({
  frame,
  technique,
  front,
  maxBottom,
  turn = 0,
}: {
  frame: Rect;
  technique: TechniqueId;
  front: boolean;
  /** Cầm ngang (vẽ trong `Turned`): máy thẳng là đỉnh máy nằm ngang. */
  turn?: Turn;
  /** Đáy viên gợi ý không xuống dưới chỗ này (mép trên cụm zoom): khung 9:16 tràn ra sau các
   *  nút, đặt ở đáy khung thì bị nút chụp che (phiếu Phase 5 lần 4). */
  maxBottom: number;
}) {
  const sensor = useAnimatedSensor(SensorType.GRAVITY, { interval: 'auto' });
  const prev = useSharedValue<SensorHintId | null>(null);
  // Gợi ý chỉ hiện khi tình trạng giữ yên `stableMs`; đổi số độ của cùng gợi ý thì cập nhật ngay.
  // Đạt: rung một lần, viên tự ẩn sau `okHideMs` và ẩn luôn tới khi trạng thái đổi.
  const [view, setView] = useState<Hint | null>(null);
  const shownRef = useRef<Hint | null>(null);
  const stableTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const okTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (h: Hint | null) => {
    shownRef.current = h;
    setView(h);
    if (okTimer.current) clearTimeout(okTimer.current);
    if (h && isAchieved(h.id)) {
      if (h.id !== 'levelOk') haptic.levelReached();
      okTimer.current = setTimeout(() => setView(null), compositionUi.okHideMs);
    }
  };

  const onCandidate = (key: string | null) => {
    const next = parse(key);
    if (stableTimer.current) clearTimeout(stableTimer.current);
    if (!next) {
      show(null);
      return;
    }
    const cur = shownRef.current;
    if (cur && cur.id === next.id) {
      if (!isAchieved(next.id)) {
        shownRef.current = next;
        setView(next);
      }
      return;
    }
    stableTimer.current = setTimeout(() => show(next), compositionUi.stableMs);
  };

  useEffect(
    () => () => {
      if (stableTimer.current) clearTimeout(stableTimer.current);
      if (okTimer.current) clearTimeout(okTimer.current);
    },
    [],
  );

  useAnimatedReaction(
    () => {
      const g = sensor.sensor.get();
      if (!levelUsable(g.x, g.y, g.z)) return null;
      const roll = (rollFrom(deviceRoll(g.x, g.y, IOS), turn) * 180) / Math.PI;
      const pitch = cameraPitchDeg(g.x, g.y, g.z, IOS, front);
      const id = sensorHint(technique, roll, pitch, front, prev.get());
      if (id == null) return null;
      return `${id}:${id === 'level' ? Math.round(roll) : 0}`;
    },
    (key, old) => {
      if (key === old) return;
      prev.set(key ? (key.split(':')[0] as SensorHintId) : null);
      scheduleOnRN(onCandidate, key);
    },
    [technique, front, turn],
  );

  // Dòng hướng dẫn khi vừa chọn kỹ thuật, ẩn sau `introMs`.
  const [expired, setExpired] = useState(false);
  const [introFor, setIntroFor] = useState(technique);
  if (introFor !== technique) {
    setIntroFor(technique);
    setExpired(false);
  }
  useEffect(() => {
    const id = setTimeout(() => setExpired(true), compositionUi.introMs);
    return () => clearTimeout(id);
  }, [technique]);
  const intro = expired
    ? null
    : ((t.composition.intro as Partial<Record<TechniqueId, string>>)[technique] ?? null);

  if (technique === 'off') return null;

  const sensorShown = view;
  let text: string | null = null;
  let Icon: LucideIcon | null = null;
  let ok = false;
  if (sensorShown) {
    const { id, roll } = sensorShown;
    ok = isAchieved(id);
    text = id === 'level' ? t.composition.hints.level(Math.abs(roll)) : t.composition.hints[id];
    if (ok) Icon = Check;
    else if (id === 'level') Icon = roll > 0 ? RotateCcw : RotateCw;
    else if (id === 'lowDown' || id === 'selfieDown') Icon = ArrowDown;
    else if (id === 'selfieUp') Icon = ArrowUp;
    else if (id === 'selfieFront') Icon = SwitchCamera;
  } else if (intro) {
    text = intro;
  }
  if (!text) return null;

  const top = Math.min(frame.y + frame.height - space[3], maxBottom) - compositionUi.hintH;
  return (
    <View pointerEvents="none" style={[styles.wrap, { top }]}>
      <Animated.View
        key={sensorShown ? sensorShown.id : 'intro'}
        entering={FadeIn.duration(motion.in)}
        exiting={FadeOut.duration(motion.in)}
        accessibilityRole="text"
        accessibilityLiveRegion="polite"
        style={[styles.pill, ok && styles.pillOk]}
      >
        {Icon && (
          <Icon
            size={size.iconSmall}
            strokeWidth={2.5}
            color={ok ? color.accentInk : color.camAccent}
          />
        )}
        <Text style={[styles.text, ok && styles.textOk]} maxFontSizeMultiplier={1.3}>
          {text}
        </Text>
      </Animated.View>
    </View>
  );
}

/** Một viên chữ ở chỗ dòng gợi ý (vd "Đã tắt bố cục"), mờ dần vào / ra. */
export function HintPill({
  frame,
  maxBottom,
  text,
}: {
  frame: Rect;
  maxBottom: number;
  text: string;
}) {
  const top = Math.min(frame.y + frame.height - space[3], maxBottom) - compositionUi.hintH;
  return (
    <View pointerEvents="none" style={[styles.wrap, { top }]}>
      <Animated.View
        entering={FadeIn.duration(motion.in)}
        exiting={FadeOut.duration(motion.in)}
        accessibilityRole="text"
        accessibilityLiveRegion="polite"
        style={styles.pill}
      >
        <Text style={styles.text} maxFontSizeMultiplier={1.3}>
          {text}
        </Text>
      </Animated.View>
    </View>
  );
}

/**
 * Máy cầm ngang / lộn ngược: bố cục chưa tính cho khung ngang (phiếu Phase 5b lần 17). Viên nằm
 * giữa khung, xoay theo cách cầm để đọc được ngay khi đang cầm ngang.
 */
export function HoldPortraitPill({ frame, hold }: { frame: Rect; hold: Hold }) {
  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { top: frame.y + (frame.height - compositionUi.hintH) / 2 }]}
    >
      <Animated.View
        entering={FadeIn.duration(motion.in)}
        exiting={FadeOut.duration(motion.in)}
        accessibilityRole="text"
        accessibilityLiveRegion="polite"
        style={[styles.pill, { transform: [{ rotate: `${-hold}deg` }] }]}
      >
        <Smartphone size={size.iconSmall} strokeWidth={2.5} color={color.camAccent} />
        <Text style={styles.text} maxFontSizeMultiplier={1.3}>
          {t.composition.holdPortrait}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  pill: {
    height: compositionUi.hintH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[4],
    borderRadius: radius.full,
    backgroundColor: color.camHint,
  },
  pillOk: { backgroundColor: color.camAccent },
  text: { ...type.label, fontSize: 14, color: color.camInk },
  textOk: { color: color.accentInk },
});
