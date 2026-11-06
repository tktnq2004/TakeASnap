import {
  useExclusiveGestures,
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

import {
  clampedScaleChange,
  rotateAbout,
  scaleAbout,
  snapAngle,
  toCentered,
} from './transformMath';

export type Placement = { x: number; y: number; scale: number; rotation: number };

const IDENTITY: Placement = { x: 0, y: 0, scale: 1, rotation: 0 };

type Options = {
  /** Chỉ nhận cử chỉ khi true (chế độ chỉnh overlay, business-flow §4.2). */
  enabled: boolean;
  initial?: Placement;
  /** Gọi một lần khi mọi ngón tay rời màn hình, để lưu placement (BR-10). */
  onEnd?: (p: Placement) => void;
  /** Gọi khi góc hít vào 0°/90° (haptics). */
  onSnap?: () => void;
};

/**
 * Kéo + pinch + xoay cùng lúc, chạm đúp để đặt lại. Dùng chung cho overlay camera và bước
 * Vị trí của Thay nền (roadmap §3.5).
 *
 * - Chạy hoàn toàn trên UI thread: không có setState nào trong lúc cử chỉ đang diễn ra.
 * - Mọi phép biến đổi cộng dồn bằng phần thay đổi của từng frame.
 * - Pinch neo theo tâm hai ngón, xoay neo theo điểm neo của hai ngón.
 * - Gắn `gesture` lên VÙNG NHẬN (toàn khung ngắm), không phải lên overlay, và gắn
 *   `onLayout` của vùng nhận vào `setArea` để đổi tọa độ ngón tay về gốc tâm.
 */
export function useTransformGesture({ enabled, initial = IDENTITY, onEnd, onSnap }: Options) {
  const tx = useSharedValue(initial.x);
  const ty = useSharedValue(initial.y);
  const scale = useSharedValue(initial.scale);
  const rotation = useSharedValue(initial.rotation);
  const areaW = useSharedValue(0);
  const areaH = useSharedValue(0);
  const active = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  const begin = () => {
    'worklet';
    active.value += 1;
  };

  const finish = () => {
    'worklet';
    active.value = Math.max(0, active.value - 1);
    if (active.value === 0 && onEnd) {
      scheduleOnRN(onEnd, {
        x: tx.value,
        y: ty.value,
        scale: scale.value,
        rotation: rotation.value,
      });
    }
  };

  const pan = usePanGesture({
    enabled,
    maxPointers: 2,
    onBegin: () => {
      'worklet';
      begin();
    },
    onUpdate: (e) => {
      'worklet';
      tx.value += e.changeX;
      ty.value += e.changeY;
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
      const k = clampedScaleChange(
        scale.value,
        e.scaleChange,
        transformLimits.minScale,
        transformLimits.maxScale,
      );
      const f = toCentered(e.focalX, e.focalY, areaW.value, areaH.value);
      const t = scaleAbout({ x: tx.value, y: ty.value }, f, k);
      tx.value = t.x;
      ty.value = t.y;
      scale.value *= k;
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
      const a = toCentered(e.anchorX, e.anchorY, areaW.value, areaH.value);
      const t = rotateAbout({ x: tx.value, y: ty.value }, a, e.rotationChange);
      tx.value = t.x;
      ty.value = t.y;
      rotation.value += e.rotationChange;
    },
    onDeactivate: () => {
      'worklet';
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
    onActivate: () => {
      'worklet';
      resetTo(initial);
    },
  });

  const transform = useSimultaneousGestures(pan, pinch, rotate);
  const gesture = useExclusiveGestures(doubleTap, transform);

  /** Style cho overlay (đặt overlay ở tâm vùng nhận). */
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rotation.value}rad` },
      { scale: scale.value },
    ],
  }));

  const setArea = (w: number, h: number) => {
    areaW.value = w;
    areaH.value = h;
  };

  return { gesture, style, tx, ty, scale, rotation, setArea };
}
