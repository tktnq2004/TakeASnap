/**
 * Đo độ đúng của quy tắc nhận xét (roadmap Phase 5 Bước 3, cổng ≥ 70%) trên máy tính, không cần
 * người chấm từng ảnh.
 *
 * 1. Ảnh gốc: 32 ảnh pose mẫu (assets/poses/source) + ảnh thử trong eval/photos/<nhóm>/ (tải từ
 *    Wikimedia Commons hoặc người dùng thêm; thư mục eval/ không đưa lên git).
 * 2. Chạy ĐÚNG trang WebView của app trong Chrome headless (như build-sample-poses): ảnh thu nhỏ
 *    1024 → tách người (lưới 512) + khung xương → `photoFeatures`, như `usePhotoReview`.
 * 3. Tờ soát eval/out/sources-*.jpg: khung người, mắt, khớp vẽ lên từng ảnh gốc. Ảnh app nhận sai
 *    ghi vào eval/verify.json `{ "bad": ["id"] }` thì bỏ qua; nhãn tay cho ảnh nhóm:
 *    `{ "group": { "x-group3": "level" | "staggered" } }`.
 * 4. Từ ảnh gốc đã soát, cắt nhiều khung có đáp án biết trước (mắt vào 1/3, người ở giữa, cắt
 *    ngang gối, …). Đáp án = quy tắc áp lên khớp / khung người của ảnh gốc dời vào khung cắt; khung
 *    nào mà đáp án không đúng như ý định thì bỏ. Chạy lại model trên ảnh cắt, so dòng nhận xét.
 * 5. Báo cáo eval/out/report.md: đúng / sai theo loại khung, dòng nhận xét, kỹ thuật; ảnh ca sai
 *    trong eval/out/fail/. Kết quả model lưu eval/out/cache.json: chỉnh ngưỡng rồi chạy lại rất nhanh.
 *
 *   npm run eval:review
 *
 * Cần mạng (MediaPipe + model từ CDN) và Chrome đã cài (CHROME_PATH nếu không phải Windows).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import puppeteer, { type Page } from 'puppeteer-core';

import { groupPeople, labelRegions } from '../src/engine/regions.ts';
import { segmenterHtml } from '../src/engine/segmentation/web/segmenterHtml.ts';
import { J, photoFeatures, type PhotoFeatures } from '../src/features/composition/features.ts';
import { allNotes, type NoteId } from '../src/features/composition/review.ts';
import type { TechniqueId } from '../src/features/composition/techniques.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const SAMPLE_DIR = path.join(ROOT, 'assets/poses/source');
const EVAL_DIR = path.join(ROOT, 'eval');
const PHOTO_DIR = path.join(EVAL_DIR, 'photos');
const OUT_DIR = path.join(EVAL_DIR, 'out');
const CACHE_FILE = path.join(OUT_DIR, 'cache.json');
const VERIFY_FILE = path.join(EVAL_DIR, 'verify.json');
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
/** Như app: prepareImage 1024, lưới 512, BR-06 2%. */
const IMAGE_SIDE = 1024;
const GRID_SIDE = 512;
const MIN_PERSON_RATIO = 0.02;
/** Ảnh cắt nhỏ hơn chừng này (px ảnh gốc, cạnh dài) thì bỏ: quá mờ, không giống ảnh thật. */
const MIN_CROP_PX = 480;

type Box = [number, number, number, number];
type Pt = { x: number; y: number };
type Crop = { x: number; y: number; w: number; h: number };
/** Kết quả thô của model trên một ảnh (đủ để dựng lại PhotoFeatures với ngưỡng mới). */
type Raw = {
  width: number;
  height: number;
  gridW: number;
  gridH: number;
  people: { bbox: Box; areaRatio: number }[];
  body: number[] | null;
  /** Mọi khung xương (thêm sau: bản lưu cũ không có thì chạy lại khi cần, ví dụ ảnh nhóm). */
  bodies?: number[][];
};
type Source = { id: string; file: string; group: string };
type Case = {
  id: string;
  src: string;
  kind: string;
  crop: Crop;
  technique: TechniqueId;
  expect: NoteId[];
  reject: NoteId[];
};

