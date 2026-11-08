import { useCallback } from 'react';
import {
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import { useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { easeIO } from '@/ui/easing';
import { motion } from '@/ui/tokens';

import { clamp, clampPan, clampedScaleChange, scaleAbout, toCentered } from './transformMath';

const MAX_ZOOM = 4;

/**
 * Kéo + pinch để xem ảnh trong một khung (Chỉnh pose). Ảnh luôn PHỦ KÍN khung: không cho thu
 * nhỏ dưới mức cover, không cho kéo lộ mép ảnh (góp ý lần 4). Chạm đúp để về khung ban đầu.
 *
 * - `tx, ty`: tâm ảnh lệch so với tâm khung (px). `zoom`: hệ số so với mức cover (≥ 1).
 * - Gọi `setLayout(areaW, areaH, coverW, coverH)` khi biết kích thước khung và ảnh ở mức cover.
 * Chạy hoàn toàn trên UI thread, không setState.
 */
export function usePanZoom() {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const zoom = useSharedValue(1);
  const areaW = useSharedValue(0);
  const areaH = useSharedValue(0);
  const coverW = useSharedValue(0);
  const coverH = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  const applyClamp = () => {
    'worklet';
    const t = clampPan(
      { x: tx.value, y: ty.value },
      coverW.value * zoom.value,
      coverH.value * zoom.value,
      areaW.value,
      areaH.value,
    );
    tx.value = t.x;
    ty.value = t.y;
  };

  const pan = usePanGesture({
    maxPointers: 2,
    minDistance: 2,
    onUpdate: (e) => {
      'worklet';
      tx.value += e.changeX;
      ty.value += e.changeY;
      applyClamp();
    },
  });

  const pinch = usePinchGesture({
    onUpdate: (e) => {
      'worklet';
      const k = clampedScaleChange(zoom.value, e.scaleChange, 1, MAX_ZOOM);
      const f = toCentered(e.focalX, e.focalY, areaW.value, areaH.value);
      const t = scaleAbout({ x: tx.value, y: ty.value }, f, k);
      tx.value = t.x;
      ty.value = t.y;
      zoom.value = clamp(zoom.value * k, 1, MAX_ZOOM);
      applyClamp();
    },
  });

  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    onActivate: () => {
      'worklet';
      const cfg = { duration: motion.slide, easing: easeIO };
      tx.value = reduceMotion ? 0 : withTiming(0, cfg);
      ty.value = reduceMotion ? 0 : withTiming(0, cfg);
      zoom.value = reduceMotion ? 1 : withTiming(1, cfg);
    },
  });

  const gesture = useSimultaneousGestures(pan, pinch, doubleTap);

  // Ổn định giữa các lần render: nếu đổi mỗi lần, effect gọi nó sẽ đặt lại khung xem mỗi khi
  // người dùng bật/tắt hay đổi màu.
  const setLayout = useCallback(
    (aw: number, ah: number, cw: number, ch: number) => {
      areaW.set(aw);
      areaH.set(ah);
      coverW.set(cw);
      coverH.set(ch);
      tx.set(0);
      ty.set(0);
      zoom.set(1);
    },
    [areaW, areaH, coverW, coverH, tx, ty, zoom],
  );

  return { gesture, tx, ty, zoom, setLayout };
}
