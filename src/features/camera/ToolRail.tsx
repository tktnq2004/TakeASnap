import {
  Contrast,
  EyeOff,
  FlipHorizontal2,
  type LucideIcon,
  Pencil,
  Plus,
} from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  GestureDetector,
  useExclusiveGestures,
  usePanGesture,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { PoseCanvas } from '@/features/pose/PoseCanvas';
import type { Pose } from '@/features/pose/types';
import { haptic } from '@/lib/haptics';
import { AnimatedText, PressableScale } from '@/ui/components';
import { ease, easeIO } from '@/ui/easing';
import { t } from '@/ui/strings';
import { cameraRail as R, color, motion, radius, size, type } from '@/ui/tokens';

import { type RailSide, useCameraStore } from './cameraStore';
import type { Rect } from './frame';
import {
  clampRailTop,
  formatPercent,
  opacityFromDrag,
  railLeft,
  railTopFromY,
  railYFromTop,
  snapSide,
} from './rail';

type Props = {
  frame: Rect;
  pose: Pose | null;
  /** Độ hiện overlay 0..1, đọc trực tiếp bởi PoseOverlay. */
  opacity: SharedValue<number>;
  mirrored: boolean;
  hidden: boolean;
  /** Đang kéo pose: cột mờ đi. */
  dim: SharedValue<boolean>;
  onOpenLibrary: () => void;
  onEdit: () => void;
  onCycleOpacity: () => void;
  onOpacityEnd: (v: number) => void;
  onToggleMirror: () => void;
  onHide: (hidden: boolean) => void;
};

const railHeight = (items: number) => R.pad * 2 + R.grip + items * (R.gap + R.item);

/** Rãnh thanh độ hiện: nằm gọn trong cột, chừa chỗ cho số % ở trên và nửa núm ở dưới. */
const sliderTrack = (railH: number) => railH - R.sliderTop - R.sliderBottom;

/**
 * Cột công cụ pose (design.md §6.1). Kéo vạch nắm để dời cột lên xuống; quăng sang trái hoặc phải
 * thì cột dính vào mép đó; luôn nằm trong khung ngắm; nhớ vị trí. Giữ nút độ hiện thì cột thành
 * thanh kéo dọc gọn trong cột (góp ý Phase 4); kéo lên tăng, kéo xuống giảm, tính theo quãng ngón
 * tay đi chứ không theo chỗ ngón tay đặt; thả tay thì cột trở lại.
 * Chưa có pose: cột chỉ còn ô tròn dấu cộng.
 */
