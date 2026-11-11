import {
  usePanGesture,
  usePinchGesture,
  useRotationGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ease, easeIO } from '@/ui/easing';
import { motion, transformLimits } from '@/ui/tokens';

import { clampedScaleChange, rotateAbout, scaleAbout, snapAngle } from './transformMath';

export type Placement = { x: number; y: number; scale: number; rotation: number };

const IDENTITY: Placement = { x: 0, y: 0, scale: 1, rotation: 0 };

type Options = {
  /** Tắt hẳn mọi cử chỉ (ví dụ chưa có pose). */
  enabled: boolean;
  initial?: Placement;
  /** Gọi một lần khi mọi ngón tay rời màn hình sau một lượt chỉnh, để lưu placement (BR-10). */
  onEnd?: (p: Placement) => void;
  /** Gọi khi góc hít vào 0°/90° (haptics). */
  onSnap?: () => void;
  /**
   * Worklet: chạm (tọa độ trong vùng nhận) có trúng vật đang ở placement `p` không. Có hàm này thì chỉ lượt chạm BẮT
   * ĐẦU trên vật mới kéo/pinch/xoay vật, ngay từ ngón đầu tiên, không cần bật chế độ chỉnh
   * (góp ý Phase 2). Lượt chạm bắt đầu ngoài vật để cho cử chỉ khác (zoom camera).
   */
  hitTest?: (x: number, y: number, p: Placement) => boolean;
};

/**
 * Kéo + pinch + xoay cùng lúc, chạm đúp để đặt lại. Dùng chung cho overlay camera và bước
 * Vị trí của Thay nền (roadmap §3.5).
 *
 * - Chạy hoàn toàn trên UI thread: không có setState nào trong lúc cử chỉ đang diễn ra.
 * - Mọi phép biến đổi cộng dồn bằng phần thay đổi của từng frame.
 * - Pinch neo theo tâm hai ngón, xoay neo theo điểm neo của hai ngón.
 * - Gắn `gesture` lên VÙNG NHẬN, không phải lên vật. Gọi `setArea(w, h, ox, oy)` với cỡ vùng
 *   nhận và vị trí tâm-lúc-nghỉ của vật trong vùng đó (mặc định giữa vùng).
 */
