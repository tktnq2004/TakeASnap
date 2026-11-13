import {
  buildContours,
  contoursToSvgPath,
  downsampleMask,
  type Grid,
  insideContours,
  personAreaRatio,
  segmentsInContours,
  signedArea,
  simplifyClosed,
  traceContours,
} from '../contour';

/** Tạo lưới w × h, giá trị 1 ở pixel mà `inside(x, y)` trả true. */
function grid(w: number, h: number, inside: (x: number, y: number) => boolean): Grid {
  const data = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data[y * w + x] = inside(x, y) ? 1 : 0;
  return { width: w, height: h, data };
}

const square = (x0: number, y0: number, x1: number, y1: number) => (x: number, y: number) =>
  x >= x0 && x < x1 && y >= y0 && y < y1;

describe('traceContours', () => {
  it('hình vuông đặc → 1 đường bao ngoài, diện tích ≈ số pixel', () => {
    const c = traceContours(grid(20, 20, square(5, 5, 15, 15)), 0.5);
    expect(c).toHaveLength(1);
    expect(c[0]!.isHole).toBe(false);
    // Đường đi qua trung điểm giữa pixel trong và ngoài: vuông 10 × 10, vạt 4 góc.
    expect(Math.abs(signedArea(c[0]!.points))).toBeCloseTo(100 - 4 * 0.125, 3);
  });

  it('vành khuyên → 1 đường bao ngoài + 1 lỗ', () => {
    const ring = (x: number, y: number) =>
      square(3, 3, 17, 17)(x, y) && !square(8, 8, 12, 12)(x, y);
    const c = traceContours(grid(20, 20, ring), 0.5);
    expect(c).toHaveLength(2);
    expect(c.filter((k) => k.isHole)).toHaveLength(1);
    const hole = c.find((k) => k.isHole)!;
    const outer = c.find((k) => !k.isHole)!;
    expect(Math.abs(signedArea(hole.points))).toBeLessThan(Math.abs(signedArea(outer.points)));
  });

  it('hai mảng rời → 2 đường bao ngoài', () => {
    const two = (x: number, y: number) => square(1, 1, 6, 6)(x, y) || square(10, 10, 16, 16)(x, y);
    const c = traceContours(grid(20, 20, two), 0.5);
    expect(c).toHaveLength(2);
    expect(c.every((k) => !k.isHole)).toBe(true);
  });

  it('vùng chạm mép ảnh vẫn khép kín', () => {
    const c = traceContours(
      grid(10, 10, () => true),
      0.5,
    );
    expect(c).toHaveLength(1);
    expect(Math.abs(signedArea(c[0]!.points))).toBeGreaterThan(90);
  });

  it('ô chéo (saddle) không làm vỡ thuật toán, mọi đường khép kín', () => {
    const checker = (x: number, y: number) => (x + y) % 2 === 0;
    const c = traceContours(grid(6, 6, checker), 0.5);
    expect(c.length).toBeGreaterThan(0);
    for (const k of c) expect(k.points.length).toBeGreaterThanOrEqual(3);
  });

  it('nội suy theo giá trị: ngưỡng thấp → vùng rộng hơn', () => {
    const soft: Grid = { width: 3, height: 1, data: [0, 1, 0] };
    const wide = traceContours(soft, 0.25)[0]!;
    const narrow = traceContours(soft, 0.75)[0]!;
    expect(Math.abs(signedArea(wide.points))).toBeGreaterThan(Math.abs(signedArea(narrow.points)));
  });
});

describe('downsampleMask', () => {
  it('giữ nguyên khi đã nhỏ hơn maxSide', () => {
    const g = grid(10, 8, () => true);
    expect(downsampleMask(g, 512)).toBe(g);
  });
  it('thu về cạnh dài = maxSide, giữ tỉ lệ', () => {
    const g = downsampleMask(grid(1024, 512, square(0, 0, 512, 512)), 256);
    expect(g.width).toBe(256);
    expect(g.height).toBe(128);
    expect(g.data[0]).toBe(1);
    expect(g.data[255]).toBe(0);
  });
});

