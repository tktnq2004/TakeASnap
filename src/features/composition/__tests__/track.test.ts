import type { PhotoFeatures } from 'composition-critic';

import {
  type Anchor,
  depthOf,
  lensOf,
  LIVE0,
  project,
  type Quat,
  qIntegrate,
  Q_ID,
  TRACK,
  trackFrame,
  V0,
  type Xyz,
  zoomed,
} from '../track';

const deg = (d: number) => (d * Math.PI) / 180;
/** Xoay `d` độ quanh trục `axis` của máy, cộng dần như con quay (60 khung hình). */
const turn = (axis: 'x' | 'y' | 'z', d: number, q: Quat = Q_ID): Quat => {
  let r = q;
  const w = deg(d);
  for (let i = 0; i < 60; i++) {
    r = qIntegrate(r, axis === 'x' ? w : 0, axis === 'y' ? w : 0, axis === 'z' ? w : 0, 1 / 60);
  }
  return r;
};

const rear = lensOf({ width: 300, height: 400 }, { width: 300, height: 400 }, false);
const front = { ...rear, front: true };

describe('project: chỗ của người trên khung sau khi xoay máy', () => {
  it('không xoay: giữ nguyên chỗ', () => {
    const p = project({ x: 0.3, y: 0.6 }, rear, Q_ID, rear)!;
    expect(p.x).toBeCloseTo(0.3);
    expect(p.y).toBeCloseTo(0.6);
  });

  it('camera sau: xoay máy sang trái (quanh trục y, dương) → người dịch sang phải', () => {
    const p = project({ x: 0.5, y: 0.5 }, rear, turn('y', 10), rear)!;
    // Dịch tan(10°) / (2 · tan nửa góc ngang).
    expect(p.x).toBeCloseTo(0.5 + Math.tan(deg(10)) / (2 * TRACK.tanShort), 3);
    expect(p.y).toBeCloseTo(0.5, 3);
  });

  it('camera sau: ngửa máy lên (quanh trục x, dương) → người dịch xuống', () => {
    const p = project({ x: 0.5, y: 0.5 }, rear, turn('x', 8), rear)!;
    expect(p.y).toBeGreaterThan(0.6);
    expect(p.x).toBeCloseTo(0.5, 3);
  });

  it('camera trước (khung soi gương): cùng cú xoay thì người dịch ngược chiều camera sau', () => {
    const p = project({ x: 0.5, y: 0.5 }, front, turn('y', 10), front)!;
    expect(p.x).toBeLessThan(0.4);
  });

  it('zoom 2 thì cùng cú xoay dịch gấp đôi', () => {
    const one = project({ x: 0.5, y: 0.5 }, rear, turn('y', 5), rear)!.x - 0.5;
    const two =
      project({ x: 0.5, y: 0.5 }, zoomed(rear, 2), turn('y', 5), zoomed(rear, 2))!.x - 0.5;
    expect(two / one).toBeCloseTo(2, 2);
  });

  it('điểm ra sau lưng camera: null', () => {
    expect(project({ x: 0.5, y: 0.5 }, rear, turn('y', 120), rear)).toBeNull();
  });
});

describe('trackFrame: theo máy xoay mỗi khung hình', () => {
  // Người ở x 0,6, cần tới cột 1/3: xoay máy sang phải (quanh y, âm) để người dịch sang trái.
  const anchor: Anchor = {
    id: 1,
    q: Q_ID,
    s: V0,
    depth: 3,
    lens: rear,
    zoom: 1,
    at: { x: 0.6, y: 0.4 },
    target: { kind: 'vline', x: 1 / 3 },
    axis: 'x',
    band: 0.05,
  };
  const run = (w: Xyz, frames: number, l = LIVE0, epoch = 0, lin: Xyz | null = null, a = anchor) => {
    let r = l;
    for (let i = 0; i < frames; i++) r = trackFrame(r, w, lin, 1000 / 60, epoch, a, 1);
    return r;
  };

  it('chấm người chạy về chấm đích theo máy xoay, tới nơi thì reached', () => {
    const start = run({ x: 0, y: 0, z: 1e-4 }, 1);
    expect(start.for).toBe(1);
    expect(start.px).toBeCloseTo(0.6, 2);
    expect(start.tx).toBeCloseTo(1 / 3);
    expect(start.ty).toBeCloseTo(start.py);
    expect(start.reached).toBe(false);
    // Cần dịch 0,267 khung ↔ atan(0,267 · 2 · 0,5) ≈ 15°: xoay 15°/s trong 1 s.
    const after = run({ x: 0, y: -deg(15), z: 0 }, 60, start);
    expect(after.err).toBeLessThan(0.05 * TRACK.reach);
    expect(after.reached).toBe(true);
    expect(after.moved).toBe(true);
  });

  it('máy yên: đếm thời gian yên; lần chụp mới (epoch) tính lại "đã di chuyển"', () => {
    const moved = run({ x: 0, y: -0.5, z: 0 }, 10);
    expect(moved.moved).toBe(true);
    const still = run({ x: 0.01, y: 0, z: 0 }, 30, moved);
    expect(still.stillMs).toBeGreaterThan(450);
    const fresh = run({ x: 0.01, y: 0, z: 0 }, 1, still, 1);
    expect(fresh.moved).toBe(false);
    expect(fresh.stillMs).toBeLessThan(20);
  });

  it('con quay đọc đúng 0 liền 1 s (máy không có con quay): không theo máy xoay', () => {
    const dead = run({ x: 0, y: 0, z: 0 }, 70);
    expect(dead.for).toBe(-1);
  });

  it('độ lệch không của con quay: máy đứng yên thì chấm không trôi mãi', () => {
    const bias = 0.01;
    const r = run({ x: 0, y: bias, z: 0 }, 60 * 20);
    expect(r.bias[1]).toBeGreaterThan(bias * 0.9);
  });
});

