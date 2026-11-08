import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';

import { AnimatedText } from '@/ui/components';
import { color, radius, space, type } from '@/ui/tokens';

/**
 * Đo FPS cho spike. UI: thread chạy cử chỉ và animation (phải giữ ~60).
 * JS: thread của React (được phép tụt khi re-render, nhưng không được kéo UI tụt theo).
 */
export function FpsMeter() {
  const uiFps = useSharedValue(0);
  const acc = useSharedValue(0);
  const frames = useSharedValue(0);

  useFrameCallback((info) => {
    'worklet';
    const dt = info.timeSincePreviousFrame ?? 0;
    // Khi có sự kiện chạm, callback có thể chạy thêm vài lần trong cùng một khung hình (dt ≈ 0).
    // Đếm cả những lần đó cho ra 180–200 "fps" ảo (spike A lần 1). Màn 120 Hz có dt ≈ 8.3 ms,
    // nên bỏ qua mọi lần dt < 4 ms.
    if (dt < 4) return;
    acc.value += dt;
    frames.value += 1;
    if (acc.value >= 500) {
      uiFps.value = Math.round((frames.value * 1000) / acc.value);
      acc.value = 0;
      frames.value = 0;
    }
  });
  const uiText = useDerivedValue(() => `UI ${uiFps.value}`);

  const [jsFps, setJsFps] = useState(0);
  useEffect(() => {
    let frames = 0;
    let start = performance.now();
    let id = 0;
    const loop = () => {
      frames += 1;
      const now = performance.now();
      if (now - start >= 1000) {
        setJsFps(Math.round((frames * 1000) / (now - start)));
        frames = 0;
        start = now;
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <View style={styles.box} pointerEvents="none">
      <AnimatedText text={uiText} style={[type.num, styles.text]} />
      <Text style={[type.num, styles.text]}>JS {jsFps}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderRadius: radius.sm,
    backgroundColor: color.scrim,
    gap: 2,
  },
  text: { color: color.ink },
});