export function useTransformGesture({ enabled, initial = IDENTITY, onEnd, onSnap, hitTest }: Options) {
  const tx = useSharedValue(initial.x);
  const ty = useSharedValue(initial.y);
  const scale = useSharedValue(initial.scale);
  const rotation = useSharedValue(initial.rotation);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const active = useSharedValue(0);
  /** Lượt chạm hiện tại đang điều khiển vật. */
  const engaged = useSharedValue(false);
  /** Đã quyết định lượt chạm này thuộc vật hay không. */
  const decided = useSharedValue(false);
  /** Vật đã thực sự bị kéo/pinch/xoay trong lượt này (để hiện vùng xóa). */
  const moved = useSharedValue(false);
  /** Vị trí ngón kéo trong vùng nhận. */
  const fingerX = useSharedValue(0);
  const fingerY = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  const current = (): Placement => {
    'worklet';
    return { x: tx.value, y: ty.value, scale: scale.value, rotation: rotation.value };
  };

  const begin = () => {
    'worklet';
    active.value += 1;
  };

  const finish = () => {
    'worklet';
    active.value = Math.max(0, active.value - 1);
    if (active.value > 0) return;
    if (engaged.value && onEnd) {
      scheduleOnRN(onEnd, {
        x: tx.value,
        y: ty.value,
        scale: scale.value,
        rotation: rotation.value,
      });
    }
    engaged.value = false;
    decided.value = false;
    moved.value = false;
  };

  const decide = (x: number, y: number) => {
    'worklet';
    if (decided.value) return;
    decided.value = true;
    engaged.value = hitTest ? hitTest(x, y, current()) : true;
  };

  const pan = usePanGesture({
    enabled,
    maxPointers: 2,
    // Kích hoạt sau 2 pt thay vì ngưỡng mặc định, để vật bám ngón tay ngay từ đầu.
    minDistance: 2,
    onBegin: (e) => {
      'worklet';
      begin();
      // Ngón đầu tiên chạm xuống quyết định cả lượt.
      decide(e.x, e.y);
      fingerX.value = e.x;
      fingerY.value = e.y;
    },
    onUpdate: (e) => {
      'worklet';
      if (!engaged.value) return;
      tx.value += e.changeX;
      ty.value += e.changeY;
      fingerX.value = e.x;
      fingerY.value = e.y;
      moved.value = true;
    },
    onFinalize: () => {
      'worklet';
      finish();
    },
  });

  const pinch = usePinchGesture({
    enabled,
    onBegin: () => {
      'worklet';
      begin();
    },
    onUpdate: (e) => {
      'worklet';
      if (!engaged.value) return;
      const k = clampedScaleChange(
        scale.value,
        e.scaleChange,
        transformLimits.minScale,
        transformLimits.maxScale,
      );
      const f = { x: e.focalX - originX.value, y: e.focalY - originY.value };
      const t = scaleAbout({ x: tx.value, y: ty.value }, f, k);
      tx.value = t.x;
      ty.value = t.y;
      scale.value *= k;
      moved.value = true;
    },
    onFinalize: () => {
      'worklet';
      finish();
    },
  });

  const rotate = useRotationGesture({
    enabled,
    onBegin: () => {
      'worklet';
      begin();
    },
    onUpdate: (e) => {
      'worklet';
      if (!engaged.value) return;
      const a = { x: e.anchorX - originX.value, y: e.anchorY - originY.value };
      const t = rotateAbout({ x: tx.value, y: ty.value }, a, e.rotationChange);
      tx.value = t.x;
      ty.value = t.y;
      rotation.value += e.rotationChange;
      moved.value = true;
    },
    onDeactivate: () => {
      'worklet';
      if (!engaged.value) return;
      const snapped = snapAngle(rotation.value, transformLimits.snapAngleDeg);
      if (snapped !== null) {
        rotation.value = reduceMotion
          ? snapped
          : withTiming(snapped, { duration: motion.in, easing: ease });
        if (onSnap) scheduleOnRN(onSnap);
      }
    },
    onFinalize: () => {
      'worklet';
      finish();
    },
  });

  const resetTo = (p: Placement) => {
    'worklet';
    const cfg = { duration: motion.slide, easing: easeIO };
    tx.value = reduceMotion ? p.x : withTiming(p.x, cfg);
    ty.value = reduceMotion ? p.y : withTiming(p.y, cfg);
    scale.value = reduceMotion ? p.scale : withTiming(p.scale, cfg);
    rotation.value = reduceMotion ? p.rotation : withTiming(p.rotation, cfg);
    if (onEnd) scheduleOnRN(onEnd, p);
  };

  const doubleTap = useTapGesture({
    enabled,
    numberOfTaps: 2,
    onActivate: (e) => {
      'worklet';
      if (hitTest && !hitTest(e.x, e.y, current())) return;
      resetTo(initial);
    },
  });

  // KHÔNG dùng useExclusiveGestures(doubleTap, …): kiểu ghép đó bắt kéo/pinch/xoay chờ chạm đúp
  // thất bại (~0.5 s) mới được chạy, nên ngón tay phải đi xa rồi overlay mới theo (spike A,
  // docs/spikes.md). Chạm đúp chạy song song là đủ: tap tự hủy khi ngón tay di chuyển, còn pan
  // chỉ kích hoạt khi ngón tay di chuyển, nên hai cử chỉ không giẫm lên nhau.
  const gesture = useSimultaneousGestures(pan, pinch, rotate, doubleTap);

  /** Style cho vật (đặt vật sao cho tâm-lúc-nghỉ trùng `origin`). */
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rotation.value}rad` },
      { scale: scale.value },
    ],
  }));

  /** Cỡ vùng nhận và tâm-lúc-nghỉ của vật trong vùng đó (mặc định giữa vùng). */
  const setArea = (w: number, h: number, ox = w / 2, oy = h / 2) => {
    originX.value = ox;
    originY.value = oy;
  };

  return { gesture, style, tx, ty, scale, rotation, setArea, engaged, moved, fingerX, fingerY };
}
