import { guideShape, UPPER } from '../guides';
import { cameraPitchDeg, isAchieved, SENSOR, sensorHint } from '../sensor';
import { anchorOnFrame, poseAnchor, snapPlacement, snapTargets } from '../snap';
import { isTechnique, TECHNIQUES } from '../techniques';

const G = 9.81;
const rad = (d: number) => (d * Math.PI) / 180;

describe('techniques', () => {
  it('9 dòng: Tắt, Lưới 3×3, Lưới 4×4 rồi các kỹ thuật (có Lấp đầy khung)', () => {
    expect(TECHNIQUES).toHaveLength(9);
    expect(TECHNIQUES).toContain('fill');
    // Đường chân trời, Đường dẫn đã bỏ (2026-11-26).
    expect(isTechnique('horizon')).toBe(false);
    expect(isTechnique('lead')).toBe(false);
    expect(TECHNIQUES.slice(0, 3)).toEqual(['off', 'grid', 'grid4']);
    expect(isTechnique('thirds')).toBe(true);
    expect(isTechnique('3')).toBe(false);
  });
});

describe('guideShape', () => {
  it('Tắt không vẽ gì', () => {
    const g = guideShape('off');
    expect(g.v.length + g.h.length + g.points.length).toBe(0);
    expect(g.target).toBeNull();
  });

  it('Lưới 4×4: ba đường mỗi chiều, không có chấm', () => {
    const g = guideShape('grid4');
    expect(g.v).toEqual([0.25, 0.5, 0.75]);
    expect(g.h).toHaveLength(3);
    expect(g.target).toBeNull();
    expect(g.points).toEqual([]);
  });

  it('1/3 chưa có pose: hai giao điểm trên, chưa có đích', () => {
    const g = guideShape('thirds');
    expect(g.v).toHaveLength(2);
    expect(g.target).toBeNull();
    expect(g.points).toEqual(UPPER);
    expect(UPPER.every((p) => p.y === 1 / 3)).toBe(true);
  });

  it('1/3 có pose: đích là giao điểm trên gần mắt người mẫu nhất', () => {
    expect(guideShape('thirds', { x: 0.7, y: 0.3 }).target).toEqual({ x: 2 / 3, y: 1 / 3 });
    // Mắt pose ở dưới vẫn chỉ về đường 1/3 trên, khớp nhận xét.
    expect(guideShape('thirds', { x: 0.2, y: 0.8 }).target).toEqual({ x: 1 / 3, y: 1 / 3 });
    expect(guideShape('thirds', { x: 0.2, y: 0.8 }).points).toEqual([]);
  });

  it('Ở giữa: lưới 3×3 thêm trục giữa (phiếu Phase 5b lần 13, mục 21.6)', () => {
    const g = guideShape('center');
    expect(g.v).toEqual([1 / 3, 0.5, 2 / 3]);
    expect(g.h).toEqual([1 / 3, 2 / 3]);
  });
});

describe('cameraPitchDeg', () => {
  // Android: vector hướng lên. Máy dựng thẳng: y = g. Ngửa ống kính sau lên a độ: đỉnh máy
  // ngả về phía người cầm, màn hình hướng xuống một chút → z = −g·sin a.
  const tiltUp = (a: number) => ({ y: G * Math.cos(rad(a)), z: -G * Math.sin(rad(a)) });

  it('máy dựng thẳng → 0', () => {
    expect(cameraPitchDeg(0, G, 0, false, false)).toBeCloseTo(0);
    expect(cameraPitchDeg(0, -G, 0, true, false)).toBeCloseTo(0);
  });

  it('ngửa camera sau 20° → +20 trên cả hai nền tảng, camera trước thì nhìn xuống −20', () => {
    const { y, z } = tiltUp(20);
    expect(cameraPitchDeg(0, y, z, false, false)).toBeCloseTo(20);
    expect(cameraPitchDeg(0, -y, -z, true, false)).toBeCloseTo(20);
    expect(cameraPitchDeg(0, y, z, false, true)).toBeCloseTo(-20);
  });
});

