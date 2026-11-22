/**
 * Phase 5b: phần huấn luyện dùng chung cho scripts/p5b-train.mts (vòng 1–2) và p5b-train-r3.mts.
 * Softmax (+ một lớp ẩn ReLU) bằng Adam, cả bộ một lượt, phạt L2, trọng số lớp tùy chọn. Nhãn đích
 * là phân bố trên các lớp (một nhãn: one-hot; vòng 3 có thể chia cho hai nhãn).
 */
export type TrainSet = { ids: string[]; X: number[][]; T: number[][] };
export type Weight = 'none' | 'sqrt' | 'full';
export type FitConfig = { hidden: number; l2: number; weight: Weight; epochs: number; lr: number };
export type Norm = { mean: number[]; std: number[] };
/** Cùng dạng `TechniqueModel` của composition-critic, lớp là chuỗi bất kỳ. */
export type FitModel = {
  version: string;
  classes: string[];
  mean: number[];
  std: number[];
  hidden?: { W: number[][]; b: number[] };
  W: number[][];
  b: number[];
  threshold: number;
};

export const oneHot = (k: number, K: number) =>
  Array.from({ length: K }, (_, i) => (i === k ? 1 : 0));
const argmax = (t: number[]) => t.indexOf(Math.max(...t));

/** Chuẩn hóa từng chiều theo bộ huấn luyện. */
export function stats(X: number[][]): Norm {
  const D = X[0]!.length;
  const mean = new Array<number>(D).fill(0);
  const std = new Array<number>(D).fill(0);
  for (const x of X) for (let i = 0; i < D; i++) mean[i]! += x[i]! / X.length;
  for (const x of X) for (let i = 0; i < D; i++) std[i]! += (x[i]! - mean[i]!) ** 2 / X.length;
  return { mean, std: std.map((v) => Math.sqrt(v) || 1) };
}

// Xáo có seed.
let seed = 0x5b;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());

export function fit(set: TrainSet, cfg: FitConfig, norm: Norm, classes: string[]): FitModel {
  seed = 0x5b;
  const K = classes.length;
  const D = set.X[0]!.length;
  const X = set.X.map((x) => x.map((v, i) => (v - norm.mean[i]!) / norm.std[i]!));
  const N = X.length;
  const counts = new Array<number>(K).fill(0);
  for (const t of set.T) counts[argmax(t)]!++;
  const inv = (y: number) => N / (K * Math.max(1, counts[y]!));
  const w = set.T.map((t) => {
    const y = argmax(t);
    return cfg.weight === 'full' ? inv(y) : cfg.weight === 'sqrt' ? Math.sqrt(inv(y)) : 1;
  });
  const H = cfg.hidden;
  const In = H > 0 ? H : D;
  const W1 =
    H > 0
      ? Array.from({ length: H }, () => Array.from({ length: D }, () => gauss() * Math.sqrt(2 / D)))
      : [];
  const b1 = new Array<number>(H).fill(0);
  const W = Array.from({ length: K }, () => Array.from({ length: In }, () => gauss() * 0.01));
  const b = new Array<number>(K).fill(0);
  const params = [...W1, b1, ...W, b];
  const m = params.map((p) => new Array<number>(p.length).fill(0));
  const v = params.map((p) => new Array<number>(p.length).fill(0));
  const wsum = w.reduce((a, c) => a + c, 0);
  for (let ep = 1; ep <= cfg.epochs; ep++) {
    const gW1 = W1.map((r) => new Array<number>(r.length).fill(0));
    const gb1 = new Array<number>(H).fill(0);
    const gW = W.map((r) => new Array<number>(r.length).fill(0));
    const gb = new Array<number>(K).fill(0);
    for (let n = 0; n < N; n++) {
      const x = X[n]!;
      const h = H > 0 ? W1.map((r, j) => Math.max(0, dotp(r, x) + b1[j]!)) : x;
      const z = W.map((r, k) => dotp(r, h) + b[k]!);
      const mx = Math.max(...z);
      const e = z.map((c) => Math.exp(c - mx));
      const s = e.reduce((a, c) => a + c, 0);
      const t = set.T[n]!;
      const dz = e.map((c, k) => ((c / s - t[k]!) * w[n]!) / wsum);
      for (let k = 0; k < K; k++) {
        gb[k]! += dz[k]!;
        const row = gW[k]!;
        for (let i = 0; i < In; i++) row[i]! += dz[k]! * h[i]!;
      }
      if (H > 0) {
        for (let j = 0; j < H; j++) {
          if (h[j]! <= 0) continue;
          let dh = 0;
          for (let k = 0; k < K; k++) dh += dz[k]! * W[k]![j]!;
          gb1[j]! += dh;
          const row = gW1[j]!;
          for (let i = 0; i < D; i++) row[i]! += dh * x[i]!;
        }
      }
    }
    for (let k = 0; k < K; k++) for (let i = 0; i < In; i++) gW[k]![i]! += cfg.l2 * W[k]![i]!;
    for (let j = 0; j < H; j++) for (let i = 0; i < D; i++) gW1[j]![i]! += cfg.l2 * W1[j]![i]!;
    const grads = [...gW1, gb1, ...gW, gb];
    for (let p = 0; p < params.length; p++) {
      const P = params[p]!;
      const G = grads[p]!;
      for (let i = 0; i < P.length; i++) {
        m[p]![i] = 0.9 * m[p]![i]! + 0.1 * G[i]!;
        v[p]![i] = 0.999 * v[p]![i]! + 0.001 * G[i]! ** 2;
        const mh = m[p]![i]! / (1 - 0.9 ** ep);
        const vh = v[p]![i]! / (1 - 0.999 ** ep);
        P[i]! -= (cfg.lr * mh) / (Math.sqrt(vh) + 1e-8);
      }
    }
  }
  return {
    version: `p5b-${new Date().toISOString().slice(0, 10)}`,
    classes,
    mean: norm.mean,
    std: norm.std,
    ...(H > 0 ? { hidden: { W: W1, b: b1 } } : {}),
    W,
    b,
    threshold: 0,
  };
}

function dotp(a: number[], x: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i]! * x[i]!;
  return s;
}
