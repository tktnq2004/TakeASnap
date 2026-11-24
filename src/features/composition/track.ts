/**
 * Theo máy xoay giữa hai ảnh kiểm tra (phiếu Phase 5b lần 3, mục 11.5; business-flow §6.10): chụp
 * một ảnh, biết chỗ người (hoặc mắt) trên khung; sau đó chỉ đọc con quay (gyroscope) để đoán chỗ
 * đó dịch tới đâu khi người dùng xoay máy, ngay trên UI thread, không chụp thêm. Chấm người và mũi
 * tên tới chấm đích bám theo tay không trễ; chụp kiểm tra khi chấm tới đích và máy đã yên.
 *
 * Con quay của Reanimated cho tốc độ xoay (rad/s) theo hệ trục của máy, quy tắc bàn tay phải, như
 * nhau trên iOS và Android: x sang phải màn hình, y lên đỉnh máy, z ra phía mặt người cầm. Camera
 * sau nhìn theo −z; camera trước nhìn theo +z và khung ngắm soi gương (điểm bên phải máy hiện bên
 * phải khung).
 *
 * Chỉ theo được máy xoay. Người chụp bước ngang hay người mẫu tự đi thì chấm không chạy; khi máy yên
 * lại, ảnh kiểm tra sau đặt lại chấm. Hàm thuần, chạy được trên UI thread, test được trong Jest.
 */

/** Quaternion [w, x, y, z]. */
export type Quat = [number, number, number, number];
export const Q_ID: Quat = [1, 0, 0, 0];

export const TRACK = {
  /**
   * tan(nửa góc nhìn) của cả cảm biến 4:3 dựng đứng ở zoom 1: cạnh ngắn (ngang khung) / cạnh dài
   * (dọc khung). Camera chính điện thoại chừng 26 mm (tương đương 35 mm): 13 / 26 và 17,3 / 26.
   * Sai vài phần trăm thì chấm chạy nhanh / chậm hơn một chút; ảnh kiểm tra sửa lại.
   */
  tanShort: 0.5,
  tanLong: 0.665,
  /** Máy yên khi tốc độ xoay dưới chừng này (rad/s, run tay khi cầm yên chừng 0,02–0,05). */
  stillRate: 0.1,
  /** Đã di chuyển máy (kể cả bước đi, máy rung khi bước) khi tốc độ xoay vượt chừng này (rad/s). */
  moveRate: 0.35,
  /** Hoặc khi máy đã xoay quá chừng này (độ) so với lúc chụp. */
  movedDeg: 2,
  /**
   * Độ lệch không (bias) của con quay (iOS đọc con quay thô): ước lượng bằng trung bình chậm của
   * tốc độ xoay khi gần như yên (dưới `biasRate` rad/s), hằng thời gian `biasTau` s. Không bỏ thì
   * chấm trôi chừng 0,5°/s khi máy đứng yên.
   */
  biasRate: 0.03,
  biasTau: 3,
  /** Chấm người cách đích dưới ngưỡng đạt × chừng này thì tính là tới (chừa chỗ cho ảnh kiểm tra). */
  reach: 0.8,
  /**
   * Con quay đọc đúng 0 liền chừng này ms: máy không có con quay (máy ảo) hoặc chưa chạy; không
   * theo máy xoay, bên JS chụp lại theo nhịp như tiêu chí không theo được.
   */
  deadMs: 1000,
} as const;

export function qMul(a: Quat, b: Quat): Quat {
  'worklet';
  return [
    a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
    a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
    a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
    a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
  ];
}

export function qConj(q: Quat): Quat {
  'worklet';
  return [q[0], -q[1], -q[2], -q[3]];
}

/** Góc xoay (độ) của quaternion đơn vị. */
export function qAngleDeg(q: Quat): number {
  'worklet';
  return (2 * Math.acos(Math.min(1, Math.abs(q[0]))) * 180) / Math.PI;
}

