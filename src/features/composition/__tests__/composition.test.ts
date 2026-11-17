import { guideShape, thirdsTarget } from '../guides';
import { cameraPitchDeg, isAchieved, SENSOR, sensorHint } from '../sensor';
import { anchorOnFrame, poseAnchor, snapLines, snapPlacement } from '../snap';
import { isTechnique, TECHNIQUES, techniqueForSample } from '../techniques';

const G = 9.81;
const rad = (d: number) => (d * Math.PI) / 180;

describe('techniques', () => {
  it('9 dòng, bắt đầu bằng Tắt', () => {
    expect(TECHNIQUES).toHaveLength(9);
    expect(TECHNIQUES[0]).toBe('off');
    expect(isTechnique('thirds')).toBe(true);
    expect(isTechnique('3')).toBe(false);
  });

  it('pose mẫu nhóm Selfie gắn Selfie, nhóm khác gắn 1/3, pose của bạn không gắn', () => {
    expect(techniqueForSample('selfie')).toBe('selfie');
    expect(techniqueForSample('travel')).toBe('thirds');
    expect(techniqueForSample(null)).toBeNull();
  });
});

describe('guideShape', () => {
  it('Tắt không vẽ gì', () => {
    const g = guideShape('off');
    expect(g.v.length + g.h.length + g.accentH.length + g.diagonals.length).toBe(0);
    expect(g.target).toBeNull();
  });

  it('1/3 có lưới 3×3 và đích ở giao điểm trên trái, lật thì sang phải', () => {
    expect(guideShape('thirds').target).toEqual({ x: 1 / 3, y: 1 / 3 });
    expect(guideShape('thirds', true).target).toEqual({ x: 2 / 3, y: 1 / 3 });
    expect(guideShape('thirds').v).toHaveLength(2);
  });

  it('Chân trời tô đường 1/3 dưới, Đường dẫn có hai đường chéo về đích', () => {
    expect(guideShape('horizon').accentH).toEqual([2 / 3]);
    const lead = guideShape('lead');
    expect(lead.diagonals).toHaveLength(2);
    for (const d of lead.diagonals) expect(d.to).toEqual(thirdsTarget(false));
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
  it('Tắt và Lưới không có gợi ý', () => {
    expect(sensorHint('off', 10, 0, false, null)).toBeNull();
    expect(sensorHint('grid', 10, 0, false, null)).toBeNull();
  });

  it('máy nghiêng đứng trước mọi gợi ý khác, có độ trễ', () => {
    expect(sensorHint('thirds', 4, 0, false, null)).toBe('level');
    expect(sensorHint('thirds', 2, 0, false, null)).toBeNull();
    expect(sensorHint('thirds', 2, 0, false, 'level')).toBe('level');
    expect(sensorHint('thirds', SENSOR.levelOut - 0.1, 0, false, 'level')).toBeNull();
  });

  it('Chân trời: máy thẳng là đạt', () => {
    expect(sensorHint('horizon', 0.5, 0, false, null)).toBe('levelOk');
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

  it('dính đường 1/3 gần nhất trong bán kính, mỗi trục riêng', () => {
    const lines = snapLines('thirds', frame);
    // Đường dọc ±50, đường ngang −66.7.
    const p = snapPlacement(id, { x: 40, y: 0 }, lines, 16);
    expect(p).toEqual({ ...id, x: 10, y: 0 });
    const q = snapPlacement(id, { x: -45, y: -60 }, lines, 16);
    expect(q!.x).toBeCloseTo(-5);
    expect(q!.y).toBeCloseTo(-400 / 6 + 60);
    expect(snapPlacement(id, { x: 0, y: 0 }, lines, 16)).toBeNull();
  });

  it('Góc thấp không có đường dính', () => {
    expect(snapLines('low', frame)).toEqual({ v: [], h: [] });
  });
});
