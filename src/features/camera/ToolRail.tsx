import {
  ChevronUp,
  Contrast,
  Eye,
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
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
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

/** Ngón tay đi quá chừng này mới tính là kéo cột (dưới mức đó là chạm nút). */
const DRAG_SLOP = 10;

/** Cao của cột: nút thu gọn (khi có pose) + các nút. */
const railHeight = (items: number, toggle: boolean) =>
  R.pad * 2 + (toggle ? R.toggle + R.gap : 0) + items * R.item + (items - 1) * R.gap;

/** Rãnh thanh độ hiện: nằm gọn trong cột, chừa chỗ cho số % ở trên và nửa núm ở dưới. */
const sliderTrack = (railH: number) => railH - R.sliderTop - R.sliderBottom;

/**
 * Cột công cụ pose (design.md §6.1). Kéo ở bất kỳ đâu trên cột để dời cột lên xuống; quăng sang trái hoặc phải
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
  const collapsed = useCameraStore((s) => s.railCollapsed);
  // Thu gọn (góp ý Phase 4): chỉ còn nút chọn pose. Chưa có pose thì cột chỉ là ô dấu cộng.
  const full = p.pose != null && !collapsed;
  const items = full ? 5 : 1;
  const railH = railHeight(items, p.pose != null);
  const trackH = sliderTrack(railHeight(5, true));
  const reduceMotion = useReducedMotion();
  /** Chiều cao cột chạy hiệu ứng: thu gọn thì cuộn lên, mở thì xổ xuống. */
  const height = useSharedValue(railH);
  /** 1 = cột mở hết, 0 = thu gọn. Mũi tên và các nút phụ chạy theo. */
  const expanded = useSharedValue(full ? 1 : 0);

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
  const mounted = useRef(false);
  const { x: fx, y: fy, width: fw, height: fh } = frame;
  useEffect(() => {
    const anim = mounted.current && !reduceMotion;
    mounted.current = true;
    const cfg = { duration: motion.panel, easing: easeIO };
    height.set(anim ? withTiming(railH, cfg) : railH);
    expanded.set(anim ? withTiming(full ? 1 : 0, cfg) : full ? 1 : 0);
    if (fromDrag.current) {
      fromDrag.current = false;
      return;
    }
    const f = { x: fx, y: fy, width: fw, height: fh };
    left.set(railLeft(side, f, R.width, R.inset));
    // Mép trên đứng yên; chỉ dịch khi cột mở ra mà chạm mép dưới khung (kẹp), dịch có hiệu ứng.
    const to = railTopFromY(railY, f, railH, R.inset);
    top.set(anim ? withTiming(to, cfg) : to);
  }, [side, railY, fx, fy, fw, fh, railH, full, left, top, height, expanded, reduceMotion]);

  const saveRail = (s: RailSide, y: number) => {
    haptic.snap();
    fromDrag.current = true;
    useCameraStore.getState().setRail(s, y);
  };

  // Kéo từ bất kỳ đâu trên cột (góp ý Phase 4): ngón đi quá 10 px mới tính là kéo. Lúc đó Gesture
  // Handler hủy lượt chạm của nút bên dưới nên thả tay không bấm nhầm; chạm nhanh vẫn là bấm nút.
  const move = usePanGesture({
    activeOffsetX: [-DRAG_SLOP, DRAG_SLOP],
    activeOffsetY: [-DRAG_SLOP, DRAG_SLOP],
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
      scheduleOnRN(saveRail, s, railYFromTop(top.get(), frame));
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
    maxDistance: DRAG_SLOP,
    onActivate: () => {
      'worklet';
      scheduleOnRN(onCycleOpacity);
    },
  });
  const opacityGesture = useExclusiveGestures(hold, tap);

  const railStyle = useAnimatedStyle(() => ({
    left: left.get(),
    top: top.get(),
    height: height.get(),
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
  const extrasStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expanded.get(), [0, 0.6, 1], [0, 0.2, 1]),
    transform: [{ translateY: interpolate(expanded.get(), [0, 1], [-12, 0]) }],
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(expanded.get(), [0, 1], [180, 0])}deg` }],
  }));
  const pctText = useDerivedValue(() => formatPercent(opacity.get()));
  const pct = Math.round(savedOpacity * 100);

  return (
    <GestureDetector gesture={move}>
      <Animated.View style={[styles.rail, railStyle]} accessibilityLabel={t.camera.railGrip}>
        {/* Nút thu gọn / mở cột (thay cho vạch nắm). Kéo ở đâu trên cột cũng dời được cột. */}
        {p.pose && (
          <Animated.View style={bodyStyle}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={collapsed ? t.camera.railExpand : t.camera.railCollapse}
              hitSlop={{ top: 8, bottom: 4, left: 4, right: 4 }}
              onPress={useCameraStore.getState().toggleRailCollapsed}
              style={styles.toggle}
            >
              <Animated.View style={chevronStyle}>
                <ChevronUp size={size.iconSmall} strokeWidth={2.5} color={color.camInk} />
              </Animated.View>
            </PressableScale>
          </Animated.View>
        )}

        <Animated.View style={[styles.body, bodyStyle]}>
          <PoseButton pose={p.pose} onPress={p.onOpenLibrary} />
          {/* Các nút phụ luôn gắn sẵn để chạy hiệu ứng; thu gọn thì bị cột cắt và không nhận chạm. */}
          {p.pose && (
            <Animated.View
              style={[styles.extras, extrasStyle]}
              pointerEvents={full ? 'auto' : 'none'}
            >
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
                icon={p.hidden ? Eye : EyeOff}
                label={p.hidden ? t.camera.showPose : t.camera.hidePose}
                onPress={() => p.onHide(!p.hidden)}
                active={p.hidden}
              />
            </Animated.View>
          )}
        </Animated.View>

        {/* Thanh độ hiện: thay chỗ cột trong lúc giữ nút. */}
        {full && (
          <Animated.View pointerEvents="none" style={[styles.slider, sliderStyle]}>
            <AnimatedText text={pctText} style={[type.num, styles.pct]} />
            <View style={[styles.track, { height: trackH }]}>
              <Animated.View style={[styles.fill, fillStyle]} />
            </View>
            <Animated.View style={[styles.thumb, thumbStyle]} />
          </Animated.View>
        )}
      </Animated.View>
    </GestureDetector>
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
    overflow: 'hidden',
    width: R.width,
    padding: R.pad,
    borderRadius: radius.full,
    backgroundColor: color.camScrim,
  },
  toggle: {
    height: R.toggle,
    marginBottom: R.gap,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { gap: R.gap },
  extras: { gap: R.gap },
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
