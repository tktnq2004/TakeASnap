/**
 * Phase 5b, Bước 1: trang duyệt nhãn bộ giữ riêng (người ↔ Claude), chạy trên máy.
 *
 *   node scripts/p5b-review.mts        rồi mở http://127.0.0.1:5175
 *   SPLIT=split-r2.json node scripts/p5b-review.mts      bộ giữ riêng vòng 2
 *
 * Mỗi lần một ảnh của bộ giữ riêng (eval/composition/split.json), nhãn Claude chọn sẵn. Enter: lưu
 * nhãn đang chọn và sang ảnh sau; phím 1–7 bật / tắt nhãn (bật trước là nhãn chính, tối đa 2);
 * ←: ảnh trước. Mỗi câu trả lời ghi ngay vào eval/composition/labels-review.json, đóng trang mở lại
 * thì làm tiếp từ ảnh chưa duyệt. Chỉ nghe 127.0.0.1, không gửi gì ra ngoài.
 *
 * Vòng 3 — gán mù (người gán không thấy nhãn Claude, tránh bị kéo theo):
 *   IDS=calib.json BLIND=1 OUT=labels-calib-user.json node scripts/p5b-review.mts
 * IDS: file JSON (mảng id, hoặc { holdout: [...] }); BLIND=1: không hiện, không chọn sẵn nhãn
 * Claude và có thêm "Không chắc" (phím 8, đi kèm tối đa 2 nhãn khác); OUT: file ghi nhãn.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', 'eval', 'composition');
const PORT = Number(process.env.PORT ?? 5175);
const BLIND = process.env.BLIND === '1';
const REVIEW = path.join(ROOT, process.env.OUT ?? 'labels-review.json');
const claude = JSON.parse(fs.readFileSync(path.join(ROOT, 'labels-claude.json'), 'utf8')) as Record<
  string,
  string[]
>;
const SPLIT = process.env.IDS ?? process.env.SPLIT ?? 'split.json';
const list = JSON.parse(fs.readFileSync(path.join(ROOT, SPLIT), 'utf8')) as
  string[] | { holdout: string[] };
const holdout = Array.isArray(list) ? list : list.holdout;
const review: Record<string, string[]> = fs.existsSync(REVIEW)
  ? (JSON.parse(fs.readFileSync(REVIEW, 'utf8')) as Record<string, string[]>)
  : {};
const LABELS = ['thirds', 'center', 'fill', 'horizon', 'lead', 'group', 'other'];
/** Gán mù: "Không chắc" là cờ đi kèm, không tính vào 2 nhãn. */
const UNSURE = 'unsure';

