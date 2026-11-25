/**
 * Hình của lớp bố cục trên khung ngắm (design.md §6.15). Tọa độ chuẩn hóa 0..1 trong khung
 * (0,0 = góc trên trái). Hàm thuần.
 *
 * Phase 5 chưa phân tích ảnh camera: chấm đích bám theo POSE đang đặt trên khung (giao điểm TRÊN
 * gần mắt người mẫu nhất). Chưa có pose thì hiện hai giao điểm trên để người dùng tự chọn. Chỉ giao
 * điểm trên, vì nhận xét chấm mắt theo đường 1/3 trên (phiếu phase5a 1.5).
 */
import type { TechniqueId } from './techniques';

export type Pt = { x: number; y: number };

export type GuideShape = {
  /** Đường dọc (x) và đường ngang (y). */
  v: number[];
  h: number[];
  /** Chấm đích (vòng + chấm). */
  target: Pt | null;
  /** Các điểm có thể đặt người khi chưa biết người ở đâu (chấm nhỏ). */
  points: Pt[];
};

const THIRDS = [1 / 3, 2 / 3];
const QUARTERS = [1 / 4, 1 / 2, 3 / 4];
const EMPTY: GuideShape = { v: [], h: [], target: null, points: [] };

/** Bốn giao điểm 1/3. */
export const INTERSECTIONS: Pt[] = THIRDS.flatMap((y) => THIRDS.map((x) => ({ x, y })));
export const UPPER = INTERSECTIONS.filter((p) => p.y < 0.5);

export function nearest(list: Pt[], a: Pt): Pt {
  let best = list[0]!;
  for (const p of list) {
    if (Math.hypot(p.x - a.x, p.y - a.y) < Math.hypot(best.x - a.x, best.y - a.y)) best = p;
  }
  return best;
}

/** `anchor`: mắt người mẫu của pose trên khung (0..1), null khi chưa có pose. */
export function guideShape(t: TechniqueId, anchor: Pt | null = null): GuideShape {
  switch (t) {
    case 'off':
      return EMPTY;
    case 'grid4':
      return { ...EMPTY, v: QUARTERS, h: QUARTERS };
    case 'thirds':
      return anchor
        ? { ...EMPTY, v: THIRDS, h: THIRDS, target: nearest(UPPER, anchor) }
        : { ...EMPTY, v: THIRDS, h: THIRDS, points: UPPER };
    case 'center':
      return { ...EMPTY, v: [0.5], target: { x: 0.5, y: 1 / 3 } };
    default:
      // Lưới 3×3, góc thấp, selfie, nhóm: lưới 3×3 (ba kỹ thuật sau gợi ý qua dòng gợi ý).
      return { ...EMPTY, v: THIRDS, h: THIRDS };
  }
}
