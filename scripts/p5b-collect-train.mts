/**
 * Phase 5b vòng 2: thêm ảnh người cho Quy tắc 1/3, Đặt ở giữa, Lấp đầy khung, Nhóm người từ tập
 * train của Open Images V7 (1,7 triệu ảnh). Vòng 1 thiếu ảnh các kỹ thuật này (1/3 122, ở giữa
 * 64, nhóm 32 ảnh huấn luyện) nên model đoán "Khác" quá nhiều.
 *
 *   node scripts/p5b-collect-train.mts [portrait 450] [group 250]
 *
 * Metadata lớn (bbox 2,2 GB, thông tin ảnh 640 MB) nên đọc từng dòng. Không có nhãn cảnh của tập
 * train (2,7 GB, bỏ), nên lọc theo khung vật:
 * - portrait: 1–2 người rõ, người lớn nhất 8–60% ảnh (chân dung, nửa người, cả người gần);
 * - group: ≥ 3 người rõ (mỗi người ≥ 1% ảnh), người lớn nhất ≥ 3%;
 * - bỏ ảnh có khung xe, xe đạp, bóng, đồ ăn, ngựa, tranh / tượng người (IsDepiction), nhóm đông
 *   (IsGroupOf). Giấy phép CC BY 2.0, ảnh không xoay (như p5b-collect.mts).
 * Ảnh mới gộp vào eval/composition/manifest.json (subset "train"), tải từ kho S3 của Open Images.
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const ROOT = path.resolve(import.meta.dirname, '..', 'eval', 'composition');
const META = path.join(ROOT, 'meta');
const IMAGES = path.join(ROOT, 'images');
const MANIFEST = path.join(ROOT, 'manifest.json');
const WANT = { portrait: Number(process.argv[2] ?? 450), group: Number(process.argv[3] ?? 250) };
const S3 = 'https://open-images-dataset.s3.amazonaws.com/train';
const CC_BY = 'https://creativecommons.org/licenses/by/2.0/';
const PERSON = new Set(['/m/01g317', '/m/04yx4', '/m/03bt1vf', '/m/01bl7v', '/m/05r655']);
/** Xe hơi, xe cộ, xe máy, xe đạp, bóng, bóng đá, đồ ăn, ngựa. */
const EXCLUDE = new Set([
  '/m/0k4j',
  '/m/01prls',
  '/m/04_sv',
  '/m/0199g',
  '/m/018xm',
  '/m/01226z',
  '/m/02wbm',
  '/m/03k3r',
]);

/** Một dòng CSV (có ngoặc kép; không có xuống dòng trong ô). */
function cells(line: string): string[] {
  const out: string[] = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cell += '"';
          i++;
        } else q = false;
      } else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      out.push(cell);
      cell = '';
    } else cell += c;
  }
  out.push(cell);
  return out;
}

async function* rows(file: string) {
  const rl = readline.createInterface({ input: fs.createReadStream(path.join(META, file)) });
  let head: string[] | null = null;
  for await (const line of rl) {
    if (!line) continue;
    const r = cells(line);
    if (!head) {
      head = r;
      continue;
    }
    yield { r, col: (name: string) => head!.indexOf(name) };
  }
}

type Stat = { clear: number; maxArea: number; bad: boolean };
const stats = new Map<string, Stat>();
let n = 0;
for await (const { r, col } of rows('oidv6-train-annotations-bbox.csv')) {
  if (++n % 2_000_000 === 0) console.log(`bbox ${n / 1e6} triệu dòng, ${stats.size} ảnh có người`);
  const label = r[col('LabelName')]!;
  const isPerson = PERSON.has(label);
  if (!isPerson && !EXCLUDE.has(label)) continue;
  const id = r[col('ImageID')]!;
  const s = stats.get(id) ?? { clear: 0, maxArea: 0, bad: false };
  if (!isPerson) s.bad = true;
  else if (r[col('IsDepiction')] === '1' || r[col('IsGroupOf')] === '1') s.bad = true;
  else {
    const area =
      (Number(r[col('XMax')]) - Number(r[col('XMin')])) *
      (Number(r[col('YMax')]) - Number(r[col('YMin')]));
    if (area >= 0.01) s.clear++;
    s.maxArea = Math.max(s.maxArea, area);
  }
  stats.set(id, s);
}

