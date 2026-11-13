/**
 * Sửa nét (business-flow §5.2, Phase 3): cọ thêm / xóa trên lưới mask, hoàn tác 30 bước.
 * Lưới dựng lại từ viền đang có (pose mẫu không có mask PNG), nên mọi pose sửa được như nhau.
 * Nhấc ngón tay thì dò viền lại bằng `buildContours`.
 *
 * TypeScript thuần, chạy trên JS thread, có unit test.
 */
import type { Contour, Grid } from './contour';
import { groupPeople, labelRegions } from './regions';

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
export function rasterizeContours(
  contours: Contour[],
  width: number,
  height: number,
): Float32Array {
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

/**
 * Dáng mọi người trong ảnh lúc tạo pose (kể cả người không được chọn), để cọ Thêm nhận ra người.
 * Lưới 0..1 cùng kích thước lưới sửa nét, chia sẵn thành từng người (regions.ts).
 */
export type BrushSource = {
  data: Float32Array;
  labels: Int32Array;
  /** Người của mỗi nhãn vùng (labels), -1 = nền hoặc mảng không gắn vào ai. */
  personOf: Int32Array;
  /** Số ô của từng người. */
  personArea: number[];
  /** Khung [x0, y0, x1, y1] của từng người, theo ô, x1/y1 không tính. */
  personBox: [number, number, number, number][];
};

export function brushSource(data: Float32Array, width: number, height: number): BrushSource {
  const l = labelRegions({ width, height, data });
  const people = groupPeople(l, MIN_PERSON_AREA);
  const personOf = new Int32Array(l.regions.length + 1).fill(-1);
  const personArea: number[] = [];
  const personBox: [number, number, number, number][] = [];
  people.forEach((p, k) => {
    let area = 0;
    const box: [number, number, number, number] = [width, height, 0, 0];
    for (const id of p.regionIds) {
      personOf[id] = k;
      const r = l.regions[id - 1]!;
      area += r.area;
      box[0] = Math.min(box[0], r.bbox[0]);
      box[1] = Math.min(box[1], r.bbox[1]);
      box[2] = Math.max(box[2], r.bbox[2]);
      box[3] = Math.max(box[3], r.bbox[3]);
    }
    personArea.push(area);
    personBox.push(box);
  });
  return { data, labels: l.labels, personOf, personArea, personBox };
}

/** Người = vùng từ 2% ảnh trở lên (BR-06), như lúc tạo pose. */
const MIN_PERSON_AREA = 0.02;
/** Nét có ít nhất chừng này phần nằm trên người (trong ảnh gốc) thì tính là tô lên người. */
const ON_PERSON = 0.25;
/** Người đang thiếu quá nửa mà nét tô lộ ra từ chừng này trở lên thì hiện cả người. */
const ABSENT = 0.5;
const REVEAL = 0.25;

/**
 * Áp một nét cọ lên lưới (sửa tại chỗ). Mép cọ khử răng cưa.
 *
 * Cọ Thêm có `source` (góp ý Phase 3):
 * - Nét nằm chủ yếu trên nền: nới viền đúng theo nét cọ.
 * - Nét nằm trên người: chỉ phần thuộc dáng người được tô lại (phần nền trong nét bỏ qua), nên tô
 *   lại vùng đã xóa thì viền theo đúng dáng người. Người đang thiếu (chưa chọn lúc tạo pose, hoặc đã
 *   xóa gần hết) mà nét tô lộ ra đủ nhiều thì hiện cả người đó.
 */
export function applyStroke(
  data: Float32Array,
  width: number,
  height: number,
  s: Stroke,
  source?: BrushSource,
) {
  const p = s.points;
  if (p.length < 2) return;
  const cov = new Float32Array(width * height);
  const step = Math.max(0.5, s.radius * 0.35);
  stamp(cov, width, height, p[0]!, p[1]!, s.radius);
  for (let i = 2; i + 1 < p.length; i += 2) {
    const ax = p[i - 2]!;
    const ay = p[i - 1]!;
    const bx = p[i]!;
    const by = p[i + 1]!;
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 1; k <= n; k++) {
      stamp(cov, width, height, ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n, s.radius);
    }
  }

  if (s.mode === 'erase') {
    for (let i = 0; i < cov.length; i++) if (cov[i]! > 0) data[i] = Math.min(data[i]!, 1 - cov[i]!);
    return;
  }
  if (!source || !onPerson(cov, source.data)) {
    for (let i = 0; i < cov.length; i++) if (cov[i]! > 0) data[i] = Math.max(data[i]!, cov[i]!);
    return;
  }

  const { labels, personOf, personArea } = source;
  const src = source.data;
  const n = personArea.length;
  const before = presentByPerson(data, labels, personOf, n);
  const touched = new Uint8Array(n);
  for (let i = 0; i < cov.length; i++) {
    const c = cov[i]!;
    if (c <= 0) continue;
    data[i] = Math.max(data[i]!, Math.min(c, src[i]!));
    const k = personOf[labels[i]!]!;
    if (k >= 0) touched[k] = 1;
  }
  const after = presentByPerson(data, labels, personOf, n);
  for (let k = 0; k < n; k++) {
    const area = personArea[k]!;
    if (touched[k] && before[k]! < ABSENT * area && after[k]! >= REVEAL * area) {
      revealPerson(data, width, height, source, k);
    }
  }
}

