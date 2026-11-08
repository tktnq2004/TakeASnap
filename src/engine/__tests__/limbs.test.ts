import type { Grid } from '../contour';
import { type BodyPoint, buildLimbOutlines, unpackBodyPoints } from '../limbs';

const W = 200;
const H = 200;

/** Mask: thân (70..130 × 50..150) + tay trái buông NGOÀI thân (40..56 × 50..140). */
function mask(): Grid {
  const data = new Float32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const torso = x >= 70 && x < 130 && y >= 50 && y < 150;
      const armOut = x >= 40 && x < 57 && y >= 50 && y < 140;
      data[y * W + x] = torso || armOut ? 1 : 0;
    }
  return { width: W, height: H, data };
}

/** 33 khớp, mặc định ẩn (v = 0); chỉ bật những khớp truyền vào (tọa độ pixel). */
function body(px: Record<number, [number, number]>): BodyPoint[] {
  return Array.from({ length: 33 }, (_, i) => {
    const p = px[i];
    return p ? { x: p[0] / W, y: p[1] / H, v: 1 } : { x: 0, y: 0, v: 0 };
  });
}

const shoulders = { 11: [48, 55], 12: [118, 55] } as Record<number, [number, number]>;

describe('buildLimbOutlines', () => {
  it('tay buông ngoài thân → không vẽ thêm (viền ngoài đã đủ)', () => {
    // Vai trái đặt ở giữa ống tay ngoài để S = 70; tay trái dọc theo ống tay.
    const pts = body({ ...shoulders, 13: [48, 95], 15: [48, 132] });
    expect(buildLimbOutlines(mask(), pts)).toHaveLength(0);
  });

  it('tay vắt ngang thân → hai nét ống tay + nét khép đầu', () => {
    const pts = body({ ...shoulders, 14: [112, 100], 16: [82, 110] });
    const lines = buildLimbOutlines(mask(), pts);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    for (const l of lines)
      for (const p of l) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(1);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(1);
      }
  });

  it('hai nét của ống tay nằm hai phía xương, cách nhau khoảng bề rộng tay', () => {
    // Cẳng tay ngang (y = 100) từ x 112 → 82 trên thân.
    const pts = body({ ...shoulders, 14: [112, 70], 16: [82, 100] });
    const lines = buildLimbOutlines(mask(), pts, { minRun: 2 });
    const ys = lines.filter((l) => l.length > 6).map((l) => l[Math.floor(l.length / 2)]!.y * H);
    expect(ys.length).toBeGreaterThanOrEqual(2);
  });

  it('thiếu vai → không dựng được thước đo, trả rỗng', () => {
    expect(buildLimbOutlines(mask(), body({ 14: [112, 100], 16: [82, 110] }))).toHaveLength(0);
  });

  it('khớp bị che (visibility thấp) thì cắt chuỗi tại đó', () => {
    const pts = body({ ...shoulders, 14: [112, 100] });
    pts[16] = { x: 82 / W, y: 110 / H, v: 0.2 };
    // Chỉ còn vai → khuỷu: vẫn vẽ được đoạn bắp tay nằm trên thân.
    expect(buildLimbOutlines(mask(), pts).length).toBeGreaterThanOrEqual(1);
  });
});

describe('unpackBodyPoints', () => {
  it('mảng phẳng [x, y, v, …] → điểm', () => {
    expect(unpackBodyPoints([0.1, 0.2, 0.9, 0.3, 0.4, 0.5])).toEqual([
      { x: 0.1, y: 0.2, v: 0.9 },
      { x: 0.3, y: 0.4, v: 0.5 },
    ]);
  });
});
