import { containSize, hitOverlay } from '../overlayHit';
import { deviceRoll, holdOf, levelUsable, rollFrom } from '../level';

const G = 9.81;
const deg = (r: number) => (r * 180) / Math.PI;

describe('deviceRoll', () => {
  it('máy dựng thẳng → 0 trên cả hai nền tảng', () => {
    expect(deg(deviceRoll(0, G, false))).toBeCloseTo(0);
    expect(deg(deviceRoll(0, -G, true))).toBeCloseTo(0);
  });

  it('đỉnh máy nghiêng phải 10° → +10° trên cả hai nền tảng', () => {
    const a = (10 * Math.PI) / 180;
    // Android: vector lên trong hệ trục máy có x = −g·sin, y = g·cos.
    expect(deg(deviceRoll(-G * Math.sin(a), G * Math.cos(a), false))).toBeCloseTo(10);
    // iOS: vector xuống, ngược dấu.
    expect(deg(deviceRoll(G * Math.sin(a), -G * Math.cos(a), true))).toBeCloseTo(10);
  });

  it('máy nằm ngửa → thước không dùng được', () => {
    expect(levelUsable(0.2, 0.3, G)).toBe(false);
    expect(levelUsable(0, G, 0.5)).toBe(true);
  });
});

describe('hitOverlay', () => {
  const id = { x: 0, y: 0, scale: 1, rotation: 0 };

  it('trúng trong khung, trượt ngoài khung', () => {
    expect(hitOverlay(40, 90, id, 100, 200)).toBe(true);
    expect(hitOverlay(60, 0, id, 100, 200)).toBe(false);
  });

  it('tính cả dịch, phóng và xoay', () => {
    const t = { x: 100, y: 0, scale: 2, rotation: Math.PI / 2 };
    // Xoay 90°: khung 100 × 200 thành 200 ngang × 100 dọc, rồi ×2 → 400 × 200, tâm ở (100, 0).
    expect(hitOverlay(100 + 190, 0, t, 100, 200)).toBe(true);
    expect(hitOverlay(100, 110, t, 100, 200)).toBe(false);
  });

  it('slop nới vùng chạm theo pt màn hình', () => {
    expect(hitOverlay(55, 0, id, 100, 200, 8)).toBe(true);
  });
});

describe('containSize', () => {
  it('ảnh dọc trong khung dọc cao hơn → vừa chiều rộng', () => {
    expect(containSize(3, 4, 300, 600)).toEqual({ width: 300, height: 400 });
  });
});

describe('holdOf (phiếu Phase 5b lần 17)', () => {
  it('dọc: nghiêng tới 60° vẫn là dọc, quá 60° là ngang theo phía đỉnh máy', () => {
    expect(holdOf(45, 0)).toBe(0);
    expect(holdOf(60, 0)).toBe(0);
    expect(holdOf(61, 0)).toBe(90);
    expect(holdOf(-75, 0)).toBe(-90);
  });

  it('ngang: về dưới 30° mới là dọc lại (độ trễ, không nhấp nháy quanh ngưỡng)', () => {
    expect(holdOf(40, 90)).toBe(90);
    expect(holdOf(29, 90)).toBe(0);
    expect(holdOf(-35, -90)).toBe(-90);
  });

  it('lộn ngược: quanh ±180° là 180, đi qua mốc ±180 không đổi', () => {
    expect(holdOf(170, 90)).toBe(180);
    expect(holdOf(-170, 180)).toBe(180);
    expect(holdOf(179, 180)).toBe(180);
    expect(holdOf(-125, 180)).toBe(180);
    expect(holdOf(-110, 180)).toBe(-90);
  });
});

describe('rollFrom (phiếu Phase 5b lần 18)', () => {
  const r = (d: number) => (d * Math.PI) / 180;
  it('cầm ngang: đỉnh máy nằm ngang là thẳng, lệch tính theo cách cầm', () => {
    expect(deg(rollFrom(r(90), 90))).toBeCloseTo(0);
    expect(deg(rollFrom(r(95), 90))).toBeCloseTo(5);
    expect(deg(rollFrom(r(-88), -90))).toBeCloseTo(2);
  });
  it('qua mốc ±180 vẫn ra góc nhỏ', () => {
    expect(deg(rollFrom(r(-175), 90))).toBeCloseTo(95);
    expect(deg(rollFrom(r(179), -90))).toBeCloseTo(-91);
  });
});
