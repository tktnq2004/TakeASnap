/**
 * Hình của lớp bố cục trên khung ngắm (design.md §6.15). Tọa độ chuẩn hóa 0..1 trong khung
 * (0,0 = góc trên trái). Hàm thuần.
 *
 * Phase 5 chưa phân tích ảnh camera: chấm đích bám theo POSE đang đặt trên khung (giao điểm gần
 * mắt người mẫu nhất). Chưa có pose thì hiện đủ các điểm để người dùng tự chọn.
 */
import type { TechniqueId } from './techniques';

export type Pt = { x: number; y: number };

export type GuideShape = {
  /** Đường dọc (x) và đường ngang (y). */
  v: number[];
  h: number[];
  /** Đường ngang tô màu nhấn (chân trời). */
  accentH: number[];
  /** Chấm đích (vòng + chấm). */
  target: Pt | null;
  /** Các điểm có thể đặt người khi chưa biết người ở đâu (chấm nhỏ). */
  points: Pt[];
  /** Đường chéo nét đứt (đường dẫn): từ `from` tới `to`. */
  diagonals: { from: Pt; to: Pt }[];
};

const THIRDS = [1 / 3, 2 / 3];
const EMPTY: GuideShape = { v: [], h: [], accentH: [], target: null, points: [], diagonals: [] };

/** Bốn giao điểm 1/3. */
export const INTERSECTIONS: Pt[] = THIRDS.flatMap((y) => THIRDS.map((x) => ({ x, y })));
const UPPER = INTERSECTIONS.filter((p) => p.y < 0.5);

export function nearest(list: Pt[], a: Pt): Pt {
  let best = list[0]!;
  for (const p of list) {
    if (Math.hypot(p.x - a.x, p.y - a.y) < Math.hypot(best.x - a.x, best.y - a.y)) best = p;
  }
  return best;
}

/** Hai góc dưới, lùi vào một chút để nét đứt không dính viền bo của khung. */
const LEAD_FROM: Pt[] = [
  { x: 0.06, y: 0.99 },
  { x: 0.94, y: 0.99 },
];

/** `anchor`: mắt người mẫu của pose trên khung (0..1), null khi chưa có pose. */
export function guideShape(t: TechniqueId, anchor: Pt | null = null): GuideShape {
  switch (t) {
    case 'off':
      return EMPTY;
    case 'thirds':
      return anchor
        ? { ...EMPTY, v: THIRDS, h: THIRDS, target: nearest(INTERSECTIONS, anchor) }
        : { ...EMPTY, v: THIRDS, h: THIRDS, points: INTERSECTIONS };
    case 'center':
      return { ...EMPTY, v: [0.5], target: { x: 0.5, y: 1 / 3 } };
    case 'horizon':
      return { ...EMPTY, h: [1 / 3], accentH: [2 / 3] };
    case 'lead': {
      // Đường dẫn chụm về giao điểm trên gần người nhất; chưa có pose thì bên trái.
      const to = anchor ? nearest(UPPER, anchor) : UPPER[0]!;
      return {
        ...EMPTY,
        v: THIRDS,
        h: THIRDS,
        target: to,
        diagonals: LEAD_FROM.map((from) => ({ from, to })),
      };
    }
    default:
      // Góc thấp, selfie, nhóm: lưới 3×3, gợi ý qua dòng gợi ý.
      return { ...EMPTY, v: THIRDS, h: THIRDS };
  }
}