/**
 * Cộng một bước xoay `w` (rad/s, hệ trục máy lúc này) trong `dt` giây: q ← q ⊗ dq. `q` đổi toạ độ
 * theo hệ máy lúc này ra hệ lúc bắt đầu.
 */
export function qIntegrate(q: Quat, wx: number, wy: number, wz: number, dt: number): Quat {
  'worklet';
  const rate = Math.sqrt(wx * wx + wy * wy + wz * wz);
  if (rate * dt < 1e-9) return q;
  const half = (rate * dt) / 2;
  const s = Math.sin(half) / rate;
  const r = qMul(q, [Math.cos(half), wx * s, wy * s, wz * s]);
  const n = Math.sqrt(r[0] * r[0] + r[1] * r[1] + r[2] * r[2] + r[3] * r[3]);
  return [r[0] / n, r[1] / n, r[2] / n, r[3] / n];
}

/** Góc nhìn của khung ngắm: tan(nửa góc) theo ngang, dọc; camera trước. */
export type Lens = { tx: number; ty: number; front: boolean };

/**
 * Góc nhìn của khung ngắm ở zoom 1: `frame` nằm trong màn xem trước (`preview`, cả cảm biến 3:4).
 */
export function lensOf(
  frame: { width: number; height: number },
  preview: { width: number; height: number },
  front: boolean,
): Lens {
  return {
    tx: TRACK.tanShort * (frame.width / preview.width),
    ty: TRACK.tanLong * (frame.height / preview.height),
    front,
  };
}

/** Góc nhìn ở zoom `zoom` (1 = camera chính; zoom thu hẹp góc nhìn). */
export function zoomed(l: Lens, zoom: number): Lens {
  'worklet';
  const z = Math.max(zoom, 0.1);
  return { tx: l.tx / z, ty: l.ty / z, front: l.front };
}

/**
 * Chỗ trên khung ngắm (0..1) lúc này của một điểm cố định ngoài đời mà lúc chụp ở `p` (khung ngắm,
 * `shot`), sau khi máy xoay `rel` (quaternion: hệ máy lúc này → hệ máy lúc chụp). Điểm ra sau lưng
 * camera: null.
 */
export function project(
  p: { x: number; y: number },
  shot: Lens,
  rel: Quat,
  now: Lens,
): { x: number; y: number } | null {
  'worklet';
  // Tia tới điểm, theo hệ máy lúc chụp.
  const v: Quat = [0, (p.x - 0.5) * 2 * shot.tx, -(p.y - 0.5) * 2 * shot.ty, shot.front ? 1 : -1];
  // Đổi sang hệ máy lúc này: v' = rel* ⊗ v ⊗ rel.
  const d = qMul(qMul(qConj(rel), v), rel);
  const depth = now.front ? d[3] : -d[3];
  if (depth < 1e-3) return null;
  return {
    x: 0.5 + d[1] / depth / (2 * now.tx),
    y: 0.5 - d[2] / depth / (2 * now.ty),
  };
}

/** Đích của tiêu chí đang làm trên khung ngắm. */
export type TrackTarget =
  | { kind: 'vline'; x: number }
  | { kind: 'hline'; y: number }
  | { kind: 'point'; x: number; y: number };

/** Chấm đích ứng với chấm người `p`: chiếu lên đường đích, hoặc chính điểm đích. */
export function targetPoint(t: TrackTarget, p: { x: number; y: number }): { x: number; y: number } {
  'worklet';
  if (t.kind === 'vline') return { x: t.x, y: p.y };
  if (t.kind === 'hline') return { x: p.x, y: t.y };
  return { x: t.x, y: t.y };
}

/** Một lần chụp kiểm tra, đã phân tích: chấm người, đích, góc máy lúc chụp. */
export type Anchor = {
  /** Tăng mỗi lần đặt chấm (để biết kết quả trên UI thread đã theo lần này chưa). */
  id: number;
  q: Quat;
  /** Góc nhìn ở zoom 1, zoom lúc chụp. */
  lens: Lens;
  zoom: number;
  at: { x: number; y: number };
  target: TrackTarget;
  axis: 'x' | 'y';
  /** Ngưỡng đạt của tiêu chí (cùng đơn vị với khoảng lệch theo `axis`). */
  band: number;
};

