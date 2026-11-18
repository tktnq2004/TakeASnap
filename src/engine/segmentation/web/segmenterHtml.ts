/**
 * Trang HTML chạy trong WebView ẩn: tách người bằng MediaPipe (WebGL/WASM).
 *
 * Hai chế độ (buildSegmenterHtml):
 * - 'cdn': thư viện và model tải từ CDN, phiên bản cố định (màn spike, script dựng pose mẫu).
 * - 'local': app gửi file của gói model đã tải về máy (src/engine/models, BR-13) vào trang theo
 *   từng khúc base64; trang ghép thành blob: URL / Uint8Array rồi chạy MediaPipe, không cần mạng.
 *   Không đọc file:// trực tiếp vì WKWebView chặn fetch file://.
 * Đổi phiên bản ở đây thì đo lại spike B.
 *
 * Giao thức (JSON qua postMessage):
 *   RN → WV  { id, type: 'asset', name, mime, index, total, data }   một khúc base64 của một file
 *   RN → WV  { id, type: 'segment', model, base64, gridSide? }        ảnh JPEG base64
 *   WV → RN  { id, ok: true, maskBase64, grid?: { width, height, base64 }, … }  grid = alpha Uint8
 *   RN → WV  { id, type: 'landmarks', base64 }             nét mặt + khung xương
 *   WV → RN  { id, ok: true, face, bodyPoints, timings }   nét mặt (đoạn thẳng) + 33 khớp [x,y,vis]
 *   RN → WV  { id, type: 'frame', base64, seg, body, gridSide, bodyGpu }   khung hình nhỏ lúc ngắm
 *   WV → RN  { id, ok: true, grid, bodyPoints, backend, timings }  bản nhẹ: không mask PNG, không mặt
 *   WV → RN  { type: 'ready', info }                       trang đã nạp xong thư viện
 *   WV → RN  { id, ok: true, maskBase64, width, height, backend, timings }
 *   WV → RN  { id, ok: false, error }
 *   WV → RN  { type: 'log', message }
 */

export const MEDIAPIPE_VERSION = '1.1.1';

const MP_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}`;

export const MODEL_URLS = {
  multiclass:
    'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite',
  selfie:
    'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
  deeplab:
    'https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite',
  // Nét mặt (478 điểm) và khung xương (33 khớp) cho lớp "Nét" của pose.
  face: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
  body: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
} as const;

/** Tên file trong gói model (src/engine/models/packs.ts) ứng với từng model. */
export const MODEL_FILES = {
  multiclass: 'selfie_multiclass_256x256.tflite',
  face: 'face_landmarker.task',
  body: 'pose_landmarker_full.task',
} as const;

const script = `
const post = (m) => window.ReactNativeWebView.postMessage(JSON.stringify(m));
const log = (message) => post({ type: 'log', message: String(message) });
window.onerror = (msg, src, line) => log('onerror: ' + msg + ' @' + line);
window.onunhandledrejection = (e) => log('unhandled: ' + (e.reason && e.reason.message || e.reason));

const URLS = ${JSON.stringify(MODEL_URLS)};
const now = () => performance.now();
let mp = null;          // module MediaPipe, nạp lười
let fileset = null;