describe('sensorHint', () => {
  it('Tắt và hai kiểu Lưới không có gợi ý', () => {
    expect(sensorHint('off', 10, 0, false, null)).toBeNull();
    expect(sensorHint('grid', 10, 0, false, null)).toBeNull();
    expect(sensorHint('grid4', 10, 0, false, null)).toBeNull();
  });

  it('máy nghiêng đứng trước mọi gợi ý khác, có độ trễ', () => {
    expect(sensorHint('thirds', 4, 0, false, null)).toBe('level');
    expect(sensorHint('thirds', 2, 0, false, null)).toBeNull();
    expect(sensorHint('thirds', 2, 0, false, 'level')).toBe('level');
    expect(sensorHint('thirds', SENSOR.levelOut - 0.1, 0, false, 'level')).toBeNull();
  });

  it('Góc thấp: chưa ngửa → hạ máy; ngửa vừa → đạt; quá → ngửa ít lại', () => {
    expect(sensorHint('low', 0, 0, false, null)).toBe('lowDown');
    expect(sensorHint('low', 0, 15, false, null)).toBe('lowOk');
    expect(sensorHint('low', 0, 50, false, null)).toBe('lowTooUp');
    // Đang đạt: lệch nhẹ dưới ngưỡng vẫn giữ đạt.
    expect(sensorHint('low', 0, SENSOR.lowMin - 1, false, 'lowOk')).toBe('lowOk');
  });

  it('Selfie: camera sau → nhắc đổi camera; camera trước nhìn xuống mặt → đạt', () => {
    expect(sensorHint('selfie', 0, -15, false, null)).toBe('selfieFront');
    expect(sensorHint('selfie', 0, 0, true, null)).toBe('selfieUp');
    expect(sensorHint('selfie', 0, -15, true, null)).toBe('selfieOk');
    expect(sensorHint('selfie', 0, -60, true, null)).toBe('selfieDown');
    expect(isAchieved('selfieOk')).toBe(true);
    expect(isAchieved('selfieUp')).toBe(false);
  });
});

describe('snap', () => {
  const frame = { width: 300, height: 400 };
  const box = { width: 300, height: 400 };
  const id = { x: 0, y: 0, scale: 1, rotation: 0 };

  it('neo = giữa hai mắt khi thấy rõ, không thì giữa mép trên khung người', () => {
    const body = new Array(33 * 3).fill(0);
    body.splice(6, 3, 0.4, 0.3, 0.9);
    body.splice(15, 3, 0.6, 0.3, 0.9);
    expect(poseAnchor(body, null)).toEqual({ x: 0.5, y: 0.3 });
    const contours = [
      {
        points: [
          { x: 0.2, y: 0.25 },
          { x: 0.6, y: 0.9 },
        ],
        isHole: false,
      },
    ];
    expect(poseAnchor(null, contours)).toEqual({ x: 0.4, y: 0.25 });
    expect(poseAnchor(null, [])).toBeNull();
  });

  it('neo trên khung theo placement và lật ngang', () => {
    expect(anchorOnFrame({ x: 0.5, y: 0.5 }, box, { ...id, x: 10, y: 20 }, false)).toEqual({
      x: 10,
      y: 20,
    });
    const a = anchorOnFrame({ x: 0.25, y: 0.5 }, box, id, true);
    expect(a.x).toBeCloseTo(75);
  });

  it('1/3: chỉ dính vào giao điểm, không dính riêng một trục', () => {
    const tg = snapTargets('thirds', frame);
    // Giao điểm (±50, ±66.7).
    const q = snapPlacement(id, { x: -45, y: -60 }, tg, 28, 18);
    expect(q!.x).toBeCloseTo(-5);
    expect(q!.y).toBeCloseTo(-400 / 6 + 60);
    // Sát đường dọc nhưng xa giao điểm: không dính (lỗi phiếu lần 3).
    expect(snapPlacement(id, { x: 48, y: 0 }, tg, 28, 18)).toBeNull();
    expect(snapPlacement(id, { x: 0, y: 0 }, tg, 28, 18)).toBeNull();
    // Giao điểm dưới không còn là chỗ dính.
    expect(snapPlacement(id, { x: -45, y: 60 }, tg, 28, 18)).toBeNull();
  });

  it('Đặt ở giữa: dính trục dọc, gần điểm đích thì dính cả điểm', () => {
    const tg = snapTargets('center', frame);
    expect(snapPlacement(id, { x: 10, y: 100 }, tg, 28, 18)).toEqual({ ...id, x: -10, y: 0 });
    const q = snapPlacement(id, { x: 5, y: -60 }, tg, 28, 18);
    expect(q!.x).toBeCloseTo(-5);
    expect(q!.y).toBeCloseTo(-400 / 6 + 60);
  });

  it('Góc thấp không có chỗ dính', () => {
    expect(snapTargets('low', frame)).toEqual({ points: [], v: [] });
  });
});
