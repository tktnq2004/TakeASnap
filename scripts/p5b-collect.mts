/**
 * Phase 5b, Bước 1: gom ảnh có người từ Open Images V7 để gán nhãn kỹ thuật bố cục.
 *
 *   node scripts/p5b-collect.mts validation 2400            ngẫu nhiên + thẻ cảnh hiếm
 *   node scripts/p5b-collect.mts test 1200 --targeted        chỉ ảnh nhắm đích (xem dưới)
 *
 * Đọc metadata trong eval/composition/meta/ (tải từ storage.googleapis.com/openimages, xem
 * docs/phase5b-data.md), chọn ảnh rồi tải về eval/composition/images/<id>.jpg từ kho S3 công khai
 * của Open Images. Ghi eval/composition/manifest.json: nguồn, giấy phép, tác giả từng ảnh (BR-16).
 * Thư mục eval/ không bao giờ commit.
 *
 * Lọc: người thật (bỏ IsDepiction: tranh, poster, tượng), người lớn nhất chiếm ≥ 2% ảnh (BR-06),
 * ảnh không xoay, giấy phép CC BY 2.0. Lấy thêm ảnh có thẻ cảnh hiếm (chân trời, đường đi, nhóm,
 * chân dung) để mỗi kỹ thuật đủ ảnh, phần còn lại chọn ngẫu nhiên (có seed, chạy lại ra cùng ảnh).
 *
 * `--targeted` (320 ảnh ngẫu nhiên đầu cho 60% "Khác", chân trời / đường dẫn ~1%): không lấy ngẫu
 * nhiên; người lớn nhất ≥ 4% ảnh; bỏ ảnh có thẻ xe, thể thao, sân khấu, đồ ăn; nhóm theo thẻ cảnh
 * hoặc ≥ 3 người rõ. Ảnh mới gộp vào manifest.json (không trùng ảnh đã có).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', 'eval', 'composition');
const META = path.join(ROOT, 'meta');
const IMAGES = path.join(ROOT, 'images');
const SUBSET = process.argv[2] === 'test' ? 'test' : 'validation';
const TARGET = Number(process.argv[3] ?? 2400);
const TARGETED = process.argv.includes('--targeted');
const S3 = `https://open-images-dataset.s3.amazonaws.com/${SUBSET}`;
const MIN_AREA = TARGETED ? 0.04 : 0.02;
const CC_BY = 'https://creativecommons.org/licenses/by/2.0/';

const PERSON = new Set(['/m/01g317', '/m/04yx4', '/m/03bt1vf', '/m/01bl7v', '/m/05r655']);
/** Thẻ cảnh (nhãn ảnh của Open Images) → nhóm lấy thêm, kèm số ảnh tối đa mỗi nhóm. */
const HORIZON = [
  '/m/0d1n2',
  '/m/06npx',
  '/m/05kq4',
  '/m/0b3yr',
  '/m/04h4w',
  '/m/01lxd',
  '/m/0brn2d',
];
const LEAD = ['/m/06gfj', '/m/02zh30', '/m/06d_3', '/m/01c8br', '/m/01phq4'];
const BOOST: Record<string, { tags: string[]; max: number }> = TARGETED
  ? {
      // + hoàng hôn, sa mạc; + bậc thang; đối xứng, vòm, cửa, chân dung, cô dâu.
      horizon: { tags: [...HORIZON, '/m/01b2w5', '/m/0284w'], max: 450 },
      lead: { tags: [...LEAD, '/m/01lynh'], max: 350 },
      center: { tags: ['/m/0f28m', '/m/0dpvm', '/m/02dgv', '/m/01dv4h', '/m/0ltfs'], max: 250 },
      group: { tags: ['/m/011l78'], max: 150 },
    }
  : {
      horizon: { tags: HORIZON, max: 450 },
      lead: { tags: LEAD, max: 450 },
      group: { tags: ['/m/011l78'], max: 200 },
      portrait: { tags: ['/m/01dv4h', '/m/0sgh53y', '/m/0f28m'], max: 300 },
    };
/** --targeted: bỏ ảnh xe, thể thao, sân khấu, đồ ăn (không phải ảnh người được nhờ chụp). */
const EXCLUDE = [
  ...['/m/0k4j', '/m/01prls', '/m/04_sv', '/m/0h8mhzd', '/m/01226z', '/m/01jddz'],
  ...['/m/04_5hy', '/m/02wbm', '/m/07bs0', '/m/06z6r', '/m/03k3r'],
];
/** --targeted: số người rõ (khung riêng ≥ 1% ảnh) từ chừng này trở lên thì vào nhóm "group". */
const GROUP_PEOPLE = 3;

/** CSV theo RFC 4180 (tên tác giả, tiêu đề có dấu phẩy và ngoặc kép). */
function* csvRows(file: string): Generator<string[]> {
  const text = fs.readFileSync(file, 'utf8');
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      yield row;
      row = [];
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    yield row;
  }
}

/** Đọc một bảng CSV; `idx('Cột')` là vị trí cột (báo lỗi ngay nếu file thiếu cột). */
function table(file: string) {
  const rows = csvRows(path.join(META, file));
  const head = rows.next().value as string[];
  const idx = (name: string): number => {
    const i = head.indexOf(name);
    if (i < 0) throw new Error(`${file}: thiếu cột ${name}`);
    return i;
  };
  return { idx, rows };
}