// ---- File của gói model gửi từ app (chế độ local) ----
const ASSETS = {};      // tên file -> { parts, mime, blob, url, bytes }
const MODEL_FILES = ${JSON.stringify(MODEL_FILES)};
function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesToB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
}
function addAssetChunk(msg) {
  let a = ASSETS[msg.name];
  if (!a || msg.index === 0) a = ASSETS[msg.name] = { parts: [], got: 0, mime: msg.mime };
  if (!a.parts[msg.index]) a.got++;
  a.parts[msg.index] = b64ToBytes(msg.data);
  if (a.got === msg.total) {
    a.blob = new Blob(a.parts, { type: a.mime });
    a.url = URL.createObjectURL(a.blob);
    a.parts = null; // giải phóng các khúc, chỉ giữ blob
  }
}
async function assetBytes(name) {
  const a = ASSETS[name];
  if (!a || !a.blob) return null;
  if (!a.bytes) a.bytes = new Uint8Array(await a.blob.arrayBuffer());
  return a.bytes;
}
async function loadMp() {
  if (mp) return;
  const local = ASSETS['vision_bundle.mjs'];
  mp = await import(local && local.url ? local.url : '${MP_BASE}/vision_bundle.mjs');
}
async function getFileset() {
  if (fileset) return fileset;
  const L = ASSETS['vision_wasm_internal.js'], B = ASSETS['vision_wasm_internal.wasm'];
  fileset = L && L.url && B && B.url
    ? { wasmLoaderPath: L.url, wasmBinaryPath: B.url }
    : await mp.FilesetResolver.forVisionTasks('${MP_BASE}/wasm');
  return fileset;
}
// Model trong máy thì truyền bytes, không thì tải từ CDN.
async function modelOptions(key) {
  const file = MODEL_FILES[key];
  const bytes = file ? await assetBytes(file) : null;
  return bytes ? { modelAssetBuffer: bytes } : { modelAssetPath: URLS[key] };
}
const segmenters = {};  // model -> { seg, backend }

async function getMediaPipe(model) {
  if (segmenters[model]) return { entry: segmenters[model], loadMs: 0 };
  const t0 = now();
  await loadMp();
  await getFileset();
  const source = await modelOptions(model);
  const make = (delegate) => mp.ImageSegmenter.createFromOptions(fileset, {
    baseOptions: Object.assign({ delegate: delegate }, source),
    runningMode: 'IMAGE',
    outputConfidenceMasks: true,
    outputCategoryMask: false,
  });
  let seg, backend;
  if (mpForceCpu) { seg = await make('CPU'); backend = 'mediapipe-CPU'; }
  else {
    try { seg = await make('GPU'); backend = 'mediapipe-GPU'; }
    catch (e) { log('GPU lỗi, chuyển CPU: ' + e.message); seg = await make('CPU'); backend = 'mediapipe-CPU'; }
  }
  segmenters[model] = { seg: seg, backend: backend };
  return { entry: segmenters[model], loadMs: now() - t0 };
}

// Android emulator (spike B): GPU chạy được nhưng đọc mask số thực từ WebGL ra toàn 0, nên
// Multiclass ra "toàn người", Selfie/DeepLab ra "không có người". Khi mask đầu tiên rỗng hoàn
// toàn thì coi GPU hỏng: bỏ mọi segmenter GPU, từ đó chỉ dùng CPU.
let mpForceCpu = false;
function maxOf(a) {
  let m = 0;
  for (let i = 0; i < a.length; i++) if (a[i] > m) m = a[i];
  return m;
}
function dropGpuSegmenters() {
  mpForceCpu = true;
  for (const k of Object.keys(segmenters)) {
    try { segmenters[k].seg.close(); } catch (e) {}
    delete segmenters[k];
  }
}

function loadImage(base64, mime) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không giải mã được ảnh'));
    img.src = 'data:' + (mime || 'image/jpeg') + ';base64,' + base64;
  });
}

