import { containSize, hitOverlay } from '../overlayHit';
import { deviceRoll, levelUsable } from '../level';

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
