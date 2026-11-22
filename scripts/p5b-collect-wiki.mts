/**
 * Phase 5b vòng 3: ảnh người đời thường từ Wikimedia Commons (gần ảnh của app hơn Open Images:
 * du lịch, phố, bãi biển, nhóm bạn, chân dung ngoài trời).
 *
 *   node scripts/p5b-collect-wiki.mts [số ảnh tối đa, mặc định 1200]
 *
 * Tìm bằng API của Commons (generator=search, ảnh bitmap), lọc: giấy phép tự do cho phép dùng lại
 * và huấn luyện (CC BY, CC BY-SA, CC0, public domain), ngày chụp từ năm 2000 (bỏ ảnh lưu trữ cũ),
 * cạnh dài ≥ 800 px, tỉ lệ 1:2–2:1. Tải ảnh thu nhỏ cạnh dài 1024 px về eval/composition/images/
 * w<pageid>.jpg, gộp vào manifest.json (subset "wikimedia", tác giả, giấy phép, link gốc; BR-16).
 * Ảnh không có người (hoặc người quá nhỏ) bị lọc sau, khi trích đặc trưng. eval/ không commit.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', 'eval', 'composition');
const IMAGES = path.join(ROOT, 'images');
const MANIFEST = path.join(ROOT, 'manifest.json');
const MAX = Number(process.argv[2] ?? 1200);
const API = 'https://commons.wikimedia.org/w/api.php';
/** Commons yêu cầu User-Agent mô tả; không gửi thông tin cá nhân. */
const UA = 'TakeASnap-research/0.3 (educational composition study)';

const QUERIES = [
  'tourist posing',
  'woman posing park',
  'man posing street',
  'friends posing',
  'family portrait outdoor',
  'couple portrait',
  'girl portrait outdoor',
  'boy portrait outdoor',
  'woman beach',
  'man beach sunset',
  'people on bridge',
  'woman walking road',
  'selfie',
  'group photo friends',
  'student portrait',
  'travel portrait',
  'woman standing doorway',
  'man standing alley',
  'people sitting bench',
  'hiker portrait mountain',
  'couple walking path',
  'child portrait park',
  'woman cafe portrait',
  'man portrait city',
  'people pier',
  'woman lake',
  'wedding couple portrait',
  'graduation portrait',
  'street portrait',
  'festival portrait',
  'woman field',
  'man standing beach',
  'family beach',
  'friends hiking',
  'woman temple',
  'man old town',
  'girl flowers',
  'couple sunset',
  'woman stairs',
  'man railway',
];
const LICENSE = /^(CC BY(-SA)? \d(\.\d)?|CC0|Public domain|No restrictions)$/i;

type Page = {
  pageid: number;
  title: string;
  imageinfo?: {
    width: number;
    height: number;
    thumburl?: string;
    descriptionurl: string;
    extmetadata?: Record<string, { value: string }>;
  }[];
};

const strip = (html: string | undefined) =>
  (html ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function search(q: string, offset: number): Promise<Page[]> {
  const url = new URL(API);
  const params: Record<string, string> = {
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch: `filetype:bitmap ${q}`,
    gsrnamespace: '6',
    gsrlimit: '50',
    gsroffset: String(offset),
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata',
    iiurlwidth: '1024',
    iiextmetadatafilter: 'LicenseShortName|Artist|DateTimeOriginal',
  };
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`search ${res.status}`);
  const d = (await res.json()) as { query?: { pages?: Record<string, Page> } };
  return Object.values(d.query?.pages ?? {});
}

const existing = fs.existsSync(MANIFEST)
  ? (JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) as { id: string }[])
  : [];
const have = new Set(existing.map((e) => e.id));
type Pick = { id: string; thumb: string; entry: Record<string, unknown> };
const picks = new Map<string, Pick>();
const reasons: Record<string, number> = {};
const skip = (why: string) => (reasons[why] = (reasons[why] ?? 0) + 1);

for (const q of QUERIES) {
  for (const offset of [0, 50]) {
    if (picks.size >= MAX) break;
    let pages: Page[] = [];
    try {
      pages = await search(q, offset);
    } catch (e) {
      console.warn(q, (e as Error).message);
    }
    for (const p of pages) {
      const ii = p.imageinfo?.[0];
      const id = `w${p.pageid}`;
      if (!ii?.thumburl) continue;
      if (have.has(id) || picks.has(id)) continue;
      const m = ii.extmetadata ?? {};
      const license = strip(m.LicenseShortName?.value);
      const year = Number(/(\d{4})/.exec(m.DateTimeOriginal?.value ?? '')?.[1] ?? 0);
      const long = Math.max(ii.width, ii.height);
      const ratio = ii.width / ii.height;
      if (!LICENSE.test(license)) skip('giấy phép');
      else if (year < 2000) skip('trước 2000 / không rõ năm');
      else if (long < 800) skip('ảnh nhỏ');
      else if (ratio < 0.5 || ratio > 2) skip('tỉ lệ');
      else
        picks.set(id, {
          id,
          thumb: ii.thumburl,
          entry: {
            id,
            pool: q,
            subset: 'wikimedia',
            file: `images/${id}.jpg`,
            license,
            author: strip(m.Artist?.value),
            title: p.title.replace(/^File:/, ''),
            source: ii.descriptionurl,
            year,
          },
        });
    }
    await sleep(300);
  }
  console.log(`${q}: tổng ${picks.size}`);
  if (picks.size >= MAX) break;
}
console.log('bỏ:', reasons);

fs.mkdirSync(IMAGES, { recursive: true });
const queue = [...picks.values()];
const failed = new Set<string>();
let done = 0;
await Promise.all(
  Array.from({ length: 2 }, async () => {
    for (;;) {
      const p = queue.pop();
      if (!p) return;
      const file = path.join(IMAGES, `${p.id}.jpg`);
      if (!fs.existsSync(file)) {
        for (let attempt = 0; ; attempt++) {
          try {
            const res = await fetch(p.thumb, { headers: { 'user-agent': UA } });
            if (res.status === 429 && attempt < 4) {
              await sleep(5000 * (attempt + 1));
              continue;
            }
            if (!res.ok) throw new Error(String(res.status));
            fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
            break;
          } catch (e) {
            failed.add(p.id);
            console.warn(p.id, (e as Error).message);
            break;
          }
        }
        await sleep(400);
      }
      if (++done % 100 === 0) console.log(`đã tải ${done}/${picks.size}`);
    }
  }),
);

const added = [...picks.values()].filter((p) => !failed.has(p.id)).map((p) => p.entry);
fs.writeFileSync(MANIFEST, JSON.stringify([...existing, ...added], null, 1));
console.log(`xong: thêm ${added.length} ảnh Wikimedia, lỗi ${failed.size}`);
