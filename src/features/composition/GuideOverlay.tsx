/**
 * Hướng dẫn liên tục trên khung ngắm (Phase 5b, design.md §6.15): khung người, chấm mắt, đường
 * tìm được của lượt gần nhất (giữ tới khi có lượt mới, không nháy), **mũi tên kết quả** từ chỗ
 * người / mắt đang đứng tới đích sáng, viên "hành động + kết quả" và chấm nhắc; viên xanh "Đúng
 * rồi, giữ yên máy" khi vừa tới đích, "Đạt: …" khi qua một bước; viên kết thúc; chip bố cục phụ.
 *
 * Hướng nằm ở mũi tên trên khung ngắm (người sẽ đi về đâu) và ở câu (máy làm gì); icon của viên chỉ
 * báo kiểu thao tác, không có chiều, để hai chiều không trái nhau (xoay máy sang trái thì người
 * dịch sang phải).
 */
import {
  Check,
  ChevronsDown,
  ChevronsUp,
  Footprints,
  type LucideIcon,
  MoveHorizontal,
  MoveVertical,
  Plus,
  RotateCcw,
  RotateCw,
  ScanSearch,
  X,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Svg, { Line, Polygon } from 'react-native-svg';

import type { Rect } from '@/features/camera/frame';
import { ease } from '@/ui/easing';
import { t } from '@/ui/strings';
import { color, compositionUi, motion, radius, size, space, type } from '@/ui/tokens';

import {
  type Action,
  type Check as GuideCheck,
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
  panLeft: MoveHorizontal,
  panRight: MoveHorizontal,
  tiltUp: MoveVertical,
  tiltDown: MoveVertical,
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

/** Điểm cuối mũi tên: chiếu chỗ đang đứng lên đích (đường dọc, đường ngang) hoặc chính điểm đích. */
function arrowEnd(c: GuideCheck): { x: number; y: number } | null {
  const a = c.at;
  const tg = c.target;
  if (!a || !tg) return null;
  if (tg.kind === 'vline') return { x: tg.x, y: a.y };
  if (tg.kind === 'hline') return { x: a.x, y: tg.y };
  if (tg.kind === 'point') return { x: tg.x, y: tg.y };
  return null;
}

/** Mũi tên kết quả: người / mắt / chân trời sẽ đi từ đây tới đích sáng. */
function ResultArrow({ c, width, height }: { c: GuideCheck; width: number; height: number }) {
  const end = arrowEnd(c);
  if (!c.at || !end) return null;
  const x1 = c.at.x * width;
  const y1 = c.at.y * height;
  const x2 = end.x * width;
  const y2 = end.y * height;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const head = compositionUi.arrowHead;
  if (len < head * 1.5) return null;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  // Thân dừng ở gốc đầu mũi tên; đầu là tam giác nhọn chạm đích.
  const bx = x2 - ux * head;
  const by = y2 - uy * head;
  const w = head * 0.6;
  const pts = `${x2},${y2} ${bx - uy * w},${by + ux * w} ${bx + uy * w},${by - ux * w}`;
  const s = compositionUi.arrowStroke;
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Viền tối để mũi tên trắng vẫn thấy trên nền sáng. */}
      <Line
        x1={x1}
        y1={y1}
        x2={bx}
        y2={by}
        stroke={color.camBg}
        strokeOpacity={0.45}
        strokeWidth={s + 3}
        strokeLinecap="round"
      />
      <Polygon
        points={pts}
        fill={color.camBg}
        fillOpacity={0.45}
        stroke={color.camBg}
        strokeOpacity={0.45}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Line
        x1={x1}
        y1={y1}
        x2={bx}
        y2={by}
        stroke={color.camInk}
        strokeWidth={s}
        strokeLinecap="round"
      />
      <Polygon points={pts} fill={color.camInk} />
    </Svg>
  );
}

/** Khung người, chấm mắt, đường tìm được của lượt gần nhất (đã theo khung ngắm), mũi tên. */
function Found({ frame, view }: { frame: Rect; view: GuideView }) {
  const snap = view.snap;
  if (!snap) return null;
  const f = snap.features;
  const b = f.people[f.main]?.box;
  const W = frame.width;
  const H = frame.height;
  const E = compositionUi.checkEye;
  const c = view.state.current;
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
      {c && !view.state.holding && <ResultArrow c={c} width={W} height={H} />}
    </View>
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
  maxBottom,
}: {
  frame: Rect;
  view: GuideView;
  maxBottom: number;
}) {
  const g = t.composition.guide;
  const s = view.state;
  const c = s.current;
  const used = remindersOf(s);
  const flash = usePassedFlash(s.passedAt) && s.justPassed != null;
  // Viên xanh: vừa qua một bước, hoặc đang đúng chờ xác nhận.
  let ok = false;
  let text: string;
  let Icon: LucideIcon;
  let key: string;
  if (flash) {
    ok = true;
    text = g.passed(g.done[s.justPassed!]);
    Icon = Check;
    key = `passed-${s.passedAt}`;
  } else if (c && s.holding) {
    ok = true;
    text = g.hold;
    Icon = Check;
    key = `hold-${c.id}`;
  } else {
    text = c ? guideLine(c) : t.composition.check.running;
    Icon = c?.action ? ICONS[c.action] : ScanSearch;
    key = c?.id ?? 'wait';
  }
  return (
    <>
      <Found frame={frame} view={view} />
      <View pointerEvents="none" style={[styles.wrap, { top: hintTop(frame, maxBottom) }]}>
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
        {used > 0 && !ok && (
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

/**
 * Chip thêm bố cục phụ khi đang bật bố cục chính (chỗ của chip bố cục phụ). Nút Bố cục đang bật
 * thì chạm là tắt nhanh (phiếu Phase 5 lần 7), nên cần lối riêng để mở bảng mà không tắt bố cục
 * chính (phiếu Phase 5b lần 1, mục 1.2).
 */
export function AddSceneChip({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.composition.guide.addSceneLabel}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.sceneChip, pressed && styles.pressed]}
    >
      <Plus size={14} strokeWidth={2.5} color={color.camInk} />
      <Text style={styles.sceneChipText}>{t.composition.guide.addScene}</Text>
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
