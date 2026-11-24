import {
  type Anchor,
  lensOf,
  LIVE0,
  project,
  type Quat,
  qIntegrate,
  Q_ID,
  TRACK,
  trackFrame,
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
    lens: rear,
    zoom: 1,
    at: { x: 0.6, y: 0.4 },
    target: { kind: 'vline', x: 1 / 3 },
    axis: 'x',
    band: 0.05,
  };
  const run = (w: { x: number; y: number; z: number }, frames: number, l = LIVE0, epoch = 0) => {
    let r = l;
    for (let i = 0; i < frames; i++) r = trackFrame(r, w, 1000 / 60, epoch, anchor, 1);
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
