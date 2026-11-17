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

import type { Rect } from './frame';
import { deviceRoll, levelUsable } from './level';

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
      backgroundColor: level.get() ? color.camAccent : color.camWarn,
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
