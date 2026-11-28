/**
 * Lớp vẽ theo cách cầm máy (phiếu Phase 5b lần 18): app khóa màn hình dọc; cầm ngang thì khung
 * ngắm dọc trên màn hình là khung ngang của cảnh. Lớp này là khung ngang đó, xoay ngược cách cầm,
 * nên mọi thứ vẽ bên trong (đường kẻ, dải đích, viên chữ, mũi tên) đứng đúng chiều cảnh. Con nhận
 * khung ảo tính trong lớp (gốc 0, 0; rộng = cao của khung thật).
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Rect, Turn } from './frame';

export function Turned({
  frame,
  turn,
  children,
}: {
  frame: Rect;
  turn: Turn;
  children: (frame: Rect) => ReactNode;
}) {
  if (turn === 0) return <>{children(frame)}</>;
  const w = frame.height;
  const h = frame.width;
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.abs,
        {
          left: frame.x + (frame.width - w) / 2,
          top: frame.y + (frame.height - h) / 2,
          width: w,
          height: h,
          transform: [{ rotate: `${-turn}deg` }],
        },
      ]}
    >
      {children({ x: 0, y: 0, width: w, height: h })}
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
});
