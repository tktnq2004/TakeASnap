import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { t } from '@/ui/strings';
import { color, radius, tileSelect } from '@/ui/tokens';

import { PoseCanvas } from './PoseCanvas';
import { inRange } from './selection';
import type { Pose } from './types';

/** Dải đang vuốt chọn (selection.ts). start = -1: không vuốt. */
export type DragRange = { start: number; end: number; select: boolean };

type Props = {
  pose: Pose;
  width: number;
  height: number;
  plain?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  /** Đang ở chế độ chọn nhiều: hiện dấu chọn ở góc. */
  selecting?: boolean;
  selected?: boolean;
  index?: number;
  drag?: SharedValue<DragRange>;
};

/**
 * Ô pose: luôn là ẢNH GỐC đầy đủ màu (người + nền), vì người dùng chọn pose nhờ nhìn cả người
 * mẫu lẫn bối cảnh (góp ý Phase 1).
 * - `plain` (Pose mẫu): chỉ thêm viền trắng mảnh.
 * - Pose của bạn: phủ style của chính bản đó lên ảnh gốc (thu nhỏ độ dày cho vừa ô), để các bản
 *   từ cùng một ảnh vẫn phân biệt được.
 */
export function PoseTile({
  pose,
  width,
  height,
  plain,
  onPress,
  onLongPress,
  selecting,
  selected,
  index,
  drag,
}: Props) {
  const s = pose.style;
  return (
    <Pressable
      accessibilityRole={selecting ? 'checkbox' : 'button'}
      accessibilityLabel={selecting ? t.library.selectTile : t.library.use}
      accessibilityHint={selecting ? undefined : t.library.longPressHint}
      accessibilityState={selecting ? { checked: !!selected } : undefined}
      onPress={onPress}
      onLongPress={selecting ? undefined : onLongPress}
      style={[styles.tile, { width, height }]}
    >
      <PoseCanvas
        fit="cover"
        source={pose.source}
        imageWidth={pose.width}
        imageHeight={pose.height}
        contours={pose.contours}
        landmarks={pose.landmarks}
        width={width}
        height={height}
        subjectOpacity={1}
        backgroundOpacity={1}
        outlineEnabled={plain ? true : s.outlineEnabled}
        outlineColor={plain ? '#ffffff' : s.outlineColor}
        outlineWidth={plain ? 1.5 : Math.min(s.outlineWidth, 2)}
        fillEnabled={plain ? false : s.fillEnabled}
        fillColor={s.fillColor}
        fillOpacity={s.fillOpacity}
        faceEnabled={plain ? false : s.faceEnabled}
        faceColor={s.faceColor}
        faceWidth={Math.min(s.faceWidth, 1)}
      />
      {selecting && drag && index != null && (
        <SelectMark selected={!!selected} index={index} drag={drag} />
      )}
    </Pressable>
  );
}

/** Vòng tròn rỗng ở góc; đã chọn (hoặc nằm trong dải đang vuốt chọn) thì đặc màu nhấn + viền ô. */
function SelectMark({
  selected,
  index,
  drag,
}: {
  selected: boolean;
  index: number;
  drag: SharedValue<DragRange>;
}) {
  const onStyle = useAnimatedStyle(() => {
    const d = drag.get();
    const on = inRange(index, d.start, d.end) ? d.select : selected;
    return { opacity: on ? 1 : 0 };
  });
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.ring} />
      <Animated.View style={[StyleSheet.absoluteFill, onStyle]}>
        <View style={styles.border} />
        <View style={styles.markOn}>
          <Check size={tileSelect.check} strokeWidth={3} color={color.accentInk} />
        </View>
      </Animated.View>
    </View>
  );
}

const mark = {
  position: 'absolute',
  top: tileSelect.markInset,
  right: tileSelect.markInset,
  width: tileSelect.mark,
  height: tileSelect.mark,
  borderRadius: radius.full,
} as const;

const styles = StyleSheet.create({
  tile: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: color.surface },
  ring: {
    ...mark,
    borderWidth: tileSelect.ring,
    borderColor: color.ink,
    backgroundColor: color.scrim,
  },
  markOn: {
    ...mark,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  border: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: radius.md,
    borderWidth: tileSelect.border,
    borderColor: color.accent,
  },
});