type Info = { license: string; author: string; landing: string; title: string; rotation: string };
const info = new Map<string, Info>();
{
  const { idx, rows } = table(`${SUBSET}-images-with-rotation.csv`);
  for (const r of rows) {
    if (r.length < 5) continue;
    info.set(r[idx('ImageID')]!, {
      license: r[idx('License')]!,
      author: r[idx('Author')]!,
      landing: r[idx('OriginalLandingURL')]!,
      title: r[idx('Title')]!,
      rotation: r[idx('Rotation')] ?? '',
    });
  }
}

type People = {
  maxArea: number;
  count: number;
  /** Số người có khung riêng ≥ 1% ảnh. */
  clear: number;
  group: boolean;
  depiction: boolean;
};
const people = new Map<string, People>();
{
  const { idx, rows } = table(`${SUBSET}-annotations-bbox.csv`);
  for (const r of rows) {
    if (!PERSON.has(r[idx('LabelName')]!)) continue;
    const id = r[idx('ImageID')]!;
    const area =
      (Number(r[idx('XMax')]) - Number(r[idx('XMin')])) *
      (Number(r[idx('YMax')]) - Number(r[idx('YMin')]));
    const p = people.get(id) ?? { maxArea: 0, count: 0, clear: 0, group: false, depiction: false };
    if (r[idx('IsDepiction')] === '1') p.depiction = true;
    else {
      p.count += r[idx('IsGroupOf')] === '1' ? 5 : 1;
      if (r[idx('IsGroupOf')] === '1') p.group = true;
      else {
        p.maxArea = Math.max(p.maxArea, area);
        if (area >= 0.01) p.clear++;
      }
    }
    people.set(id, p);
  }
}

const tags = new Map<string, Set<string>>();
{
  const wanted = new Set([...Object.values(BOOST).flatMap((b) => b.tags), ...EXCLUDE]);
  const short = SUBSET === 'test' ? 'test' : 'val';
  const { idx, rows } = table(`oidv7-${short}-annotations-human-imagelabels.csv`);
  for (const r of rows) {
    if (r[idx('Confidence')] !== '1' || !wanted.has(r[idx('LabelName')]!)) continue;
    const id = r[idx('ImageID')]!;
    if (!tags.has(id)) tags.set(id, new Set());
    tags.get(id)!.add(r[idx('LabelName')]!);
  }
}

const ok = [...people.entries()]
  .filter(([id, p]) => {
    const i = info.get(id);
    return (
      i &&
      i.license === CC_BY &&
      (i.rotation === '' || i.rotation === '0' || i.rotation === '0.0') &&
      !p.depiction &&
      p.maxArea >= MIN_AREA &&
      !(TARGETED && EXCLUDE.some((t) => tags.get(id)?.has(t)))
    );
  })
  .map(([id]) => id)
  .sort();

// Xáo có seed (mulberry32) để chạy lại ra cùng tập ảnh.
let seed = 0x5b5b;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const shuffled = ok
  .map((id) => [rnd(), id] as const)
  .sort((a, b) => a[0] - b[0])
  .map((x) => x[1]);

const MANIFEST = path.join(ROOT, 'manifest.json');
type Entry = Record<string, unknown> & { id: string };
const existing: Entry[] = fs.existsSync(MANIFEST)
  ? (JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) as Entry[])
  : [];
const have = new Set(existing.map((e) => e.id));

const chosen = new Map<string, string>();
for (const [group, b] of Object.entries(BOOST)) {
  let n = 0;
  for (const id of shuffled) {
    if (n >= b.max || chosen.size >= TARGET) break;
    if (chosen.has(id) || have.has(id)) continue;
    const byTag = b.tags.some((t) => tags.get(id)?.has(t));
    const byCount = TARGETED && group === 'group' && people.get(id)!.clear >= GROUP_PEOPLE;
    if (byTag || byCount) {
      chosen.set(id, group);
      n++;
    }
  }
}
if (!TARGETED) {
  for (const id of shuffled) {
    if (chosen.size >= TARGET) break;
    if (!chosen.has(id) && !have.has(id)) chosen.set(id, 'random');
  }
}

console.log(
  `ảnh có người hợp lệ: ${ok.length}; chọn ${chosen.size}:`,
  Object.fromEntries(
    [...new Set(chosen.values())].map((g) => [
      g,
      [...chosen.values()].filter((v) => v === g).length,
    ]),
  ),
);

fs.mkdirSync(IMAGES, { recursive: true });
const ids = [...chosen.keys()];
let done = 0;
let failed = 0;
const worker = async () => {
  for (;;) {
    const id = ids.pop();
    if (!id) return;
    const file = path.join(IMAGES, `${id}.jpg`);
    if (!fs.existsSync(file)) {
      try {
        const res = await fetch(`${S3}/${id}.jpg`);
        if (!res.ok) throw new Error(String(res.status));
        fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      } catch (e) {
        failed++;
        console.warn(id, (e as Error).message);
        chosen.delete(id);
        continue;
      }
    }
    if (++done % 200 === 0) console.log(`đã tải ${done}`);
  }
};
await Promise.all(Array.from({ length: 8 }, worker));

const added = [...chosen.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([id, pool]) => {
    const i = info.get(id)!;
    const p = people.get(id)!;
    return {
      id,
      pool,
      subset: SUBSET,
      file: `images/${id}.jpg`,
      license: 'CC BY 2.0',
      author: i.author,
      title: i.title,
      source: i.landing,
      people: p.count,
      maxPersonArea: Number(p.maxArea.toFixed(3)),
      tags: [...(tags.get(id) ?? [])],
    };
  });
const manifest = [...existing, ...added];
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
console.log(`xong: thêm ${added.length} ảnh (tổng ${manifest.length}), lỗi ${failed}`);
