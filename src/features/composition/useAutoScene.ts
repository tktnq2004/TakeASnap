/**
 * Gợi ý bố cục phụ tự động (Phase 5b, business-flow §6.10; Cài đặt, mặc định tắt): đoán lúc người
 * dùng chuẩn bị chụp rồi gọi `onTrigger` để nhìn cảnh một lần.
 *
 * Dấu hiệu: máy đứng yên `autoStillMs` (hướng máy lệch dưới `autoStillDeg`), máy dựng gần thẳng
 * (ống kính lệch khỏi phương ngang không quá `autoMaxPitch`), máy đã xoay hơn `autoTurnDeg` so với
 * lần nhìn trước (cảnh đã đổi), cách lần trước ít nhất `autoCooldownMs`. Cảm biến đọc trên JS
 * khoảng 10 lần / giây, chỉ khi bật.
 */
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { SensorType, useAnimatedSensor } from 'react-native-reanimated';

import { type AutoState, autoStep } from './autoScene';
import { cameraPitchDeg } from './sensor';

const IOS = Platform.OS === 'ios';
const POLL_MS = 100;

export function useAutoScene({
  enabled,
  allowed,
  front,
  onTrigger,
}: {
  enabled: boolean;
  /** Đọc mỗi lần đoán: camera rảnh, không đang kiểm tra / hướng dẫn / chụp. */
  allowed: () => boolean;
  front: boolean;
  onTrigger: () => void;
}) {
  const rotation = useAnimatedSensor(SensorType.ROTATION, { interval: POLL_MS });
  const gravity = useAnimatedSensor(SensorType.GRAVITY, { interval: POLL_MS });
  const cb = useRef({ allowed, onTrigger });
  useEffect(() => {
    cb.current = { allowed, onTrigger };
  });

  useEffect(() => {
    if (!enabled) return;
    let s: AutoState = { anchor: null, anchorAt: 0, last: null, lastAt: -Infinity };
    const id = setInterval(() => {
      const r = rotation.sensor.get();
      const g = gravity.sensor.get();
      const q = { x: r.qx, y: r.qy, z: r.qz, w: r.qw };
      if (!q.w && !q.x && !q.y && !q.z) return;
      const pitch = cameraPitchDeg(g.x, g.y, g.z, IOS, front);
      const out = autoStep(s, q, pitch, Date.now(), cb.current.allowed());
      s = out.state;
      if (out.fire) cb.current.onTrigger();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [enabled, front, rotation, gravity]);
}
