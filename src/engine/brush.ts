/**
 * Sửa nét (business-flow §5.2, Phase 3): cọ thêm / cọ xóa trên lưới mask, hoàn tác 30 bước.
 * Lưới dựng lại từ viền đang có (pose mẫu không có mask PNG), nên mọi pose sửa được như nhau.
 * Nhấc ngón tay thì dò viền lại bằng `buildContours`.
 *
 * TypeScript thuần, chạy trên JS thread, có unit test.
 */
import type { Contour, Grid } from './contour';

export type BrushMode = 'add' | 'erase';

/** Một nét cọ, tọa độ theo ô lưới. */
export type Stroke = {
  mode: BrushMode;
  /** Bán kính cọ, ô lưới. */
  radius: number;
  /** [x, y, x, y, …] */
  points: number[];
};

/** Cạnh dài của lưới sửa nét: bằng lưới dò viền (contour.ts) để viền dò lại khớp viền cũ. */
export const REFINE_SIDE = 512;

export function refineGridSize(imageW: number, imageH: number, side = REFINE_SIDE) {
  const k = side / Math.max(imageW, imageH);
  return {
    width: Math.max(1, Math.round(imageW * k)),
    height: Math.max(1, Math.round(imageH * k)),
  };
}

/** Số hàng con mỗi ô khi tô viền: khử răng cưa theo chiều dọc (chiều ngang tính đúng phần phủ). */
const SUB = 4;

/**
 * Viền chuẩn hóa → lưới 0..1 (fill rule evenOdd, lỗ tay–thân để trống), có khử răng cưa để dò
 * viền lại ra đường mượt.
 */
export function rasterizeContours(contours: Contour[], width: number, height: number): Float32Array {
  const out = new Float32Array(width * height);
  const edges: [number, number, number, number][] = [];
  for (const c of contours) {
    const n = c.points.length;
    for (let i = 0; i < n; i++) {
      const a = c.points[i]!;
      const b = c.points[(i + 1) % n]!;
      if (a.y === b.y) continue;
      edges.push([a.x * width, a.y * height, b.x * width, b.y * height]);
    }
  }
  const xs: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let s = 0; s < SUB; s++) {
      const sy = y + (s + 0.5) / SUB;
      xs.length = 0;
      for (const [x0, y0, x1, y1] of edges) {
        if ((sy >= y0 && sy < y1) || (sy >= y1 && sy < y0)) {
          xs.push(x0 + ((sy - y0) / (y1 - y0)) * (x1 - x0));
        }
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = Math.max(0, xs[k]!);
        const xb = Math.min(width, xs[k + 1]!);
        for (let x = Math.floor(xa); x < xb; x++) {
          const cover = Math.min(x + 1, xb) - Math.max(x, xa);
          if (cover > 0) out[y * width + x]! += cover / SUB;
        }
      }
    }
  }
  for (let i = 0; i < out.length; i++) if (out[i]! > 1) out[i] = 1;
  return out;
}

/** Áp một nét cọ lên lưới (sửa tại chỗ). Mép cọ khử răng cưa. */
export function applyStroke(data: Float32Array, width: number, height: number, s: Stroke) {
  const p = s.points;
  if (p.length < 2) return;
  const step = Math.max(0.5, s.radius * 0.35);
  stamp(data, width, height, p[0]!, p[1]!, s);
  for (let i = 2; i + 1 < p.length; i += 2) {
    const ax = p[i - 2]!;
    const ay = p[i - 1]!;
    const bx = p[i]!;
    const by = p[i + 1]!;
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 1; k <= n; k++) {
      stamp(data, width, height, ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n, s);
    }
  }
}

function stamp(data: Float32Array, w: number, h: number, cx: number, cy: number, s: Stroke) {
  const r = s.radius;
  const y0 = Math.max(0, Math.floor(cy - r - 1));
  const y1 = Math.min(h - 1, Math.ceil(cy + r + 1));
  const x0 = Math.max(0, Math.floor(cx - r - 1));
  const x1 = Math.min(w - 1, Math.ceil(cx + r + 1));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const cover = Math.min(1, Math.max(0, r + 0.5 - d));
      if (cover <= 0) continue;
      const i = y * w + x;
      data[i] = s.mode === 'add' ? Math.max(data[i]!, cover) : Math.min(data[i]!, 1 - cover);
    }
  }
}

/**
 * Lịch sử nét cọ: hoàn tác / làm lại tối đa `limit` bước. Quá giới hạn thì nét cũ nhất được "nung"
 * vào lưới gốc. Hoàn tác = dựng lại từ lưới gốc với các nét còn lại (≤ 30 nét, nhanh).
 */
export class MaskHistory {
  private base: Float32Array;
  private current: Float32Array;
  private strokes: Stroke[] = [];
  private undone: Stroke[] = [];
  /** Đã có nét bị nung vào lưới gốc (vượt giới hạn hoàn tác). */
  private baked = false;

  constructor(
    base: Float32Array,
    readonly width: number,
    readonly height: number,
    private readonly limit = 30,
  ) {
    this.base = base.slice();
    this.current = base.slice();
  }

  get grid(): Grid {
    return { width: this.width, height: this.height, data: this.current };
  }

  get canUndo() {
    return this.strokes.length > 0;
  }

  get canRedo() {
    return this.undone.length > 0;
  }

  /** Đã có nét nào còn hiệu lực (để biết pose có bị sửa viền không). */
  get edited() {
    return this.strokes.length > 0 || this.baked;
  }

  push(s: Stroke) {
    this.strokes.push(s);
    this.undone = [];
    applyStroke(this.current, this.width, this.height, s);
    if (this.strokes.length > this.limit) {
      applyStroke(this.base, this.width, this.height, this.strokes.shift()!);
      this.baked = true;
    }
  }

  undo() {
    const s = this.strokes.pop();
    if (!s) return;
    this.undone.push(s);
    this.replay();
  }

  redo() {
    const s = this.undone.pop();
    if (!s) return;
    this.strokes.push(s);
    applyStroke(this.current, this.width, this.height, s);
  }

  private replay() {
    this.current = this.base.slice();
    for (const s of this.strokes) applyStroke(this.current, this.width, this.height, s);
  }
}
