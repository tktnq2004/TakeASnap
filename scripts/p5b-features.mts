/**
 * Phase 5b, Bước 2: chạy đúng trang WebView của app (composition-critic `page.ts`: tách người,
 * khung xương, mắt, vector ảnh MobileNetV3 small) trên mọi ảnh có nhãn, trong Chrome headless.
 *
 *   node scripts/p5b-features.mts [số tiến trình, mặc định 3]
 *   node scripts/p5b-features.mts 3 --large      chỉ vector ảnh MobileNetV3 large
 *   node scripts/p5b-features.mts 3 --subset wikimedia   mọi ảnh của một nguồn, kể cả chưa có nhãn
 *
 * Ghi eval/composition/features.json: { id: Raw không có lưới / ảnh xám (chỉ người, khung xương,
 * mắt, vector ảnh) }. Ảnh đã có thì bỏ qua (chạy tiếp được khi bị ngắt). Dùng GPU thật của máy cho
 * nhanh; tách người trên điện thoại cũng chạy GPU. `--large`: chỉ vector ảnh bằng MobileNetV3 large
 * (không tách người), ghi eval/composition/embeddings-large.json ({ id: number[] }).
 *
 * Node không bỏ kiểu TypeScript trong node_modules nên nạp analyzer từ bản clone composition-critic
 * cạnh app (hoặc COMPOSITION_CRITIC_DIR), như scripts/build-sample-poses.mts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA = path.join(ROOT, 'eval', 'composition');
const LARGE = process.argv.includes('--large');
const OUT = path.join(DATA, LARGE ? 'embeddings-large.json' : 'features.json');
const WORKERS = Number(process.argv[2] ?? 3);
const CRITIC_DIR =
  process.env.COMPOSITION_CRITIC_DIR ?? path.resolve(ROOT, '../composition-critic');
const { createAnalyzer } = (await import(
  pathToFileURL(path.join(CRITIC_DIR, 'src/node/analyzer.ts')).href
)) as typeof import('composition-critic/node');

const labels = JSON.parse(fs.readFileSync(path.join(DATA, 'labels-claude.json'), 'utf8')) as Record<
  string,
  string[]
>;
type Stored = Record<string, unknown> | number[];
const done: Record<string, Stored> = fs.existsSync(OUT)
  ? (JSON.parse(fs.readFileSync(OUT, 'utf8')) as Record<string, Stored>)
  : {};
// --subset wikimedia: mọi ảnh của nguồn đó trong manifest, kể cả chưa có nhãn (lọc ảnh có người).
const si = process.argv.indexOf('--subset');
const SUBSET = si > 0 ? process.argv[si + 1] : null;
const pool = SUBSET
  ? (
      JSON.parse(fs.readFileSync(path.join(DATA, 'manifest.json'), 'utf8')) as {
        id: string;
        subset?: string;
      }[]
    )
      .filter((m) => m.subset === SUBSET)
      .map((m) => m.id)
  : Object.keys(labels);
const todo = pool.filter((id) => !done[id]);
console.log(
  `ảnh có nhãn ${Object.keys(labels).length}, đã có ${Object.keys(done).length}, còn ${todo.length}`,
);

let n = 0;
let failed = 0;
const t0 = Date.now();
const save = () => fs.writeFileSync(OUT, JSON.stringify(done));
const worker = async () => {
  const a = await createAnalyzer({ embed: true, gpu: true });
  try {
    for (;;) {
      const id = todo.pop();
      if (!id) return;
      try {
        const file = path.join(DATA, 'images', `${id}.jpg`);
        if (LARGE) done[id] = await a.embedFile(file, true);
        else {
          const { raw } = await a.analyzeFile(file);
          // Bỏ lưới người và ảnh xám (lớn, không dùng để huấn luyện).
          const { grid: _g, gray: _y, sky: _s, ...keep } = raw;
          done[id] = keep;
        }
      } catch (e) {
        failed++;
        console.warn(id, (e as Error).message);
      }
      if (++n % 50 === 0) {
        save();
        const rate = (Date.now() - t0) / n / 1000;
        console.log(
          `${n}/${todo.length + n} · ${rate.toFixed(1)} s/ảnh · còn ~${Math.round((rate * todo.length) / 60)} phút`,
        );
      }
    }
  } finally {
    await a.close();
  }
};
await Promise.all(Array.from({ length: WORKERS }, worker));
save();
console.log(`xong: ${Object.keys(done).length} ảnh, lỗi ${failed}`);
process.exit(0);
