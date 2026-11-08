/**
 * Ống tay, ống chân (góp ý sau Phase 1): mỗi tay/chân có HAI nét dọc hai bên, như viền, để thấy
 * tay chân cả khi chúng nằm đè lên thân (lúc đó viền ngoài không có nét nào).
 *
 * Cách làm, chạy trên mask (lưới 0..1) + 33 khớp của PoseLandmarker:
 * 1. Đi dọc từng chuỗi khớp (vai → khuỷu → cổ tay → đầu bàn tay; hông → gối → cổ chân → mũi chân),
 *    mỗi bước ~3% thước đo cơ thể.
 * 2. Tại mỗi điểm, bắn tia vuông góc sang hai bên trong mask.
 *    - Tia gặp mép bóng người gần (≤ 1.5 × bề rộng dự kiến): phía đó đã có viền ngoài → KHÔNG vẽ,
 *      nhưng ghi lại bề rộng đo được.
 *    - Tia đi sâu vào thân: tay/chân đang nằm trên người → VẼ ở bề rộng của phía bên kia nếu đo
 *      được, không thì theo tỉ lệ cơ thể.
 * 3. Làm mượt bề rộng, bỏ các đoạn vẽ quá ngắn, nối thành các nét; khép đầu bàn tay/bàn chân.
 *
 * TypeScript thuần (chạy được trong app lẫn script Node), có unit test.
 */
import type { Grid, Point } from './contour';

export type BodyPoint = { x: number; y: number; v: number };

/** Mảng phẳng [x, y, visibility, …] (33 khớp) → điểm. */
export function unpackBodyPoints(flat: number[]): BodyPoint[] {
  const out: BodyPoint[] = [];
  for (let i = 0; i + 2 < flat.length; i += 3) {
    out.push({ x: flat[i]!, y: flat[i + 1]!, v: flat[i + 2]! });
  }
  return out;
}

type Chain = {
  /** Chỉ số khớp MediaPipe; số âm = điểm đầu bàn tay/bàn chân tính riêng. */
  joints: number[];
  /** Nửa bề rộng dự kiến tại mỗi khớp, theo thước đo cơ thể S. */
  half: number[];
  tip: 'hand-left' | 'hand-right' | 'foot-left' | 'foot-right';
};

// Tỉ lệ nửa bề rộng / S (S ≈ bề rộng vai), ước lượng từ tỉ lệ cơ thể người lớn.
const CHAINS: Chain[] = [
  { joints: [11, 13, 15], half: [0.16, 0.12, 0.09, 0.06], tip: 'hand-left' },
  { joints: [12, 14, 16], half: [0.16, 0.12, 0.09, 0.06], tip: 'hand-right' },
  { joints: [23, 25, 27], half: [0.24, 0.16, 0.1, 0.07], tip: 'foot-left' },
  { joints: [24, 26, 28], half: [0.24, 0.16, 0.1, 0.07], tip: 'foot-right' },
];

export type LimbOptions = {
  /** Bỏ khớp có visibility thấp hơn ngưỡng (bị che, ngoài khung). */
  minVisibility?: number;
  /** Bước đi dọc xương, theo S. */
  stepRatio?: number;
  /** Tia gặp mép trong (edgeTol × bề rộng dự kiến) → phía đó đã có viền ngoài. */
  edgeTol?: number;
  /** Bỏ đoạn vẽ ngắn hơn số điểm này (tránh nét lấm tấm). */
  minRun?: number;
  /** Lấp khe không vẽ ngắn hơn hoặc bằng số điểm này giữa hai đoạn vẽ (tránh nét đứt). */
  maxGap?: number;
  /**
   * Ảnh xám 0..1, CÙNG kích thước mask. Có thì nét bám vào mép thật trong ảnh (chỗ đổi độ sáng
   * mạnh nhất quanh bề rộng ước lượng), không thì đi theo bề rộng ước lượng.
   */
  image?: Grid;
};

/**
 * Trả về các nét (tọa độ chuẩn hóa 0..1) cần vẽ thêm để thấy hình ống tay/chân.
 * Rỗng nếu mọi tay chân đã nằm ngoài thân (viền ngoài đã đủ).
 */
