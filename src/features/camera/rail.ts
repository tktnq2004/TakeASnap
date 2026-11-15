/**
 * Hình học của cột công cụ pose và thanh độ hiện (design.md §6.1). Hàm thuần, chạy được trên UI
 * thread (worklet), có unit test.
 */
import type { Rect } from './frame';

export type Side = 'left' | 'right';

/** Thả cột: đoán chỗ cột sẽ tới theo vận tốc, rồi dính về mép gần hơn. */
export function snapSide(centerX: number, velocityX: number, screenW: number): Side {
  'worklet';
  const projected = centerX + velocityX * 0.15;
  return projected < screenW / 2 ? 'left' : 'right';
}

/** Mép trái của cột khi dính vào một mép khung ngắm. */
export function railLeft(side: Side, frame: Rect, railW: number, inset: number): number {
  'worklet';
  return side === 'left' ? frame.x + inset : frame.x + frame.width - railW - inset;
}

/** Kẹp mép trên của cột trong khung ngắm; khung thấp hơn cột thì đặt giữa khung. */
export function clampRailTop(top: number, frame: Rect, railH: number, inset: number): number {
  'worklet';
  const min = frame.y + inset;
  const max = frame.y + frame.height - railH - inset;
  if (max < min) return frame.y + (frame.height - railH) / 2;
  return Math.min(max, Math.max(min, top));
}

/** Mép trên của cột từ vị trí đã lưu (tâm cột theo tỉ lệ chiều cao khung). */
export function railTopFromY(y: number, frame: Rect, railH: number, inset: number): number {
  'worklet';
  return clampRailTop(frame.y + y * frame.height - railH / 2, frame, railH, inset);
}

/** Ngược lại: mép trên → tâm cột theo tỉ lệ chiều cao khung, để lưu. */
export function railYFromTop(top: number, frame: Rect, railH: number): number {
  'worklet';
  if (frame.height <= 0) return 0.5;
  return Math.min(1, Math.max(0, (top + railH / 2 - frame.y) / frame.height));
}

/**
 * Giữ nút độ hiện rồi kéo: kéo lên tăng, kéo xuống giảm. Đi hết `trackH` px là đi hết 0–100%,
 * bước 5%.
 */
export function opacityFromDrag(start: number, dy: number, trackH: number): number {
  'worklet';
  const v = start - dy / trackH;
  return Math.min(1, Math.max(0, Math.round(v * 20) / 20));
}

/** "60%". */
export function formatPercent(v: number): string {
  'worklet';
  return `${Math.round(v * 100)}%`;
}
