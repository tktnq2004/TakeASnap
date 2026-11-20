import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { Pipette } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  GestureDetector,
  usePanGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { PressableScale } from '@/ui/components';
import { hexToHsv, hsvToHex, normalizeHex } from '@/ui/colorMath';
import { needsEdge } from '@/ui/contrast';
import { t } from '@/ui/strings';
import { color, colorPopover as P, elevation, radius, size, space, type } from '@/ui/tokens';

import type { TileRect } from './PoseTile';

type Props = {
  /** Ô màu tự chọn trong hàng màu (tọa độ trong khung màn), mũi tên chỉ vào đây. */
  anchor: TileRect;
  area: { width: number; height: number };
  /** Màu lúc mở bảng. */
  initial: string;
  /** Màu đang chọn, preview đọc trực tiếp (đổi theo ngón tay, không re-render). */
  live: SharedValue<string>;
  recent: string[];
  /** Thả tay, gõ xong mã, chọn màu gần đây: ghi màu vào pose. */
  onCommit: (hex: string) => void;
  onPipette: () => void;
  onClose: () => void;
};

const HUE_STOPS = ['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FF0000'];

/**
 * Bảng màu (design.md §6.10, bản B): bảng nhỏ nổi trên panel, mũi tên chỉ vào ô màu tự chọn.
 * Ô sáng / đậm, thanh màu, mã HEX, lấy màu từ ảnh, 6 màu gần đây. Kéo thì preview đổi ngay trên
 * UI thread; thả tay mới ghi vào pose. Chạm ra ngoài là xong.
 */
