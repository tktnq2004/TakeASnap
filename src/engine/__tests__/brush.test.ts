import { applyStroke, brushSource, MaskHistory, rasterizeContours, refineGridSize } from '../brush';
import { buildContours, type Contour, personAreaRatio } from '../contour';

const sum = (a: Float32Array) => a.reduce((s, v) => s + v, 0);

const square: Contour = {
  isHole: false,
  points: [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.75, y: 0.75 },
    { x: 0.25, y: 0.75 },
  ],
};

describe('refineGridSize', () => {
  it('giữ tỉ lệ ảnh, cạnh dài 512', () => {
    expect(refineGridSize(3000, 4000)).toEqual({ width: 384, height: 512 });
  });
});

describe('rasterizeContours', () => {
  it('tô đúng diện tích hình vuông', () => {
    const g = rasterizeContours([square], 100, 100);
    expect(sum(g)).toBeCloseTo(2500, 0);
    expect(g[50 * 100 + 50]).toBe(1);
    expect(g[10 * 100 + 10]).toBe(0);
  });

  it('lỗ để trống (evenOdd)', () => {
    const hole: Contour = {
      isHole: true,
      points: [
        { x: 0.4, y: 0.4 },
        { x: 0.6, y: 0.4 },
        { x: 0.6, y: 0.6 },
        { x: 0.4, y: 0.6 },
      ],
    };
    const g = rasterizeContours([square, hole], 100, 100);
    expect(g[50 * 100 + 50]).toBe(0);
    expect(sum(g)).toBeCloseTo(2500 - 400, 0);
  });

  it('dò viền lại ra gần đúng hình cũ', () => {
    const g = rasterizeContours([square], 200, 200);
    const back = buildContours({ width: 200, height: 200, data: g });
    expect(back).toHaveLength(1);
    expect(personAreaRatio(back)).toBeCloseTo(0.25, 2);
  });
});

describe('applyStroke', () => {
  it('cọ thêm tô một vệt, cọ xóa xóa vệt đó', () => {
    const g = new Float32Array(100 * 100);
    applyStroke(g, 100, 100, { mode: 'add', radius: 5, points: [20, 50, 80, 50] });
    expect(g[50 * 100 + 50]).toBe(1);
    expect(g[50 * 100 + 20]).toBe(1);
    expect(g[30 * 100 + 50]).toBe(0);
    // Vệt dài 60, rộng 10, hai đầu tròn.
    expect(sum(g)).toBeGreaterThan(600);
    expect(sum(g)).toBeLessThan(700);
    applyStroke(g, 100, 100, { mode: 'erase', radius: 8, points: [50, 50] });
    expect(g[50 * 100 + 50]).toBe(0);
    expect(g[50 * 100 + 30]).toBe(1);
  });
});

describe('cọ Thêm nhận ra người', () => {
  const rect = (x0: number, y0: number, x1: number, y1: number): Contour => ({
    isHole: false,
    points: [
      { x: x0 / 100, y: y0 / 100 },
      { x: x1 / 100, y: y0 / 100 },
      { x: x1 / 100, y: y1 / 100 },
      { x: x0 / 100, y: y1 / 100 },
    ],
  });
  // Hai người: A bên trái (đã chọn), B bên phải (chưa chọn).
  const A = rect(10, 20, 40, 80);
  const B = rect(60, 20, 90, 80);
  const source = () => brushSource(rasterizeContours([A, B], 100, 100), 100, 100);
  const at = (g: Float32Array, x: number, y: number) => g[y * 100 + x]!;

  it('tô lên người chưa chọn đủ nhiều thì hiện cả người đó', () => {
    const g = rasterizeContours([A], 100, 100);
    applyStroke(g, 100, 100, { mode: 'add', radius: 6, points: [75, 25, 75, 75] }, source());
    expect(at(g, 62, 22)).toBe(1);
    expect(at(g, 88, 78)).toBe(1);
    // Nền quanh B không thành người.
    expect(at(g, 95, 50)).toBe(0);
  });

  it('tô lại vùng đã xóa thì theo dáng người, không tô ra nền, không hiện lại vùng xóa khác', () => {
    const g = rasterizeContours([A, B], 100, 100);
    applyStroke(g, 100, 100, { mode: 'erase', radius: 10, points: [25, 25] });
    applyStroke(g, 100, 100, { mode: 'erase', radius: 3, points: [37, 70] });
    expect(at(g, 25, 25)).toBe(0);
    applyStroke(g, 100, 100, { mode: 'add', radius: 12, points: [25, 25] }, source());
    expect(at(g, 25, 25)).toBe(1);
    expect(at(g, 25, 14)).toBe(0);
    expect(at(g, 37, 70)).toBe(0);
  });

  it('tô chủ yếu lên nền thì nới viền theo nét cọ', () => {
    const g = rasterizeContours([A], 100, 100);
    applyStroke(g, 100, 100, { mode: 'add', radius: 4, points: [42, 50, 55, 50] }, source());
    expect(at(g, 50, 50)).toBe(1);
    // B không bị hiện vì nét chỉ chạm mép.
    expect(at(g, 75, 50)).toBe(0);
  });
});

