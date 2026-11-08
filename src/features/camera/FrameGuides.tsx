import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  SensorType,
  useAnimatedReaction,
  useAnimatedSensor,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '@/lib/haptics';
import { t } from '@/ui/strings';
import { color, levelGuide } from '@/ui/tokens';

import type { GridMode } from './cameraStore';
import type { Rect } from './frame';
import { deviceRoll, levelUsable } from './level';

/** Lưới chia khung (business-flow §4.3): vẽ TRONG vùng ảnh sẽ được lưu. */
export function FrameGrid({ frame, mode }: { frame: Rect; mode: GridMode }) {
  if (mode === 'off') return null;
  const n = mode === '3' ? 3 : 4;
  const lines = Array.from({ length: n - 1 }, (_, i) => (i + 1) / n);
  return (
    <View pointerEvents="none" style={[styles.abs, frameStyle(frame)]}>
      {lines.map((f) => (
        <View key={`v${f}`} style={[styles.v, { left: `${f * 100}%` }]} />
      ))}
      {lines.map((f) => (
        <View key={`h${f}`} style={[styles.h, { top: `${f * 100}%` }]} />
      ))}
    </View>
  );
}

const IOS = Platform.OS === 'ios';
const LEVEL_RAD = (levelGuide.levelDeg * Math.PI) / 180;

/**
 * Thước cân bằng: vạch ngang giữa khung luôn song song mặt đất (xoay ngược góc nghiêng của máy),
 * đổi sang màu nhấn và rung một lần khi máy lệch dưới 1°. Trọng lực đọc trên UI thread
 * (`useAnimatedSensor`), không qua state.
 */
export function LevelGuide({ frame }: { frame: Rect }) {
  const sensor = useAnimatedSensor(SensorType.GRAVITY, { interval: 'auto' });
  const level = useSharedValue(false);

  useAnimatedReaction(
    () => {
      const g = sensor.sensor.get();
      return levelUsable(g.x, g.y, g.z) ? Math.abs(deviceRoll(g.x, g.y, IOS)) : Infinity;
    },
    (roll) => {
      // Có độ trễ: vào "thẳng" dưới 1°, ra khi quá 1.5°, để rung không lặp khi tay run quanh 1°.
      if (!level.get() && roll < LEVEL_RAD) {
        level.set(true);
        scheduleOnRN(haptic.levelReached);
      } else if (level.get() && roll > LEVEL_RAD * 1.5) {
        level.set(false);
      }
    },
  );

  const lineStyle = useAnimatedStyle(() => {
    const g = sensor.sensor.get();
    const usable = levelUsable(g.x, g.y, g.z);
    return {
      opacity: usable ? 1 : 0,
      backgroundColor: level.get() ? color.accent : color.ink,
      transform: [{ rotate: `${-deviceRoll(g.x, g.y, IOS)}rad` }],
    };
  });

  return (
    <View
      pointerEvents="none"
      accessibilityLabel={t.camera.level}
      style={[styles.abs, frameStyle(frame), styles.center]}
    >
      <Animated.View style={[styles.level, lineStyle]} />
      <View style={styles.levelRefLeft} />
      <View style={styles.levelRefRight} />
    </View>
  );
}

const frameStyle = (f: Rect) => ({ left: f.x, top: f.y, width: f.width, height: f.height });

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  center: { alignItems: 'center', justifyContent: 'center' },
  v: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: color.guide,
  },
  h: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: color.guide,
  },
  level: { width: levelGuide.length, height: levelGuide.thickness, borderRadius: 1 },
  // Hai vạch ngắn cố định hai bên: mốc để so vạch xoay.
  levelRefLeft: {
    position: 'absolute',
    width: levelGuide.ref,
    height: levelGuide.thickness,
    backgroundColor: color.guide,
    marginRight: levelGuide.length + levelGuide.ref * 2,
  },
  levelRefRight: {
    position: 'absolute',
    width: levelGuide.ref,
    height: levelGuide.thickness,
    backgroundColor: color.guide,
    marginLeft: levelGuide.length + levelGuide.ref * 2,
  },
});
