import { formatZoom, nextZoomFactor, type ZoomConfig, zoomTarget } from '../zoom';

const ios: ZoomConfig = {
  platform: 'ios',
  hasUltraWide: true,
  iosMaxFactor: 100,
  androidMaxRatio: 8,
  precision: 0.0001,
};
const android: ZoomConfig = { ...ios, platform: 'android', hasUltraWide: false };

describe('nextZoomFactor', () => {
  it('pinch ×2 khoảng cách thì hệ số zoom ×2', () => {
    expect(nextZoomFactor(1, 2, 0.5, 5)).toBeCloseTo(2);
    expect(nextZoomFactor(2, 2, 0.5, 5)).toBeCloseTo(4);
  });

  it('nhiều frame nhỏ cộng dồn bằng một frame lớn', () => {
    let f = 1;
    for (let i = 0; i < 10; i++) f = nextZoomFactor(f, 2 ** 0.1, 0.5, 5);
    expect(f).toBeCloseTo(2, 6);
  });

  it('kẹp trong [min, max]', () => {
    expect(nextZoomFactor(0.6, 0.5, 0.5, 5)).toBe(0.5);
    expect(nextZoomFactor(4, 3, 0.5, 5)).toBe(5);
  });
});

describe('zoomTarget iOS', () => {
  it('1× là ống chính, prop 0', () => {
    expect(zoomTarget(1, ios)).toEqual({ ultra: false, prop: 0 });
  });

  it('quy đổi theo hàm mũ: M^prop = hệ số', () => {
    const { prop } = zoomTarget(5, ios);
    expect(100 ** prop).toBeCloseTo(5, 2);
  });

  it('dưới 1× đổi sang ống góc rộng; 0,5× là 1× của ống đó', () => {
    expect(zoomTarget(0.5, ios)).toEqual({ ultra: true, prop: 0 });
    const r = zoomTarget(0.8, ios);
    expect(r.ultra).toBe(true);
    expect(100 ** r.prop).toBeCloseTo(1.6, 2);
  });

  it('không có ống góc rộng thì không xuống dưới 1×', () => {
    expect(zoomTarget(0.5, { ...ios, hasUltraWide: false })).toEqual({ ultra: false, prop: 0 });
  });
});

describe('zoomTarget Android', () => {
  it('quy đổi tuyến tính: prop · M = tỉ lệ, 1× là 0', () => {
    expect(zoomTarget(1, android).prop).toBe(0);
    expect(zoomTarget(4, android).prop * 8).toBeCloseTo(4, 3);
  });
});

describe('formatZoom', () => {
  it('một chữ số thập phân, dấu phẩy', () => {
    expect(formatZoom(0.5)).toBe('0,5×');
    expect(formatZoom(0.1 * 13)).toBe('1,3×');
  });
});

describe('zoomTarget trên camera ảo iOS (không chớp khi qua 1×)', () => {
  const v: ZoomConfig = { ...ios, virtual: true, iosVirtualMaxFactor: 100 };

  it('không bao giờ đổi ống: máy tự chuyển ống bên trong camera ảo', () => {
    expect(zoomTarget(0.5, v).ultra).toBe(false);
    expect(zoomTarget(0.9, v).ultra).toBe(false);
    expect(zoomTarget(1, v).ultra).toBe(false);
  });

  it('0,5× là hệ số thiết bị 1 (ống góc rộng), 1× là hệ số 2', () => {
    expect(zoomTarget(0.5, v).prop).toBeCloseTo(0, 3);
    expect(zoomTarget(1, v).prop).toBeCloseTo(Math.log(2) / Math.log(100), 3);
  });

  it('đi qua 0,9× → 1× là một bước liền, không nhảy', () => {
    const a = zoomTarget(0.9, v).prop;
    const b = zoomTarget(1, v).prop;
    expect(b).toBeGreaterThan(a);
    expect(b - a).toBeLessThan(0.03);
  });
});
