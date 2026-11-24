/**
 * Theo máy giữa hai ảnh kiểm tra (phiếu Phase 5b lần 3, mục 11.5; business-flow §6.10): chụp một
 * ảnh, biết chỗ người (hoặc mắt) trên khung; sau đó chỉ đọc cảm biến chuyển động để đoán chỗ đó dịch
 * tới đâu khi người dùng di chuyển máy, ngay trên UI thread, không chụp thêm. Chấm người và mũi tên
 * tới chấm đích bám theo tay không trễ; chụp kiểm tra khi chấm tới đích và máy đã yên.
 *
 * Máy xoay: con quay (gyroscope) của Reanimated cho tốc độ xoay (rad/s) theo hệ trục của máy, quy
 * tắc bàn tay phải, như nhau trên iOS và Android: x sang phải màn hình, y lên đỉnh máy, z ra phía mặt
 * người cầm. Camera sau nhìn theo −z; camera trước nhìn theo +z và khung ngắm soi gương (điểm bên
 * phải máy hiện bên phải khung). Đo chính xác.
 *
 * Máy dịch chuyển (bước ngang, tiến, lùi; phiếu lần 4, người dùng muốn theo cả việc này): cảm biến
 * gia tốc (gia tốc thẳng, đã bỏ trọng lực) cộng hai lần ra quãng máy đã đi (mét), đổi ra quãng chấm
 * chạy nhờ khoảng cách tới người ước lượng từ ảnh (`depthOf`). Cảm biến gia tốc trôi nhanh nên chỉ
 * tin trong một hai giây: máy yên thì đặt vận tốc về 0 (zero-velocity update) và học độ lệch không;
 * đi liền quá `TRACK.walkMaxMs` thì thôi cộng. Chấm chạy đúng chiều, quãng chỉ gần đúng; khi máy yên
 * lại, ảnh kiểm tra sau đặt lại chấm. Camera trước không theo máy dịch chuyển (người cầm máy đi theo
 * máy). Người mẫu tự đi thì không biết.
 *
 * Gia tốc của Reanimated theo quy ước iOS (Android đã đổi dấu cho giống): máy nằm yên trên bàn thì
 * trọng lực đọc (0, 0, −9,8); đẩy máy theo +x thì gia tốc thẳng đọc −x. Android: `ACCELEROMETER` đã
 * là gia tốc thẳng; iOS: gia tốc thô, bên `GuideOverlay` trừ `GRAVITY`.
 *
 * Hàm thuần, chạy được trên UI thread, test được trong Jest.
 */
import { J, type Joint, type PhotoFeatures, visible } from 'composition-critic';

/** Quaternion [w, x, y, z]. */
export type Quat = [number, number, number, number];
export const Q_ID: Quat = [1, 0, 0, 0];

export type Vec = [number, number, number];
export const V0: Vec = [0, 0, 0];

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
   * theo máy, bên JS chụp lại theo nhịp như tiêu chí không theo được.
   */
  deadMs: 1000,
  /** Gia tốc (m/s², đã trừ độ lệch không) dưới chừng này: máy không dịch chuyển (run tay). */
  accStill: 0.4,
  /** Gia tốc dưới chừng này bị bỏ khi cộng (run tay, nhiễu); lớn hơn thì trừ đi chừng này. */
  accDead: 0.1,
  /** Gia tốc vượt chừng này: đã di chuyển máy (bước đi); máy chưa yên. */
  moveAcc: 1.2,
  /** Độ lệch không của cảm biến gia tốc: trung bình chậm khi máy yên, hằng thời gian (s). */
  accBiasTau: 1,
  /** Con quay yên liền chừng này ms mà gia tốc chưa về 0 (độ lệch không lớn): thôi cộng quãng. */
  accHoldMs: 500,
  /** Đi liền quá chừng này ms thì thôi cộng quãng (trôi quá nhiều), chờ máy yên để chụp lại. */
  walkMaxMs: 3000,
  /** Vận tốc tối đa (m/s) khi cộng (chặn số liệu hỏng). */
  maxSpeed: 2,
  /** Gia tốc đọc quá chừng này (m/s²): số liệu hỏng (iOS chưa có trọng lực để trừ), bỏ. */
  accBad: 30,
  /** Khoảng cách tới người (m) khi ảnh không cho đủ khớp để ước lượng; giới hạn ước lượng. */
  depth: 3,
  depthMin: 0.5,
  depthMax: 12,
  /**
   * Cỡ thật để ước lượng khoảng cách (m): thân (giữa hai vai → giữa hai hông, theo khớp MediaPipe),
   * bề ngang hai khớp vai. Người lớn; trẻ em nhỏ hơn thì chấm chạy hơi nhanh, ảnh kiểm tra sửa lại.
   */
  torso: 0.5,
  shoulders: 0.36,
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