/** Kết quả theo máy xoay, ghi mỗi khung hình trên UI thread. */
export type Live = {
  /** Góc máy cộng dồn từ lúc bắt đầu theo dõi. */
  q: Quat;
  bias: [number, number, number];
  /** Lần chụp gần nhất (`epoch` mà UI thread đã thấy) và góc máy lúc đó. */
  epoch: number;
  q0: Quat;
  /** Đã di chuyển máy từ lần chụp gần nhất; máy yên liền chừng này ms. */
  moved: boolean;
  stillMs: number;
  /** Con quay đọc đúng 0 liền chừng này ms. */
  zeroMs: number;
  /** Chấm người, chấm đích (khung ngắm 0..1) theo `Anchor.id` = `for`; -1 khi chưa có. */
  for: number;
  px: number;
  py: number;
  tx: number;
  ty: number;
  err: number;
  reached: boolean;
};

export const LIVE0: Live = {
  q: Q_ID,
  bias: [0, 0, 0],
  epoch: 0,
  q0: Q_ID,
  moved: false,
  stillMs: 0,
  zeroMs: 0,
  for: -1,
  px: 0,
  py: 0,
  tx: 0,
  ty: 0,
  err: 1,
  reached: false,
};

/**
 * Một khung hình: `w` tốc độ xoay đọc từ con quay (rad/s), `dtMs` từ khung trước, `epoch` lần chụp
 * mới nhất (bên JS tăng ngay trước khi chụp), `anchor` lần chụp đã phân tích, `zoom` lúc này.
 */
export function trackFrame(
  l: Live,
  w: { x: number; y: number; z: number },
  dtMs: number,
  epoch: number,
  anchor: Anchor | null,
  zoom: number,
): Live {
  'worklet';
  const dt = Math.min(dtMs, 100) / 1000;
  let [bx, by, bz] = l.bias;
  let wx = w.x - bx;
  let wy = w.y - by;
  let wz = w.z - bz;
  const rate = Math.sqrt(wx * wx + wy * wy + wz * wz);
  if (rate < TRACK.biasRate) {
    const k = dt / TRACK.biasTau;
    bx += wx * k;
    by += wy * k;
    bz += wz * k;
    wx = w.x - bx;
    wy = w.y - by;
    wz = w.z - bz;
  }
  const q = qIntegrate(l.q, wx, wy, wz, dt);

  const fresh = epoch !== l.epoch;
  const q0 = fresh ? q : l.q0;
  let moved = fresh ? false : l.moved;
  if (rate > TRACK.moveRate || qAngleDeg(qMul(qConj(q0), q)) > TRACK.movedDeg) moved = true;
  const stillMs = rate < TRACK.stillRate ? (fresh ? 0 : l.stillMs) + dtMs : 0;

  const zeroMs = w.x === 0 && w.y === 0 && w.z === 0 ? l.zeroMs + dtMs : 0;
  const out: Live = { ...l, q, bias: [bx, by, bz], epoch, q0, moved, stillMs, zeroMs };
  if (!anchor || zeroMs >= TRACK.deadMs) return { ...out, for: -1, reached: false };
  const rel = qMul(qConj(anchor.q), q);
  const p = project(anchor.at, zoomed(anchor.lens, anchor.zoom), rel, zoomed(anchor.lens, zoom));
  if (!p) return { ...out, for: anchor.id, err: 1, reached: false };
  const t = targetPoint(anchor.target, p);
  const err = anchor.axis === 'x' ? Math.abs(t.x - p.x) : Math.abs(t.y - p.y);
  return {
    ...out,
    for: anchor.id,
    px: p.x,
    py: p.y,
    tx: t.x,
    ty: t.y,
    err,
    reached: err <= anchor.band * TRACK.reach,
  };
}
