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
 *
 * Vòng 2 (cổng lần 1 trượt: 61,6% / 80,6%, model đoán "Khác" quá nhiều):
 *   SPLIT=split-r2.json   bộ chia khác (bộ giữ riêng mới; ảnh có nhãn người thì huấn luyện bằng nhãn đó)
 *   EMBED=large           vector ảnh MobileNetV3 large (eval/composition/embeddings-large.json)
 *   --final               mới chấm bộ giữ riêng; không có cờ này chỉ báo bộ kiểm tra, để vòng thử
 *                         không nhìn đáp án
 * Chọn cấu hình theo độ đúng cân bằng giữa các lớp (trung bình độ đúng từng lớp) thay vì độ đúng
 * chung, vì bộ kiểm tra lệch về "Khác" còn ảnh thật của app thì không.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  fit as fitModel,
  oneHot,
  stats,
  type FitConfig,
  type Norm,
  type TrainSet,
} from './p5b-fit.mts';

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
const SPLIT = process.env.SPLIT ?? 'split.json';
const split = read<{ train: string[]; val: string[]; holdout: string[] }>(SPLIT);
const FINAL = process.argv.includes('--final');
const EMBED = process.env.EMBED === 'large' ? 'large' : 'small';
const large = EMBED === 'large' ? read<Record<string, number[]>>('embeddings-large.json') : null;
const CLASSES = [...TECHNIQUE_CLASSES] as string[];
const K = CLASSES.length;

const input = (id: string) => {
  const r = raws[id];
  const emb = large ? large[id] : r?.embedding;
  if (!r || !emb) return null;
  return techniqueInput(featuresOf(r), emb);
};
/** Nhãn huấn luyện / kiểm tra: nhãn người duyệt nếu có, không thì nhãn Claude. */
const labelOf = (id: string) => review[id] ?? claude[id];
const target = (labels: string[] | undefined) => {
  const l = labels?.find((x) => CLASSES.includes(x));
  return l === undefined ? -1 : CLASSES.indexOf(l);
};

type Set = TrainSet & { y: number[] };
const build = (ids: string[], labelsOf: (id: string) => string[] | undefined): Set => {
  const out: Set = { ids: [], X: [], T: [], y: [] };
  for (const id of ids) {
    const x = input(id);
    const y = target(labelsOf(id));
    if (!x || y < 0) continue;
    out.ids.push(id);
    out.X.push(x);
    out.T.push(oneHot(y, K));
    out.y.push(y);
  }
  return out;
};
const train = build(split.train, labelOf);
const val = build(split.val, labelOf);
const D = train.X[0]!.length;
console.log(`huấn luyện ${train.X.length}, kiểm tra ${val.X.length}, ${D} chiều`);

const fit = (set: Set, cfg: FitConfig, n: Norm) =>
  fitModel(set, cfg, n, CLASSES) as unknown as TechniqueModel;

/** Độ đúng: lựa chọn đầu nằm trong nhãn của ảnh (`labelsOf`), và hai lựa chọn đầu. */
function score(model: TechniqueModel, set: Set, labelsOf: (id: string) => string[]) {
  let top1 = 0;
  let top2 = 0;
  let strict = 0;
  const confusion = CLASSES.map(() => new Array<number>(K).fill(0));
  const per = CLASSES.map(() => ({ n: 0, ok: 0 }));
  set.X.forEach((x, n) => {
    const g = predictTechnique(model, x);
    const ok = labelsOf(set.ids[n]!);
    per[set.y[n]!]!.n++;
    if (ok.includes(g[0]!.technique)) {
      top1++;
      per[set.y[n]!]!.ok++;
    }
    if (ok.includes(g[0]!.technique) || ok.includes(g[1]!.technique)) top2++;
    if (g[0]!.technique === CLASSES[set.y[n]!]) strict++;
    confusion[set.y[n]!]![CLASSES.indexOf(g[0]!.technique)]!++;
  });
  const N = set.X.length;
  const present = per.filter((c) => c.n > 0);
  const bal = present.reduce((a, c) => a + c.ok / c.n, 0) / present.length;
  return { top1: top1 / N, top2: top2 / N, strict: strict / N, bal, confusion, N };
}

const norm = stats(train.X);
const configs: FitConfig[] = [];
for (const hidden of [32, 64, 128])
  for (const l2 of [1e-3, 1e-2, 5e-2])
    for (const weight of ['none', 'sqrt', 'full'] as const)
      configs.push({ hidden, l2, weight, epochs: 300, lr: 0.003 });

