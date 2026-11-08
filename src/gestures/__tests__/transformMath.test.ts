import {
  clampedScaleChange,
  clampPan,
  coverScale,
  rotateAbout,
  scaleAbout,
  snapAngle,
  toCentered,
} from '../transformMath';

const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 6);

describe('scaleAbout', () => {
  it('giữ điểm dưới ngón tay đứng yên', () => {
    // Overlay lệch (10, 0); hai ngón đặt tại (50, 0); phóng ×2.
    const t = scaleAbout({ x: 10, y: 0 }, { x: 50, y: 0 }, 2);
    // Điểm của overlay đang nằm dưới ngón tay (cách tâm overlay 40) giờ cách 80, vẫn ở x = 50.
    close(t.x, -30);
    close(t.x + 40 * 2, 50);
  });

  it('phóng quanh chính tâm overlay thì không dịch chuyển', () => {
    const t = scaleAbout({ x: 12, y: -7 }, { x: 12, y: -7 }, 3);
    close(t.x, 12);
    close(t.y, -7);
  });

  it('hai lần pinch liên tiếp cộng dồn, không nhảy về cỡ gốc (lỗi L2)', () => {
    let scale = 1;
    scale *= clampedScaleChange(scale, 1.5, 0.2, 4);
    scale *= clampedScaleChange(scale, 1.5, 0.2, 4);
    close(scale, 2.25);
  });
});

describe('clampedScaleChange', () => {
  it('kẹp ở giới hạn trên', () => {
    close(3.9 * clampedScaleChange(3.9, 1.1, 0.2, 4), 4);
  });
  it('kẹp ở giới hạn dưới', () => {
    close(0.25 * clampedScaleChange(0.25, 0.5, 0.2, 4), 0.2);
  });
});

describe('rotateAbout', () => {
  it('xoay 90° quanh gốc', () => {
    const t = rotateAbout({ x: 10, y: 0 }, { x: 0, y: 0 }, Math.PI / 2);
    close(t.x, 0);
    close(t.y, 10);
  });

  it('xoay quanh điểm neo trùng tâm overlay thì không dịch chuyển', () => {
    const t = rotateAbout({ x: 5, y: 5 }, { x: 5, y: 5 }, 1.234);
    close(t.x, 5);
    close(t.y, 5);
  });
});

describe('snapAngle', () => {
  const deg = (d: number) => (d * Math.PI) / 180;

  it('hít về 0° khi lệch dưới 3°', () => {
    close(snapAngle(deg(2.5), 3) as number, 0);
  });
  it('hít về 90°', () => {
    close(snapAngle(deg(88), 3) as number, deg(90));
  });
  it('không hít khi lệch 10°', () => {
    expect(snapAngle(deg(10), 3)).toBeNull();
  });
  it('giữ số vòng đã quay', () => {
    close(snapAngle(deg(361), 3) as number, deg(360));
  });
});

describe('toCentered', () => {
  it('đổi góc trên-trái về gốc tâm', () => {
    const p = toCentered(0, 0, 200, 100);
    close(p.x, -100);
    close(p.y, -50);
  });
});

describe('clampPan / coverScale', () => {
  it('ảnh dọc 3:4 trong khung ngang 430 × 370 → phủ theo chiều ngang', () => {
    const k = coverScale(300, 400, 430, 370);
    expect(300 * k).toBeCloseTo(430);
    expect(400 * k).toBeGreaterThan(370);
  });

  it('không cho kéo lộ mép ảnh', () => {
    // Ảnh hiển thị 430 × 573 trong khung 430 × 370: chỉ kéo dọc được ±101.5.
    const t = clampPan({ x: 50, y: -500 }, 430, 573, 430, 370);
    expect(t.x).toBeCloseTo(0);
    expect(t.y).toBeCloseTo(-101.5);
  });

  it('phóng to thì được kéo xa hơn', () => {
    const t = clampPan({ x: 200, y: 0 }, 860, 1146, 430, 370);
    expect(t.x).toBeCloseTo(200);
  });
});
