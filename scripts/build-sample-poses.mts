/**
 * Tách sẵn 25 pose mẫu (roadmap Phase 1, BR-13: pose mẫu không cần tải model).
 *
 * Chạy ĐÚNG trang WebView của app (src/engine/segmentation/web/segmenterHtml.ts, model Multiclass)
 * trong Chrome headless, rồi dùng ĐÚNG engine viền của app (src/engine/contour.ts). Kết quả là
 * assets/poses/samples.json chỉ chứa viền vector, không có ảnh mask.
 *
 *   npm run build:samples
 *   CHROME_PATH=/đường/dẫn/chrome npm run build:samples   (máy không phải Windows)
 *
 * Cần mạng (tải MediaPipe + model từ CDN) và Chrome đã cài.
 */
import fs from 'node:fs';
import path from 'node:path';

import puppeteer from 'puppeteer-core';

import { buildContours, personAreaRatio, type Contour } from '../src/engine/contour.ts';
import { buildLimbOutlines, unpackBodyPoints } from '../src/engine/limbs.ts';
import { MEDIAPIPE_VERSION, segmenterHtml } from '../src/engine/segmentation/web/segmenterHtml.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'assets/poses/source');
const OUT_FILE = path.join(ROOT, 'assets/poses/samples.json');
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
/** Độ phân giải dò viền, khớp mặc định của buildContours. */
const CONTOUR_SIDE = 512;
/** BR-06: người phải chiếm ít nhất 2% ảnh. */
const MIN_PERSON_RATIO = 0.02;

type Incoming =
  | { type: 'ready' | 'log'; message?: string }
  | {
      id: number;
      ok: true;
      maskBase64: string;
      width: number;
      height: number;
      backend: string;
      face?: number[] | null;
      bodyPoints?: number[] | null;
    }
  | { id: number; ok: false; error: string };

type SampleOut = {
  id: string;
  group: string;
  width: number;
  height: number;
  areaRatio: number;
  contours: { isHole: boolean; points: [number, number][] }[];
  /** Nét mặt: đoạn thẳng phẳng chuẩn hóa; null = không thấy. bodyPoints: 33 khớp [x, y, vis]. */
  face: number[] | null;
  bodyPoints: number[] | null;
  /** Ống tay chân: mỗi nét là polyline phẳng [x, y, …]. */
  limbs: number[][];
};