// prob (w × h, 0..1) → canvas trắng với alpha = prob.
function probCanvas(prob, w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  for (let i = 0, j = 0; i < prob.length; i++, j += 4) {
    img.data[j] = 255; img.data[j + 1] = 255; img.data[j + 2] = 255;
    img.data[j + 3] = Math.max(0, Math.min(255, Math.round(prob[i] * 255)));
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

// Phóng prob (w × h) lên (W × H) bằng nội suy song tuyến của canvas.
function upscaleProb(prob, w, h, W, H) {
  if (w === W && h === H) return prob;
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(probCanvas(prob, w, h), 0, 0, W, H);
  const d = ctx.getImageData(0, 0, W, H).data;
  const p = new Float32Array(W * H);
  for (let i = 0, j = 3; i < p.length; i++, j += 4) p[i] = d[j] / 255;
  return p;
}

// prob ở kích thước ảnh → PNG base64.
// Đã thử guided filter (ảnh dẫn xám) để làm mịn mép: tệ hơn, mép quầng và lem nền khi áo và nền
// có độ sáng gần nhau (spike B, docs/spikes.md). Không dùng.
function finishMask(prob, img) {
  return probCanvas(prob, img.naturalWidth, img.naturalHeight).toDataURL('image/png').split(',')[1];
}

async function runMediaPipe(model, img) {
  const { entry, loadMs } = await getMediaPipe(model);
  const t1 = now();
  const result = entry.seg.segment(img);
  const t2 = now();
  const masks = result.confidenceMasks || [];
  const pick = (i) => masks[i].getAsFloat32Array();
  if (entry.backend === 'mediapipe-GPU' && masks.length && maxOf(pick(0)) < 1e-6) {
    log(model + ': GPU trả mask rỗng, chuyển CPU');
    result.close();
    dropGpuSegmenters();
    const again = await runMediaPipe(model, img);
    again.timings.loadMs += loadMs;
    return again;
  }
  let prob, mw, mh;
  if (model === 'multiclass') {
    // 0 = nền; người = 1 − nền. Kênh nền chỉ đạt ~0.8–0.96 trên vùng nền (đo trên street1), nên
    // 1 − nền còn 4–20% làm nền hiện mờ. Kéo dãn [0.25, 0.65] → [0, 1].
    const bg = pick(0);
    prob = new Float32Array(bg.length);
    for (let i = 0; i < bg.length; i++) {
      prob[i] = Math.max(0, Math.min(1, (1 - bg[i] - 0.25) / 0.4));
    }
  } else if (model === 'deeplab') {
    prob = pick(15); // Pascal VOC: 15 = person
  } else {
    prob = pick(masks.length > 1 ? 1 : 0);
  }
  mw = masks[0].width; mh = masks[0].height;
  result.close();
  const full = upscaleProb(prob, mw, mh, img.naturalWidth, img.naturalHeight);
  const maskBase64 = finishMask(full, img);
  const t3 = now();
  return { maskBase64: maskBase64, backend: entry.backend,
    timings: { loadMs: loadMs, prepMs: 0, inferMs: t2 - t1, postMs: t3 - t2 } };
}

// ---- Nét mặt + khung xương ----------------------------------------------------------------
// Trả các đoạn thẳng [x1, y1, x2, y2, …] chuẩn hóa 0..1. Không có mặt = quay lưng (business-flow
// §5.2). Bộ dò mặt của MediaPipe chỉ bắt tốt mặt to; ảnh toàn thân mặt nhỏ nên dò lại trên vùng
// đầu (cắt theo mũi/tai/vai của khung xương) phóng lên 512 px — đo trên máy tính: 5/6 ảnh có mặt.
let faceLm = null, bodyLm = null;
async function getLandmarkers() {
  if (faceLm && bodyLm) return 0;
  const t0 = now();
  await loadMp();
  await getFileset();
  // CPU: kết quả là toạ độ điểm (không đọc mask từ GPU), ổn định trên mọi máy, đủ nhanh.
  const base = async (key) => Object.assign({ delegate: 'CPU' }, await modelOptions(key));
  faceLm = await mp.FaceLandmarker.createFromOptions(fileset, {
    baseOptions: await base('face'), runningMode: 'IMAGE', numFaces: MAX_PEOPLE,
  });
  bodyLm = await mp.PoseLandmarker.createFromOptions(fileset, {
    baseOptions: await base('body'), runningMode: 'IMAGE', numPoses: MAX_PEOPLE,
  });
  return now() - t0;
}

const MAX_PEOPLE = 6;
// Tâm thân (vai + hông) và bề ngang vai, chuẩn hóa: để nhận ra cùng một người ở hai lần dò.
function torso(b) {
  const x = (b[11].x + b[12].x + b[23].x + b[24].x) / 4;
  const y = (b[11].y + b[12].y + b[23].y + b[24].y) / 4;
  return { x: x, y: y, w: Math.hypot(b[11].x - b[12].x, b[11].y - b[12].y) };
}
function sameBody(a, b) {
  const p = torso(a), q = torso(b);
  return Math.hypot(p.x - q.x, p.y - q.y) < Math.max(p.w, q.w, 0.02) * 0.6;
}
// Bộ dò khung xương hay bỏ sót người đứng sát người khác: dò thêm trên 3 dải dọc chồng nhau
// (mỗi dải nửa bề ngang ảnh), gộp những khung xương chưa có.
function bodiesInStrips(img, bodies) {
  const W = img.naturalWidth, H = img.naturalHeight;
  const sw = Math.round(W / 2);
  const out = bodies.slice();
  for (const sx of [0, Math.round(W / 4), W - sw]) {
    if (out.length >= MAX_PEOPLE) break;
    const c = document.createElement('canvas');
    c.width = sw; c.height = H;
    c.getContext('2d').drawImage(img, sx, 0, sw, H, 0, 0, sw, H);
    for (const b of bodyLm.detect(c).landmarks || []) {
      const m = b.map((q) => ({ x: (sx + q.x * sw) / W, y: q.y, visibility: q.visibility }));
      if (out.length < MAX_PEOPLE && !out.some((o) => sameBody(o, m))) out.push(m);
    }
  }
  return out;
}
// Điểm (chuẩn hóa) nằm trong khung bao của mặt, nới 20% mỗi phía.
function faceHas(f, x, y) {
  let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
  for (const q of f) {
    if (q.x < x0) x0 = q.x; if (q.x > x1) x1 = q.x;
    if (q.y < y0) y0 = q.y; if (q.y > y1) y1 = q.y;
  }
  const mx = (x1 - x0) * 0.2, my = (y1 - y0) * 0.2;
  return x >= x0 - mx && x <= x1 + mx && y >= y0 - my && y <= y1 + my;
}
const NOSE = [[168, 6], [6, 197], [197, 195], [195, 5], [5, 4], [98, 97], [97, 2], [2, 326], [326, 327]];
function faceConnections() {
  const F = mp.FaceLandmarker;
  const sets = [F.FACE_LANDMARKS_FACE_OVAL, F.FACE_LANDMARKS_LEFT_EYE, F.FACE_LANDMARKS_RIGHT_EYE,
    F.FACE_LANDMARKS_LEFT_EYEBROW, F.FACE_LANDMARKS_RIGHT_EYEBROW, F.FACE_LANDMARKS_LIPS];
  const out = [];
  for (const s of sets) for (const c of s) out.push([c.start, c.end]);
  return out.concat(NOSE);
}
const r4 = (v) => Math.round(v * 10000) / 10000;
function segments(points, pairs, minVis) {
  const out = [];
  for (const [a, b] of pairs) {
    const p = points[a], q = points[b];
    if (!p || !q) continue;
    if (minVis && ((p.visibility ?? 1) < minVis || (q.visibility ?? 1) < minVis)) continue;
    out.push(r4(p.x), r4(p.y), r4(q.x), r4(q.y));
  }
  return out;
}

async function runLandmarks(img) {
  const loadMs = await getLandmarkers();
  const t0 = now();
  const W = img.naturalWidth, H = img.naturalHeight;
  const bodies = bodiesInStrips(img, bodyLm.detect(img).landmarks || []);
  const body = bodies[0] || null;
  // Ảnh nhiều người: lấy mọi mặt, app giữ lại mặt của người được chọn (Phase 3).
  const faces = (faceLm.detect(img).faceLandmarks || []).slice();
  // Mặt nhỏ (ảnh toàn thân, nhiều người) bộ dò bỏ sót: dò lại trên vùng đầu của TỪNG khung xương
  // chưa có mặt, để người đứng sát nhau (chung một vùng) vẫn có nét mặt riêng.
  for (const b of bodies) {
    if ((b[0].visibility ?? 1) <= 0.5) continue;
    if (faces.some((f) => faceHas(f, b[0].x, b[0].y))) continue;
    const sh = Math.hypot((b[11].x - b[12].x) * W, (b[11].y - b[12].y) * H);
    const ear = Math.hypot((b[7].x - b[8].x) * W, (b[7].y - b[8].y) * H);
    const side = Math.max(ear * 2.2, sh * 0.9, 48);
    const sx = b[0].x * W - side / 2, sy = b[0].y * H - side / 2;
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    c.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, 512, 512);
    // Vùng cắt có thể dính mặt người bên cạnh: lấy mặt chứa mũi của khung xương này.
    const found = (faceLm.detect(c).faceLandmarks || [])
      .map((f) => f.map((q) => ({ x: (sx + q.x * side) / W, y: (sy + q.y * side) / H })))
      .find((f) => faceHas(f, b[0].x, b[0].y));
    // Hai khung xương của cùng một người (dò trên dải bị cắt ngang người) không thêm mặt hai lần.
    if (found && !faces.some((e) => faceHas(e, found[1].x, found[1].y))) faces.push(found);
  }
  return {
    face: faces.length ? faces.flatMap((f) => segments(f, faceConnections(), 0)) : null,
    // 33 khớp phẳng [x, y, visibility, …] chuẩn hóa; giữ cho tính năng khớp dáng sau này.
    bodyPoints: body
      ? body.flatMap((p) => [r4(p.x), r4(p.y), r4(p.visibility ?? 1)])
      : null,
    timings: { loadMs: loadMs, prepMs: 0, inferMs: now() - t0, postMs: 0 },
  };
}

async function maskGrid(maskB64, side) {
  const img = await loadImage(maskB64, 'image/png');
  const k = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * k));
  const h = Math.max(1, Math.round(img.naturalHeight * k));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = d[i * 4 + 3];
  return { width: w, height: h, base64: bytesToB64(alpha) };
}