describe('simplifyClosed', () => {
  it('đường tròn 400 điểm → ít điểm hơn nhiều, sai lệch ≤ epsilon', () => {
    const pts = Array.from({ length: 400 }, (_, i) => {
      const a = (i / 400) * Math.PI * 2;
      return { x: 100 + 50 * Math.cos(a), y: 100 + 50 * Math.sin(a) };
    });
    const s = simplifyClosed(pts, 0.75);
    expect(s.length).toBeLessThan(60);
    expect(s.length).toBeGreaterThan(8);
    for (const p of s) expect(Math.hypot(p.x - 100, p.y - 100)).toBeCloseTo(50, 5);
  });
});

describe('buildContours', () => {
  it('bỏ mảng li ti (mảng thừa của model), giữ người', () => {
    const body = square(20, 10, 60, 90);
    const speck = square(90, 5, 92, 7); // 4 px trên ảnh 100 × 100 = 0.04%
    const c = buildContours(grid(100, 100, (x, y) => body(x, y) || speck(x, y)));
    expect(c).toHaveLength(1);
  });

  it('tọa độ chuẩn hóa 0..1 theo mask gốc, kể cả khi đã thu nhỏ', () => {
    const c = buildContours(grid(1000, 2000, square(250, 500, 750, 1500)), { maxSide: 200 });
    expect(c).toHaveLength(1);
    const xs = c[0]!.points.map((p) => p.x);
    const ys = c[0]!.points.map((p) => p.y);
    expect(Math.min(...xs)).toBeCloseTo(0.25, 1);
    expect(Math.max(...xs)).toBeCloseTo(0.75, 1);
    expect(Math.min(...ys)).toBeCloseTo(0.25, 1);
    expect(Math.max(...ys)).toBeCloseTo(0.75, 1);
  });

  it('tỉ lệ diện tích người trừ phần lỗ', () => {
    const ring = (x: number, y: number) =>
      square(0, 0, 100, 100)(x, y) && !square(25, 25, 75, 75)(x, y);
    const ratio = personAreaRatio(buildContours(grid(100, 100, ring)));
    expect(ratio).toBeCloseTo(0.75, 1);
  });
});

describe('contoursToSvgPath', () => {
  it('mỗi đường khép kín là một cụm M … C … Z, tọa độ theo kích thước vẽ', () => {
    const c = buildContours(grid(50, 50, square(10, 10, 40, 40)));
    const d = contoursToSvgPath(c, 200, 200);
    expect(d.startsWith('M')).toBe(true);
    expect(d.trim().endsWith('Z')).toBe(true);
    expect(d.match(/M/g)).toHaveLength(1);
    const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
    expect(Math.max(...nums)).toBeLessThanOrEqual(200);
  });
});

describe('segmentsInContours', () => {
  const box = (x0: number, y0: number, x1: number, y1: number, isHole = false) => ({
    isHole,
    points: [
      { x: x0, y: y0 },
      { x: x1, y: y0 },
      { x: x1, y: y1 },
      { x: x0, y: y1 },
    ],
  });
  const person = [box(0.2, 0.1, 0.8, 0.9), box(0.4, 0.4, 0.6, 0.6, true)];

  it('điểm trong người, trong lỗ và ngoài', () => {
    expect(insideContours(person, 0.3, 0.3)).toBe(true);
    expect(insideContours(person, 0.5, 0.5)).toBe(false);
    expect(insideContours(person, 0.9, 0.5)).toBe(false);
  });

  it('bỏ đoạn đã nằm ngoài người, giữ đoạn sát viền', () => {
    const inside = [0.3, 0.2, 0.32, 0.2];
    const nearEdge = [0.805, 0.5, 0.805, 0.52];
    const erased = [0.9, 0.2, 0.95, 0.2];
    expect(segmentsInContours([...inside, ...nearEdge, ...erased], person)).toEqual([
      ...inside,
      ...nearEdge,
    ]);
    expect(segmentsInContours(erased, person)).toBeNull();
    expect(segmentsInContours(null, person)).toBeNull();
  });
});
