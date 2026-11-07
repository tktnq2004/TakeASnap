/**
 * Mask → đường viền vector (roadmap §3.4). TypeScript thuần, chạy trên JS thread, có unit test.
 *
 * 1. `downsampleMask`: thu mask về cạnh dài ≤ 512 để nhanh.
 * 2. `traceContours`: marching squares có nội suy, đoạn thẳng định hướng nhất quán (vùng người
 *    luôn nằm bên trái hướng đi), nên lỗ (khe tay–thân) có dấu diện tích ngược với đường bao ngoài.
 * 3. `buildContours`: bỏ mảng nhỏ, đơn giản hóa Douglas–Peucker, chuẩn hóa tọa độ về 0..1.
 * 4. `contoursToSvgPath`: làm mượt Catmull–Rom thành đường cong Bézier, ra chuỗi SVG cho Skia.
 *
 * Không dùng thư viện `marchingsquares` vì license AGPL-3.0.
 */

export type Point = { x: number; y: number };

/** Một đường khép kín. Tọa độ tính theo pixel (trace) hoặc chuẩn hóa 0..1 (build). */
export type Contour = { points: Point[]; isHole: boolean };

export type Grid = { width: number; height: number; data: ArrayLike<number> };

/** Thu nhỏ lưới bằng trung bình hộp để cạnh dài ≤ maxSide. Giá trị giữ nguyên thang đo. */
export function downsampleMask(mask: Grid, maxSide: number): Grid {
  const { width: w, height: h, data } = mask;
  const k = Math.max(w, h) / maxSide;
  if (k <= 1) return mask;
  const W = Math.max(1, Math.round(w / k));
  const H = Math.max(1, Math.round(h / k));
  const out = new Float32Array(W * H);
  for (let Y = 0; Y < H; Y++) {
    const y0 = Math.floor((Y * h) / H);
    const y1 = Math.max(y0 + 1, Math.floor(((Y + 1) * h) / H));
    for (let X = 0; X < W; X++) {
      const x0 = Math.floor((X * w) / W);
      const x1 = Math.max(x0 + 1, Math.floor(((X + 1) * w) / W));
      let s = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) s += data[y * w + x] as number;
      out[Y * W + X] = s / ((y1 - y0) * (x1 - x0));
    }
  }
  return { width: W, height: H, data: out };
}

/**
 * Marching squares. Mẫu (x, y) của lưới nằm ở tâm pixel (x + 0.5, y + 0.5). Lưới được đệm một
 * viền 0 ở bốn phía nên mọi đường đều khép kín, kể cả vùng chạm mép ảnh.
 */
export function traceContours(grid: Grid, threshold: number): Contour[] {
  const { width: w, height: h, data } = grid;
  const PW = w + 2; // lưới đệm
  const PH = h + 2;
  const v = (i: number, j: number): number =>
    i <= 0 || j <= 0 || i > w || j > h ? 0 : (data[(j - 1) * w + (i - 1)] as number);

  // Khóa duy nhất cho mỗi cạnh của lưới đệm: ngang (i,j)-(i+1,j) và dọc (i,j)-(i,j+1).
  const hKey = (i: number, j: number) => (j * PW + i) * 2;
  const vKey = (i: number, j: number) => (j * PW + i) * 2 + 1;

  // Điểm cắt trên cạnh p→q, nội suy tuyến tính, đổi về tọa độ pixel (bỏ đệm, cộng 0.5).
  const cross = (pi: number, pj: number, qi: number, qj: number): Point => {
    const vp = v(pi, pj);
    const vq = v(qi, qj);
    const t = vq === vp ? 0.5 : (threshold - vp) / (vq - vp);
    return { x: pi + t * (qi - pi) - 0.5, y: pj + t * (qj - pj) - 0.5 };
  };

  const next = new Map<number, number>(); // khóa cạnh vào → khóa cạnh ra
  const pointOf = new Map<number, Point>();

  for (let j = 0; j < PH - 1; j++) {
    for (let i = 0; i < PW - 1; i++) {
      // Bốn góc theo chiều kim đồng hồ trên màn hình (y hướng xuống): tl, tr, br, bl.
      const corners: [number, number][] = [
        [i, j],
        [i + 1, j],
        [i + 1, j + 1],
        [i, j + 1],
      ];
      const inside = corners.map(([a, b]) => v(a, b) >= threshold);
      if (inside.every((x) => x) || inside.every((x) => !x)) continue;

      // Cạnh theo chiều kim đồng hồ: top (tl→tr), right (tr→br), bottom (br→bl), left (bl→tl).
      const edgeKeys = [hKey(i, j), vKey(i + 1, j), hKey(i, j + 1), vKey(i, j)];
      const ins: number[] = [];
      const outs: number[] = [];
      for (let e = 0; e < 4; e++) {
        const p = e;
        const q = (e + 1) % 4;
        if (inside[p] === inside[q]) continue;
        const [pi, pj] = corners[p]!;
        const [qi, qj] = corners[q]!;
        const key = edgeKeys[e]!;
        if (!pointOf.has(key)) {
          // Luôn nội suy theo chiều cố định của cạnh để hai ô chung cạnh ra cùng một điểm.
          pointOf.set(key, e < 2 ? cross(pi, pj, qi, qj) : cross(qi, qj, pi, pj));
        }
        // Đi theo chiều kim đồng hồ: từ ngoài vào trong là điểm "vào", ngược lại là "ra".
        (inside[q] ? ins : outs).push(e);
      }

      if (ins.length === 1 && outs.length === 1) {
        next.set(edgeKeys[ins[0]!]!, edgeKeys[outs[0]!]!);
      } else {
        // Ô chéo (saddle): 4 điểm cắt xen kẽ vào/ra. Tâm ô thuộc người → hai góc người nối với
        // nhau, mỗi điểm vào đi tới điểm ra liền TRƯỚC; ngược lại đi tới điểm ra liền SAU.
        const center = (v(i, j) + v(i + 1, j) + v(i + 1, j + 1) + v(i, j + 1)) / 4;
        const connected = center >= threshold;
        for (const e of ins) {
          const o = connected ? (e + 3) % 4 : (e + 1) % 4;
          next.set(edgeKeys[e]!, edgeKeys[o]!);
        }
      }
    }
  }

  // Nối các đoạn thành đường khép kín.
  const loops: Point[][] = [];
  const visited = new Set<number>();
  for (const start of next.keys()) {
    if (visited.has(start)) continue;
    const loop: Point[] = [];
    let k: number | undefined = start;
    while (k !== undefined && !visited.has(k)) {
      visited.add(k);
      loop.push(pointOf.get(k)!);
      k = next.get(k);
    }
    if (loop.length >= 3) loops.push(loop);
  }

  // Vùng người nằm bên trái hướng đi → đường bao ngoài có diện tích có dấu âm (y hướng xuống),
  // lỗ có dấu dương.
  return loops.map((points) => ({ points, isHole: signedArea(points) > 0 }));
}