// ---- Khung hình lúc ngắm (spike gợi ý lúc ngắm, Phase 5 Bước 3) -----------------------------
// Bản nhẹ cho ảnh nhỏ chụp liên tục: lưới người thu nhỏ đọc thẳng từ mask (không phóng lên, không
// PNG), một khung xương ở chế độ VIDEO (bám theo khung trước, bỏ bước dò lại), không nét mặt.
let frameBody = null, frameBodyGpu = null, lastFrameTs = 0;
async function getFrameBody(gpu) {
  if (frameBody && frameBodyGpu === gpu) return frameBody;
  if (frameBody) { try { frameBody.close(); } catch (e) {} frameBody = null; }
  await loadMp();
  await getFileset();
  frameBody = await mp.PoseLandmarker.createFromOptions(fileset, {
    baseOptions: Object.assign({ delegate: gpu ? 'GPU' : 'CPU' }, await modelOptions('body')),
    runningMode: 'VIDEO', numPoses: 1,
  });
  frameBodyGpu = gpu;
  return frameBody;
}
async function runFrame(msg) {
  const t0 = now();
  const img = await loadImage(msg.base64);
  const decodeMs = now() - t0;
  let grid = null, backend = '', segMs = 0, bodyMs = 0, bodyPoints = null;
  if (msg.seg) {
    let { entry } = await getMediaPipe('multiclass');
    const s0 = now();
    let result = entry.seg.segment(img);
    let masks = result.confidenceMasks || [];
    if (entry.backend === 'mediapipe-GPU' && masks.length && maxOf(masks[0].getAsFloat32Array()) < 1e-6) {
      log('frame: GPU trả mask rỗng, chuyển CPU');
      result.close();
      dropGpuSegmenters();
      entry = (await getMediaPipe('multiclass')).entry;
      result = entry.seg.segment(img);
      masks = result.confidenceMasks || [];
    }
    backend = entry.backend;
    const bg = masks[0].getAsFloat32Array();
    const mw = masks[0].width, mh = masks[0].height;
    result.close();
    const k = Math.min(1, msg.gridSide / Math.max(mw, mh));
    const w = Math.max(1, Math.round(mw * k)), h = Math.max(1, Math.round(mh * k));
    const alpha = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      const sy = Math.min(mh - 1, Math.floor((y + 0.5) / k));
      for (let x = 0; x < w; x++) {
        const sx = Math.min(mw - 1, Math.floor((x + 0.5) / k));
        // Như runMediaPipe: người = 1 − nền, kéo dãn [0.25, 0.65] → [0, 1].
        const p = (1 - bg[sy * mw + sx] - 0.25) / 0.4;
        alpha[y * w + x] = p <= 0 ? 0 : p >= 1 ? 255 : Math.round(p * 255);
      }
    }
    grid = { width: w, height: h, base64: bytesToB64(alpha) };
    segMs = now() - s0;
  }
  if (msg.body) {
    const lm = await getFrameBody(!!msg.bodyGpu);
    const b0 = now();
    lastFrameTs = Math.max(lastFrameTs + 1, Math.round(now()));
    const b = (lm.detectForVideo(img, lastFrameTs).landmarks || [])[0];
    bodyPoints = b ? b.flatMap((p) => [r4(p.x), r4(p.y), r4(p.visibility ?? 1)]) : null;
    bodyMs = now() - b0;
  }
  return { grid: grid, bodyPoints: bodyPoints, backend: backend,
    width: img.naturalWidth, height: img.naturalHeight,
    timings: { decodeMs: decodeMs, segMs: segMs, bodyMs: bodyMs } };
}

