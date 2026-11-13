import { MaskHistory, applyStroke, rasterizeContours, refineGridSize } from '../brush';
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

  it('cọ khôi phục chỉ tô lại phần thuộc dáng người gốc', () => {
    const source = rasterizeContours([square], 100, 100);
    const g = source.slice();
    applyStroke(g, 100, 100, { mode: 'erase', radius: 10, points: [50, 50] });
    expect(g[50 * 100 + 50]).toBe(0);
    // Nét to tràn ra ngoài hình vuông: chỉ phần trong hình vuông được tô lại.
    applyStroke(g, 100, 100, { mode: 'restore', radius: 30, points: [50, 50] }, source);
    expect(g[50 * 100 + 50]).toBe(1);
    expect(g[50 * 100 + 22]).toBe(0);
    expect(sum(g)).toBeCloseTo(sum(source), 0);
    // Thiếu lưới gốc thì không làm gì.
    const before = sum(g);
    applyStroke(g, 100, 100, { mode: 'restore', radius: 30, points: [10, 10] });
    expect(sum(g)).toBe(before);
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

  it('giữ tối đa 30 bước, nét cũ hơn vẫn còn trên lưới', () => {
    const h = new MaskHistory(new Float32Array(100), 10, 10, 30);
    h.push(add(1));
    for (let i = 0; i < 30; i++) h.push({ mode: 'add', radius: 0.5, points: [8.5, 0.5] });
    for (let i = 0; i < 40; i++) h.undo();
    expect(h.canUndo).toBe(false);
    expect(h.grid.data[5 * 10 + 1]).toBe(1);
    expect(h.edited).toBe(true);
  });
});
