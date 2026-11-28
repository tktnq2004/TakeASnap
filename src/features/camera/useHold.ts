/**
 * Cách cầm máy (dọc / ngang / lộn ngược) theo cảm biến trọng lực. App khóa màn hình dọc, khung
 * ngắm luôn dọc; bố cục chưa tính cho khung ngang thì cần biết máy đang cầm ngang để báo "Cầm máy
 * dọc" (phiếu Phase 5b lần 17). Máy nằm ngửa (không đọc được góc nghiêng) thì giữ cách cầm cũ.
 */
import { Platform } from 'react-native';
import {
  SensorType,
  useAnimatedReaction,
  useAnimatedSensor,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useState } from 'react';

import { deviceRoll, type Hold, holdOf, levelUsable } from './level';

const IOS = Platform.OS === 'ios';

export function useHold(): Hold {
  const sensor = useAnimatedSensor(SensorType.GRAVITY, { interval: 'auto' });
  const held = useSharedValue<Hold>(0);
  const [hold, setHold] = useState<Hold>(0);
  useAnimatedReaction(
    () => {
      const g = sensor.sensor.get();
      if (!levelUsable(g.x, g.y, g.z)) return held.get();
      return holdOf((deviceRoll(g.x, g.y, IOS) * 180) / Math.PI, held.get());
    },
    (h, old) => {
      if (h === old) return;
      held.set(h);
      scheduleOnRN(setHold, h);
    },
  );
  return hold;
}
