import {
  ASPECTS,
  frameCrop,
  frameToPhotoCrop,
  isWholeImage,
  previewRect,
  uprightToImage,
  viewfinderRect,
} from '../frame';

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

  it('9:16 có đường giữa hai cụm nút → mép khung đi qua giữa thanh trên và giữa nút chụp', () => {
    // Giữa thanh trên y = 93, giữa nút chụp y = 841: cách nhau 748 < 764 → khung thấp lại.
    const r = viewfinderRect(SW, SH, 100, 200, ASPECTS['9:16'], { top: 93, bottom: 841 });
    expect(r.y).toBeCloseTo(93);
    expect(r.y + r.height).toBeCloseTo(841);
    expect(r.width).toBeCloseTo(748 * (9 / 16));
    expect(r.x).toBeCloseTo((SW - r.width) / 2);
  });

  it('9:16 thấp hơn khoảng giữa hai cụm nút → giữ cỡ, đặt giữa hai đường', () => {
    const r = viewfinderRect(SW, SH, 100, 200, ASPECTS['9:16'], { top: 60, bottom: 900 });
    expect(r.height).toBeCloseTo(764.44, 1);
    expect(r.y + r.height / 2).toBeCloseTo(480);
  });

  it('3:4 vừa thì không dùng đường cắt', () => {
    const a = viewfinderRect(SW, SH, 100, 200, ASPECTS['3:4']);
    const b = viewfinderRect(SW, SH, 100, 200, ASPECTS['3:4'], { top: 93, bottom: 841 });
    expect(b).toEqual(a);
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

describe('previewRect (màn xem trước đúng tỉ lệ cảm biến)', () => {
  it('khung 3:4 thấy đủ cảm biến: màn xem trước trùng khung', () => {
    const f = { x: 0, y: 112, width: 390, height: 520 };
    expect(previewRect(f)).toEqual(f);
  });

  it('khung 1:1 cắt trên dưới như app gốc', () => {
    const p = previewRect({ x: 0, y: 200, width: 390, height: 390 });
    expect(p.width).toBe(390);
    expect(p.height).toBeCloseTo(520);
    expect(p.y).toBeCloseTo(200 - 65);
  });

  it('khung 9:16 cắt hai bên như app gốc', () => {
    const p = previewRect({ x: 0, y: 75, width: 390, height: 693.33 });
    expect(p.height).toBeCloseTo(693.33);
    expect(p.width).toBeCloseTo(520);
    expect(p.x).toBeCloseTo(-65);
  });
});

describe('isWholeImage (chụp liên tục: khung trùng cả ảnh thì không cắt)', () => {
  const photo = { width: 3024, height: 4032 };
  it('khung 3:4 trùng màn xem trước thì là cả ảnh', () => {
    const frame = { x: 0, y: 0, width: 390, height: 520 };
    const crop = frameToPhotoCrop(frame, 390, 520, photo.width, photo.height);
    expect(isWholeImage(crop, photo)).toBe(true);
  });
  it('khung 1:1 thì phải cắt', () => {
    const frame = { x: 0, y: 65, width: 390, height: 390 };
    const crop = frameToPhotoCrop(frame, 390, 520, photo.width, photo.height);
    expect(isWholeImage(crop, photo)).toBe(false);
  });
});

describe('frameCrop: cầm máy ngang (phiếu Phase 5b lần 18)', () => {
  // Khung 3:4 trùng màn xem trước 300 × 400; ảnh camera 3000 × 4000 (dọc) hoặc 4000 × 3000.
  const F = { x: 0, y: 0, width: 300, height: 400 };
  // Khung 1:1 giữa màn xem trước.
  const S = { x: 0, y: 50, width: 300, height: 300 };

  it('cầm dọc: như frameToPhotoCrop, không xoay', () => {
    expect(frameCrop(S, 300, 400, 3000, 4000, 0)).toEqual({
      rect: frameToPhotoCrop(S, 300, 400, 3000, 4000),
      rotate: 0,
    });
  });

  it('ảnh còn dọc: cắt như cũ rồi xoay theo cách cầm', () => {
    const r = frameCrop(S, 300, 400, 3000, 4000, 90);
    expect(r.rect).toEqual({ x: 0, y: 500, width: 3000, height: 3000 });
    expect(r.rotate).toBe(90);
  });

  it('ảnh đã xoay ngang: vùng cắt đổi sang ảnh ngang, không xoay', () => {
    const whole = frameCrop(F, 300, 400, 4000, 3000, 90);
    expect(whole).toEqual({ rect: { x: 0, y: 0, width: 4000, height: 3000 }, rotate: 0 });
    // Khung 1:1 cách mép trên khung dọc 500 px (ảnh dọc): cầm 90 thì mép trên khung dọc là phía
    // phải cảnh → vùng cắt cách mép phải ảnh ngang 500 px.
    expect(frameCrop(S, 300, 400, 4000, 3000, 90).rect).toEqual({
      x: 500,
      y: 0,
      width: 3000,
      height: 3000,
    });
    // Cầm −90: mép trên khung dọc là phía trái cảnh.
    expect(frameCrop(S, 300, 400, 4000, 3000, -90).rect).toEqual({
      x: 500,
      y: 0,
      width: 3000,
      height: 3000,
    });
  });

  it('cầm 90, khung lệch: đổi đúng phía', () => {
    // Khung chỉ nửa trên khung dọc (y 0..200): cầm 90 → nửa phải cảnh.
    const top = { x: 0, y: 0, width: 300, height: 200 };
    expect(frameCrop(top, 300, 400, 4000, 3000, 90).rect).toEqual({
      x: 2000,
      y: 0,
      width: 2000,
      height: 3000,
    });
    // Cầm −90 → nửa trái cảnh.
    expect(frameCrop(top, 300, 400, 4000, 3000, -90).rect).toEqual({
      x: 0,
      y: 0,
      width: 2000,
      height: 3000,
    });
  });

  it('uprightToImage ngược với cách xoay: góc trên trái của ảnh đứng', () => {
    const rect = { x: 100, y: 200, width: 300, height: 400 };
    // Xoay 90 (cầm 90): góc trên trái ảnh đứng là góc dưới trái phần cắt.
    expect(uprightToImage(0, 0, rect, 90)).toEqual({ x: 100, y: 600 });
    // Xoay −90: góc trên phải phần cắt.
    expect(uprightToImage(0, 0, rect, -90)).toEqual({ x: 400, y: 200 });
    expect(uprightToImage(0.5, 0.5, rect, 90)).toEqual({ x: 250, y: 400 });
  });
});