async function main() {
  const files = fs
    .readdirSync(SOURCE_DIR)
    .flatMap((group) =>
      fs
        .readdirSync(path.join(SOURCE_DIR, group))
        .filter((f) => /\.jpe?g$/i.test(f))
        .map((f) => ({
          group,
          file: path.join(SOURCE_DIR, group, f),
          id: f.replace(/\.\w+$/, ''),
        })),
    )
    .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage();
  const inbox: Incoming[] = [];
  await page.exposeFunction('__rnPost', (s: string) => inbox.push(JSON.parse(s) as Incoming));
  await page.evaluateOnNewDocument(() => {
    (window as unknown as { ReactNativeWebView: object }).ReactNativeWebView = {
      postMessage: (s: string) =>
        (window as unknown as { __rnPost: (s: string) => void }).__rnPost(s),
    };
  });
  // Trang cần origin https để import module MediaPipe từ CDN (about:blank không chạy).
  await page.goto('https://example.com/', { waitUntil: 'domcontentloaded' });
  await page.setContent(segmenterHtml, { waitUntil: 'load' });

  const waitFor = async <T extends Incoming>(pred: (m: Incoming) => boolean, ms: number) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const i = inbox.findIndex(pred);
      if (i >= 0) return inbox.splice(i, 1)[0] as T;
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error('Hết thời gian chờ WebView');
  };
  await waitFor((m) => 'type' in m && m.type === 'ready', 60_000);

  const items: SampleOut[] = [];
  let id = 1;
  for (const s of files) {
    const base64 = fs.readFileSync(s.file).toString('base64');
    const myId = id++;
    await page.evaluate(
      (m) => window.postMessage(m, '*'),
      JSON.stringify({ id: myId, type: 'segment', model: 'multiclass', base64 }),
    );
    const res = await waitFor((m) => 'id' in m && m.id === myId, 120_000);
    if (!('ok' in res) || !res.ok) {
      throw new Error(`${s.id}: ${'error' in res ? res.error : 'không rõ lỗi'}`);
    }

    // Đọc kênh alpha của mask ở cạnh dài 512 bằng canvas của trang (không cần thư viện PNG).
    const grid = await page.evaluate(
      async (mask64: string, side: number) => {
        const img = new Image();
        await new Promise((r) => {
          img.onload = r;
          img.src = 'data:image/png;base64,' + mask64;
        });
        const k = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * k);
        const h = Math.round(img.naturalHeight * k);
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        const d = ctx.getImageData(0, 0, w, h).data;
        const alpha: number[] = new Array(w * h);
        for (let i = 0; i < w * h; i++) alpha[i] = d[i * 4 + 3]! / 255;
        return { width: w, height: h, data: alpha };
      },
      res.maskBase64,
      CONTOUR_SIDE,
    );

    // Ảnh xám cùng kích thước mask: ống tay chân bám vào mép thật trong ảnh.
    const gray = await page.evaluate(
      async (img64: string, w: number, h: number) => {
        const img = new Image();
        await new Promise((r) => {
          img.onload = r;
          img.src = 'data:image/jpeg;base64,' + img64;
        });
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        const d = ctx.getImageData(0, 0, w, h).data;
        const out: number[] = new Array(w * h);
        for (let i = 0; i < w * h; i++) {
          out[i] = (0.299 * d[i * 4]! + 0.587 * d[i * 4 + 1]! + 0.114 * d[i * 4 + 2]!) / 255;
        }
        return { width: w, height: h, data: out };
      },
      base64,
      grid.width,
      grid.height,
    );

    const contours: Contour[] = buildContours(grid, { maxSide: CONTOUR_SIDE });
    const areaRatio = personAreaRatio(contours);

    // Nét mặt + khung xương bằng đúng lệnh của WebView.
    const lmId = id++;
    await page.evaluate(
      (m) => window.postMessage(m, '*'),
      JSON.stringify({ id: lmId, type: 'landmarks', base64 }),
    );
    const lm = await waitFor((m) => 'id' in m && m.id === lmId, 120_000);
    if (!('ok' in lm) || !lm.ok) {
      throw new Error(`${s.id} landmarks: ${'error' in lm ? lm.error : 'không rõ lỗi'}`);
    }
    const face = lm.face ?? null;
    const bodyPoints = lm.bodyPoints ?? null;
    // Ống tay chân: cùng engine với app, trên chính lưới mask dùng để dò viền.
    const limbs = bodyPoints
      ? buildLimbOutlines(grid, unpackBodyPoints(bodyPoints), { image: gray }).map((line) =>
          line.flatMap((p) => [p.x, p.y]),
        )
      : [];

    const warn = areaRatio < MIN_PERSON_RATIO ? '  ⚠ người quá nhỏ (BR-06)' : '';
    console.log(
      `${s.id.padEnd(10)} ${res.width}×${res.height}  viền ${contours.length}  ` +
        `điểm ${contours.reduce((n, c) => n + c.points.length, 0)}  người ${(areaRatio * 100).toFixed(1)}%  ` +
        `mặt ${face ? face.length / 4 : '—'}  ống tay chân ${limbs.length}${warn}`,
    );
    items.push({
      id: s.id,
      group: s.group,
      width: res.width,
      height: res.height,
      areaRatio: Math.round(areaRatio * 10000) / 10000,
      contours: contours.map((c) => ({
        isHole: c.isHole,
        points: c.points.map((p) => [p.x, p.y] as [number, number]),
      })),
      face,
      bodyPoints,
      limbs,
    });
  }
  await browser.close();

  const out = { version: 3, model: 'multiclass', mediapipe: MEDIAPIPE_VERSION, items };
  fs.writeFileSync(OUT_FILE, JSON.stringify(out) + '\n');
  const kb = (fs.statSync(OUT_FILE).size / 1024).toFixed(0);
  console.log(`Đã ghi ${path.relative(ROOT, OUT_FILE)} (${items.length} pose, ${kb} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
