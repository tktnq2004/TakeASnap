/**
 * Hình của lớp bố cục trên khung ngắm (design.md §6.15). Tọa độ chuẩn hóa 0..1 trong khung
 * (0,0 = góc trên trái). Hàm thuần.
 */
import type { TechniqueId } from './techniques';

export type Pt = { x: number; y: number };

export type GuideShape = {
  /** Đường dọc (x) và đường ngang (y). */
  v: number[];
  h: number[];
  /** Đường ngang tô màu nhấn (chân trời). */
  accentH: number[];
  /** Chấm đích. */
  target: Pt | null;
  /** Đường chéo nét đứt (đường dẫn): từ `from` tới `to`. */
  diagonals: { from: Pt; to: Pt }[];
};

const THIRDS = [1 / 3, 2 / 3];
const EMPTY: GuideShape = { v: [], h: [], accentH: [], target: null, diagonals: [] };

/**
 * Giao điểm 1/3 trên dùng làm đích: bên trái, lật pose thì sang phải để người nhìn vào khoảng
 * trống phía còn lại.
 */
export function thirdsTarget(mirrored: boolean): Pt {
  return { x: mirrored ? 2 / 3 : 1 / 3, y: 1 / 3 };
}

/** Hai góc dưới, lùi vào một chút để nét đứt không dính viền bo của khung. */
const LEAD_FROM: Pt[] = [
  { x: 0.06, y: 0.99 },
  { x: 0.94, y: 0.99 },
];

export function guideShape(t: TechniqueId, mirrored = false): GuideShape {
  switch (t) {
    case 'off':
      return EMPTY;
    case 'thirds':
      return { ...EMPTY, v: THIRDS, h: THIRDS, target: thirdsTarget(mirrored) };
    case 'center':
      return { ...EMPTY, v: [0.5], target: { x: 0.5, y: 1 / 3 } };
    case 'horizon':
      return { ...EMPTY, h: [1 / 3], accentH: [2 / 3] };
    case 'lead': {
      const to = thirdsTarget(mirrored);
      return {
        ...EMPTY,
        v: THIRDS,
        h: THIRDS,
        target: to,
        diagonals: LEAD_FROM.map((from) => ({ from, to })),
      };
    }
    default:
      // Lưới, góc thấp, selfie, nhóm: lưới 3×3, gợi ý qua dòng gợi ý.
      return { ...EMPTY, v: THIRDS, h: THIRDS };
  }
}