async function handle(msg) {
  if (msg && msg.type === 'frame') {
    try {
      post(Object.assign({ id: msg.id, ok: true }, await runFrame(msg)));
    } catch (e) {
      const error = (e && e.message) || String(e);
      log('frame lỗi: ' + error);
      post({ id: msg.id, ok: false, error: error });
    }
    return;
  }
  if (msg && msg.type === 'asset') {
    try {
      addAssetChunk(msg);
      post({ id: msg.id, ok: true });
    } catch (e) {
      post({ id: msg.id, ok: false, error: 'asset ' + msg.name + ': ' + ((e && e.message) || e) });
    }
    return;
  }
  if (msg && msg.type === 'landmarks') {
    try {
      const img = await loadImage(msg.base64);
      const r = await runLandmarks(img);
      post({ id: msg.id, ok: true, face: r.face, bodyPoints: r.bodyPoints, timings: r.timings });
    } catch (e) {
      const error = (e && e.message) || String(e);
      log('landmarks lỗi: ' + error);
      post({ id: msg.id, ok: false, error: error });
    }
    return;
  }
  if (!msg || msg.type !== 'segment') return;
  try {
    const t0 = now();
    const img = await loadImage(msg.base64);
    const decodeMs = now() - t0;
    const r = await runMediaPipe(msg.model, img);
    r.timings.prepMs += decodeMs;
    // Lưới alpha thu nhỏ (cạnh dài ≤ gridSide) để JS dò viền mà không phải giải mã PNG.
    const grid = msg.gridSide ? await maskGrid(r.maskBase64, msg.gridSide) : undefined;
    post({ id: msg.id, ok: true, maskBase64: r.maskBase64, grid: grid, width: img.naturalWidth,
      height: img.naturalHeight, backend: r.backend, timings: r.timings });
  } catch (e) {
    const error = (e && e.message) || String(e);
    log(msg.model + ' lỗi: ' + error);
    post({ id: msg.id, ok: false, error: error });
  }
}

const onMessage = (e) => { try { handle(JSON.parse(e.data)); } catch (err) { log('message: ' + err); } };
window.addEventListener('message', onMessage);   // iOS
document.addEventListener('message', onMessage); // Android

post({ type: 'ready', info: {
  ua: navigator.userAgent,
  webgl2: !!document.createElement('canvas').getContext('webgl2'),
  wasm: typeof WebAssembly === 'object',
  crossOriginIsolated: !!self.crossOriginIsolated,
} });
`;

/**
 * 'cdn': nạp MediaPipe và model từ CDN (spike, script dựng pose mẫu).
 * 'local': không nạp gì từ mạng; chờ app gửi file của gói model (BR-13).
 */
export function buildSegmenterHtml(mode: 'cdn' | 'local'): string {
  void mode; // 'cdn' và 'local' dùng cùng trang; khác nhau ở chỗ app có gửi gói model vào không.
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body>
<script type="module">${script}</script>
</body></html>`;
}

export const segmenterHtml = buildSegmenterHtml('cdn');