describe('trackFrame: theo máy dịch chuyển (cảm biến gia tốc)', () => {
  // Người giữa khung, cách 3 m.
  const anchor: Anchor = {
    id: 1,
    q: Q_ID,
    s: V0,
    depth: 3,
    lens: rear,
    zoom: 1,
    at: { x: 0.5, y: 0.4 },
    target: { kind: 'vline', x: 1 / 3 },
    axis: 'x',
    band: 0.05,
  };
  const quiet: Xyz = { x: 0, y: 0, z: 1e-4 };
  /** Gia tốc thẳng theo quy ước Reanimated: đẩy máy theo +x thì đọc −x. */
  const push = (ax: number): Xyz => ({ x: -ax, y: 0, z: 0 });
  const run = (lin: Xyz, frames: number, l = LIVE0, a = anchor) => {
    let r = l;
    for (let i = 0; i < frames; i++) r = trackFrame(r, quiet, lin, 1000 / 60, 0, a, 1);
    return r;
  };
  /** Bước sang trái chừng 0,5 m trong 1 s: tăng tốc rồi hãm, rồi đứng yên. */
  const stepLeft = (a = anchor) => {
    const go = run(push(-2), 30, LIVE0, a);
    const stop = run(push(2), 30, go, a);
    return { go, end: run({ x: 0, y: 0, z: 0 }, 30, stop, a) };
  };

  it('camera sau: bước sang trái → người dịch sang phải, chừng quãng bước / bề ngang khung', () => {
    const { go, end } = stepLeft();
    expect(go.moved).toBe(true);
    expect(end.s[0]).toBeLessThan(-0.4);
    expect(end.s[0]).toBeGreaterThan(-0.55);
    // 0,5 m ở 3 m: bề ngang khung 3 m → dịch chừng 1/6 khung.
    expect(end.px).toBeGreaterThan(0.62);
    expect(end.px).toBeLessThan(0.7);
    expect(end.py).toBeCloseTo(0.4, 2);
  });

  it('đứng yên sau khi bước: vận tốc về 0, chấm không trôi tiếp', () => {
    const { end } = stepLeft();
    const later = run({ x: 0, y: 0, z: 0 }, 120, end);
    expect(later.v).toEqual(V0);
    expect(later.px).toBeCloseTo(end.px, 3);
  });

  it('camera trước: không theo máy dịch chuyển', () => {
    const { end } = stepLeft({ ...anchor, lens: front });
    expect(end.px).toBeCloseTo(0.5, 3);
  });

  it('độ lệch không của gia tốc khi máy yên: không cộng quãng, học độ lệch', () => {
    const r = run({ x: 0.2, y: 0, z: 0 }, 120);
    expect(r.s).toEqual(V0);
    expect(r.ab[0]).toBeLessThan(-0.15);
  });

  it('đi quá lâu: thôi cộng quãng', () => {
    const r = run(push(-1.5), 60 * 5);
    expect(r.walkMs).toBeGreaterThanOrEqual(3000);
    expect(r.v).toEqual(V0);
  });
});

describe('depthOf: khoảng cách tới người từ cỡ thân trên khung', () => {
  const joints = (sh: number, hip: number | null) => {
    const j = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, v: 0 }));
    j[11] = { x: 0.45, y: sh, v: 1 };
    j[12] = { x: 0.55, y: sh, v: 1 };
    if (hip != null) {
      j[23] = { x: 0.47, y: hip, v: 1 };
      j[24] = { x: 0.53, y: hip, v: 1 };
    }
    return { joints: j } as unknown as PhotoFeatures;
  };

  it('thân 0,5 m chiếm 1/8 bề cao khung → chừng 0,5 / (0,125 · 2 · 0,665) ≈ 3 m', () => {
    expect(depthOf(joints(0.4, 0.525), rear)).toBeCloseTo(0.5 / (0.125 * 2 * 0.665), 2);
  });

  it('không thấy hông: theo bề ngang vai', () => {
    expect(depthOf(joints(0.4, null), rear)).toBeCloseTo(0.36 / (0.1 * 2 * 0.5), 2);
  });

  it('không có khớp: mặc định, và kẹp trong giới hạn', () => {
    expect(depthOf(null, rear)).toBe(TRACK.depth);
    expect(depthOf(joints(0.4, 0.41), rear)).toBe(TRACK.depthMax);
  });
});