describe('MaskHistory', () => {
  const add = (x: number) => ({ mode: 'add' as const, radius: 2, points: [x, 5] });

  it('hoàn tác và làm lại', () => {
    const h = new MaskHistory(new Float32Array(100), 10, 10);
    h.push(add(2));
    h.push(add(7));
    expect(h.grid.data[5 * 10 + 7]).toBe(1);
    h.undo();
    expect(h.grid.data[5 * 10 + 7]).toBe(0);
    expect(h.grid.data[5 * 10 + 2]).toBe(1);
    expect(h.canRedo).toBe(true);
    h.redo();
    expect(h.grid.data[5 * 10 + 7]).toBe(1);
    h.undo();
    h.push(add(5));
    expect(h.canRedo).toBe(false);
  });

  it('hoàn tác hết rồi làm lại hết về đúng từng lưới, kể cả nét Thêm nhận ra người', () => {
    const square2: Contour = {
      isHole: false,
      points: square.points.map((p) => ({ x: p.x * 0.5 + 0.5, y: p.y })),
    };
    const src = rasterizeContours([square, square2], 40, 40);
    const base = rasterizeContours([square], 40, 40);
    const h = new MaskHistory(base, 40, 40, 30, brushSource(src, 40, 40));
    const states: Float32Array[] = [base.slice()];
    for (let i = 0; i < 12; i++) {
      h.push({
        mode: i % 3 === 2 ? 'erase' : 'add',
        radius: 2,
        points: [5 + i * 2.5, 20, 30, 20 + i],
      });
      states.push((h.grid.data as Float32Array).slice());
    }
    for (let i = 12; i > 0; i--) {
      h.undo();
      expect(Array.from(h.grid.data)).toEqual(Array.from(states[i - 1]!));
    }
    for (let i = 1; i <= 12; i++) {
      h.redo();
      expect(Array.from(h.grid.data)).toEqual(Array.from(states[i]!));
    }
  });

  it('mặc định không giới hạn: hoàn tác hết là về lưới ban đầu', () => {
    const h = new MaskHistory(new Float32Array(100), 10, 10);
    for (let i = 0; i < 60; i++)
      h.push({ mode: 'add', radius: 0.5, points: [(i % 10) + 0.5, 0.5] });
    for (let i = 0; i < 60; i++) h.undo();
    expect(h.canUndo).toBe(false);
    expect(h.edited).toBe(false);
    expect(Array.from(h.grid.data).every((v) => v === 0)).toBe(true);
  });

  it('có giới hạn thì giữ tối đa `limit` bước, nét cũ hơn vẫn còn trên lưới', () => {
    const h = new MaskHistory(new Float32Array(100), 10, 10, 30);
    h.push(add(1));
    for (let i = 0; i < 30; i++) h.push({ mode: 'add', radius: 0.5, points: [8.5, 0.5] });
    for (let i = 0; i < 40; i++) h.undo();
    expect(h.canUndo).toBe(false);
    expect(h.grid.data[5 * 10 + 1]).toBe(1);
    expect(h.edited).toBe(true);
  });
});
