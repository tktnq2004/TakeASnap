import { applyRange, inRange, tileIndexAt } from '../selection';

const layout = { cols: 4, tileW: 80, tileH: 100, gap: 8, padX: 16, count: 10 };

describe('tileIndexAt', () => {
  it('ô theo hàng và cột, khe giữa hai ô tính cho ô bên trái', () => {
    expect(tileIndexAt(layout, 20, 10)).toBe(0);
    expect(tileIndexAt(layout, 16 + 88 + 5, 10)).toBe(1);
    expect(tileIndexAt(layout, 16 + 80 + 4, 10)).toBe(0);
    expect(tileIndexAt(layout, 20, 108 + 10)).toBe(4);
  });

  it('ngoài lưới kẹp về ô gần nhất, không vượt số ô', () => {
    expect(tileIndexAt(layout, -50, -20)).toBe(0);
    expect(tileIndexAt(layout, 999, 10)).toBe(3);
    expect(tileIndexAt(layout, 999, 999)).toBe(9);
    expect(tileIndexAt({ ...layout, count: 0 }, 20, 10)).toBe(-1);
  });
});

describe('dải vuốt', () => {
  const ids = ['a', 'b', 'c', 'd', 'e'];

  it('inRange hai chiều, -1 là chưa vuốt', () => {
    expect(inRange(2, 3, 1)).toBe(true);
    expect(inRange(0, 3, 1)).toBe(false);
    expect(inRange(0, -1, -1)).toBe(false);
  });

  it('chọn và bỏ chọn cả dải', () => {
    const s = applyRange(new Set(['a']), ids, 3, 1, true);
    expect([...s].sort()).toEqual(['a', 'b', 'c', 'd']);
    expect([...applyRange(s, ids, 0, 2, false)].sort()).toEqual(['d']);
  });
});