export function ToolRail(p: Props) {
  const side = useCameraStore((s) => s.railSide);
  const railY = useCameraStore((s) => s.railY);
  const savedOpacity = useCameraStore((s) => s.opacity);
  const { frame, opacity, dim, onOpacityEnd, onCycleOpacity } = p;
  const items = p.pose ? 5 : 1;
  const railH = railHeight(items);
  const trackH = sliderTrack(railH);

  const left = useSharedValue(railLeft(side, frame, R.width, R.inset));
  const top = useSharedValue(railTopFromY(railY, frame, railH, R.inset));
  const sx = useSharedValue(0);
  const sy = useSharedValue(0);
  const vx = useSharedValue(0);
  const adjusting = useSharedValue(false);
  const start = useSharedValue(1);

  // Khung đổi cỡ (đổi tỉ lệ) hoặc số nút đổi: đặt lại cột theo vị trí đã lưu, kẹp trong khung.
  // Vị trí vừa lưu do chính lần kéo này: cột đang trượt về mép, không đặt lại kẻo mất chuyển động.
  const fromDrag = useRef(false);
  const { x: fx, y: fy, width: fw, height: fh } = frame;
  useEffect(() => {
    if (fromDrag.current) {
      fromDrag.current = false;
      return;
    }
    const f = { x: fx, y: fy, width: fw, height: fh };
    left.set(railLeft(side, f, R.width, R.inset));
    top.set(railTopFromY(railY, f, railH, R.inset));
  }, [side, railY, fx, fy, fw, fh, railH, left, top]);

  const saveRail = (s: RailSide, y: number) => {
    haptic.snap();
    fromDrag.current = true;
    useCameraStore.getState().setRail(s, y);
  };

  const move = usePanGesture({
    minDistance: 0,
    hitSlop: { top: 12, left: 4, right: 4, bottom: 4 },
    onActivate: () => {
      'worklet';
      sx.set(left.get());
      sy.set(top.get());
    },
    onUpdate: (e) => {
      'worklet';
      vx.set(e.velocityX);
      const minX = frame.x + R.inset;
      const maxX = frame.x + frame.width - R.width - R.inset;
      left.set(Math.min(maxX, Math.max(minX, sx.get() + e.translationX)));
      top.set(clampRailTop(sy.get() + e.translationY, frame, railH, R.inset));
    },
    onDeactivate: () => {
      'worklet';
      const s = snapSide(left.get() + R.width / 2 - frame.x, vx.get(), frame.width);
      left.set(
        withTiming(railLeft(s, frame, R.width, R.inset), {
          duration: motion.slide,
          easing: easeIO,
        }),
      );
      scheduleOnRN(saveRail, s, railYFromTop(top.get(), frame, railH));
    },
  });

  // Nút độ hiện: chạm = đổi nhanh 3 mức; giữ 300 ms = thanh kéo tại chỗ.
  const hold = usePanGesture({
    activateAfterLongPress: motion.holdDelay,
    onActivate: () => {
      'worklet';
      start.set(opacity.get());
      adjusting.set(true);
      scheduleOnRN(haptic.select);
    },
    onUpdate: (e) => {
      'worklet';
      opacity.set(opacityFromDrag(start.get(), e.translationY, trackH));
    },
    onFinalize: () => {
      'worklet';
      if (!adjusting.get()) return;
      adjusting.set(false);
      scheduleOnRN(onOpacityEnd, opacity.get());
    },
  });
  const tap = useTapGesture({
    onActivate: () => {
      'worklet';
      scheduleOnRN(onCycleOpacity);
    },
  });
  const opacityGesture = useExclusiveGestures(hold, tap);

  const railStyle = useAnimatedStyle(() => ({
    left: left.get(),
    top: top.get(),
    opacity: withTiming(dim.get() ? R.dimOpacity : 1, { duration: motion.in, easing: ease }),
  }));
  const bodyStyle = useAnimatedStyle(() => ({
    opacity: withTiming(adjusting.get() ? 0 : 1, { duration: motion.in, easing: ease }),
  }));
  const sliderStyle = useAnimatedStyle(() => ({
    opacity: withTiming(adjusting.get() ? 1 : 0, { duration: motion.in, easing: ease }),
  }));
  const fillStyle = useAnimatedStyle(() => ({ height: opacity.get() * trackH }));
  const thumbStyle = useAnimatedStyle(() => ({
    top: R.sliderTop + (1 - opacity.get()) * trackH - R.thumb / 2,
  }));
  const pctText = useDerivedValue(() => formatPercent(opacity.get()));
  const pct = Math.round(savedOpacity * 100);

  return (
    <Animated.View style={[styles.rail, { height: railH }, railStyle]}>
      <GestureDetector gesture={move}>
        <Animated.View
          style={[styles.grip, bodyStyle]}
          accessible
          accessibilityLabel={t.camera.railGrip}
          accessibilityRole="adjustable"
        >
          <View style={styles.gripBar} />
        </Animated.View>
      </GestureDetector>

      <Animated.View style={[styles.body, bodyStyle]}>
        <PoseButton pose={p.pose} onPress={p.onOpenLibrary} />
        {p.pose && (
          <>
            <RailButton icon={Pencil} label={t.camera.editPose} onPress={p.onEdit} />
            <GestureDetector gesture={opacityGesture}>
              <View
                style={styles.button}
                accessible
                accessibilityRole="button"
                accessibilityLabel={t.camera.opacity(pct)}
              >
                <Contrast size={size.icon} strokeWidth={2} color={color.camInk} />
                {pct < 100 && <Text style={styles.badge}>{pct}</Text>}
              </View>
            </GestureDetector>
            <RailButton
              icon={FlipHorizontal2}
              label={t.camera.mirror}
              onPress={p.onToggleMirror}
              active={p.mirrored}
            />
            <RailButton
              icon={EyeOff}
              label={t.camera.holdToHide}
              onPressIn={() => p.onHide(true)}
              onPressOut={() => p.onHide(false)}
              active={p.hidden}
            />
          </>
        )}
      </Animated.View>

      {/* Thanh độ hiện: thay chỗ cột trong lúc giữ nút. */}
      {p.pose && (
        <Animated.View pointerEvents="none" style={[styles.slider, sliderStyle]}>
          <AnimatedText text={pctText} style={[type.num, styles.pct]} />
          <View style={[styles.track, { height: trackH }]}>
            <Animated.View style={[styles.fill, fillStyle]} />
          </View>
          <Animated.View style={[styles.thumb, thumbStyle]} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

function RailButton({
  icon: Icon,
  label,
  onPress,
  onPressIn,
  onPressOut,
  active,
}: {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  active?: boolean;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[styles.button, active && styles.buttonOn]}
    >
      <Icon size={size.icon} strokeWidth={2} color={color.camInk} />
    </PressableScale>
  );
}

/** Nút pose: thumbnail pose đang dùng; chưa có pose thì ô tròn dấu cộng (design.md §6.2). */
function PoseButton({ pose, onPress }: { pose: Pose | null; onPress: () => void }) {
  const inner = R.item - 4;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={t.camera.openLibrary}
      onPress={onPress}
      style={styles.pose}
    >
      {pose ? (
        <PoseCanvas
          fit="cover"
          source={pose.source}
          imageWidth={pose.width}
          imageHeight={pose.height}
          contours={pose.contours}
          landmarks={null}
          width={inner}
          height={inner}
          subjectOpacity={1}
          backgroundOpacity={1}
          outlineEnabled
          outlineColor="#ffffff"
          outlineWidth={1}
          fillEnabled={false}
          fillColor={pose.style.fillColor}
          fillOpacity={0}
          faceEnabled={false}
          faceColor={pose.style.faceColor}
          faceWidth={0}
        />
      ) : (
        <Plus size={22} strokeWidth={2.5} color={color.camInk} />
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  rail: {
    position: 'absolute',
    width: R.width,
    padding: R.pad,
    borderRadius: radius.full,
    backgroundColor: color.camScrim,
  },
  grip: { height: R.grip, alignItems: 'center', justifyContent: 'center' },
  gripBar: { width: 22, height: 4, borderRadius: 2, backgroundColor: color.camMuted },
  body: { gap: R.gap, paddingTop: R.gap },
  button: {
    width: R.item,
    height: R.item,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOn: { backgroundColor: color.accent },
  badge: {
    position: 'absolute',
    right: -2,
    top: -2,
    minWidth: 20,
    height: 18,
    paddingHorizontal: 3,
    borderRadius: radius.full,
    overflow: 'hidden',
    backgroundColor: color.camInk,
    color: color.accent,
    textAlign: 'center',
    ...type.badge,
  },
  pose: {
    width: R.item,
    height: R.item,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: color.camAccent,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Phủ đúng khung cột (nền cột đã có), không lấn ra ngoài.
  slider: { ...StyleSheet.absoluteFill, alignItems: 'center' },
  track: {
    position: 'absolute',
    top: R.sliderTop,
    width: 8,
    borderRadius: 4,
    backgroundColor: color.camLine,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fill: { width: 8, backgroundColor: color.camAccent },
  thumb: {
    position: 'absolute',
    width: R.thumb,
    height: R.thumb,
    borderRadius: radius.full,
    backgroundColor: color.camInk,
  },
  pct: {
    position: 'absolute',
    top: R.pad + 4,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: color.camInk,
  },
});
