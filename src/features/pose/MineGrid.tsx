import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { space } from '@/ui/tokens';

import { type DragRange, PoseTile } from './PoseTile';
import { type GridLayout, tileIndexAt } from './selection';
import type { Pose } from './types';

type Props = {
  poses: Pose[];
  layout: Omit<GridLayout, 'count'>;
  selecting: boolean;
  selected: ReadonlySet<string>;
  onPress: (p: Pose) => void;
  onLongPress: (p: Pose) => void;
  /** Nhấc ngón tay sau khi vuốt chọn: dải ô [a, b] và chọn hay bỏ chọn. */
  onRange: (a: number, b: number, select: boolean) => void;
};

const IDLE: DragRange = { start: -1, end: -1, select: true };

/**
 * Lưới "Pose của bạn". Ở chế độ chọn nhiều: vuốt NGANG để bắt đầu chọn (vuốt dọc vẫn cuộn), rồi
 * kéo đi đâu cũng được, như album ảnh iPhone. Dải đang vuốt chỉ nằm trong shared value; chọn thật
 * (state) chỉ đổi khi nhấc tay.
 */
export function MineGrid({
  poses,
  layout,
  selecting,
  selected,
  onPress,
  onLongPress,
  onRange,
}: Props) {
  const drag = useSharedValue<DragRange>(IDLE);
  // Cờ đã chọn theo thứ tự ô, để worklet biết ô bắt đầu đang chọn hay chưa.
  const flags = useSharedValue<number[]>([]);
  const grid: GridLayout = { ...layout, count: poses.length };

  useEffect(() => {
    flags.set(poses.map((p) => (selected.has(p.id) ? 1 : 0)));
    // Lựa chọn mới đã render xong mới bỏ dải đang vuốt, để không chớp về trạng thái cũ.
    drag.set(IDLE);
  }, [poses, selected, flags, drag]);

  const pan = usePanGesture({
    enabled: selecting,
    activeOffsetX: [-10, 10],
    failOffsetY: [-10, 10],
    onActivate: (e) => {
      'worklet';
      const start = tileIndexAt(grid, e.x - e.translationX, e.y - e.translationY);
      if (start < 0) return;
      const end = tileIndexAt(grid, e.x, e.y);
      drag.set({ start, end, select: flags.get()[start] !== 1 });
    },
    onUpdate: (e) => {
      'worklet';
      const d = drag.get();
      if (d.start < 0) return;
      const end = tileIndexAt(grid, e.x, e.y);
      if (end !== d.end) drag.set({ ...d, end });
    },
    onDeactivate: () => {
      'worklet';
      const d = drag.get();
      if (d.start >= 0) scheduleOnRN(onRange, d.start, d.end, d.select);
    },
  });

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.grid, { gap: layout.gap, paddingHorizontal: layout.padX }]}>
        {poses.map((p, i) => (
          <PoseTile
            key={p.id}
            pose={p}
            width={layout.tileW}
            height={layout.tileH}
            onPress={() => onPress(p)}
            onLongPress={() => onLongPress(p)}
            selecting={selecting}
            selected={selected.has(p.id)}
            index={i}
            drag={drag}
          />
        ))}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingBottom: space[2] },
});
