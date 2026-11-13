import type { Grid } from '../contour';
import {
  groupPeople,
  keepBodyOnPeople,
  keepSegmentsOnPeople,
  labelRegions,
  maskForPeople,
  personAt,
} from '../regions';

/** Lưới w×h, các hình chữ nhật [x0, y0, x1, y1) mang giá trị 1. */
function gridWith(w: number, h: number, rects: [number, number, number, number][]): Grid {
  const data = new Float32Array(w * h);
  for (const [x0, y0, x1, y1] of rects) {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) data[y * w + x] = 1;
  }
  return { width: w, height: h, data };
}

describe('labelRegions', () => {
  it('đếm đúng các vùng rời nhau và khung của chúng', () => {
    const g = gridWith(20, 10, [
      [1, 1, 5, 9],
      [10, 2, 18, 8],
    ]);
    const l = labelRegions(g);
    expect(l.regions).toHaveLength(2);
    expect(l.regions.map((r) => r.area).sort((a, b) => a - b)).toEqual([32, 48]);
    expect(l.regions.find((r) => r.area === 32)!.bbox).toEqual([1, 1, 5, 9]);
  });

  it('nối vùng chạm chéo (8 hướng)', () => {
    const g = gridWith(4, 4, [
      [0, 0, 1, 1],
      [1, 1, 2, 2],
    ]);
    expect(labelRegions(g).regions).toHaveLength(1);
  });
});

describe('groupPeople', () => {
  it('chỉ vùng đủ lớn là người, vùng nhỏ gắn vào người gần nhất, xếp trái sang phải', () => {
    const g = gridWith(100, 100, [
      [60, 10, 90, 90], // người phải
      [5, 10, 35, 90], // người trái
      [37, 50, 39, 52], // mảng nhỏ sát người trái
    ]);
    const people = groupPeople(labelRegions(g), 0.02);
    expect(people).toHaveLength(2);
    expect(people[0]!.bbox[0]).toBe(5);
    expect(people[0]!.regionIds).toHaveLength(2);
    expect(people[1]!.regionIds).toHaveLength(1);
  });

  it('không có vùng nào đủ lớn → không có người', () => {
    const g = gridWith(100, 100, [[0, 0, 5, 5]]);
    expect(groupPeople(labelRegions(g), 0.02)).toEqual([]);
  });

  it('nhiều mảng nhỏ cộng lại đủ lớn → một người', () => {
    const g = gridWith(100, 100, [
      [10, 10, 22, 22],
      [30, 10, 42, 22],
    ]);
    const people = groupPeople(labelRegions(g), 0.02);
    expect(people).toHaveLength(1);
    expect(people[0]!.regionIds).toHaveLength(2);
    expect(people[0]!.bbox).toEqual([10, 10, 42, 22]);
  });
});

describe('maskForPeople và personAt', () => {
  const g = gridWith(100, 100, [
    [5, 10, 35, 90],
    [60, 10, 90, 90],
  ]);
  const l = labelRegions(g);
  const people = groupPeople(l, 0.02);

  it('chỉ giữ người đã chọn', () => {
    const m = maskForPeople(g, l, [people[1]!]);
    expect(m.data[50 * 100 + 20]).toBe(0);
    expect(m.data[50 * 100 + 70]).toBe(1);
  });

  it('chạm trúng hoặc sát mép người đều nhận ra', () => {
    expect(personAt(l, people, 20, 50, 3)).toBe(0);
    expect(personAt(l, people, 37, 50, 3)).toBe(0);
    expect(personAt(l, people, 48, 50, 3)).toBeNull();
  });

  it('nét mặt và khung xương chỉ giữ phần trên người đã chọn', () => {
    const face = [0.2, 0.3, 0.22, 0.3, 0.7, 0.3, 0.72, 0.3];
    expect(keepSegmentsOnPeople(face, l, [people[1]!], 2)).toEqual([0.7, 0.3, 0.72, 0.3]);
    expect(keepSegmentsOnPeople([0.2, 0.3, 0.22, 0.3], l, [people[1]!], 2)).toBeNull();
    const body = [0.7, 0.3, 1, 0.75, 0.5, 1, 0.2, 0.5, 0.1];
    expect(keepBodyOnPeople(body, l, [people[1]!], 2)).toBe(body);
    expect(keepBodyOnPeople(body, l, [people[0]!], 2)).toBeNull();
  });
});