export function ColorPopover(p: Props) {
  const { live, onCommit } = p;
  const width = Math.min(P.width, p.area.width - size.edge * 2);
  const inner = width - P.pad * 2;
  const start = hexToHsv(p.initial);
  const h = useSharedValue(start.h);
  const s = useSharedValue(start.s);
  const v = useSharedValue(start.v);
  const [hexText, setHexText] = useState(p.initial.toUpperCase());
  const [lift, setLift] = useState(0);

  // Bàn phím (gõ mã HEX) che bảng: đẩy bảng lên vừa đủ.
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const a = Keyboard.addListener(showEvt, (e) => {
      const kbTop = p.area.height - e.endCoordinates.height;
      setLift(Math.max(0, p.anchor.y - P.arrow - kbTop + space[3]));
    });
    const b = Keyboard.addListener(hideEvt, () => setLift(0));
    return () => {
      a.remove();
      b.remove();
    };
  }, [p.area.height, p.anchor.y]);

  const commitHex = (hex: string) => {
    setHexText(hex);
    onCommit(hex);
  };
  const apply = (hex: string) => {
    const c = hexToHsv(hex);
    h.set(c.h);
    s.set(c.s);
    v.set(c.v);
    live.set(hex);
    commitHex(hex);
  };

  // ---- Ô sáng / đậm ----
  const setSv = (x: number, y: number) => {
    'worklet';
    s.set(Math.min(1, Math.max(0, x / inner)));
    v.set(1 - Math.min(1, Math.max(0, y / P.svHeight)));
    live.set(hsvToHex(h.get(), s.get(), v.get()));
  };
  const endSv = () => {
    'worklet';
    scheduleOnRN(commitHex, hsvToHex(h.get(), s.get(), v.get()));
  };
  const svPan = usePanGesture({
    minDistance: 0,
    onUpdate: (e) => {
      'worklet';
      setSv(e.x, e.y);
    },
    onDeactivate: endSv,
  });
  const svTap = useTapGesture({
    onActivate: (e) => {
      'worklet';
      setSv(e.x, e.y);
      endSv();
    },
  });
  const svGesture = useSimultaneousGestures(svPan, svTap);

  // ---- Thanh màu ----
  const setHue = (x: number) => {
    'worklet';
    h.set(Math.min(1, Math.max(0, x / inner)) * 360);
    live.set(hsvToHex(h.get(), s.get(), v.get()));
  };
  const huePan = usePanGesture({
    minDistance: 0,
    onUpdate: (e) => {
      'worklet';
      setHue(e.x);
    },
    onDeactivate: endSv,
  });
  const hueTap = useTapGesture({
    onActivate: (e) => {
      'worklet';
      setHue(e.x);
      endSv();
    },
  });
  const hueGesture = useSimultaneousGestures(huePan, hueTap);

  const svColors = useDerivedValue(() => ['#FFFFFF', hsvToHex(h.get(), 1, 1)]);
  const svThumb = useAnimatedStyle(() => ({
    backgroundColor: live.get(),
    transform: [
      { translateX: s.get() * inner - P.thumb / 2 },
      { translateY: (1 - v.get()) * P.svHeight - P.thumb / 2 },
    ],
  }));
  const hueThumb = useAnimatedStyle(() => ({
    backgroundColor: hsvToHex(h.get(), 1, 1),
    transform: [{ translateX: (h.get() / 360) * inner - P.thumb / 2 }],
  }));

  const anchorCx = p.anchor.x + p.anchor.width / 2;
  const left = Math.min(
    p.area.width - size.edge - width,
    Math.max(size.edge, anchorCx - width / 2),
  );
  const arrowX = Math.min(width - 24, Math.max(16, anchorCx - left - P.arrow));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.common.done}
        style={[StyleSheet.absoluteFill, styles.backdrop]}
        onPress={p.onClose}
      />
      <View
        style={[
          styles.pop,
          {
            left,
            width,
            bottom: p.area.height - p.anchor.y + P.arrow + 2 + lift,
          },
        ]}
      >
        <GestureDetector gesture={svGesture}>
          <View style={[styles.sv, { width: inner }]} accessibilityLabel={t.editor.color}>
            <Canvas style={StyleSheet.absoluteFill}>
              <Rect x={0} y={0} width={inner} height={P.svHeight}>
                <LinearGradient start={vec(0, 0)} end={vec(inner, 0)} colors={svColors} />
              </Rect>
              <Rect x={0} y={0} width={inner} height={P.svHeight}>
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(0, P.svHeight)}
                  colors={['rgba(0,0,0,0)', '#000000']}
                />
              </Rect>
            </Canvas>
            <Animated.View pointerEvents="none" style={[styles.thumb, svThumb]} />
          </View>
        </GestureDetector>

        <GestureDetector gesture={hueGesture}>
          <View style={styles.hueHit}>
            <View style={[styles.hue, { width: inner }]}>
              <Canvas style={StyleSheet.absoluteFill}>
                <Rect x={0} y={0} width={inner} height={P.hueHeight}>
                  <LinearGradient start={vec(0, 0)} end={vec(inner, 0)} colors={HUE_STOPS} />
                </Rect>
              </Canvas>
            </View>
            <Animated.View pointerEvents="none" style={[styles.thumb, styles.hueThumb, hueThumb]} />
          </View>
        </GestureDetector>

        <View style={styles.row}>
          <View style={styles.hexBox}>
            <Text style={[type.hint, styles.muted]}>{t.editor.hex}</Text>
            <TextInput
              value={hexText}
              onChangeText={setHexText}
              onEndEditing={() => {
                const n = normalizeHex(hexText);
                if (n) apply(n);
                else setHexText(live.get());
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={7}
              accessibilityLabel={t.editor.hex}
              style={[type.label, styles.hexInput]}
            />
          </View>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={t.editor.pipette}
            hitSlop={4}
            onPress={p.onPipette}
            style={styles.pipette}
          >
            <Pipette size={size.iconSmall} strokeWidth={2} color={color.ink} />
          </PressableScale>
        </View>

        {p.recent.length > 0 && (
          <View style={styles.recentBox}>
            <Text style={[type.caption, styles.muted]}>{t.editor.recent}</Text>
            <View style={styles.recent}>
              {p.recent.map((c) => (
                <PressableScale
                  key={c}
                  accessibilityRole="button"
                  accessibilityLabel={c}
                  hitSlop={4}
                  onPress={() => apply(c)}
                  style={[
                    styles.recentSwatch,
                    { backgroundColor: c },
                    needsEdge(c) && styles.white,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        <View style={[styles.arrow, { left: arrowX }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: color.popoverScrim },
  pop: {
    position: 'absolute',
    padding: P.pad,
    gap: space[3],
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    ...elevation.float,
    shadowColor: color.shadow,
  },
  sv: { height: P.svHeight, borderRadius: 10, overflow: 'hidden' },
  thumb: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: P.thumb,
    height: P.thumb,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: color.knob,
    shadowColor: color.shadow,
    shadowOpacity: 0.35,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  hueHit: { height: P.thumb, justifyContent: 'center' },
  hue: { height: P.hueHeight, borderRadius: radius.full, overflow: 'hidden' },
  hueThumb: { top: 0 },
  row: { flexDirection: 'row', gap: space[2] },
  hexBox: {
    flex: 1,
    height: 40,
    paddingHorizontal: space[3],
    borderRadius: radius.sm,
    backgroundColor: color.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  hexInput: { flex: 1, color: color.ink, textAlign: 'right', padding: 0 },
  pipette: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muted: { color: color.muted },
  recentBox: { gap: space[2] },
  recent: { flexDirection: 'row', gap: 9 },
  recentSwatch: { width: 30, height: 30, borderRadius: radius.full },
  white: { borderWidth: 1, borderColor: color.swatchEdge },
  arrow: {
    position: 'absolute',
    bottom: -P.arrow,
    width: P.arrow * 2,
    height: P.arrow * 2,
    backgroundColor: color.surface,
    transform: [{ rotate: '45deg' }],
  },
});