type Incoming =
  | { type: 'ready' | 'log'; message?: string }
  | ({ id: number; ok: true } & Record<string, unknown>)
  | { id: number; ok: false; error: string };

// ---------------------------------------------------------------------------------------------
// Chrome + trang WebView của app

async function openPage() {
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
  await page.goto('https://example.com/', { waitUntil: 'domcontentloaded' });
  await page.setContent(segmenterHtml, { waitUntil: 'load' });

  const waitFor = async (pred: (m: Incoming) => boolean, ms: number) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const i = inbox.findIndex(pred);
      if (i >= 0) return inbox.splice(i, 1)[0]!;
      await new Promise((r) => setTimeout(r, 30));
    }
    throw new Error('Hết thời gian chờ WebView');
  };
  await waitFor((m) => 'type' in m && m.type === 'ready', 60_000);

  let nextId = 1;
  const request = async (payload: Record<string, unknown>) => {
    const id = nextId++;
    await page.evaluate((m) => window.postMessage(m, '*'), JSON.stringify({ id, ...payload }));
    const res = await waitFor((m) => 'id' in m && m.id === id, 180_000);
    if (!('ok' in res) || !res.ok) throw new Error('error' in res ? res.error : 'không rõ lỗi');
    return res as Record<string, unknown>;
  };
  return { browser, page, request };
}

/** Nạp ảnh gốc (độ phân giải đầy đủ) vào trang, giữ ở window.__src để cắt nhiều lần. */
async function loadSource(page: Page, file: string) {
  const b64 = fs.readFileSync(file).toString('base64');
  return page.evaluate(async (data: string) => {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('Không giải mã được ảnh'));
      img.src = 'data:image/jpeg;base64,' + data;
    });
    (window as unknown as { __src: HTMLImageElement }).__src = img;
    return { w: img.naturalWidth, h: img.naturalHeight };
  }, b64);
}

/** Cắt khung (chuẩn hóa) từ ảnh gốc trong trang, thu nhỏ cạnh dài 1024, JPEG 0.9 như prepareImage. */
async function cropJpeg(page: Page, c: Crop) {
  return page.evaluate(
    (cr: Crop, side: number) => {
      const img = (window as unknown as { __src: HTMLImageElement }).__src;
      const W = img.naturalWidth;
      const H = img.naturalHeight;
      const sw = cr.w * W;
      const sh = cr.h * H;
      const k = Math.min(1, side / Math.max(sw, sh));
      const cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(sw * k));
      cv.height = Math.max(1, Math.round(sh * k));
      cv.getContext('2d')!.drawImage(img, cr.x * W, cr.y * H, sw, sh, 0, 0, cv.width, cv.height);
      return { b64: cv.toDataURL('image/jpeg', 0.9).split(',')[1]!, w: cv.width, h: cv.height };
    },
    c,
    IMAGE_SIDE,
  );
}

async function analyze(
  page: Page,
  request: (p: Record<string, unknown>) => Promise<Record<string, unknown>>,
  b64: string,
): Promise<Raw> {
  const seg = await request({ type: 'segment', model: 'multiclass', base64: b64, gridSide: GRID_SIDE });
  const g = seg.grid as { width: number; height: number; base64: string };
  const bytes = Buffer.from(g.base64, 'base64');
  const data = new Float32Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) data[i] = bytes[i]! / 255;
  const people = groupPeople(labelRegions({ width: g.width, height: g.height, data }), MIN_PERSON_RATIO);
  const lm = await request({ type: 'landmarks', base64: b64 });
  return {
    width: seg.width as number,
    height: seg.height as number,
    gridW: g.width,
    gridH: g.height,
    people: people.map((p) => ({ bbox: p.bbox, areaRatio: p.areaRatio })),
    body: (lm.bodyPoints as number[] | null) ?? null,
    bodies: (lm.bodies as number[][] | undefined) ?? [],
  };
}