/** Đổi vector `v` bằng quaternion `q`: q ⊗ v ⊗ q*. */
export function qRot(q: Quat, v: Vec): Vec {
  'worklet';
  const r = qMul(qMul(q, [0, v[0], v[1], v[2]]), qConj(q));
  return [r[1], r[2], r[3]];
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
 * `shot`), sau khi máy xoay `rel` (quaternion: hệ máy lúc này → hệ máy lúc chụp) và dịch `o` (theo
 * hệ máy lúc chụp, chia cho khoảng cách tới điểm theo trục camera). Điểm ra sau lưng camera: null.
 */
export function project(
  p: { x: number; y: number },
  shot: Lens,
  rel: Quat,
  now: Lens,
  o: Vec = V0,
): { x: number; y: number } | null {
  'worklet';
  // Điểm (chia cho khoảng cách) nhìn từ chỗ máy lúc này, theo hệ máy lúc chụp.
  const v: Quat = [
    0,
    (p.x - 0.5) * 2 * shot.tx - o[0],
    -(p.y - 0.5) * 2 * shot.ty - o[1],
    (shot.front ? 1 : -1) - o[2],
  ];
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

/** Một lần chụp kiểm tra, đã phân tích: chấm người, đích, góc và chỗ của máy lúc chụp. */
export type Anchor = {
  /** Tăng mỗi lần đặt chấm (để biết kết quả trên UI thread đã theo lần này chưa). */
  id: number;
  q: Quat;
  /** Chỗ máy lúc chụp (m, hệ lúc bắt đầu theo dõi); khoảng cách tới người (m). */
  s: Vec;
  depth: number;
  /** Góc nhìn ở zoom 1, zoom lúc chụp. */
  lens: Lens;
  zoom: number;
  at: { x: number; y: number };
  target: TrackTarget;
  axis: 'x' | 'y';
  /** Ngưỡng đạt của tiêu chí (cùng đơn vị với khoảng lệch theo `axis`). */
  band: number;
};

/** Kết quả theo máy, ghi mỗi khung hình trên UI thread. */
export type Live = {
  /** Góc máy cộng dồn từ lúc bắt đầu theo dõi. */
  q: Quat;
  bias: Vec;
  /** Chỗ (m), vận tốc (m/s) của máy theo hệ lúc bắt đầu; độ lệch không của gia tốc (hệ máy). */
  s: Vec;
  v: Vec;
  ab: Vec;
  /** Đang cộng quãng liền bao lâu, ms. */
  walkMs: number;
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
  bias: V0,
  s: V0,
  v: V0,
  ab: V0,
  walkMs: 0,
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

export type Xyz = { x: number; y: number; z: number };

/**
 * Một khung hình: `w` tốc độ xoay đọc từ con quay (rad/s), `lin` gia tốc thẳng (m/s², quy ước ở đầu
 * file; null khi không có), `dtMs` từ khung trước, `epoch` lần chụp mới nhất (bên JS tăng ngay trước
 * khi chụp), `anchor` lần chụp đã phân tích, `zoom` lúc này.
 */
export function trackFrame(
  l: Live,
  w: Xyz,
  lin: Xyz | null,
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

  // Máy dịch chuyển: gia tốc (đẩy máy theo +x thì +x), trừ độ lệch không.
  const raw: Vec = lin ? [-lin.x, -lin.y, -lin.z] : V0;
  const good = Math.sqrt(raw[0] * raw[0] + raw[1] * raw[1] + raw[2] * raw[2]) < TRACK.accBad;
  let ab = l.ab;
  const a: Vec = good ? [raw[0] - ab[0], raw[1] - ab[1], raw[2] - ab[2]] : V0;
  const mag = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
  if (mag > TRACK.moveAcc) moved = true;
  const stillMs =
    rate < TRACK.stillRate && mag < TRACK.moveAcc ? (fresh ? 0 : l.stillMs) + dtMs : 0;
  let s = l.s;
  let v = l.v;
  let walkMs = l.walkMs;
  if (rate < TRACK.stillRate && mag < TRACK.accStill) {
    // Máy yên: vận tốc về 0, học độ lệch không.
    const k = dt / TRACK.accBiasTau;
    ab = [ab[0] + a[0] * k, ab[1] + a[1] * k, ab[2] + a[2] * k];
    v = V0;
    walkMs = 0;
  } else if (stillMs >= TRACK.accHoldMs || walkMs >= TRACK.walkMaxMs) {
    // Con quay yên lâu mà gia tốc chưa về (độ lệch không lớn), hoặc đi quá lâu: thôi cộng.
    v = V0;
    if (stillMs >= TRACK.accHoldMs) walkMs = 0;
  } else {
    const shrink = mag > TRACK.accDead ? 1 - TRACK.accDead / mag : 0;
    const aw = qRot(q, [a[0] * shrink, a[1] * shrink, a[2] * shrink]);
    let nv: Vec = [v[0] + aw[0] * dt, v[1] + aw[1] * dt, v[2] + aw[2] * dt];
    const speed = Math.sqrt(nv[0] * nv[0] + nv[1] * nv[1] + nv[2] * nv[2]);
    if (speed > TRACK.maxSpeed) {
      const c = TRACK.maxSpeed / speed;
      nv = [nv[0] * c, nv[1] * c, nv[2] * c];
    }
    s = [
      s[0] + ((v[0] + nv[0]) / 2) * dt,
      s[1] + ((v[1] + nv[1]) / 2) * dt,
      s[2] + ((v[2] + nv[2]) / 2) * dt,
    ];
    v = nv;
    walkMs += dtMs;
  }

  const zeroMs = w.x === 0 && w.y === 0 && w.z === 0 ? l.zeroMs + dtMs : 0;
  const out: Live = {
    ...l,
    q,
    bias: [bx, by, bz],
    s,
    v,
    ab,
    walkMs,
    epoch,
    q0,
    moved,
    stillMs,
    zeroMs,
  };
  if (!anchor || zeroMs >= TRACK.deadMs) return { ...out, for: -1, reached: false };
  const rel = qMul(qConj(anchor.q), q);
  // Quãng máy đi từ lúc chụp, theo hệ máy lúc chụp, chia cho khoảng cách tới người.
  let o = V0;
  if (!anchor.lens.front && anchor.depth > 0) {
    const d = qRot(qConj(anchor.q), [s[0] - anchor.s[0], s[1] - anchor.s[1], s[2] - anchor.s[2]]);
    o = [d[0] / anchor.depth, d[1] / anchor.depth, d[2] / anchor.depth];
  }
  const p = project(
    anchor.at,
    zoomed(anchor.lens, anchor.zoom),
    rel,
    zoomed(anchor.lens, zoom),
    o,
  );
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

/**
 * Khoảng cách (m, theo trục camera) tới người chính trong ảnh, từ cỡ thân (giữa vai → giữa hông)
 * hoặc bề ngang vai trên khung, với góc nhìn `lens` lúc chụp (đã tính zoom). Không đủ khớp:
 * `TRACK.depth`.
 */
export function depthOf(f: PhotoFeatures | null, lens: Lens): number {
  const j = f?.joints;
  const span = (a: Joint, b: Joint) =>
    Math.hypot((a.x - b.x) * 2 * lens.tx, (a.y - b.y) * 2 * lens.ty);
  const mid = (a: Joint, b: Joint): Joint => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, v: 1 });
  let d: number = TRACK.depth;
  const sl = j?.[J.shoulderL];
  const sr = j?.[J.shoulderR];
  const hl = j?.[J.hipL];
  const hr = j?.[J.hipR];
  if (sl && sr && visible(sl) && visible(sr)) {
    if (hl && hr && visible(hl) && visible(hr)) {
      const t = span(mid(sl, sr), mid(hl, hr));
      if (t > 1e-3) d = TRACK.torso / t;
    } else {
      const w = span(sl, sr);
      if (w > 1e-3) d = TRACK.shoulders / w;
    }
  }
  return Math.min(TRACK.depthMax, Math.max(TRACK.depthMin, d));
}
