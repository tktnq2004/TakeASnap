/**
 * Phase 5b, Bước 1: chia ảnh đã gán nhãn thành huấn luyện / kiểm tra / giữ riêng.
 *
 *   node scripts/p5b-split.mts
 *
 * Đọc eval/composition/labels-claude.json ({id: [nhãn chính, nhãn phụ?]}), ghi
 * eval/composition/split.json ({ train, val, holdout }: danh sách id). Chọn theo nhãn chính, có seed:
 * mỗi nhãn góp cùng tỉ lệ vào bộ giữ riêng và bộ kiểm tra, riêng "other" chỉ góp tới HOLDOUT_OTHER
 * ảnh để bộ giữ riêng không bị "Khác" lấn át. Bộ giữ riêng không bao giờ dùng để huấn luyện hay
 * chỉnh; người duyệt lại nhãn của chính bộ này (scripts/p5b-review.mts).
 * Chạy lại không đổi kết quả khi nhãn không đổi; đã có split.json thì giữ nguyên bộ giữ riêng.
 *
 *   node scripts/p5b-split.mts --r2
 *
 * Vòng 2 (bộ giữ riêng lần 1 đã chấm một lần nên không dùng lại để đo): ghi split-r2.json. Bộ giữ
 * riêng mới chỉ lấy từ ảnh tập train của Open Images (scripts/p5b-collect-train.mts, gần ảnh của
 * app hơn), mỗi nhãn 45%, "Khác" tối đa 143. Mọi ảnh có nhãn còn lại (kể cả bộ giữ riêng lần 1, có
 * nhãn người duyệt) vào huấn luyện / kiểm tra, chia theo nhãn người duyệt nếu có.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', 'eval', 'composition');
const LABELS = path.join(ROOT, 'labels-claude.json');
const R2 = process.argv.includes('--r2');
const OUT = path.join(ROOT, R2 ? 'split-r2.json' : 'split.json');
/** Phần mỗi nhãn đưa vào bộ giữ riêng / kiểm tra. */
const HOLDOUT = R2 ? 0.45 : 0.3;
const VAL = 0.15;
const HOLDOUT_OTHER = R2 ? 143 : 140;

const claude = JSON.parse(fs.readFileSync(LABELS, 'utf8')) as Record<string, string[]>;
const REVIEW = path.join(ROOT, 'labels-review.json');
const review =
  R2 && fs.existsSync(REVIEW)
    ? (JSON.parse(fs.readFileSync(REVIEW, 'utf8')) as Record<string, string[]>)
    : {};
/** Vòng 2: nhãn người duyệt nếu có. */
const labels: Record<string, string[]> = { ...claude, ...review };
/** Ảnh được chọn vào bộ giữ riêng (vòng 2: chỉ ảnh tập train của Open Images). */
const subset = new Map(
  (
    JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8')) as {
      id: string;
      subset?: string;
    }[]
  ).map((m) => [m.id, m.subset ?? 'validation']),
);
const holdoutPool = (id: string) => !R2 || subset.get(id) === 'train';
const previous = fs.existsSync(OUT)
  ? (JSON.parse(fs.readFileSync(OUT, 'utf8')) as { holdout: string[] })
  : null;

let seed = 0x5b5b5b;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const byLabel = new Map<string, string[]>();
for (const id of Object.keys(labels).sort()) {
  const main = labels[id]![0]!;
  if (!byLabel.has(main)) byLabel.set(main, []);
  byLabel.get(main)!.push(id);
}

const holdout = new Set(previous?.holdout ?? []);
const val: string[] = [];
const train: string[] = [];
for (const [label, ids] of [...byLabel.entries()].sort()) {
  const shuffled = ids
    .map((id) => [rnd(), id] as const)
    .sort((a, b) => a[0] - b[0])
    .map((x) => x[1]);
  let rest = shuffled.filter((id) => !holdout.has(id));
  if (!previous) {
    const pool = rest.filter(holdoutPool);
    const n = Math.min(
      Math.round(pool.length * HOLDOUT),
      label === 'other' ? HOLDOUT_OTHER : Infinity,
    );
    for (const id of pool.slice(0, n)) holdout.add(id);
    rest = rest.filter((id) => !holdout.has(id));
  }
  val.push(...rest.splice(0, Math.round(ids.length * VAL)));
  train.push(...rest);
}

const split = { holdout: [...holdout].sort(), val: val.sort(), train: train.sort() };
fs.writeFileSync(OUT, JSON.stringify(split, null, 1));
const count = (ids: string[]) => {
  const c: Record<string, number> = {};
  for (const id of ids) c[labels[id]?.[0] ?? '?'] = (c[labels[id]?.[0] ?? '?'] ?? 0) + 1;
  return c;
};
for (const [name, ids] of Object.entries(split)) console.log(name, ids.length, count(ids));