const featuresOf = (r: Raw): PhotoFeatures =>
  photoFeatures({
    width: r.width,
    height: r.height,
    gridW: r.gridW,
    gridH: r.gridH,
    people: r.people,
    body: r.body,
    bodies: r.bodies,
  });

// ---------------------------------------------------------------------------------------------
// Khung cắt có đáp án

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const FULL: Crop = { x: 0, y: 0, w: 1, h: 1 };

/**
 * Khung lớn nhất tỉ lệ `aspect` (rộng / cao theo px) nằm trong ảnh, đặt điểm `a` (chuẩn hóa theo
 * ảnh gốc) vào vị trí (tx, ty) của khung. Null khi khung quá nhỏ.
 */
function placeAt(a: Pt, tx: number, ty: number, iw: number, ih: number, aspect = 0.75): Crop | null {
  const ax = a.x * iw;
  const ay = a.y * ih;
  const H = Math.min(
    tx > 0 ? ax / (aspect * tx) : Infinity,
    tx < 1 ? (iw - ax) / (aspect * (1 - tx)) : Infinity,
    ty > 0 ? ay / ty : Infinity,
    ty < 1 ? (ih - ay) / (1 - ty) : Infinity,
  );
  const W = aspect * H;
  if (Math.max(W, H) < MIN_CROP_PX || !Number.isFinite(H)) return null;
  return { x: (ax - tx * W) / iw, y: (ay - ty * H) / ih, w: W / iw, h: H / ih };
}

/** Khung chữ nhật theo tọa độ chuẩn hóa, kẹp trong ảnh; null khi quá nhỏ. */
function rect(x0: number, y0: number, x1: number, y1: number, iw: number, ih: number): Crop | null {
  const a = clamp01(x0);
  const b = clamp01(y0);
  const c = clamp01(x1);
  const d = clamp01(y1);
  if (Math.max((c - a) * iw, (d - b) * ih) < MIN_CROP_PX || c - a < 0.15 || d - b < 0.15) return null;
  return { x: a, y: b, w: c - a, h: d - b };
}

/** Khung tỉ lệ 3:4 tâm (cx, cy), cao H px, dời cho nằm trong ảnh; null khi không vừa ảnh. */
function centered(cx: number, cy: number, H: number, iw: number, ih: number): Crop | null {
  const W = 0.75 * H;
  if (H > ih + 0.5 || W > iw + 0.5 || Math.max(W, H) < MIN_CROP_PX) return null;
  const x = Math.min(Math.max(cx * iw - W / 2, 0), iw - W);
  const y = Math.min(Math.max(cy * ih - H / 2, 0), ih - H);
  return { x: x / iw, y: y / ih, w: W / iw, h: H / ih };
}

/** Đặc trưng của ảnh gốc dời vào khung cắt: "đáp án" của khung đó. */
function truthIn(f: PhotoFeatures, c: Crop): PhotoFeatures {
  const tx = (x: number) => (x - c.x) / c.w;
  const ty = (y: number) => (y - c.y) / c.h;
  const people = f.people.map((p) => {
    const [x0, y0, x1, y1] = p.box;
    const cx0 = clamp01(tx(x0));
    const cy0 = clamp01(ty(y0));
    const cx1 = clamp01(tx(x1));
    const cy1 = clamp01(ty(y1));
    const full = (x1 - x0) * (y1 - y0);
    const kept = full > 0 ? ((cx1 - cx0) * (cy1 - cy0) * c.w * c.h) / full : 0;
    return { box: [cx0, cy0, cx1, cy1] as Box, area: (p.area * kept) / (c.w * c.h) };
  });
  return {
    aspect: f.aspect * (c.w / c.h),
    people,
    main: f.main,
    eye: f.eye ? { x: tx(f.eye.x), y: ty(f.eye.y) } : null,
    joints: f.joints ? f.joints.map((j) => ({ x: tx(j.x), y: ty(j.y), v: j.v })) : null,
    facing: f.facing,
    heads: f.heads.map((h) => ({ x: tx(h.x), y: ty(h.y), scale: h.scale / c.h })),
  };
}

