import { BlurView } from 'expo-blur';
import { Camera, Copy, type LucideIcon, Pencil, Trash2 } from 'lucide-react-native';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '@/lib/haptics';
import { ease } from '@/ui/easing';
import { t } from '@/ui/strings';
import { color, elevation, motion, poseMenu as M, radius, size, space, type } from '@/ui/tokens';

import { PoseTile, type TileRect } from './PoseTile';
import type { Pose } from './types';

type Props = {
  pose: Pose;
  /** Pose của bạn: có Sửa pose và Xóa pose. Pose mẫu: Tạo bản sao để sửa, không có Xóa. */
  mine: boolean;
  /** Vị trí ô đã giữ, tính trong khung của màn chứa menu. */
  from: TileRect;
  area: { width: number; height: number };
  insets: { top: number; bottom: number };
  onUse: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
};

const HINT_H = 48;

/**
 * Menu pose (design.md §6.7, bản B): nền mờ, ô pose nhấc lên phóng to từ đúng chỗ ô, menu ngay
 * dưới ô. Ô gần mép thì cả khối dịch vào trong màn. Chạm ra ngoài để hủy.
 */
export function PoseMenu(p: Props) {
  const { from, area, insets } = p;
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  const rows = p.mine ? 3 : 2;
  const menuH = rows * M.row + (rows - 1) + (p.mine ? M.band : 0);
  const blockH = M.liftH + M.gap + menuH;

  const fromCx = from.x + from.width / 2;
  const fromCy = from.y + from.height / 2;
  const cx = clamp(fromCx, size.edge + M.width / 2, area.width - size.edge - M.width / 2);
  const top = clamp(
    fromCy - M.liftH / 2,
    insets.top + size.edge,
    area.height - insets.bottom - HINT_H - blockH,
  );

  useEffect(() => {
    haptic.menu();
    if (!reduceMotion) progress.set(withTiming(1, { duration: motion.in, easing: ease }));
  }, [progress, reduceMotion]);

  const close = (after?: () => void) => {
    const done = () => {
      p.onClose();
      after?.();
    };
    if (reduceMotion) {
      done();
      return;
    }
    progress.set(
      withTiming(0, { duration: motion.in, easing: ease }, (finished) => {
        if (finished) scheduleOnRN(done);
      }),
    );
  };

  // Ô nổi: lúc đầu trùng đúng ô trong lưới, rồi phóng tới chỗ của nó trên menu.
  const startScale = from.width / M.liftW;
  const dx = fromCx - cx;
  const dy = fromCy - (top + M.liftH / 2);
  const liftStyle = useAnimatedStyle(() => {
    const v = progress.get();
    return {
      transform: [
        { translateX: interpolate(v, [0, 1], [dx, 0]) },
        { translateY: interpolate(v, [0, 1], [dy, 0]) },
        { scale: interpolate(v, [0, 1], [startScale, 1]) },
      ],
    };
  });
  const fadeStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const menuStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: interpolate(progress.get(), [0, 1], [-8, 0]) }],
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, fadeStyle]}>
        {Platform.OS === 'ios' && (
          <BlurView intensity={M.blur} tint="light" style={StyleSheet.absoluteFill} />
        )}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: Platform.OS === 'ios' ? color.menuScrim : color.menuScrimSolid },
          ]}
        />
      </Animated.View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.common.cancel}
        style={StyleSheet.absoluteFill}
        onPress={() => close()}
      />

      <Animated.View
        pointerEvents="none"
        style={[styles.lift, { left: cx - M.liftW / 2, top }, liftStyle]}
      >
        <PoseTile
          pose={p.pose}
          width={M.liftW}
          height={M.liftH}
          corner={M.liftRadius}
          plain={!p.mine}
          onPress={() => {}}
        />
      </Animated.View>

      <Animated.View
        accessibilityRole="menu"
        style={[styles.menu, { left: cx - M.width / 2, top: top + M.liftH + M.gap }, menuStyle]}
      >
        {/* Lớp ngoài giữ bóng, lớp trong cắt góc (overflow hidden làm mất bóng trên iOS). */}
        <View style={styles.menuClip}>
          <MenuRow
            icon={Camera}
            label={t.library.use}
            tone="accent"
            onPress={() => close(p.onUse)}
          />
          <View style={styles.line} />
          <MenuRow
            icon={p.mine ? Pencil : Copy}
            label={p.mine ? t.library.editPose : t.library.duplicate}
            onPress={() => close(p.onEdit)}
          />
          {p.mine && (
            <>
              <View style={styles.band} />
              <MenuRow
                icon={Trash2}
                label={t.library.removePose}
                tone="danger"
                onPress={() => close(p.onDelete)}
              />
            </>
          )}
        </View>
      </Animated.View>

      <Animated.Text
        style={[type.hint, styles.hint, { bottom: insets.bottom + space[5] }, fadeStyle]}
        pointerEvents="none"
      >
        {t.library.menuDismiss}
      </Animated.Text>
    </View>
  );
}

function MenuRow({
  icon: Icon,
  label,
  tone,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  tone?: 'accent' | 'danger';
  onPress: () => void;
}) {
  const ink = tone === 'accent' ? color.accent : tone === 'danger' ? color.danger : color.ink;
  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Text style={[type.label, { color: ink }]} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      <Icon size={size.icon} strokeWidth={2} color={ink} />
    </Pressable>
  );
}

function clamp(v: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(max, Math.max(min, v));
}

const styles = StyleSheet.create({
  lift: {
    position: 'absolute',
    width: M.liftW,
    height: M.liftH,
    borderRadius: M.liftRadius,
    ...elevation.float,
    shadowColor: color.shadow,
  },
  menu: {
    position: 'absolute',
    width: M.width,
    borderRadius: radius.lg - 2,
    backgroundColor: color.surface,
    ...elevation.float,
    shadowColor: color.shadow,
  },
  menuClip: { borderRadius: radius.lg - 2, overflow: 'hidden' },
  row: {
    height: M.row,
    paddingHorizontal: space[4] + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowPressed: { backgroundColor: color.surfaceAlt },
  line: { height: 1, marginLeft: space[4] + 2, backgroundColor: color.line },
  band: { height: M.band, backgroundColor: color.bg },
  hint: { position: 'absolute', left: 0, right: 0, textAlign: 'center', color: color.muted },
});
