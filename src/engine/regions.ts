/**
 * Tách mask thành từng người (business-flow §5.1, Phase 3). Model chỉ phân biệt người / nền, không
 * phân biệt từng người, nên mỗi vùng liền nhau trên mask được coi là một người. Hai người chạm
 * nhau thì thành một vùng: giới hạn đã biết, ghi ở business-flow §5.1.
 *
 * TypeScript thuần, chạy trên JS thread, có unit test.
 */
import type { Grid } from './contour';

export type Region = {
  /** Nhãn trong `labels`, bắt đầu từ 1 (0 = nền). */
  id: number;
  /** Số ô của vùng. */
  area: number;
  /** [x0, y0, x1, y1] theo ô lưới, x1/y1 không tính. */
  bbox: [number, number, number, number];
};

export type Labeling = {
  width: number;
  height: number;
  labels: Int32Array;
  regions: Region[];
};

/** Gán nhãn vùng liền nhau (8 hướng) cho mọi ô có giá trị ≥ threshold. */
export function labelRegions(grid: Grid, threshold = 0.5): Labeling {
  const { width: w, height: h, data } = grid;
  const labels = new Int32Array(w * h);
  const regions: Region[] = [];
  const stack = new Int32Array(w * h);
  let next = 1;

  for (let start = 0; start < w * h; start++) {
    if (labels[start] !== 0 || (data[start] as number) < threshold) continue;
    const id = next++;
    let top = 0;
    stack[top++] = start;
    labels[start] = id;
    let area = 0;
    let x0 = w;
    let y0 = h;
    let x1 = 0;
    let y1 = 0;
    while (top > 0) {
      const i = stack[--top]!;
      const x = i % w;
      const y = (i - x) / w;
      area++;
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x + 1 > x1) x1 = x + 1;
      if (y + 1 > y1) y1 = y + 1;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if ((dx === 0 && dy === 0) || nx < 0 || nx >= w) continue;
          const j = ny * w + nx;
          if (labels[j] !== 0 || (data[j] as number) < threshold) continue;
          labels[j] = id;
          stack[top++] = j;
        }
      }
    }
    regions.push({ id, area, bbox: [x0, y0, x1, y1] });
  }
  return { width: w, height: h, labels, regions };
}

export type Person = {
  /** Vùng chính và các mảng nhỏ gắn vào (tay rời, tóc, mảng thừa của model). */
  regionIds: number[];
  /** Tỉ lệ diện tích trên cả ảnh. */
  areaRatio: number;
  /** Khung của vùng chính, theo ô lưới. */
  bbox: [number, number, number, number];
};

/**
 * Người = vùng chiếm ít nhất `minPersonRatio` diện tích ảnh (BR-06). Vùng nhỏ hơn gắn vào người
 * có khung gần nhất. Xếp từ trái sang phải để thứ tự hiển thị ổn định.
 */
export function groupPeople(l: Labeling, minPersonRatio: number): Person[] {
  const total = l.width * l.height;
  const main = l.regions.filter((r) => r.area >= minPersonRatio * total);
  if (!main.length) {
    // Người bị che thành nhiều mảng nhỏ: không mảng nào đủ lớn nhưng cộng lại đủ → một người.
    const area = l.regions.reduce((s, r) => s + r.area, 0);
    if (area < minPersonRatio * total) return [];
    const bbox = l.regions.reduce<[number, number, number, number]>(
      (b, r) => [
        Math.min(b[0], r.bbox[0]),
        Math.min(b[1], r.bbox[1]),
        Math.max(b[2], r.bbox[2]),
        Math.max(b[3], r.bbox[3]),
      ],
      [l.width, l.height, 0, 0],
    );
    return [{ regionIds: l.regions.map((r) => r.id), areaRatio: area / total, bbox }];
  }
  const people = main
    .map((r) => ({ regionIds: [r.id], area: r.area, bbox: r.bbox }))
    .sort((a, b) => a.bbox[0] + a.bbox[2] - (b.bbox[0] + b.bbox[2]));
  for (const r of l.regions) {
    if (r.area >= minPersonRatio * total) continue;
    const cx = (r.bbox[0] + r.bbox[2]) / 2;
    const cy = (r.bbox[1] + r.bbox[3]) / 2;
    let best = people[0]!;
    let bestD = Infinity;
    for (const p of people) {
      const d = distToBox(cx, cy, p.bbox);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    best.regionIds.push(r.id);
    best.area += r.area;
  }
  return people.map((p) => ({ regionIds: p.regionIds, areaRatio: p.area / total, bbox: p.bbox }));
}

function distToBox(x: number, y: number, b: [number, number, number, number]): number {
  const dx = Math.max(b[0] - x, 0, x - b[2]);
  const dy = Math.max(b[1] - y, 0, y - b[3]);
  return Math.hypot(dx, dy);
}

/**
 * Mask chỉ còn những người đã chọn. Ô dưới ngưỡng (mép mềm) giữ giá trị nếu nằm sát vùng được
 * giữ, để viền nội suy vẫn mượt như mask gốc.
 */
export function maskForPeople(grid: Grid, l: Labeling, people: Person[]): Grid {
  const keep = new Set(people.flatMap((p) => p.regionIds));
  const { width: w, height: h } = l;
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const id = l.labels[i]!;
      if (id !== 0) {
        if (keep.has(id)) out[i] = grid.data[i] as number;
        continue;
      }
      if (nearKept(l, keep, x, y)) out[i] = grid.data[i] as number;
    }
  }
  return { width: w, height: h, data: out };
}

