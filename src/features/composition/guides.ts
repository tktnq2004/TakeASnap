/**
 * Hình của lớp bố cục trên khung ngắm (design.md §6.15). Tọa độ chuẩn hóa 0..1 trong khung
 * (0,0 = góc trên trái). Hàm thuần.
 *
 * Phase 5 chưa phân tích ảnh camera: chấm đích bám theo POSE đang đặt trên khung (giao điểm TRÊN
 * gần mắt người mẫu nhất). Chưa có pose thì không có chấm (phiếu Phase 5b lần 3, mục 11.5: bỏ hai
 * chấm ở hai giao điểm trên). Chỉ giao điểm trên, vì nhận xét chấm mắt theo đường 1/3 trên (phiếu
 * phase5a 1.5).
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
  /** Đường chéo nét đứt (đường dẫn): từ `from` tới `to`. */
  diagonals: { from: Pt; to: Pt }[];
};

const THIRDS = [1 / 3, 2 / 3];
const QUARTERS = [1 / 4, 1 / 2, 3 / 4];
const EMPTY: GuideShape = { v: [], h: [], accentH: [], target: null, diagonals: [] };

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
    case 'grid4':
      return { ...EMPTY, v: QUARTERS, h: QUARTERS };
    case 'thirds':
      return { ...EMPTY, v: THIRDS, h: THIRDS, target: anchor ? nearest(UPPER, anchor) : null };
    case 'center':
      return { ...EMPTY, v: [0.5], target: { x: 0.5, y: 1 / 3 } };
    case 'horizon':
      // Nhận xét đạt khi chân trời trên một trong hai đường 1/3 (phiếu phase5a 2.1).
      return { ...EMPTY, accentH: THIRDS };
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
      // Lưới 3×3, góc thấp, selfie, nhóm: lưới 3×3 (ba kỹ thuật sau gợi ý qua dòng gợi ý).
      return { ...EMPTY, v: THIRDS, h: THIRDS };
  }
}

/**
 * Lớp kẻ khi bật cùng lúc bố cục chính và bố cục phụ (Phase 5b, business-flow §6.10): hợp các
 * đường kẻ, đường chân trời tô màu nhấn và đường chéo của bố cục phụ; chấm đích của bố cục chính
 * (không có thì của bố cục phụ).
 */
export function combinedShape(
  main: TechniqueId,
  scene: TechniqueId | null,
  anchor: Pt | null = null,
): GuideShape {
  const a = guideShape(main, anchor);
  if (!scene) return a;
  const b = guideShape(scene, anchor);
  const uniq = (xs: number[]) => [...new Set(xs)].sort((p, q) => p - q);
  return {
    v: uniq([...a.v, ...b.v]),
    // Đường đã tô màu nhấn thì không vẽ lại thành đường kẻ thường.
    h: uniq([...a.h, ...b.h]).filter((y) => !b.accentH.includes(y)),
    accentH: b.accentH,
    target: a.target ?? b.target,
    diagonals: b.diagonals.map((d) => (a.target ? { ...d, to: a.target } : d)),
  };
}