export function buildLimbOutlines(
  mask: Grid,
  bodyPoints: BodyPoint[],
  opts: LimbOptions = {},
): Point[][] {
  const {
    minVisibility = 0.5,
    stepRatio = 0.03,
    edgeTol = 1.5,
    minRun = 4,
    maxGap = 2,
    image,
  } = opts;
  const W = mask.width;
  const H = mask.height;
  const grad = image && image.width === W && image.height === H ? sobel(image) : null;
  const gradAt = (x: number, y: number) => {
    if (!grad) return 0;
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= W || iy >= H) return 0;
    return grad[iy * W + ix]!;
  };
  const at = (x: number, y: number) => {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= W || iy >= H) return 0;
    return mask.data[iy * W + ix] as number;
  };
  const P = (i: number): Point | null => {
    const b = bodyPoints[i];
    return b && b.v >= minVisibility ? { x: b.x * W, y: b.y * H } : null;
  };
  const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

  // Thước đo cơ thể: bề rộng vai, hoặc theo chiều dài thân khi đứng nghiêng (vai co lại).
  const ls = P(11);
  const rs = P(12);
  const lh = P(23);
  const rh = P(24);
  if (!ls || !rs) return [];
  const torso = lh && rh ? dist(mid(ls, rs), mid(lh, rh)) : 0;
  const S = Math.max(dist(ls, rs), 0.6 * torso, 4);

  const tipPoint = (tip: Chain['tip'], end: Point): Point | null => {
    // Đầu bàn tay: kéo dài cổ tay → trung điểm ngón trỏ/út. Mũi chân: điểm mũi chân.
    const [a, b] =
      tip === 'hand-left'
        ? [17, 19]
        : tip === 'hand-right'
          ? [18, 20]
          : tip === 'foot-left'
            ? [31, 31]
            : [32, 32];
    const pa = P(a);
    const pb = P(b);
    if (!pa || !pb) return null;
    const m = mid(pa, pb);
    const k = tip.startsWith('hand') ? 1.3 : 1;
    return { x: end.x + (m.x - end.x) * k, y: end.y + (m.y - end.y) * k };
  };

  const out: Point[][] = [];

  for (const chain of CHAINS) {
    const pts: Point[] = [];
    for (const j of chain.joints) {
      const p = P(j);
      if (!p) break;
      pts.push(p);
    }
    if (pts.length < 2) continue;
    const half = chain.half.slice(0, pts.length).map((r) => r * S);
    let hasTip = false;
    if (pts.length === chain.joints.length) {
      const tip = tipPoint(chain.tip, pts[pts.length - 1]!);
      if (tip && dist(tip, pts[pts.length - 1]!) > 1) {
        pts.push(tip);
        half.push(chain.half[chain.half.length - 1]! * S);
        hasTip = true;
      }
    }

    // 1. Lấy mẫu dọc xương.
    type Sample = { p: Point; n: Point; w: number; dl: number; dr: number };
    const samples: Sample[] = [];
    const step = Math.max(1, stepRatio * S);
    for (let s = 0; s < pts.length - 1; s++) {
      const a = pts[s]!;
      const b = pts[s + 1]!;
      const len = dist(a, b);
      if (len < 1e-6) continue;
      const t = { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
      const n = { x: -t.y, y: t.x };
      const count = Math.max(1, Math.round(len / step));
      for (let k = 0; k < count; k++) {
        const u = k / count;
        const p = { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
        const w = half[s]! + (half[s + 1]! - half[s]!) * u;
        samples.push({ p, n, w, dl: ray(p, n, w), dr: ray(p, { x: -n.x, y: -n.y }, w) });
      }
    }
    if (samples.length < minRun) continue;

    // 2. Mỗi phía: vẽ hay không, và vẽ ở bề rộng nào.
    const sideOf = (side: 'l' | 'r') => {
      const sgn = side === 'l' ? 1 : -1;
      const info = samples.map((s) => {
        const mine = side === 'l' ? s.dl : s.dr;
        const other = side === 'l' ? s.dr : s.dl;
        const tol = edgeTol * s.w;
        const draw = mine > tol;
        const width = draw ? (other <= tol ? Math.max(other, 0.5 * s.w) : s.w) : mine;
        return { draw, width };
      });
      // Lấp khe ngắn giữa hai đoạn vẽ để nét không đứt quãng.
      for (let i = 0; i < info.length; i++) {
        if (info[i]!.draw) continue;
        let j = i;
        while (j < info.length && !info[j]!.draw) j++;
        if (i > 0 && j < info.length && j - i <= maxGap) {
          for (let k = i; k < j; k++) info[k] = { draw: true, width: samples[k]!.w };
        }
        i = j;
      }
      // Bám mép thật: quanh bề rộng ước lượng, tìm chỗ ảnh đổi độ sáng mạnh nhất; phạt việc
      // nhảy xa so với điểm trước để nét liền mạch.
      if (grad) {
        let prev: number | null = null;
        for (let i = 0; i < info.length; i++) {
          const it = info[i]!;
          if (!it.draw) {
            prev = null;
            continue;
          }
          const s = samples[i]!;
          let best = it.width;
          let bestScore = 0.12; // dưới ngưỡng này coi như không có mép rõ → giữ ước lượng
          for (let k = 0.6 * it.width; k <= 1.5 * it.width; k += 0.5) {
            const g = gradAt(s.p.x + sgn * s.n.x * k, s.p.y + sgn * s.n.y * k);
            const jump = prev === null ? 0 : Math.abs(k - prev) / s.w;
            const score = g - 0.5 * jump;
            if (score > bestScore) {
              bestScore = score;
              best = k;
            }
          }
          it.width = best;
          prev = best;
        }
      }
      return info;
    };
    const sides = { l: sideOf('l'), r: sideOf('r') };
    for (const side of ['l', 'r'] as const) {
      const sgn = side === 'l' ? 1 : -1;
      const info = sides[side];
      const widths = smooth(
        info.map((i) => i.width),
        grad ? 4 : 2,
      );
      let run: Point[] = [];
      const flush = () => {
        if (run.length >= minRun) out.push(run);
        run = [];
      };
      for (let i = 0; i < samples.length; i++) {
        if (!info[i]!.draw) {
          flush();
          continue;
        }
        const s = samples[i]!;
        run.push({ x: s.p.x + sgn * s.n.x * widths[i]!, y: s.p.y + sgn * s.n.y * widths[i]! });
      }
      flush();
    }

    // 3. Khép đầu bàn tay/bàn chân khi cả hai phía ở đó đều đang vẽ (nằm trên thân). Chuỗi bị
    // cắt giữa chừng (khớp bị che) thì không khép, tránh nắp tròn ở đầu gối/khuỷu tay.
    const lastL = sides.l.at(-1);
    const lastR = sides.r.at(-1);
    const last = samples.at(-1)!;
    const end = pts.at(-1)!;
    if (hasTip && lastL?.draw && lastR?.draw) {
      const w = (lastL.width + lastR.width) / 2;
      const arc: Point[] = [];
      const t = { x: last.n.y, y: -last.n.x }; // hướng xương (từ n quay ngược 90°)
      for (let k = 0; k <= 6; k++) {
        const a = (k / 6) * Math.PI;
        const c = Math.cos(a);
        const s = Math.sin(a);
        arc.push({
          x: end.x + last.n.x * w * c + t.x * w * s,
          y: end.y + last.n.y * w * c + t.y * w * s,
        });
      }
      out.push(arc);
    }
  }

  return out.map((line) => line.map((p) => ({ x: round4(p.x / W), y: round4(p.y / H) })));

  // Khoảng cách từ p theo hướng d tới chỗ mask < 0.5, tối đa 3 × w (không gặp = Infinity).
  function ray(p: Point, d: Point, w: number): number {
    if (at(p.x, p.y) < 0.5) return 0; // xương lệch ra ngoài bóng người: coi như mép
    const cap = 3 * w;
    for (let k = 0.5; k <= cap; k += 0.5) {
      if (at(p.x + d.x * k, p.y + d.y * k) < 0.5) return k;
    }
    return Infinity;
  }
}

/** Độ lớn gradient Sobel của ảnh xám 0..1 (mép trong ảnh), cùng kích thước. */
function sobel(img: Grid): Float32Array {
  const { width: w, height: h, data } = img;
  const g = new Float32Array(w * h);
  const v = (x: number, y: number) =>
    data[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))] as number;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const gx =
        v(x + 1, y - 1) +
        2 * v(x + 1, y) +
        v(x + 1, y + 1) -
        v(x - 1, y - 1) -
        2 * v(x - 1, y) -
        v(x - 1, y + 1);
      const gy =
        v(x - 1, y + 1) +
        2 * v(x, y + 1) +
        v(x + 1, y + 1) -
        v(x - 1, y - 1) -
        2 * v(x, y - 1) -
        v(x + 1, y - 1);
      g[y * w + x] = Math.hypot(gx, gy) / 4;
    }
  return g;
}

function smooth(values: number[], radius: number): number[] {
  return values.map((_, i) => {
    let s = 0;
    let n = 0;
    for (let k = i - radius; k <= i + radius; k++) {
      const v = values[k];
      if (v !== undefined && Number.isFinite(v)) {
        s += v;
        n++;
      }
    }
    return n ? s / n : (values[i] ?? 0);
  });
}

function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}