const claudeSet = (id: string) => labelOf(id) ?? [];
const results = configs.map((cfg) => {
  const t0 = Date.now();
  const model = fit(train, cfg, norm);
  const s = score(model, val, claudeSet);
  console.log(
    `hidden ${cfg.hidden} l2 ${cfg.l2} weight ${cfg.weight}: kiểm tra top1 ${(100 * s.top1).toFixed(1)}% cân bằng ${(100 * s.bal).toFixed(1)}% top2 ${(100 * s.top2).toFixed(1)}% (${((Date.now() - t0) / 1000).toFixed(0)} s)`,
  );
  return { cfg, s };
});
const best = results.sort((a, b) => b.s.bal + 0.25 * b.s.top2 - (a.s.bal + 0.25 * a.s.top2))[0]!;
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
  T: [...train.T, ...val.T],
  y: [...train.y, ...val.y],
};
const finalModel = { ...fit(all, best.cfg, stats(all.X)), threshold: pick.t };

// Bộ giữ riêng: nhãn người duyệt, chấm một lần.
const reviewed = (id: string) => review[id] ?? [];
const hold = build(FINAL ? split.holdout.filter((id) => review[id]) : [], reviewed);
const skipped = split.holdout.filter((id) => review[id] && target(review[id]) < 0).length;
const h = FINAL ? score(finalModel, hold, reviewed) : null;
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
  `Bộ chia ${SPLIT}. Đầu vào ${D} chiều (vector ảnh MobileNetV3 ${EMBED} + 19 đặc trưng người). Huấn luyện ${train.X.length} + kiểm tra ${val.X.length} ảnh (nhãn người duyệt nếu có, không thì nhãn Claude)${FINAL ? `, giữ riêng ${hold.X.length} ảnh (nhãn người duyệt; ${skipped} ảnh người chỉ chọn chân trời / đường dẫn không tính)` : ''}.`,
  '',
  '## Chọn cấu hình (bộ kiểm tra)',
  '',
  '| Lớp ẩn | L2 | Cân lớp | Top-1 | Cân bằng | Top-2 |',
  '|---|---|---|---|---|---|',
  ...results.map(
    (r) =>
      `| ${r.cfg.hidden || '—'} | ${r.cfg.l2} | ${r.cfg.weight} | ${pct(r.s.top1)} | ${pct(r.s.bal)} | ${pct(r.s.top2)} |`,
  ),
  '',
  `Chọn (cân bằng + ¼ top-2): lớp ẩn ${best.cfg.hidden || 'không'}, L2 ${best.cfg.l2}, cân lớp ${best.cfg.weight}. Model cuối huấn luyện lại trên huấn luyện + kiểm tra.`,
  '',
  '## Ngưỡng tin cậy (bộ kiểm tra)',
  '',
  '| Ngưỡng | Đoán trên | Đúng khi đoán |',
  '|---|---|---|',
  ...curve.map((c) => `| ${c.t} | ${pct(c.cover)} | ${pct(c.acc)} |`),
  '',
  `Chọn ngưỡng ${pick.t}.`,
  '',
  ...(h
    ? [
        '## Bộ giữ riêng (cổng)',
        '',
        '| | Kết quả | Cổng |',
        '|---|---|---|',
        `| Lựa chọn đầu nằm trong nhãn người chọn | **${pct(h.top1)}** | ≥ 70% |`,
        `| Hai lựa chọn đầu có nhãn người chọn | **${pct(h.top2)}** | hoặc ≥ 85% |`,
        `| Lựa chọn đầu trùng nhãn đầu người chọn (chặt) | ${pct(h.strict)} | — |`,
        `| Độ đúng cân bằng giữa các lớp | ${pct(h.bal)} | — |`,
        `| Trên ngưỡng ${finalModel.threshold}: đoán / đúng | ${pct(covered / hold.X.length)} / ${pct(covered ? coveredOk / covered : 0)} | — |`,
        '',
        'Ma trận nhầm lẫn (hàng: nhãn đầu người chọn, cột: model đoán):',
        '',
        `| | ${CLASSES.join(' | ')} |`,
        `|---|${CLASSES.map(() => '---').join('|')}|`,
        ...h.confusion.map((row, k) => `| ${CLASSES[k]} | ${row.join(' | ')} |`),
        '',
      ]
    : ['Bộ giữ riêng chưa chấm (chạy với --final).', '']),
].join('\n');
fs.writeFileSync(path.join(DATA, 'train-report.md'), report);
fs.writeFileSync(path.join(DATA, 'technique-model.json'), JSON.stringify(finalModel));
console.log(report);
