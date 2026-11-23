/**
 * Phase 5b, đổi hướng 2026-11-23: bộ dò Phase 5a (chân trời, đường dẫn) có đủ đúng để gợi ý bố
 * cục phụ không, hay cần model 7 lớp vòng 3 để lọc (business-flow §6.10).
 *
 *   node scripts/p5b-detectors.mts [số tiến trình, mặc định 2]
 *
 * Chạy đúng trang WebView của app (tách người, khung xương, mắt, model trời) trên ảnh có nhãn người
 * dùng: bộ đo cổng vòng 3 (gán mù) và bộ giữ riêng vòng 1–2 (người duyệt). Lưu kết quả dò vào
 * eval/composition/scene-r3.json (chạy tiếp được khi bị ngắt), rồi in độ đúng: bộ dò "có" khi có
 * người và tìm thấy đường; so với nhãn người dùng (có "horizon" / "lead" trong tối đa 2 nhãn).
 * Model chỉ so trên bộ đo cổng (bộ giữ riêng nằm trong dữ liệu huấn luyện bản cuối).
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA = path.join(ROOT, 'eval', 'composition');
const OUT = path.join(DATA, 'scene-r3.json');
const WORKERS = Number(process.argv[2] ?? 2);
const CRITIC_DIR =
  process.env.COMPOSITION_CRITIC_DIR ?? path.resolve(ROOT, '../composition-critic');
const critic = async <T,>(file: string) =>
  (await import(pathToFileURL(path.join(CRITIC_DIR, file)).href)) as T;
const { createAnalyzer, featuresOf, sceneOf } =
  await critic<typeof import('composition-critic/node')>('src/node/analyzer.ts');
const { techniqueInput, predictTechnique } =
  await critic<typeof import('composition-critic')>('src/technique.ts');
type Raw = import('composition-critic/node').Raw;
type TechniqueModel = import('composition-critic').TechniqueModel;

const read = <T,>(f: string) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')) as T;
type Labels = Record<string, string[]>;
const real = (l: string[] | undefined) => (l ?? []).filter((x) => x !== 'unsure' && x !== 'skip');

const gateLabels = read<Labels>('labels-r3-user.json');
const gateIds = read<string[]>('r3-holdout.json').filter((id) => real(gateLabels[id]).length);
const reviewLabels = read<Labels>('labels-review.json');
const reviewIds = Object.keys(reviewLabels).filter((id) => real(reviewLabels[id]).length);

/** Kết quả dò của một ảnh: số người, chân trời (có / không model trời), điểm hội tụ. */
type Found = {
  people: number;
  horizon: number | null;
  horizonNoSky: number | null;
  sky: boolean;
  vanishing: { x: number; y: number; lines: number } | null;
  /** Khoảng cách điểm hội tụ tới mắt (hoặc giữa khung) người chính, theo bề ngang ảnh. */
  vanishingToPerson: number | null;
};
const done: Record<string, Found> = fs.existsSync(OUT)
  ? (JSON.parse(fs.readFileSync(OUT, 'utf8')) as Record<string, Found>)
  : {};
const todo = [...new Set([...gateIds, ...reviewIds])].filter((id) => !done[id]);
console.log(`bộ đo ${gateIds.length}, bộ giữ riêng ${reviewIds.length}, còn dò ${todo.length}`);

const summarize = (r: Raw): Found => {
  const f = featuresOf(r);
  const s = sceneOf(r, f);
  const noSky = r.sky ? sceneOf({ ...r, sky: undefined }, f, null) : s;
  const p = f.people[f.main];
  const v = s?.vanishing ?? null;
  const target =
    f.eye ?? (p ? { x: (p.box[0] + p.box[2]) / 2, y: (p.box[1] + p.box[3]) / 2 } : null);
  return {
    people: f.people.length,
    horizon: s?.horizon?.y ?? null,
    horizonNoSky: noSky?.horizon?.y ?? null,
    sky: !!r.sky,
    vanishing: v ? { x: v.point.x, y: v.point.y, lines: v.lines.length } : null,
    vanishingToPerson:
      v && target
        ? Math.hypot(v.point.x - target.x, (v.point.y - target.y) * (r.height / r.width))
        : null,
  };
};

if (todo.length) {
  let n = 0;
  const t0 = Date.now();
  const save = () => fs.writeFileSync(OUT, JSON.stringify(done));
  const worker = async () => {
    const a = await createAnalyzer({ sky: true, gpu: true });
    try {
      for (;;) {
        const id = todo.pop();
        if (!id) return;
        try {
          const { raw } = await a.analyzeFile(path.join(DATA, 'images', `${id}.jpg`));
          done[id] = summarize(raw);
        } catch (e) {
          console.warn(id, (e as Error).message);
        }
        if (++n % 25 === 0) {
          save();
          console.log(`${n} ảnh, ${((Date.now() - t0) / n).toFixed(0)} ms / ảnh`);
        }
      }
    } finally {
      await a.close();
    }
  };
  await Promise.all(Array.from({ length: WORKERS }, worker));
  save();
}

