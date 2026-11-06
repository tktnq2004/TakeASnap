import { nextZoomFactor, zoomFactorToProp } from '../zoom';

describe('nextZoomFactor', () => {
  it('pinch ×2 khoảng cách thì hệ số zoom ×2', () => {
    expect(nextZoomFactor(1, 2, 15)).toBeCloseTo(2);
    expect(nextZoomFactor(2, 2, 15)).toBeCloseTo(4);
  });

  it('nhiều frame nhỏ cộng dồn bằng một frame lớn', () => {
    let f = 1;
    for (let i = 0; i < 10; i++) f = nextZoomFactor(f, 2 ** 0.1, 15);
    expect(f).toBeCloseTo(2, 6);
  });

  it('kẹp trong [1, max]', () => {
    expect(nextZoomFactor(1, 0.5, 15)).toBe(1);
    expect(nextZoomFactor(10, 3, 15)).toBe(15);
  });
});

describe('zoomFactorToProp', () => {
  it('1× là 0, max là 1', () => {
    expect(zoomFactorToProp(1, 15, 0.001)).toBe(0);
    expect(zoomFactorToProp(15, 15, 0.001)).toBe(1);
  });

  it('đủ mịn ở mức zoom thấp: 1× → 2× đi qua hơn 50 nấc', () => {
    const steps = new Set<number>();
    for (let f = 1; f <= 2; f += 0.005) steps.add(zoomFactorToProp(f, 15, 0.001));
    expect(steps.size).toBeGreaterThan(50);
  });
});
