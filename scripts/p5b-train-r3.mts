/**
 * Phase 5b vòng 3: model **gợi ý 2 kỹ thuật** (docs/phase5b-data.md, vòng 3).
 *
 *   node scripts/p5b-train-r3.mts            chọn cấu hình trên bộ kiểm tra Wikimedia
 *   node scripts/p5b-train-r3.mts --final    chấm thêm bộ đo cổng (một lần)
 *
 *   CLASSES=5   chỉ 1/3, ở giữa, lấp đầy, nhóm, khác (như vòng 1–2); mặc định 7 lớp, thêm chân
 *               trời và đường dẫn
 *   SOFT=1      ảnh có 2 nhãn học cả hai (0,6 / 0,4) thay vì chỉ nhãn đầu
 *
 * Dữ liệu (eval/composition/, không commit):
 * - huấn luyện: mọi ảnh Open Images có nhãn (nhãn người duyệt nếu có, không thì nhãn Claude);
 * - kiểm tra (chọn cấu hình): ảnh Wikimedia khác tác giả với bộ đo: labels-wm-claude.json (Claude,
 *   định nghĩa v2) + ảnh gán thử có nhãn người dùng (labels-calib-user.json);
 * - bộ đo cổng: r3-holdout.json, nhãn người dùng gán mù (labels-r3-user.json); ảnh "Bỏ ảnh này" và
 *   ảnh chỉ có "Không chắc" không tính. Không bao giờ huấn luyện hay chọn cấu hình trên bộ này.
 * Model cuối huấn luyện lại trên huấn luyện + kiểm tra. Ghi technique-model-r3.json và
 * train-r3-report.md.
 *
 * Cổng (chốt 2026-11-22, trước khi chấm): ≥ 75% ảnh có ít nhất một trong hai gợi ý nằm trong nhãn
 * người dùng, và hơn mốc luật hình học ít nhất 5 điểm. Mức hai người gán mù khớp nhau trên bộ đo:
 * 82,4%.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { fit, stats, type FitConfig, type FitModel, type TrainSet } from './p5b-fit.mts';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA = path.join(ROOT, 'eval', 'composition');
const CRITIC_DIR =
  process.env.COMPOSITION_CRITIC_DIR ?? path.resolve(ROOT, '../composition-critic');
const critic = async <T,>(file: string) =>
  (await import(pathToFileURL(path.join(CRITIC_DIR, file)).href)) as T;
const { featuresOf } =
  await critic<typeof import('composition-critic/node')>('src/node/analyzer.ts');
const { techniqueInput, predictTechnique } =
  await critic<typeof import('composition-critic')>('src/technique.ts');
type TechniqueModel = import('composition-critic').TechniqueModel;
type Raw = import('composition-critic/node').Raw;
type Features = ReturnType<typeof featuresOf>;

const read = <T,>(f: string) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')) as T;
type Labels = Record<string, string[]>;
const raws = read<Record<string, Raw>>('features.json');
const manifest = read<{ id: string; subset?: string; author?: string }[]>('manifest.json');
const FINAL = process.argv.includes('--final');
const SOFT = process.env.SOFT === '1';
const CLASSES =
  process.env.CLASSES === '5'
    ? ['thirds', 'center', 'fill', 'group', 'other']
    : ['thirds', 'center', 'fill', 'horizon', 'lead', 'group', 'other'];
const K = CLASSES.length;

/** Nhãn thật (bỏ cờ "Không chắc", ảnh "Bỏ ảnh này" thành rỗng). */
const real = (l: string[] | undefined) => (l ?? []).filter((x) => x !== 'unsure' && x !== 'skip');

const gateIds = read<string[]>('r3-holdout.json');
const gateLabels = read<Labels>('labels-r3-user.json');
const author = new Map(manifest.map((m) => [m.id, m.author ?? '']));
const gateAuthors = new Set(gateIds.map((id) => author.get(id)));
const gate = new Set(gateIds);

// Huấn luyện: Open Images (mọi ảnh có nhãn, kể cả hai bộ giữ riêng cũ có nhãn người duyệt).
const trainLabels: Labels = {
  ...read<Labels>('labels-claude.json'),
  ...read<Labels>('labels-review.json'),
};
// Kiểm tra: Wikimedia khác tác giả với bộ đo.
const calibUser = read<Labels>('labels-calib-user.json');
const valLabels: Labels = { ...read<Labels>('labels-wm-claude.json') };
for (const [id, l] of Object.entries(calibUser)) if (real(l).length) valLabels[id] = real(l);
for (const id of Object.keys(valLabels)) {
  if (gate.has(id) || gateAuthors.has(author.get(id))) delete valLabels[id];
}

