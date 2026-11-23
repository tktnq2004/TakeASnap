/**
 * Phase 5b: rút gọn phần đầu model vòng 3 (eval/composition/technique-model-r3-7-soft.json) để
 * phát hành ở repo model công khai (GitHub Releases, tag ghim; packs.ts `TECHNIQUE_PACK`).
 * Số làm tròn còn 4 chữ số có nghĩa; kiểm tra xác suất chân trời trên bộ đo cổng gần như không đổi
 * và quyết định lọc (P ≥ ngưỡng) giữ nguyên.
 *
 *   node scripts/p5b-export-head.mts <file ra>
 *
 * Không commit file model vào repo này.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA = path.join(ROOT, 'eval', 'composition');
const OUT = process.argv[2];
if (!OUT) throw new Error('Cần đường dẫn file ra');
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

const read = <T,>(f: string) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')) as T;
const model = read<TechniqueModel>('technique-model-r3-7-soft.json');
const r = (v: number) => Number(v.toPrecision(4));
const small: TechniqueModel = {
  version: 'r3-7-soft',
  classes: model.classes,
  mean: model.mean.map(r),
  std: model.std.map(r),
  ...(model.hidden
    ? { hidden: { W: model.hidden.W.map((row) => row.map(r)), b: model.hidden.b.map(r) } }
    : {}),
  W: model.W.map((row) => row.map(r)),
  b: model.b.map(r),
  threshold: model.threshold,
};
const json = JSON.stringify(small);
fs.writeFileSync(OUT, json);

// So trên bộ đo cổng.
const raws = read<Record<string, Raw>>('features.json');
const gate = read<string[]>('r3-holdout.json');
const T = 0.1;
let n = 0;
let maxDiff = 0;
let flips = 0;
for (const id of gate) {
  const raw = raws[id];
  if (!raw?.embedding) continue;
  const x = techniqueInput(featuresOf(raw), raw.embedding);
  const p = (m: TechniqueModel) => predictTechnique(m, x).find((g) => g.technique === 'horizon')!.p;
  const a = p(model);
  const b = p(small);
  n++;
  maxDiff = Math.max(maxDiff, Math.abs(a - b));
  if (a >= T !== b >= T) flips++;
}
console.log(
  `${(json.length / 1024).toFixed(0)} KB (${json.length} byte), ${n} ảnh, lệch P(horizon) tối đa ${maxDiff.toExponential(2)}, đổi quyết định ${flips}`,
);