function nearKept(l: Labeling, keep: Set<number>, x: number, y: number): boolean {
  for (let dy = -1; dy <= 1; dy++) {
    const ny = y + dy;
    if (ny < 0 || ny >= l.height) continue;
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      if (nx < 0 || nx >= l.width) continue;
      if (keep.has(l.labels[ny * l.width + nx]!)) return true;
    }
  }
  return false;
}

/**
 * Người tại điểm chạm (tọa độ ô lưới). Chạm hụt sát mép người vẫn tính: tìm ô người gần nhất
 * trong bán kính `slop` ô.
 */
export function personAt(
  l: Labeling,
  people: Person[],
  x: number,
  y: number,
  slop: number,
): number | null {
  let best: number | null = null;
  let bestD = Infinity;
  const r = Math.ceil(slop);
  for (let dy = -r; dy <= r; dy++) {
    const ny = Math.round(y) + dy;
    if (ny < 0 || ny >= l.height) continue;
    for (let dx = -r; dx <= r; dx++) {
      const nx = Math.round(x) + dx;
      if (nx < 0 || nx >= l.width) continue;
      const id = l.labels[ny * l.width + nx]!;
      if (id === 0) continue;
      const d = dx * dx + dy * dy;
      if (d > slop * slop || d >= bestD) continue;
      const idx = people.findIndex((p) => p.regionIds.includes(id));
      if (idx < 0) continue;
      best = idx;
      bestD = d;
    }
  }
  return best;
}

/**
 * Nét mặt chỉ giữ đoạn có trung điểm nằm trên (hoặc sát) người đã chọn: ảnh nhiều người có thể có
 * mặt của người không được chọn. Tọa độ đoạn chuẩn hóa 0..1. Không còn đoạn nào → null.
 */
export function keepSegmentsOnPeople(
  segments: number[] | null,
  l: Labeling,
  people: Person[],
  slop: number,
): number[] | null {
  if (!segments) return null;
  const out: number[] = [];
  for (let i = 0; i + 3 < segments.length; i += 4) {
    const mx = ((segments[i]! + segments[i + 2]!) / 2) * l.width;
    const my = ((segments[i + 1]! + segments[i + 3]!) / 2) * l.height;
    if (personAt(l, people, mx, my, slop) != null) {
      out.push(segments[i]!, segments[i + 1]!, segments[i + 2]!, segments[i + 3]!);
    }
  }
  return out.length ? out : null;
}

/** Khung xương giữ lại khi đa số khớp nhìn thấy nằm trên người đã chọn. */
export function keepBodyOnPeople(
  points: number[] | null,
  l: Labeling,
  people: Person[],
  slop: number,
): number[] | null {
  if (!points) return null;
  let seen = 0;
  let inside = 0;
  for (let i = 0; i + 2 < points.length; i += 3) {
    if (points[i + 2]! < 0.5) continue;
    seen++;
    if (personAt(l, people, points[i]! * l.width, points[i + 1]! * l.height, slop) != null) {
      inside++;
    }
  }
  return seen > 0 && inside * 2 > seen ? points : null;
}