function onPerson(cov: Float32Array, src: Float32Array): boolean {
  let c = 0;
  let on = 0;
  for (let i = 0; i < cov.length; i++) {
    const v = cov[i]!;
    if (v <= 0) continue;
    c += v;
    on += v * src[i]!;
  }
  return c > 0 && on >= ON_PERSON * c;
}

/** Số ô đang là người (≥ 0.5) của từng người trong ảnh gốc. */
function presentByPerson(
  data: Float32Array,
  labels: Int32Array,
  personOf: Int32Array,
  n: number,
): number[] {
  const out = new Array<number>(n).fill(0);
  if (!n) return out;
  for (let i = 0; i < data.length; i++) {
    const id = labels[i]!;
    if (id === 0 || data[i]! < 0.5) continue;
    const k = personOf[id]!;
    if (k >= 0) out[k]!++;
  }
  return out;
}

/** Hiện cả người `k` theo dáng gốc, kể cả mép mềm sát người để viền dò lại vẫn mượt. */
function revealPerson(data: Float32Array, w: number, h: number, src: BrushSource, k: number) {
  const [bx0, by0, bx1, by1] = src.personBox[k]!;
  const x0 = Math.max(0, bx0 - 1);
  const y0 = Math.max(0, by0 - 1);
  const x1 = Math.min(w, bx1 + 1);
  const y1 = Math.min(h, by1 + 1);
  const owner = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return -1;
    const id = src.labels[y * w + x]!;
    return id === 0 ? -1 : src.personOf[id]!;
  };
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = y * w + x;
      const mine = owner(x, y) === k;
      let edge = false;
      if (!mine && src.labels[i] === 0) {
        for (let dy = -1; dy <= 1 && !edge; dy++) {
          for (let dx = -1; dx <= 1 && !edge; dx++) edge = owner(x + dx, y + dy) === k;
        }
      }
      if (mine || edge) data[i] = Math.max(data[i]!, src.data[i]!);
    }
  }
}

/** Một dấu cọ tròn lên lưới phủ (giữ giá trị lớn nhất). */
function stamp(cov: Float32Array, w: number, h: number, cx: number, cy: number, r: number) {
  const y0 = Math.max(0, Math.floor(cy - r - 1));
  const y1 = Math.min(h - 1, Math.ceil(cy + r + 1));
  const x0 = Math.max(0, Math.floor(cx - r - 1));
  const x1 = Math.min(w - 1, Math.ceil(cx + r + 1));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const cover = Math.min(1, Math.max(0, r + 0.5 - d));
      const i = y * w + x;
      if (cover > cov[i]!) cov[i] = cover;
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

  /**
   * @param source dáng mọi người trong ảnh lúc tạo pose, để cọ Thêm nhận ra người (`brushSource`).
   */
  constructor(
    base: Float32Array,
    readonly width: number,
    readonly height: number,
    private readonly limit = 30,
    private readonly source?: BrushSource,
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
    applyStroke(this.current, this.width, this.height, s, this.source);
    if (this.strokes.length > this.limit) {
      applyStroke(this.base, this.width, this.height, this.strokes.shift()!, this.source);
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
    applyStroke(this.current, this.width, this.height, s, this.source);
  }

  private replay() {
    this.current = this.base.slice();
    for (const s of this.strokes)
      applyStroke(this.current, this.width, this.height, s, this.source);
  }
}
