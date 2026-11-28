/**
 * Lớp vẽ theo cách cầm máy (phiếu Phase 5b lần 18): app khóa màn hình dọc; cầm ngang thì khung
 * ngắm dọc trên màn hình là khung ngang của cảnh. Lớp này là khung ngang đó, xoay ngược cách cầm,
 * nên mọi thứ vẽ bên trong (đường kẻ, dải đích, viên chữ, mũi tên) đứng đúng chiều cảnh. Con nhận
 * khung ảo tính trong lớp (gốc 0, 0; rộng = cao của khung thật). Cầm dọc thì con nhận khung thật.
 *
 * Đổi cách cầm: lớp mới bắt đầu ở góc của lớp cũ (thu nhỏ cho vừa khung) rồi xoay về góc mới
 * (góp ý mục 26.2: xoay mượt thay cho nhảy chỗ). `spin={false}` khi nội dung đã tự liên tục theo
 * cảm biến (thước cân bằng).
 */
import { type ReactNode, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { withTiming } from 'react-native-reanimated';

import { easeIO } from '@/ui/easing';
import { motion } from '@/ui/tokens';

import type { Rect, Turn } from './frame';

export function Turned({
  frame,
  turn,
  spin = true,
  children,
}: {
  frame: Rect;
  turn: Turn;
  spin?: boolean;
  children: (frame: Rect) => ReactNode;
}) {
  // Cách cầm trước đó (đổi ngay trong lúc render, không đợi effect: lớp mới gắn kèm hiệu ứng).
  const [shown, setShown] = useState(turn);
  const [prev, setPrev] = useState(turn);
  if (turn !== shown) {
    setPrev(shown);
    setShown(turn);
  }
  const entering = spin && prev !== turn ? spinIn(prev, turn, frame) : undefined;

  if (turn === 0) {
    return (
      <Animated.View
        key={turn}
        entering={entering}
        pointerEvents="box-none"
        style={[
          StyleSheet.absoluteFill,
          {
            transformOrigin: [frame.x + frame.width / 2, frame.y + frame.height / 2, 0],
            transform: [{ rotate: '0deg' }, { scale: 1 }],
          },
        ]}
      >
        {children(frame)}
      </Animated.View>
    );
  }
  const w = frame.height;
  const h = frame.width;
  return (
    <Animated.View
      key={turn}
      entering={entering}
      pointerEvents="box-none"
      style={[
        styles.abs,
        {
          left: frame.x + (frame.width - w) / 2,
          top: frame.y + (frame.height - h) / 2,
          width: w,
          height: h,
          transform: [{ rotate: `${-turn}deg` }, { scale: 1 }],
        },
      ]}
    >
      {children({ x: 0, y: 0, width: w, height: h })}
    </Animated.View>
  );
}

/**
 * Hiệu ứng gắn lớp mới: bắt đầu ở góc cách cầm cũ, lệch 90° thì thu nhỏ để lớp (đã đổi rộng ↔
 * cao) vẫn nằm trong khung, rồi xoay và phóng về đúng chỗ.
 */
function spinIn(from: Turn, to: Turn, frame: Rect) {
  const quarter = Math.abs(from - to) === 90;
  const s0 = quarter
    ? Math.min(frame.width / frame.height, frame.height / frame.width)
    : 1;
  const start = `${-from}deg`;
  const end = `${-to}deg`;
  const cfg = { duration: motion.rotate, easing: easeIO };
  return () => {
    'worklet';
    return {
      initialValues: { transform: [{ rotate: start }, { scale: s0 }] },
      animations: {
        transform: [{ rotate: withTiming(end, cfg) }, { scale: withTiming(1, cfg) }],
      },
    };
  };
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
});