/** Diện tích có dấu (công thức shoelace). */
export function signedArea(points: Point[]): number {
  let s = 0;
  for (let i = 0, n = points.length; i < n; i++) {
    const a = points[i]!;
    const b = points[(i + 1) % n]!;
    s += a.x * b.y - b.x * a.y;
  }
  return s / 2;
}

/** Douglas–Peucker cho đường khép kín: tách tại điểm xa điểm đầu nhất rồi đơn giản từng nửa. */
export function simplifyClosed(points: Point[], epsilon: number): Point[] {
  if (points.length <= 4) return points;
  let far = 0;
  let best = -1;
  const p0 = points[0]!;
  for (let i = 1; i < points.length; i++) {
    const d = (points[i]!.x - p0.x) ** 2 + (points[i]!.y - p0.y) ** 2;
    if (d > best) {
      best = d;
      far = i;
    }
  }
  const a = simplifyOpen(points.slice(0, far + 1), epsilon);
  const b = simplifyOpen([...points.slice(far), p0], epsilon);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}

function simplifyOpen(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  let maxD = -1;
  let idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = distToSegment(points[i]!, first, last);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD <= epsilon) return [first, last];
  const left = simplifyOpen(points.slice(0, idx + 1), epsilon);
  const right = simplifyOpen(points.slice(idx), epsilon);
  return [...left.slice(0, -1), ...right];
}

function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export type BuildOptions = {
  /** Ngưỡng xác suất người (mask 0..1). */
  threshold?: number;
  /** Cạnh dài tối đa khi dò viền. */
  maxSide?: number;
  /** Bỏ đường bao ngoài nhỏ hơn tỉ lệ này của diện tích ảnh (mảng thừa của model). */
  minAreaRatio?: number;
  /** Bỏ lỗ nhỏ hơn tỉ lệ này (lỗ li ti trong vùng người). */
  minHoleRatio?: number;
  /** Sai số Douglas–Peucker, px ở độ phân giải dò viền. */
  epsilon?: number;
};

/**
 * Mask (0..1) → danh sách đường viền đã dọn và đơn giản hóa, tọa độ chuẩn hóa 0..1 theo kích
 * thước mask gốc (BR-06 kiểm tra diện tích người ở tầng trên).
 */
export function buildContours(mask: Grid, opts: BuildOptions = {}): Contour[] {
  const {
    threshold = 0.5,
    maxSide = 512,
    minAreaRatio = 0.002,
    minHoleRatio = 0.0005,
    epsilon = 0.75,
  } = opts;
  const g = downsampleMask(mask, maxSide);
  const total = g.width * g.height;
  return traceContours(g, threshold)
    .filter((c) => {
      const a = Math.abs(signedArea(c.points));
      return a >= (c.isHole ? minHoleRatio : minAreaRatio) * total;
    })
    .map((c) => ({
      isHole: c.isHole,
      points: simplifyClosed(c.points, epsilon).map((p) => ({
        x: round4(p.x / g.width),
        y: round4(p.y / g.height),
      })),
    }))
    .filter((c) => c.points.length >= 3);
}

function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}

/**
 * Đường viền chuẩn hóa → chuỗi SVG ở kích thước (width, height), làm mượt Catmull–Rom
 * (đường cong đi qua mọi điểm). Tô bằng fill rule evenOdd thì lỗ tự trống.
 */
export function contoursToSvgPath(contours: Contour[], width: number, height: number): string {
  const f = (v: number) => (Math.round(v * 100) / 100).toString();
  const parts: string[] = [];
  for (const c of contours) {
    const p = c.points.map((q) => ({ x: q.x * width, y: q.y * height }));
    const n = p.length;
    if (n < 3) continue;
    parts.push(`M${f(p[0]!.x)} ${f(p[0]!.y)}`);
    for (let i = 0; i < n; i++) {
      const p0 = p[(i - 1 + n) % n]!;
      const p1 = p[i]!;
      const p2 = p[(i + 1) % n]!;
      const p3 = p[(i + 2) % n]!;
      const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
      const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
      parts.push(`C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(p2.x)} ${f(p2.y)}`);
    }
    parts.push('Z');
  }
  return parts.join(' ');
}

/** Tỉ lệ diện tích người (đường bao ngoài trừ lỗ) trên ảnh, theo tọa độ chuẩn hóa (BR-06). */
export function personAreaRatio(contours: Contour[]): number {
  let s = 0;
  for (const c of contours) s += (c.isHole ? -1 : 1) * Math.abs(signedArea(c.points));
  return Math.max(0, s);
}