// ---- Đo ----
const model = read<TechniqueModel & { classes: string[] }>('technique-model-r3-7-soft.json');
const raws = read<Record<string, Raw>>('features.json');
const modelP = (id: string, cls: string) => {
  const r = raws[id];
  if (!r?.embedding) return null;
  const g = predictTechnique(model, techniqueInput(featuresOf(r), r.embedding));
  return g.find((x) => (x.technique as string) === cls)?.p ?? 0;
};

type Rule = { name: string; fires: (f: Found, id: string) => boolean | null };
const pct = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(1)}%` : '—');
function table(title: string, ids: string[], labels: Labels, cls: string, rules: Rule[]) {
  const pos = ids.filter((id) => real(labels[id]).includes(cls)).length;
  console.log(`\n### ${title} — ${cls} (${pos} / ${ids.length} ảnh có nhãn)\n`);
  console.log('| Cách | Báo "có" | Đúng (người dùng cũng gán) | Độ chính xác | Bắt được |');
  console.log('|---|---|---|---|---|');
  for (const r of rules) {
    let fired = 0;
    let tp = 0;
    let n = 0;
    for (const id of ids) {
      const f = done[id];
      if (!f) continue;
      const on = r.fires(f, id);
      if (on === null) continue;
      n++;
      if (!on) continue;
      fired++;
      if (real(labels[id]).includes(cls)) tp++;
    }
    console.log(`| ${r.name} | ${fired} | ${tp} | ${pct(tp, fired)} | ${pct(tp, pos)} |`);
    if (n < ids.length) console.log(`|  (thiếu ${ids.length - n} ảnh) |||||`);
  }
}

const person = (f: Found) => f.people > 0;
const withModel = (cls: string, t: number, base: (f: Found) => boolean): Rule['fires'] => {
  return (f, id) => {
    const p = modelP(id, cls);
    return p === null ? null : base(f) && p >= t;
  };
};
const hz = (f: Found) => person(f) && f.horizon !== null;
const hz0 = (f: Found) => person(f) && f.horizonNoSky !== null;
const vp = (f: Found) => person(f) && f.vanishing !== null;
const vpNear = (d: number) => (f: Found) =>
  vp(f) && f.vanishingToPerson !== null && f.vanishingToPerson <= d;

const horizonRules = (gate: boolean): Rule[] => [
  { name: 'Bộ dò (có model trời)', fires: hz },
  { name: 'Bộ dò (không model trời)', fires: hz0 },
  ...(gate
    ? [
        { name: 'Model: P(horizon) ≥ 0,15', fires: withModel('horizon', 0.15, person) },
        { name: 'Bộ dò + model P ≥ 0,05', fires: withModel('horizon', 0.05, hz) },
        { name: 'Bộ dò + model P ≥ 0,10', fires: withModel('horizon', 0.1, hz) },
      ]
    : []),
];
const leadRules = (gate: boolean): Rule[] => [
  { name: 'Bộ dò: có điểm hội tụ', fires: vp },
  { name: 'Bộ dò: điểm hội tụ ≤ 0,35 khung từ người', fires: vpNear(0.35) },
  { name: 'Bộ dò: điểm hội tụ ≤ 0,2 khung từ người', fires: vpNear(0.2) },
  ...(gate
    ? [
        { name: 'Model: P(lead) ≥ 0,15', fires: withModel('lead', 0.15, person) },
        { name: 'Bộ dò + model P ≥ 0,05', fires: withModel('lead', 0.05, vp) },
        { name: 'Bộ dò + model P ≥ 0,10', fires: withModel('lead', 0.1, vp) },
      ]
    : []),
];

table('Bộ đo cổng vòng 3 (Wikimedia, gán mù)', gateIds, gateLabels, 'horizon', horizonRules(true));
table('Bộ đo cổng vòng 3 (Wikimedia, gán mù)', gateIds, gateLabels, 'lead', leadRules(true));
table(
  'Bộ giữ riêng vòng 1–2 (Open Images, người duyệt)',
  reviewIds,
  reviewLabels,
  'horizon',
  horizonRules(false),
);
table(
  'Bộ giữ riêng vòng 1–2 (Open Images, người duyệt)',
  reviewIds,
  reviewLabels,
  'lead',
  leadRules(false),
);