const input = (id: string) => {
  const r = raws[id];
  return r?.embedding ? techniqueInput(featuresOf(r), r.embedding) : null;
};
/** Nhãn đích: nhãn đầu (hoặc 0,6 / 0,4 cho hai nhãn khi SOFT=1), chỉ các lớp của model. */
const targetOf = (labels: string[]) => {
  const l = real(labels).filter((x) => CLASSES.includes(x));
  if (!l.length) return null;
  const t = new Array<number>(K).fill(0);
  if (SOFT && l.length > 1) {
    t[CLASSES.indexOf(l[0]!)] = 0.6;
    t[CLASSES.indexOf(l[1]!)] = 0.4;
  } else t[CLASSES.indexOf(l[0]!)] = 1;
  return t;
};
const build = (labels: Labels): TrainSet => {
  const out: TrainSet = { ids: [], X: [], T: [] };
  for (const id of Object.keys(labels).sort()) {
    if (gate.has(id)) continue;
    const x = input(id);
    const t = targetOf(labels[id]!);
    if (!x || !t) continue;
    out.ids.push(id);
    out.X.push(x);
    out.T.push(t);
  }
  return out;
};
const train = build(trainLabels);
const val = build(valLabels);
console.log(
  `huấn luyện ${train.X.length}, kiểm tra ${val.X.length}, ${CLASSES.length} lớp, soft ${SOFT}`,
);

// ---- Cách gợi ý: model và các mốc so sánh. Mỗi cách trả 2 gợi ý xếp hạng. ----
type Suggest = (id: string) => string[];
const asModel = (m: FitModel) => m as unknown as TechniqueModel;
const modelSuggest = (m: FitModel): Suggest => {
  return (id) =>
    predictTechnique(asModel(m), input(id)!)
      .slice(0, 2)
      .map((g) => g.technique as string);
};
/** Tần suất nhãn của dữ liệu huấn luyện (thứ tự cho mốc hằng số và nhãn thứ hai của luật). */
const freq = (() => {
  const c: Record<string, number> = {};
  for (const l of Object.values(trainLabels)) for (const x of real(l)) c[x] = (c[x] ?? 0) + 1;
  return Object.entries(c)
    .sort((a, b) => b[1] - a[1])
    .map((x) => x[0]);
})();
const constant: Suggest = () => freq.slice(0, 2);
/** Luật hình học (vòng 2): nhóm ≥ 3 người, lấp đầy khi người cao ≥ 80% khung, ở giữa ±8%. */
const ruleOf = (f: Features) => {
  const p = f.people[f.main];
  if (!p) return 'other';
  const clear = f.people.filter((q) => q.area >= 0.02).length;
  if (Math.max(clear, f.heads.length) >= 3) return 'group';
  const h = p.box[3] - p.box[1];
  if (h >= 0.8 || p.area >= 0.3) return 'fill';
  const cx = f.eye?.x ?? (p.box[0] + p.box[2]) / 2;
  return Math.abs(cx - 0.5) <= 0.08 ? 'center' : 'thirds';
};
const rule: Suggest = (id) => {
  const r = ruleOf(featuresOf(raws[id]!));
  return [r, freq.find((x) => x !== r)!];
};

/** Có gợi ý hợp (một trong hai gợi ý nằm trong nhãn) / gợi ý đầu hợp. */
function score(suggest: Suggest, ids: string[], labelsOf: (id: string) => string[]) {
  let two = 0;
  let one = 0;
  for (const id of ids) {
    const s = suggest(id);
    const ok = labelsOf(id);
    if (s.some((x) => ok.includes(x))) two++;
    if (ok.includes(s[0]!)) one++;
  }
  return { two: two / ids.length, one: one / ids.length, n: ids.length };
}
// Chấm trên mọi ảnh có nhãn (kể cả ảnh chỉ chân trời / đường dẫn khi model 5 lớp: tính là trượt).
const valIds = Object.keys(valLabels)
  .filter((id) => input(id) && real(valLabels[id]).length)
  .sort();
const valOf = (id: string) => real(valLabels[id]);

const norm = stats(train.X);
const configs: FitConfig[] = [];
for (const hidden of [32, 64])
  for (const l2 of [1e-2, 5e-2])
    for (const weight of ['none', 'sqrt', 'full'] as const)
      configs.push({ hidden, l2, weight, epochs: 300, lr: 0.003 });

const results = configs.map((cfg) => {
  const t0 = Date.now();
  const s = score(modelSuggest(fit(train, cfg, norm, CLASSES)), valIds, valOf);
  console.log(
    `hidden ${cfg.hidden} l2 ${cfg.l2} weight ${cfg.weight}: có gợi ý hợp ${(100 * s.two).toFixed(1)}%, gợi ý đầu ${(100 * s.one).toFixed(1)}% (${((Date.now() - t0) / 1000).toFixed(0)} s)`,
  );
  return { cfg, s };
});
const best = [...results].sort((a, b) => b.s.two - a.s.two || b.s.one - a.s.one)[0]!;
console.log('chọn', best.cfg);