const existing = fs.existsSync(MANIFEST)
  ? (JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) as { id: string }[])
  : [];
const have = new Set(existing.map((e) => e.id));
const pools = { portrait: [] as string[], group: [] as string[] };
for (const [id, s] of stats) {
  if (s.bad || have.has(id)) continue;
  if (s.clear >= 1 && s.clear <= 2 && s.maxArea >= 0.08 && s.maxArea <= 0.6)
    pools.portrait.push(id);
  else if (s.clear >= 3 && s.maxArea >= 0.03) pools.group.push(id);
}
console.log(`ứng viên: chân dung ${pools.portrait.length}, nhóm ${pools.group.length}`);

let seed = 0x5b2;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const shuffle = (a: string[]) =>
  a
    .sort()
    .map((id) => [rnd(), id] as const)
    .sort((x, y) => x[0] - y[0])
    .map((x) => x[1]);
// Lấy gấp 3 rồi lọc giấy phép / xoay.
const picked = new Map<string, 'portrait' | 'group'>();
for (const id of shuffle(pools.portrait).slice(0, WANT.portrait * 3)) picked.set(id, 'portrait');
for (const id of shuffle(pools.group).slice(0, WANT.group * 3)) picked.set(id, 'group');

type Info = { author: string; title: string; source: string };
const info = new Map<string, Info>();
for await (const { r, col } of rows('train-images-boxable-with-rotation.csv')) {
  const id = r[col('ImageID')]!;
  if (!picked.has(id)) continue;
  const rot = r[col('Rotation')] ?? '';
  if (r[col('License')] !== CC_BY || !(rot === '' || rot === '0' || rot === '0.0')) continue;
  info.set(id, {
    author: r[col('Author')]!,
    title: r[col('Title')]!,
    source: r[col('OriginalLandingURL')]!,
  });
}

const chosen: [string, 'portrait' | 'group'][] = [];
const count = { portrait: 0, group: 0 };
for (const [id, pool] of picked) {
  if (!info.has(id) || count[pool] >= WANT[pool]) continue;
  chosen.push([id, pool]);
  count[pool]++;
}
console.log('chọn', count);

fs.mkdirSync(IMAGES, { recursive: true });
const queue = chosen.map(([id]) => id);
const failed = new Set<string>();
await Promise.all(
  Array.from({ length: 8 }, async () => {
    for (;;) {
      const id = queue.pop();
      if (!id) return;
      const file = path.join(IMAGES, `${id}.jpg`);
      if (fs.existsSync(file)) continue;
      try {
        const res = await fetch(`${S3}/${id}.jpg`);
        if (!res.ok) throw new Error(String(res.status));
        fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      } catch (e) {
        failed.add(id);
        console.warn(id, (e as Error).message);
      }
    }
  }),
);

const added = chosen
  .filter(([id]) => !failed.has(id))
  .map(([id, pool]) => {
    const i = info.get(id)!;
    const s = stats.get(id)!;
    return {
      id,
      pool,
      subset: 'train',
      file: `images/${id}.jpg`,
      license: 'CC BY 2.0',
      author: i.author,
      title: i.title,
      source: i.source,
      people: s.clear,
      maxPersonArea: Number(s.maxArea.toFixed(3)),
      tags: [],
    };
  });
fs.writeFileSync(MANIFEST, JSON.stringify([...existing, ...added], null, 1));
console.log(`xong: thêm ${added.length} ảnh, lỗi ${failed.size}`);
