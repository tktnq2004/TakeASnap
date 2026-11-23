/**
 * Hướng dẫn liên tục trên khung ngắm (Phase 5b, design.md §6.15): khung người, chấm mắt, đường
 * tìm được của lượt gần nhất (giữ tới khi có lượt mới, không nháy), viên "hành động + kết quả"
 * kèm icon của thao tác và chấm nhắc; viên kết thúc; chip bố cục phụ đang bật.
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
  X,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import type { Rect } from '@/features/camera/frame';
import { ease } from '@/ui/easing';
import { t } from '@/ui/strings';
import { color, compositionUi, motion, radius, size, space, type } from '@/ui/tokens';

import {
  type Action,
  GUIDE,
  gaveUpLines,
  guideLine,
  remindersOf,
  type SceneTechnique,
} from './guidance';
import { SceneLines } from './SceneLines';
import { TechniqueIcon } from './TechniqueIcon';
import type { GuideEnd, GuideView } from './useLiveGuide';

const ICONS: Record<Action, LucideIcon> = {
  panLeft: ArrowLeft,
  panRight: ArrowRight,
  tiltUp: ArrowUp,
  tiltDown: ArrowDown,
  closer: Footprints,
  back: Footprints,
  stepLeft: Footprints,
  stepRight: Footprints,
  raise: ChevronsUp,
  lower: ChevronsDown,
  rotateCw: RotateCw,
  rotateCcw: RotateCcw,
  find: ScanSearch,
};

const hintTop = (frame: Rect, maxBottom: number) =>
  Math.min(frame.y + frame.height - space[3], maxBottom) - compositionUi.hintH;

/** Khung người, chấm mắt, đường tìm được của lượt gần nhất (đã theo khung ngắm). */
function Found({ frame, view }: { frame: Rect; view: GuideView }) {
  const snap = view.snap;
  if (!snap) return null;
  const f = snap.features;
  const b = f.people[f.main]?.box;
  const W = frame.width;
  const H = frame.height;
  const E = compositionUi.checkEye;
  return (
    <View
      pointerEvents="none"
      style={[styles.abs, { left: frame.x, top: frame.y, width: W, height: H }]}
    >
      {view.plan.scene && (
        <SceneLines width={W} height={H} technique={view.plan.scene} scene={snap.scene} />
      )}
      {b && (
        <View
          style={[
            styles.box,
            { left: b[0] * W, top: b[1] * H, width: (b[2] - b[0]) * W, height: (b[3] - b[1]) * H },
          ]}
        />
      )}
      {f.eye && (
        <View style={[styles.eye, { left: f.eye.x * W - E / 2, top: f.eye.y * H - E / 2 }]} />
      )}
    </View>
  );
}

export function GuideOverlay({
  frame,
  view,
  maxBottom,
}: {
  frame: Rect;
  view: GuideView;
  maxBottom: number;
}) {
  const c = view.state.current;
  const used = remindersOf(view.state);
  const Icon = c?.action ? ICONS[c.action] : ScanSearch;
  return (
    <>
      <Found frame={frame} view={view} />
      <View pointerEvents="none" style={[styles.wrap, { top: hintTop(frame, maxBottom) }]}>
        <Animated.View
          key={c?.id ?? 'wait'}
          entering={FadeIn.duration(motion.in).easing(ease)}
          exiting={FadeOut.duration(motion.in).easing(ease)}
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
          style={styles.pill}
        >
          <Icon size={size.iconSmall} strokeWidth={2.5} color={color.camAccent} />
          <Text style={styles.text} numberOfLines={2} maxFontSizeMultiplier={1.3}>
            {c ? guideLine(c) : t.composition.check.running}
          </Text>
        </Animated.View>
        {used > 0 && (
          <View style={styles.dots}>
            {Array.from({ length: GUIDE.reminders }, (_, i) => (
              <View key={i} style={[styles.dot, i < used && styles.dotOn]} />
            ))}
          </View>
        )}
      </View>
    </>
  );
}

/** Viên kết thúc: đạt, dừng giữa chừng (đã đạt / chưa đạt), cảnh không áp được, đã dừng. */
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
  let ok = false;
  let lines: string[];
  if ('stopped' in end) lines = [g.stopped];
  else if (end.state.status === 'reached') {
    ok = true;
    const names = [end.plan.main, end.plan.scene]
      .filter((x) => x != null)
      .map((x) => t.composition.names[x]);
    lines = [g.reached(names.join(' + '))];
  } else if (end.state.status === 'notApplicable') {
    lines = [g.missing[end.state.missing ?? 'person']];
  } else {
    const [passed, failed] = gaveUpLines(end.state);
    lines = passed ? [passed, failed] : [failed];
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
        <View style={styles.lines}>
          {lines.map((l) => (
            <Text
              key={l}
              style={[styles.text, ok && styles.textOk]}
              numberOfLines={2}
              maxFontSizeMultiplier={1.3}
            >
              {l}
            </Text>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

/** Chip bố cục phụ đang bật, cạnh nút Bố cục; chạm để bỏ. */
export function SceneChip({ scene, onRemove }: { scene: SceneTechnique; onRemove: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.composition.guide.removeScene(t.composition.names[scene])}
      hitSlop={6}
      onPress={onRemove}
      style={({ pressed }) => [styles.sceneChip, pressed && styles.pressed]}
    >
      <TechniqueIcon kind={scene} width={12} height={16} ink={color.camInk} accent={color.camInk} />
      <Text style={styles.sceneChipText}>{t.composition.guide.short[scene]}</Text>
      <X size={14} strokeWidth={2.5} color={color.camInk} />
    </Pressable>
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
  wrap: { position: 'absolute', left: space[4], right: space[4], alignItems: 'center' },
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
  lines: { flexShrink: 1, gap: 2 },
  text: { ...type.label, fontSize: 14, color: color.camInk, flexShrink: 1 },
  textOk: { color: color.accentInk },
  dots: { flexDirection: 'row', gap: compositionUi.remindDot, marginTop: space[2] },
  dot: {
    width: compositionUi.remindDot,
    height: compositionUi.remindDot,
    borderRadius: compositionUi.remindDot / 2,
    backgroundColor: color.camInk,
    opacity: 0.3,
  },
  dotOn: { opacity: 1 },
  sceneChip: {
    height: compositionUi.sceneChipH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    paddingHorizontal: space[2],
    borderRadius: compositionUi.sceneChipH / 2,
    backgroundColor: color.camGlass,
  },
  sceneChipText: { ...type.caption, fontSize: 13, color: color.camInk },
  pressed: { opacity: 0.7 },
});
