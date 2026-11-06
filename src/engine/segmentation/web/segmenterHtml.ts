/**
 * Trang HTML chạy trong WebView ẩn: tách người bằng MediaPipe (WebGL/WASM) hoặc ONNX Runtime Web.
 *
 * SPIKE B: thư viện và model tải từ CDN, phiên bản cố định. Phase 1 đóng gói các file này kèm app
 * (assets/models) để chạy offline (BR-03). Đổi phiên bản ở đây thì đo lại spike B.
 *
 * Giao thức (JSON qua postMessage):
 *   RN → WV  { id, type: 'segment', model, base64 }        ảnh JPEG base64
 *   WV → RN  { type: 'ready', info }                       trang đã nạp xong thư viện
 *   WV → RN  { id, ok: true, maskBase64, width, height, backend, timings }
 *   WV → RN  { id, ok: false, error }
 *   WV → RN  { type: 'log', message }
 */

export const MEDIAPIPE_VERSION = '1.1.1';
export const ORT_VERSION = '1.30.0';

const MP_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}`;
const ORT_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;

export const MODEL_URLS = {
  multiclass:
    'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite',
  selfie:
    'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
  deeplab:
    'https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite',
  rmbg: 'https://huggingface.co/briaai/RMBG-1.4/resolve/main/onnx/model_quantized.onnx',
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
const segmenters = {};  // model -> { seg, backend }
let ortSession = null;

async function getMediaPipe(model) {
  if (segmenters[model]) return { entry: segmenters[model], loadMs: 0 };
  const t0 = now();
  if (!mp) mp = await import('${MP_BASE}/vision_bundle.mjs');
  if (!fileset) fileset = await mp.FilesetResolver.forVisionTasks('${MP_BASE}/wasm');
  const make = (delegate) => mp.ImageSegmenter.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: URLS[model], delegate: delegate },
    runningMode: 'IMAGE',
    outputConfidenceMasks: true,
    outputCategoryMask: false,
  });
  let seg, backend;
  try { seg = await make('GPU'); backend = 'mediapipe-GPU'; }
  catch (e) { log('GPU lỗi, chuyển CPU: ' + e.message); seg = await make('CPU'); backend = 'mediapipe-CPU'; }
  segmenters[model] = { seg: seg, backend: backend };
  return { entry: segmenters[model], loadMs: now() - t0 };
}

async function getOrt() {
  if (ortSession) return { session: ortSession, loadMs: 0 };
  const t0 = now();
  ort.env.wasm.numThreads = 1;          // WebView không có SharedArrayBuffer
  ort.env.wasm.wasmPaths = '${ORT_BASE}';
  ortSession = await ort.InferenceSession.create(URLS.rmbg, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  });
  return { session: ortSession, loadMs: now() - t0 };
}

function loadImage(base64) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không giải mã được ảnh'));
    img.src = 'data:image/jpeg;base64,' + base64;
  });
}

// prob: xác suất là người 0..1 ở kích thước (w, h); trả PNG trắng với alpha = prob, cỡ (outW, outH).
function probToPng(prob, w, h, outW, outH) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  for (let i = 0, j = 0; i < prob.length; i++, j += 4) {
    img.data[j] = 255; img.data[j + 1] = 255; img.data[j + 2] = 255;
    img.data[j + 3] = Math.max(0, Math.min(255, Math.round(prob[i] * 255)));
  }
  ctx.putImageData(img, 0, 0);
  let out = c;
  if (w !== outW || h !== outH) {
    out = document.createElement('canvas');
    out.width = outW; out.height = outH;
    const octx = out.getContext('2d');
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(c, 0, 0, outW, outH);
  }
  return out.toDataURL('image/png').split(',')[1];
}

async function runMediaPipe(model, img) {
  const { entry, loadMs } = await getMediaPipe(model);
  const t1 = now();
  const result = entry.seg.segment(img);
  const t2 = now();
  const masks = result.confidenceMasks || [];
  const pick = (i) => masks[i].getAsFloat32Array();
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
  const maskBase64 = probToPng(prob, mw, mh, img.naturalWidth, img.naturalHeight);
  const t3 = now();
  return { maskBase64: maskBase64, backend: entry.backend,
    timings: { loadMs: loadMs, prepMs: 0, inferMs: t2 - t1, postMs: t3 - t2 } };
}

async function runRmbg(img) {
  const { session, loadMs } = await getOrt();
  const S = 1024;
  const t0 = now();
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, S, S);
  const px = ctx.getImageData(0, 0, S, S).data;
  const plane = S * S;
  const input = new Float32Array(3 * plane);
  for (let i = 0, j = 0; i < plane; i++, j += 4) {
    input[i] = px[j] / 255 - 0.5;
    input[i + plane] = px[j + 1] / 255 - 0.5;
    input[i + 2 * plane] = px[j + 2] / 255 - 0.5;
  }
  const feeds = {};
  feeds[session.inputNames[0]] = new ort.Tensor('float32', input, [1, 3, S, S]);
  const t1 = now();
  const out = await session.run(feeds);
  const t2 = now();
  const raw = out[session.outputNames[0]].data;
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < raw.length; i++) { if (raw[i] < lo) lo = raw[i]; if (raw[i] > hi) hi = raw[i]; }
  const range = hi - lo || 1;
  const prob = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i++) prob[i] = (raw[i] - lo) / range;
  const maskBase64 = probToPng(prob, S, S, img.naturalWidth, img.naturalHeight);
  const t3 = now();
  return { maskBase64: maskBase64, backend: 'ort-wasm',
    timings: { loadMs: loadMs, prepMs: t1 - t0, inferMs: t2 - t1, postMs: t3 - t2 } };
}

async function handle(msg) {
  if (!msg || msg.type !== 'segment') return;
  try {
    const t0 = now();
    const img = await loadImage(msg.base64);
    const decodeMs = now() - t0;
    const r = msg.model === 'rmbg' ? await runRmbg(img) : await runMediaPipe(msg.model, img);
    r.timings.prepMs += decodeMs;
    post({ id: msg.id, ok: true, maskBase64: r.maskBase64, width: img.naturalWidth,
      height: img.naturalHeight, backend: r.backend, timings: r.timings });
  } catch (e) {
    post({ id: msg.id, ok: false, error: (e && e.message) || String(e) });
  }
}

const onMessage = (e) => { try { handle(JSON.parse(e.data)); } catch (err) { log('message: ' + err); } };
window.addEventListener('message', onMessage);   // iOS
document.addEventListener('message', onMessage); // Android

post({ type: 'ready', info: {
  ua: navigator.userAgent,
  ort: typeof ort !== 'undefined',
  webgl2: !!document.createElement('canvas').getContext('webgl2'),
  wasm: typeof WebAssembly === 'object',
  crossOriginIsolated: !!self.crossOriginIsolated,
} });
`;

export const segmenterHtml = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body>
<script src="${ORT_BASE}ort.min.js"></script>
<script type="module">${script}</script>
</body></html>`;