const page = `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Duyệt nhãn Phase 5b</title>
<style>
:root{color-scheme:dark;font-family:system-ui,sans-serif}
body{margin:0;background:#16181b;color:#e8e8e8;display:flex;flex-direction:column;height:100vh}
header{padding:10px 16px;display:flex;gap:16px;align-items:center;font-size:14px;color:#aaa}
header b{color:#e8e8e8}
main{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:0 16px}
img{max-width:100%;max-height:100%;object-fit:contain;border-radius:6px}
nav{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;padding:12px 16px 4px}
button{font:inherit;font-size:15px;padding:10px 14px;border-radius:999px;border:1px solid #3a3d42;
  background:#22252a;color:#e8e8e8;cursor:pointer}
button.on{background:#2fbf71;border-color:#2fbf71;color:#08130c}
button.main{outline:3px solid #b8f5d2}
.row{display:flex;gap:8px;justify-content:center;padding:4px 16px 14px}
.hint{font-size:13px;color:#8a8f96;text-align:center;padding-bottom:10px}
</style></head><body>
<header><span id="pos"></span><span id="claudeBox">Claude: <b id="claude"></b></span><span id="saved"></span></header>
<main><img id="img" alt=""></main>
<nav id="labels"></nav>
<div class="row"><button id="back">← Ảnh trước</button><button id="save">Lưu và sang ảnh sau (Enter)</button></div>
<div class="hint">Phím 1–7 bật / tắt nhãn; bật trước là nhãn chính (viền sáng), tối đa 2 nhãn.
  ${BLIND ? 'Phím 8: Không chắc (đi kèm nhãn khác). ' : ''}Xem định nghĩa nhãn ở docs/phase5b-data.md.</div>
<script>
const NAMES = {thirds:'1 · Quy tắc 1/3',center:'2 · Đặt ở giữa',fill:'3 · Lấp đầy khung',
  horizon:'4 · Đường chân trời',lead:'5 · Đường dẫn',group:'6 · Nhóm người',other:'7 · Khác',
  unsure:'8 · Không chắc'};
const BLIND = ${BLIND};
const KEYS = ${JSON.stringify(BLIND ? [...LABELS, 'unsure'] : LABELS)};
if (BLIND) document.getElementById('claudeBox').style.display = 'none';
let items = [], i = 0, sel = [];
const $ = (id) => document.getElementById(id);
function render() {
  const it = items[i];
  if (!it) { $('pos').textContent = 'Xong ' + items.length + ' ảnh. Cảm ơn.'; return; }
  $('img').src = '/img/' + it.id + '.jpg';
  if (!BLIND) $('claude').textContent = it.claude.map((l) => NAMES[l].slice(4)).join(' + ');
  $('pos').textContent = 'Ảnh ' + (i + 1) + ' / ' + items.length;
  $('saved').textContent = it.review ? 'Đã duyệt' : '';
  $('labels').innerHTML = '';
  KEYS.forEach((k) => {
    const b = document.createElement('button');
    b.textContent = NAMES[k];
    if (sel.includes(k)) b.className = 'on' + (sel[0] === k ? ' main' : '');
    b.onclick = () => toggle(k);
    $('labels').appendChild(b);
  });
}
function load() { sel = [...(items[i]?.review ?? (BLIND ? [] : items[i]?.claude) ?? [])]; render(); }
function toggle(k) {
  if (sel.includes(k)) sel = sel.filter((x) => x !== k);
  else if (k === 'unsure') sel.push(k);
  else {
    const real = sel.filter((x) => x !== 'unsure');
    const keep = real.length < 2 ? real : [real[0]];
    sel = [...keep, k, ...(sel.includes('unsure') ? ['unsure'] : [])];
  }
  render();
}
// Bấm Enter hai lần nhanh từng lưu một ảnh hai lần rồi nhảy qua ảnh sau (10 ảnh bị bỏ sót lần 1).
let busy = false;
async function save() {
  const it = items[i];
  if (busy || !it || !sel.length) return;
  busy = true;
  try {
    await fetch('/api/review', {method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({id: it.id, labels: sel})});
    it.review = [...sel];
    // Sang ảnh chưa duyệt kế tiếp (lần duyệt bù chỉ đi qua các ảnh còn thiếu).
    const next = items.findIndex((x, k) => k > i && !x.review);
    i = next < 0 ? items.length : next;
    load();
  } finally { busy = false; }
}
$('save').onclick = save;
$('back').onclick = () => { if (i > 0) { i--; load(); } };
addEventListener('keydown', (e) => {
  if (e.key === 'Enter') save();
  else if (e.key === 'ArrowLeft' && i > 0) { i--; load(); }
  else if (e.key >= '1' && e.key <= String(KEYS.length)) toggle(KEYS[Number(e.key) - 1]);
});
fetch('/api/items').then((r) => r.json()).then((d) => {
  items = d; i = Math.max(0, items.findIndex((x) => !x.review)); if (i < 0) i = items.length; load();
});
</script></body></html>`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`);
  if (url.pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(page);
  } else if (url.pathname === '/api/items') {
    const items = holdout.map((id) => ({
      id,
      claude: claude[id] ?? [],
      review: review[id] ?? null,
      ...(BLIND ? { claude: [] } : {}),
    }));
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(items));
  } else if (url.pathname === '/api/review' && req.method === 'POST') {
    let body = '';
    req.on('data', (c: Buffer) => (body += c.toString()));
    req.on('end', () => {
      const { id, labels } = JSON.parse(body) as { id: string; labels: string[] };
      const real = Array.isArray(labels) ? labels.filter((l) => l !== UNSURE) : [];
      const ok =
        holdout.includes(id) &&
        Array.isArray(labels) &&
        labels.length >= 1 &&
        real.length <= 2 &&
        real.every((l) => LABELS.includes(l)) &&
        (BLIND || real.length === labels.length);
      if (!ok) return void res.writeHead(400).end();
      review[id] = labels;
      fs.writeFileSync(REVIEW, JSON.stringify(review, null, 0));
      res.writeHead(204).end();
    });
  } else if (url.pathname.startsWith('/img/')) {
    const id = path.basename(url.pathname, '.jpg');
    const file = path.join(ROOT, 'images', `${id}.jpg`);
    if (!/^w?[0-9a-f]+$/.test(id) || !fs.existsSync(file)) return void res.writeHead(404).end();
    res.writeHead(200, { 'content-type': 'image/jpeg' });
    fs.createReadStream(file).pipe(res);
  } else res.writeHead(404).end();
});
server.listen(PORT, '127.0.0.1', () =>
  console.log(
    `Duyệt nhãn: http://127.0.0.1:${PORT}  (${holdout.length} ảnh, đã duyệt ${Object.keys(review).length})`,
  ),
);
