/**
 * Chọn nhiều pose trong "Pose của bạn" (góp ý Phase 3): chạm từng ô hoặc vuốt ngang qua các ô như
 * album ảnh iPhone. Vuốt chọn một dải liên tiếp từ ô bắt đầu tới ô dưới ngón tay; ô bắt đầu đang
 * chọn thì cả dải bỏ chọn. Hàm thuần, có unit test; `tileIndexAt` chạy được trong worklet.
 */

export type GridLayout = {
  cols: number;
  tileW: number;
  tileH: number;
  gap: number;
  /** Lề trái của lưới trong vùng nhận cử chỉ. */
  padX: number;
  count: number;
};

/** Ô dưới điểm (x, y) của vùng lưới. Ngoài lưới thì kẹp về ô gần nhất; lưới rỗng → -1. */
export function tileIndexAt(l: GridLayout, x: number, y: number): number {
  'worklet';
  if (l.count <= 0) return -1;
  const col = Math.min(l.cols - 1, Math.max(0, Math.floor((x - l.padX) / (l.tileW + l.gap))));
  const row = Math.max(0, Math.floor(y / (l.tileH + l.gap)));
  return Math.min(l.count - 1, row * l.cols + col);
}

/** Ô `i` có nằm trong dải từ `a` tới `b` (hai đầu, không cần a ≤ b). */
export function inRange(i: number, a: number, b: number): boolean {
  'worklet';
  return a >= 0 && i >= Math.min(a, b) && i <= Math.max(a, b);
}

/** Áp dải vừa vuốt lên tập đã chọn. */
export function applyRange(
  selected: ReadonlySet<string>,
  ids: readonly string[],
  a: number,
  b: number,
  select: boolean,
): Set<string> {
  const out = new Set(selected);
  for (let i = Math.max(0, Math.min(a, b)); i <= Math.min(ids.length - 1, Math.max(a, b)); i++) {
    if (select) out.add(ids[i]!);
    else out.delete(ids[i]!);
  }
  return out;
}
