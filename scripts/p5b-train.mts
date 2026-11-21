/**
 * Phase 5b, Bước 2: huấn luyện lớp phân loại kỹ thuật (1/3, ở giữa, lấp đầy, nhóm, khác) trên
 * vector ảnh + đặc trưng người, chọn cấu hình theo bộ kiểm tra, chấm một lần trên bộ giữ riêng.
 *
 *   node scripts/p5b-train.mts
 *
 * Đọc eval/composition/{features,labels-claude,labels-review,split}.json. Ghi
 * eval/composition/technique-model.json (model, không commit) và train-report.md.
 *
 * Nhãn huấn luyện: nhãn đầu tiên của Claude nằm trong 5 lớp (ảnh chỉ có chân trời / đường dẫn bị
 * bỏ: bộ dò Phase 5a chọn hai kỹ thuật này). Chấm bộ giữ riêng theo nhãn người duyệt
 * (docs/phase5b-data.md): đúng khi lựa chọn đầu nằm trong các nhãn người chọn; ảnh người chỉ chọn
 * chân trời / đường dẫn không tính.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA = path.join(ROOT, 'eval', 'composition');
const CRITIC_DIR =
  process.env.COMPOSITION_CRITIC_DIR ?? path.resolve(ROOT, '../composition-critic');
const critic = async <T,>(file: string) =>
  (await import(pathToFileURL(path.join(CRITIC_DIR, file)).href)) as T;
const { featuresOf } =
  await critic<typeof import('composition-critic/node')>('src/node/analyzer.ts');
const { TECHNIQUE_CLASSES, techniqueInput, predictTechnique } =
  await critic<typeof import('composition-critic')>('src/technique.ts');
type TechniqueModel = import('composition-critic').TechniqueModel;
type Raw = import('composition-critic/node').Raw;

const read = <T,>(f: string) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')) as T;
const raws = read<Record<string, Raw>>('features.json');
const claude = read<Record<string, string[]>>('labels-claude.json');
const review = read<Record<string, string[]>>('labels-review.json');
const split = read<{ train: string[]; val: string[]; holdout: string[] }>('split.json');
const CLASSES = [...TECHNIQUE_CLASSES] as string[];
const K = CLASSES.length;

const input = (id: string) => {
  const r = raws[id];
  if (!r?.embedding) return null;
  return techniqueInput(featuresOf(r), r.embedding);
};
const target = (labels: string[] | undefined) => {
  const l = labels?.find((x) => CLASSES.includes(x));
  return l === undefined ? -1 : CLASSES.indexOf(l);
};

type Set = { ids: string[]; X: number[][]; y: number[] };
const build = (ids: string[], labelsOf: (id: string) => string[] | undefined): Set => {
  const out: Set = { ids: [], X: [], y: [] };
  for (const id of ids) {
    const x = input(id);
    const y = target(labelsOf(id));
    if (!x || y < 0) continue;
    out.ids.push(id);
    out.X.push(x);
    out.y.push(y);
  }
  return out;
};
const train = build(split.train, (id) => claude[id]);
const val = build(split.val, (id) => claude[id]);
const D = train.X[0]!.length;
console.log(`huấn luyện ${train.X.length}, kiểm tra ${val.X.length}, ${D} chiều`);

// Chuẩn hóa theo bộ huấn luyện.
const stats = (X: number[][]) => {
  const mean = new Array<number>(D).fill(0);
  const std = new Array<number>(D).fill(0);
  for (const x of X) for (let i = 0; i < D; i++) mean[i]! += x[i]! / X.length;
  for (const x of X) for (let i = 0; i < D; i++) std[i]! += (x[i]! - mean[i]!) ** 2 / X.length;
  return { mean, std: std.map((v) => Math.sqrt(v) || 1) };
};

// Xáo có seed.
let seed = 0x5b;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());

type Config = { hidden: number; l2: number; balanced: boolean; epochs: number; lr: number };

/** Softmax (+ một lớp ẩn ReLU) bằng Adam, cả bộ một lượt, phạt L2, trọng số lớp tùy chọn. */
function fit(set: Set, cfg: Config, norm: { mean: number[]; std: number[] }): TechniqueModel {
  seed = 0x5b;
  const X = set.X.map((x) => x.map((v, i) => (v - norm.mean[i]!) / norm.std[i]!));
  const N = X.length;
  const counts = new Array<number>(K).fill(0);
  for (const y of set.y) counts[y]!++;
  const w = set.y.map((y) => (cfg.balanced ? N / (K * Math.max(1, counts[y]!)) : 1));
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
  for (let ep = 1; ep <= cfg.epochs; ep++) {
    const gW1 = W1.map((r) => new Array<number>(r.length).fill(0));
    const gb1 = new Array<number>(H).fill(0);
    const gW = W.map((r) => new Array<number>(r.length).fill(0));
    const gb = new Array<number>(K).fill(0);
    const wsum = w.reduce((a, c) => a + c, 0);
    for (let n = 0; n < N; n++) {
      const x = X[n]!;
      const h = H > 0 ? W1.map((r, j) => Math.max(0, dotp(r, x) + b1[j]!)) : x;
      const z = W.map((r, k) => dotp(r, h) + b[k]!);
      const mx = Math.max(...z);
      const e = z.map((c) => Math.exp(c - mx));
      const s = e.reduce((a, c) => a + c, 0);
      const dz = e.map((c, k) => ((c / s - (k === set.y[n] ? 1 : 0)) * w[n]!) / wsum);
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
    classes: CLASSES as TechniqueModel['classes'],
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

/** Độ đúng: lựa chọn đầu nằm trong nhãn của ảnh (`labelsOf`), và hai lựa chọn đầu. */
function score(model: TechniqueModel, set: Set, labelsOf: (id: string) => string[]) {
  let top1 = 0;
  let top2 = 0;
  let strict = 0;
  const confusion = CLASSES.map(() => new Array<number>(K).fill(0));
  set.X.forEach((x, n) => {
    const g = predictTechnique(model, x);
    const ok = labelsOf(set.ids[n]!);
    if (ok.includes(g[0]!.technique)) top1++;
    if (ok.includes(g[0]!.technique) || ok.includes(g[1]!.technique)) top2++;
    if (g[0]!.technique === CLASSES[set.y[n]!]) strict++;
    confusion[set.y[n]!]![CLASSES.indexOf(g[0]!.technique)]!++;
  });
  const N = set.X.length;
  return { top1: top1 / N, top2: top2 / N, strict: strict / N, confusion, N };
}

const norm = stats(train.X);
const configs: Config[] = [];
for (const hidden of [0, 64])
  for (const l2 of [1e-3, 1e-2, 5e-2])
    for (const balanced of [false, true])
      configs.push({ hidden, l2, balanced, epochs: 300, lr: 0.003 });

const claudeSet = (id: string) => claude[id] ?? [];
const results = configs.map((cfg) => {
  const t0 = Date.now();
  const model = fit(train, cfg, norm);
  const s = score(model, val, claudeSet);
  console.log(
    `hidden ${cfg.hidden} l2 ${cfg.l2} balanced ${cfg.balanced}: kiểm tra top1 ${(100 * s.top1).toFixed(1)}% top2 ${(100 * s.top2).toFixed(1)}% (${((Date.now() - t0) / 1000).toFixed(0)} s)`,
  );
  return { cfg, s };
});
const best = results.sort((a, b) => b.s.top1 + 0.5 * b.s.top2 - (a.s.top1 + 0.5 * a.s.top2))[0]!;
console.log('chọn', best.cfg);

// Ngưỡng tin cậy trên bộ kiểm tra: thấp nhất mà các ảnh được đoán đúng ≥ 85%, vẫn đoán ≥ 50% ảnh.
const bestModel = fit(train, best.cfg, norm);
const curve: { t: number; cover: number; acc: number }[] = [];
for (const t of [0, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]) {
  let n = 0;
  let ok = 0;
  val.X.forEach((x, i) => {
    const g = predictTechnique(bestModel, x)[0]!;
    if (g.p < t) return;
    n++;
    if (claudeSet(val.ids[i]!).includes(g.technique)) ok++;
  });
  curve.push({ t, cover: n / val.X.length, acc: n ? ok / n : 0 });
}
const pick = curve.find((c) => c.acc >= 0.85 && c.cover >= 0.5) ?? curve[0]!;

// Model cuối: huấn luyện lại trên huấn luyện + kiểm tra với cấu hình đã chọn.
const all: Set = {
  ids: [...train.ids, ...val.ids],
  X: [...train.X, ...val.X],
  y: [...train.y, ...val.y],
};
const finalModel = { ...fit(all, best.cfg, stats(all.X)), threshold: pick.t };

// Bộ giữ riêng: nhãn người duyệt, chấm một lần.
const reviewed = (id: string) => review[id] ?? [];
const hold = build(
  split.holdout.filter((id) => review[id]),
  reviewed,
);
const skipped = split.holdout.filter((id) => review[id] && target(review[id]) < 0).length;
const h = score(finalModel, hold, reviewed);
let covered = 0;
let coveredOk = 0;
hold.X.forEach((x, i) => {
  const g = predictTechnique(finalModel, x)[0]!;
  if (g.p < finalModel.threshold) return;
  covered++;
  if (reviewed(hold.ids[i]!).includes(g.technique)) coveredOk++;
});

const pct = (v: number) => `${(100 * v).toFixed(1)}%`;
const report = [
  `# Phase 5b — huấn luyện ${new Date().toISOString().slice(0, 10)}`,
  '',
  `Đầu vào ${D} chiều (vector ảnh MobileNetV3 small + 19 đặc trưng người). Huấn luyện ${train.X.length} + kiểm tra ${val.X.length} ảnh (nhãn Claude), giữ riêng ${hold.X.length} ảnh (nhãn người duyệt; ${skipped} ảnh người chỉ chọn chân trời / đường dẫn không tính).`,
  '',
  '## Chọn cấu hình (bộ kiểm tra)',
  '',
  '| Lớp ẩn | L2 | Cân lớp | Top-1 | Top-2 |',
  '|---|---|---|---|---|',
  ...results.map(
    (r) =>
      `| ${r.cfg.hidden || '—'} | ${r.cfg.l2} | ${r.cfg.balanced ? 'có' : 'không'} | ${pct(r.s.top1)} | ${pct(r.s.top2)} |`,
  ),
  '',
  `Chọn: lớp ẩn ${best.cfg.hidden || 'không'}, L2 ${best.cfg.l2}, cân lớp ${best.cfg.balanced ? 'có' : 'không'}. Model cuối huấn luyện lại trên huấn luyện + kiểm tra.`,
  '',
  '## Ngưỡng tin cậy (bộ kiểm tra)',
  '',
  '| Ngưỡng | Đoán trên | Đúng khi đoán |',
  '|---|---|---|',
  ...curve.map((c) => `| ${c.t} | ${pct(c.cover)} | ${pct(c.acc)} |`),
  '',
  `Chọn ngưỡng ${pick.t}.`,
  '',
  '## Bộ giữ riêng (cổng)',
  '',
  '| | Kết quả | Cổng |',
  '|---|---|---|',
  `| Lựa chọn đầu nằm trong nhãn người chọn | **${pct(h.top1)}** | ≥ 70% |`,
  `| Hai lựa chọn đầu có nhãn người chọn | **${pct(h.top2)}** | hoặc ≥ 85% |`,
  `| Lựa chọn đầu trùng nhãn đầu người chọn (chặt) | ${pct(h.strict)} | — |`,
  `| Trên ngưỡng ${finalModel.threshold}: đoán / đúng | ${pct(covered / hold.X.length)} / ${pct(covered ? coveredOk / covered : 0)} | — |`,
  '',
  'Ma trận nhầm lẫn (hàng: nhãn đầu người chọn, cột: model đoán):',
  '',
  `| | ${CLASSES.join(' | ')} |`,
  `|---|${CLASSES.map(() => '---').join('|')}|`,
  ...h.confusion.map((row, k) => `| ${CLASSES[k]} | ${row.join(' | ')} |`),
  '',
].join('\n');
fs.writeFileSync(path.join(DATA, 'train-report.md'), report);
fs.writeFileSync(path.join(DATA, 'technique-model.json'), JSON.stringify(finalModel));
console.log(report);