const all: TrainSet = {
  ids: [...train.ids, ...val.ids],
  X: [...train.X, ...val.X],
  T: [...train.T, ...val.T],
};
const finalModel = fit(all, best.cfg, stats(all.X), CLASSES);

const pct = (v: number) => `${(100 * v).toFixed(1)}%`;
const baselines: [string, Suggest][] = [
  [`Luôn gợi ý ${freq.slice(0, 2).join(' + ')}`, constant],
  ['Luật hình học + nhãn phổ biến', rule],
];
const r2File = path.join(DATA, 'technique-model.json');
if (fs.existsSync(r2File)) {
  baselines.push([
    'Model vòng 2',
    modelSuggest(JSON.parse(fs.readFileSync(r2File, 'utf8')) as FitModel),
  ]);
}
const table = (ids: string[], labelsOf: (id: string) => string[], model: Suggest | null) => [
  '| Cách gợi ý | Có gợi ý hợp | Gợi ý đầu hợp |',
  '|---|---|---|',
  ...baselines.map(([name, s]) => {
    const r = score(s, ids, labelsOf);
    return `| ${name} | ${pct(r.two)} | ${pct(r.one)} |`;
  }),
  ...(model
    ? (() => {
        const r = score(model, ids, labelsOf);
        return [`| **Model vòng 3** | **${pct(r.two)}** | ${pct(r.one)} |`];
      })()
    : []),
];

let gateLines: string[] = ['Bộ đo cổng chưa chấm (chạy với --final).', ''];
if (FINAL) {
  const G = gateIds.filter((id) => real(gateLabels[id]).length && input(id)).sort();
  const gOf = (id: string) => real(gateLabels[id]);
  const m = score(modelSuggest(finalModel), G, gOf);
  const r = score(rule, G, gOf);
  const pass = m.two >= 0.75 && m.two >= r.two + 0.05;
  const per = CLASSES.map((c) => {
    const ids = G.filter((id) => gOf(id)[0] === c);
    const s = score(modelSuggest(finalModel), ids, gOf);
    return `| ${c} | ${ids.length} | ${ids.length ? pct(s.two) : '—'} |`;
  });
  gateLines = [
    `## Bộ đo cổng (${G.length} ảnh, nhãn người dùng gán mù)`,
    '',
    ...table(G, gOf, modelSuggest(finalModel)),
    '| Claude gán mù (người thứ hai) | 82.4% | 64.8% |',
    '',
    `Cổng: ≥ 75% và hơn luật hình học ≥ 5 điểm (${pct(r.two + 0.05)}). **${pass ? 'Đạt' : 'Không đạt'}.**`,
    '',
    'Theo nhãn đầu người dùng:',
    '',
    '| Nhãn đầu | Ảnh | Có gợi ý hợp |',
    '|---|---|---|',
    ...per,
    '',
  ];
}

const report = [
  `# Phase 5b vòng 3 — huấn luyện ${new Date().toISOString().slice(0, 10)}`,
  '',
  `${CLASSES.length} lớp (${CLASSES.join(', ')}), nhãn đích ${SOFT ? 'chia cho hai nhãn (0,6 / 0,4)' : 'nhãn đầu'}. Huấn luyện ${train.X.length} ảnh Open Images, kiểm tra ${val.X.length} ảnh Wikimedia khác tác giả với bộ đo.`,
  '',
  '## Chọn cấu hình (bộ kiểm tra)',
  '',
  '| Lớp ẩn | L2 | Cân lớp | Có gợi ý hợp | Gợi ý đầu hợp |',
  '|---|---|---|---|---|',
  ...results.map(
    (x) =>
      `| ${x.cfg.hidden} | ${x.cfg.l2} | ${x.cfg.weight} | ${pct(x.s.two)} | ${pct(x.s.one)} |`,
  ),
  '',
  `Chọn: lớp ẩn ${best.cfg.hidden}, L2 ${best.cfg.l2}, cân lớp ${best.cfg.weight}. Mốc so sánh trên bộ kiểm tra (${valIds.length} ảnh):`,
  '',
  ...table(valIds, valOf, modelSuggest(fit(train, best.cfg, norm, CLASSES))),
  '',
  ...gateLines,
].join('\n');
const tag = `${CLASSES.length}${SOFT ? '-soft' : ''}`;
fs.writeFileSync(path.join(DATA, `train-r3-${tag}.md`), report);
fs.writeFileSync(path.join(DATA, `technique-model-r3-${tag}.json`), JSON.stringify(finalModel));
console.log(report);