const vis = (f: PhotoFeatures, i: number) => {
  const j = f.joints?.[i];
  return j && j.v >= 0.5 && j.x > 0.02 && j.x < 0.98 && j.y > 0.02 && j.y < 0.98 ? j : null;
};

function casesFor(src: string, f: PhotoFeatures, iw: number, ih: number): Case[] {
  const out: Case[] = [];
  const p = f.people[f.main];
  if (!p || !f.eye) return out;
  const E = f.eye;
  const [bx0, by0, bx1, by1] = p.box;
  const bw = bx1 - bx0;
  const bh = by1 - by0;
  const add = (
    kind: string,
    crop: Crop | null,
    technique: TechniqueId,
    expect: NoteId[],
    reject: NoteId[] = [],
  ) => {
    if (crop) out.push({ id: `${src}:${kind}`, src, kind, crop, technique, expect, reject });
  };

  // Quy tắc 1/3, ở giữa, selfie: đặt mắt vào chỗ định sẵn.
  add('thirds-left', placeAt(E, 1 / 3, 1 / 3, iw, ih), 'thirds', ['eyeOnThird', 'onVertical'], ['eyeOffThird', 'inMiddle', 'offVertical']);
  add('thirds-right', placeAt(E, 2 / 3, 1 / 3, iw, ih), 'thirds', ['eyeOnThird', 'onVertical'], ['eyeOffThird', 'inMiddle', 'offVertical']);
  add('thirds-middle', placeAt(E, 0.5, 1 / 3, iw, ih), 'thirds', ['inMiddle'], ['onVertical']);
  add('thirds-eye-low', placeAt(E, 1 / 3, 0.58, iw, ih), 'thirds', ['eyeOffThird'], ['eyeOnThird']);
  add('center-ok', placeAt(E, 0.5, 0.35, iw, ih), 'center', ['centered'], ['offCenter']);
  add('center-off', placeAt(E, 0.22, 0.35, iw, ih), 'center', ['offCenter'], ['centered']);
  add('selfie-high', placeAt(E, 0.5, 0.32, iw, ih), 'selfie', ['eyesHigh'], ['faceLow']);
  add('selfie-low', placeAt(E, 0.5, 0.68, iw, ih), 'selfie', ['faceLow'], ['eyesHigh']);

  // Lấp đầy khung: khung ôm sát người / khung rộng.
  const pcx = (bx0 + bx1) / 2;
  const pcy = (by0 + by1) / 2;
  add('fill-tight', centered(pcx, pcy, Math.max(bh * ih * 1.06, (bw * iw * 1.06) / 0.75), iw, ih), 'fill', ['fillOk'], ['fillSmall']);
  add('fill-loose', centered(pcx, pcy, (bh * ih) / 0.45, iw, ih), 'fill', ['fillSmall'], ['fillOk']);

  // Cắt ngang khớp: mép dưới qua gối / cổ chân, hoặc giữa đùi (không cắt khớp).
  const top = by0 - 0.04;
  const knee = [vis(f, J.kneeL), vis(f, J.kneeR)].filter(Boolean).sort((a, b) => b!.y - a!.y)[0];
  const ankle = [vis(f, J.ankleL), vis(f, J.ankleR)].filter(Boolean).sort((a, b) => b!.y - a!.y)[0];
  const hip = vis(f, J.hipL) ?? vis(f, J.hipR);
  if (knee) add('cut-knee', rect(0, top, 1, knee.y + 0.004, iw, ih), 'grid', ['cutKnee']);
  if (knee && hip) add('cut-thigh', rect(0, top, 1, (hip.y + knee.y) / 2, iw, ih), 'grid', [], ['cutKnee', 'cutAnkle']);
  if (ankle && knee) add('cut-ankle', rect(0, top, 1, ankle.y + 0.004, iw, ih), 'grid', ['cutAnkle'], ['cutKnee']);
  const ankles = [vis(f, J.ankleL), vis(f, J.ankleR)];
  if (ankles[0] && ankles[1] && knee) {
    const lowest = Math.max(ankles[0].y, ankles[1].y);
    if (lowest + 0.06 <= 1) add('low-feet-in', rect(0, top, 1, lowest + 0.06, iw, ih), 'low', ['feetIn'], ['feetCut']);
    add('low-feet-cut', rect(0, top, 1, (knee.y + lowest) / 2, iw, ih), 'low', ['feetCut'], ['feetIn']);
  }

  // Đầu chạm mép trên / chừa khoảng trên đầu.
  add('head-touch', rect(0, by0 + 0.02 * bh, 1, 1, iw, ih), 'grid', ['headTouch']);
  if (by0 - 0.12 * bh >= 0) add('head-room', rect(0, by0 - 0.12 * bh, 1, 1, iw, ih), 'grid', [], ['headTouch']);

  // Sát mép trái / phải: mép khung cắt vào người, người chiếm dưới 60% bề ngang.
  add('edge-left', rect(bx0 + 0.04 * bw, 0, bx0 + 0.04 * bw + bw * 2.2, 1, iw, ih), 'grid', ['edgeLeft'], ['edgeRight']);
  add('edge-right', rect(bx1 - 0.04 * bw - bw * 2.2, 0, bx1 - 0.04 * bw, 1, iw, ih), 'grid', ['edgeRight'], ['edgeLeft']);

  // Khoảng phía nhìn: người nhìn ra mép gần / nhìn vào giữa khung.
  if (f.facing) {
    const right = f.facing === 'right';
    add('look-tight', placeAt(E, right ? 0.8 : 0.2, 0.35, iw, ih), 'grid', ['noLookRoom']);
    add('look-room', placeAt(E, right ? 0.3 : 0.7, 0.35, iw, ih), 'grid', [], ['noLookRoom']);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Vẽ tờ soát / ảnh ca sai trong trang

type Tile = {
  b64: string;
  label: string;
  lines?: string[];
  box: Box | null;
  others: Box[];
  eye: Pt | null;
  joints: [number, number, number][];
  thirds?: boolean;
};

async function drawSheet(page: Page, tiles: Tile[], cols: number, tileW: number, tileH: number) {
  return page.evaluate(
    async (ts: Tile[], c: number, tw: number, th: number) => {
      const rows = Math.ceil(ts.length / c);
      const cv = document.createElement('canvas');
      cv.width = c * tw;
      cv.height = rows * th;
      const ctx = cv.getContext('2d')!;
      ctx.fillStyle = '#131416';
      ctx.fillRect(0, 0, cv.width, cv.height);
      for (let i = 0; i < ts.length; i++) {
        const t = ts[i]!;
        const img = new Image();
        await new Promise((r) => {
          img.onload = r;
          img.src = 'data:image/jpeg;base64,' + t.b64;
        });
        const textH = 18 * (1 + (t.lines?.length ?? 0));
        const k = Math.min(tw / img.naturalWidth, (th - textH) / img.naturalHeight);
        const w = img.naturalWidth * k;
        const h = img.naturalHeight * k;
        const ox = (i % c) * tw + (tw - w) / 2;
        const oy = Math.floor(i / c) * th + textH;
        ctx.drawImage(img, ox, oy, w, h);
        const X = (x: number) => ox + x * w;
        const Y = (y: number) => oy + y * h;
        if (t.thirds) {
          ctx.strokeStyle = 'rgba(255,255,255,0.6)';
          ctx.lineWidth = 1;
          for (const k3 of [1 / 3, 2 / 3]) {
            ctx.beginPath();
            ctx.moveTo(X(k3), oy);
            ctx.lineTo(X(k3), oy + h);
            ctx.moveTo(ox, Y(k3));
            ctx.lineTo(ox + w, Y(k3));
            ctx.stroke();
          }
        }
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(250,204,21,0.9)';
        for (const b of t.others) ctx.strokeRect(X(b[0]), Y(b[1]), X(b[2]) - X(b[0]), Y(b[3]) - Y(b[1]));
        if (t.box) {
          ctx.strokeStyle = '#8AB4F8';
          ctx.strokeRect(X(t.box[0]), Y(t.box[1]), X(t.box[2]) - X(t.box[0]), Y(t.box[3]) - Y(t.box[1]));
        }
        for (const [x, y, v] of t.joints) {
          ctx.fillStyle = v >= 0.5 ? '#34D399' : 'rgba(160,160,160,0.8)';
          ctx.beginPath();
          ctx.arc(X(x), Y(y), 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
        if (t.eye) {
          ctx.fillStyle = '#F43F5E';
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(X(t.eye.x), Y(t.eye.y), 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.fillStyle = '#E8EAED';
        ctx.font = '13px sans-serif';
        const lx = (i % c) * tw + 4;
        const ly = Math.floor(i / c) * th + 14;
        ctx.fillText(t.label, lx, ly);
        (t.lines ?? []).forEach((l, n) => ctx.fillText(l, lx, ly + 18 * (n + 1)));
      }
      return cv.toDataURL('image/jpeg', 0.85).split(',')[1]!;
    },
    tiles,
    cols,
    tileW,
    tileH,
  );
}

/** Khớp vẽ lên tờ soát: vai, khuỷu, cổ tay, hông, gối, cổ chân. */
const SHOWN = [J.shoulderL, J.shoulderR, J.elbowL, J.elbowR, J.wristL, J.wristR, J.hipL, J.hipR, J.kneeL, J.kneeR, J.ankleL, J.ankleR];

function tileOf(b64: string, f: PhotoFeatures, label: string, lines?: string[], thirds = false): Tile {
  return {
    b64,
    label,
    lines,
    thirds,
    box: f.main >= 0 ? f.people[f.main]!.box : null,
    others: f.people.filter((_, i) => i !== f.main).map((p) => p.box),
    eye: f.eye,
    joints: f.joints ? SHOWN.map((i) => f.joints![i]!).map((j) => [j.x, j.y, j.v]) : [],
  };
}

// ---------------------------------------------------------------------------------------------

function listSources(): Source[] {
  const out: Source[] = [];
  const scan = (dir: string, prefix: string) => {
    if (!fs.existsSync(dir)) return;
    for (const group of fs.readdirSync(dir)) {
      const gdir = path.join(dir, group);
      if (!fs.statSync(gdir).isDirectory()) continue;
      for (const f of fs.readdirSync(gdir)) {
        if (/\.jpe?g$/i.test(f)) out.push({ id: prefix + f.replace(/\.\w+$/, ''), file: path.join(gdir, f), group });
      }
    }
  };
  scan(SAMPLE_DIR, '');
  scan(PHOTO_DIR, 'x-');
  return out.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
}

type Verify = {
  bad?: string[];
  group?: Record<string, 'level' | 'staggered'>;
  /** Nhãn tay cho cả ảnh (ví dụ ảnh "sau khi học chụp" ghi rõ bố cục): kỹ thuật + dòng phải có / không được có. */
  labels?: Record<string, { technique: TechniqueId; expect: NoteId[]; reject?: NoteId[] }>;
};

const pct = (a: number, n: number) => (n ? `${Math.round((a / n) * 100)}% (${a}/${n})` : '–');

async function main() {
  fs.mkdirSync(path.join(OUT_DIR, 'fail'), { recursive: true });
  const cache: Record<string, Raw> = fs.existsSync(CACHE_FILE)
    ? (JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) as Record<string, Raw>)
    : {};
  const verify: Verify = fs.existsSync(VERIFY_FILE)
    ? (JSON.parse(fs.readFileSync(VERIFY_FILE, 'utf8')) as Verify)
    : {};
  const bad = new Set(verify.bad ?? []);
  const sources = listSources();
  const { browser, page, request } = await openPage();
  let computed = 0;
  const run = async (key: string, crop: Crop, needBodies = false) => {
    const img = await cropJpeg(page, crop);
    if (!cache[key] || (needBodies && !cache[key]!.bodies)) {
      cache[key] = await analyze(page, request, img.b64);
      if (++computed % 10 === 0) fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
    }
    return { raw: cache[key]!, b64: img.b64 };
  };
  const keyOf = (src: Source, c: Crop) =>
    crypto
      .createHash('sha1')
      .update(`${src.id}|${fs.statSync(src.file).size}|${JSON.stringify(c)}`)
      .digest('hex')
      .slice(0, 16);

  const sheetTiles: Tile[] = [];
  const results: {
    c: Case;
    ok: boolean;
    checks: { id: NoteId; want: boolean; got: boolean }[];
    got: NoteId[];
    /** Gối, cổ chân model đoán trên ảnh cắt [y, visibility]: soát ca cắt khớp. */
    legs: [number, number][];
    /** Mắt và khung người chính model thấy trên ảnh cắt. */
    eye: Pt | null;
    box: Box | null;
    heads: PhotoFeatures['heads'];
  }[] = [];
  const failTiles: Tile[] = [];
  let invalid = 0;

  for (const src of sources) {
    const t0 = Date.now();
    const { w: iw, h: ih } = await loadSource(page, src.file);
    const label = verify.group?.[src.id];
    const { raw, b64 } = await run(keyOf(src, FULL), FULL, !!label);
    const f = featuresOf(raw);
    const isBad = bad.has(src.id);
    sheetTiles.push(
      tileOf(b64, f, `${src.id}${isBad ? ' (bỏ)' : ''} · ${f.people.length} người${f.facing ? ` · nhìn ${f.facing === 'right' ? '→' : '←'}` : ''}`),
    );
    // Ảnh bị loại (vùng người dính nhau…) không cắt khung, nhưng vẫn chấm nhãn nhóm người.
    if (isBad && !label) continue;

    const cases = isBad ? [] : casesFor(src.id, f, iw, ih);
    if (label) {
      cases.push({
        id: `${src.id}:group-${label}`,
        src: src.id,
        kind: `group-${label}`,
        crop: FULL,
        technique: 'group',
        expect: [label === 'level' ? 'headsLevel' : 'headsStaggered'],
        reject: [label === 'level' ? 'headsStaggered' : 'headsLevel'],
      });
    }
    const hand = verify.labels?.[src.id];
    if (hand) {
      cases.push({
        id: `${src.id}:label-${hand.technique}`,
        src: src.id,
        kind: `label-${hand.technique}`,
        crop: FULL,
        technique: hand.technique,
        expect: hand.expect,
        reject: hand.reject ?? [],
      });
    }
    for (const c of cases) {
      // Đáp án: quy tắc trên khớp / khung người của ảnh gốc dời vào khung cắt (trừ nhãn tay).
      if (!c.kind.startsWith('group-') && !c.kind.startsWith('label-')) {
        const truth = allNotes(c.technique, truthIn(f, c.crop)).map((n) => n.id);
        if (!c.expect.every((e) => truth.includes(e)) || c.reject.some((r) => truth.includes(r))) {
          invalid++;
          continue;
        }
      }
      const r = await run(keyOf(src, c.crop), c.crop);
      const mf = featuresOf(r.raw);
      const got = allNotes(c.technique, mf).map((n) => n.id);
      const checks = [
        ...c.expect.map((id) => ({ id, want: true, got: got.includes(id) })),
        ...c.reject.map((id) => ({ id, want: false, got: got.includes(id) })),
      ];
      const ok = checks.every((k) => k.want === k.got);
      const legs = [J.kneeL, J.kneeR, J.ankleL, J.ankleR].map((i): [number, number] => {
        const j = mf.joints?.[i];
        return j ? [Math.round(j.y * 1000) / 1000, Math.round(j.v * 100) / 100] : [NaN, 0];
      });
      const box = mf.main >= 0 ? mf.people[mf.main]!.box : null;
      results.push({ c, ok, checks, got, legs, eye: mf.eye, box, heads: mf.heads });
      if (!ok && failTiles.length < 120) {
        failTiles.push(
          tileOf(r.b64, mf, c.id, [`cần: ${c.expect.join(', ') || '–'}  không: ${c.reject.join(', ') || '–'}`, `ra: ${got.join(', ') || '(không có)'}`], true),
        );
      }
    }
    console.log(`${src.id.padEnd(14)} ${cases.length} khung  ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));

  // Tờ soát ảnh gốc: 4 × 3 ô mỗi tờ.
  for (const f of fs.readdirSync(OUT_DIR)) if (/^(sources|fail)-\d+\.jpg$/.test(f)) fs.rmSync(path.join(OUT_DIR, f));
  for (let i = 0; i < sheetTiles.length; i += 12) {
    const jpg = await drawSheet(page, sheetTiles.slice(i, i + 12), 4, 360, 500);
    fs.writeFileSync(path.join(OUT_DIR, `sources-${i / 12 + 1}.jpg`), Buffer.from(jpg, 'base64'));
  }
  for (let i = 0; i < failTiles.length; i += 12) {
    const jpg = await drawSheet(page, failTiles.slice(i, i + 12), 4, 360, 540);
    fs.writeFileSync(path.join(OUT_DIR, `fail-${i / 12 + 1}.jpg`), Buffer.from(jpg, 'base64'));
  }
  await browser.close();

  // ---- Báo cáo ----
  const byKind = new Map<string, { n: number; ok: number }>();
  const byTech = new Map<string, { n: number; ok: number }>();
  const byNote = new Map<string, { hit: number; want: number; clean: number; avoid: number }>();
  let checksOk = 0;
  let checksN = 0;
  for (const r of results) {
    const k = byKind.get(r.c.kind) ?? { n: 0, ok: 0 };
    k.n++;
    if (r.ok) k.ok++;
    byKind.set(r.c.kind, k);
    const t = byTech.get(r.c.technique) ?? { n: 0, ok: 0 };
    for (const ch of r.checks) {
      checksN++;
      t.n++;
      const good = ch.want === ch.got;
      if (good) {
        checksOk++;
        t.ok++;
      }
      const s = byNote.get(ch.id) ?? { hit: 0, want: 0, clean: 0, avoid: 0 };
      if (ch.want) {
        s.want++;
        if (ch.got) s.hit++;
      } else {
        s.avoid++;
        if (!ch.got) s.clean++;
      }
      byNote.set(ch.id, s);
    }
    byTech.set(r.c.technique, t);
  }
  const casesOk = results.filter((r) => r.ok).length;
  const lines = [
    '# Độ đúng quy tắc nhận xét (scripts/eval-review.mts)',
    '',
    `Ảnh gốc: ${sources.length} (bỏ ${bad.size} ảnh nhận sai) · khung cắt hợp lệ: ${results.length} · khung bỏ vì đáp án không rõ: ${invalid}`,
    '',
    `**Độ đúng theo phép kiểm: ${pct(checksOk, checksN)}** · khung đúng hoàn toàn: ${pct(casesOk, results.length)}`,
    '',
    '## Theo kỹ thuật (phép kiểm)',
    '',
    '| Kỹ thuật | Đúng |',
    '|---|---|',
    ...[...byTech].map(([k, v]) => `| ${k} | ${pct(v.ok, v.n)} |`),
    '',
    '## Theo loại khung (khung đúng hoàn toàn)',
    '',
    '| Loại | Đúng |',
    '|---|---|',
    ...[...byKind].map(([k, v]) => `| ${k} | ${pct(v.ok, v.n)} |`),
    '',
    '## Theo dòng nhận xét',
    '',
    '| Dòng | Có khi phải có | Không có khi không được có |',
    '|---|---|---|',
    ...[...byNote].map(([k, v]) => `| ${k} | ${pct(v.hit, v.want)} | ${pct(v.clean, v.avoid)} |`),
    '',
  ];
  fs.writeFileSync(path.join(OUT_DIR, 'report.md'), lines.join('\n'));
  fs.writeFileSync(
    path.join(OUT_DIR, 'report.json'),
    JSON.stringify(
      results.map((r) => ({ id: r.c.id, ok: r.ok, expect: r.c.expect, reject: r.c.reject, got: r.got, legs: r.legs, eye: r.eye, box: r.box, heads: r.c.technique === 'group' ? r.heads : undefined })),
      null,
      1,
    ),
  );
  console.log(lines.join('\n'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
