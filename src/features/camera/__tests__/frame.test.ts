import { ASPECTS, frameToPhotoCrop, viewfinderRect } from '../frame';

// iPhone 15 Pro Max: 430 × 932 pt; thanh trên 100, dưới 200 (ước lượng).
const SW = 430;
const SH = 932;

describe('viewfinderRect', () => {
  it('3:4 vừa giữa hai thanh, rộng bằng màn hình', () => {
    const r = viewfinderRect(SW, SH, 100, 200, ASPECTS['3:4']);
    expect(r.width).toBe(430);
    expect(r.height).toBeCloseTo(573.33, 1);
    expect(r.y).toBeCloseTo(100 + (632 - 573.33) / 2, 1);
  });

  it('9:16 không vừa giữa hai thanh → tràn ra sau, đặt giữa màn hình', () => {
    const r = viewfinderRect(SW, SH, 100, 200, ASPECTS['9:16']);
    expect(r.height).toBeCloseTo(764.44, 1);
    expect(r.y).toBeCloseTo((932 - 764.44) / 2, 1);
  });

  it('không bao giờ cao quá màn hình', () => {
    const r = viewfinderRect(400, 500, 50, 50, ASPECTS['9:16']);
    expect(r.height).toBe(500);
    expect(r.width).toBeCloseTo(281.25);
    expect(r.x).toBeCloseTo((400 - 281.25) / 2);
  });
});

describe('frameToPhotoCrop', () => {
  // Ảnh dọc 3024 × 4032 (4:3), preview phủ kín màn hình 430 × 932.
  const PW = 3024;
  const PH = 4032;

  it('vùng cắt giữ đúng tỉ lệ khung 3:4', () => {
    const f = viewfinderRect(SW, SH, 100, 200, ASPECTS['3:4']);
    const c = frameToPhotoCrop(f, SW, SH, PW, PH);
    expect(c.width / c.height).toBeCloseTo(0.75, 2);
  });

  it('khung 1:1 ra ảnh vuông, nằm trọn trong ảnh', () => {
    const f = viewfinderRect(SW, SH, 100, 200, ASPECTS['1:1']);
    const c = frameToPhotoCrop(f, SW, SH, PW, PH);
    expect(Math.abs(c.width - c.height)).toBeLessThanOrEqual(1);
    expect(c.x).toBeGreaterThanOrEqual(0);
    expect(c.y + c.height).toBeLessThanOrEqual(PH);
  });

  it('khung đúng bằng phần preview thấy được → vùng cắt khớp mép ảnh đã bị cover cắt', () => {
    // Màn 430 × 932 cao hơn 3:4 → cover theo chiều cao, hai bên ảnh bị cắt.
    const c = frameToPhotoCrop({ x: 0, y: 0, width: SW, height: SH }, SW, SH, PW, PH);
    const s = SH / PH;
    expect(c.height).toBe(PH);
    expect(c.width).toBe(Math.floor(SW / s));
    expect(c.x).toBe(Math.round((PW - SW / s) / 2));
  });
});
