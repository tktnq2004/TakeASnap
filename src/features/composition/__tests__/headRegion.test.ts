import type { PhotoFeatures } from 'composition-critic';

import { headRegion, yawNearCenter } from '../headRegion';

const joints = (pts: Record<number, [number, number]>) =>
  Array.from({ length: 33 }, (_, i) =>
    pts[i] ? { x: pts[i][0], y: pts[i][1], v: 0.9 } : { x: 0, y: 0, v: 0 },
  );

const feat = (j: ReturnType<typeof joints> | null) =>
  ({
    people: [{ box: [0.4, 0.2, 0.6, 0.9], area: 0.1 }],
    main: 0,
    eye: null,
    joints: j,
    facing: null,
    heads: [],
  }) as unknown as PhotoFeatures;

describe('headRegion: vùng đầu để dò mặt lại ở ảnh cỡ thật', () => {
  it('tâm theo mũi, mắt, tai; cạnh theo vai khi vai rộng hơn tai', () => {
    const f = feat(
      joints({
        0: [0.5, 0.2],
        2: [0.49, 0.19],
        5: [0.51, 0.19],
        7: [0.48, 0.2],
        8: [0.52, 0.2],
        11: [0.45, 0.3],
        12: [0.55, 0.3],
      }),
    );
    const h = headRegion(f, 0.75)!;
    expect(h.x).toBeCloseTo(0.5, 3);
    expect(h.y).toBeCloseTo(0.196, 3);
    // Vai 0,1 × 0,75 = 0,075 chiều cao → × 1,1; tai 0,04 × 0,75 × 3 = 0,09.
    expect(h.side).toBeCloseTo(0.09, 3);
  });

  it('khung xương không thấy đầu: lấy đỉnh vùng người; đỉnh chạm mép trên thì null', () => {
    const h = headRegion(feat(joints({ 11: [0.45, 0.3], 12: [0.55, 0.3] })), 0.75)!;
    // Bề ngang 0,2 × 0,75 × 0,6 = 0,09; cao 0,7 × 0,3 = 0,21 → 0,09.
    expect(h.side).toBeCloseTo(0.09, 3);
    expect(h.x).toBeCloseTo(0.5, 3);
    expect(h.y).toBeCloseTo(0.2 + 0.09 * 0.45, 3);
    expect(headRegion(feat(null), 0.75)).not.toBeNull();
    const top = { ...feat(null), people: [{ box: [0.4, 0, 0.6, 0.9], area: 0.1 }] };
    expect(headRegion(top as unknown as PhotoFeatures, 0.75)).toBeNull();
  });

  it('cạnh tối thiểu khi người rất nhỏ', () => {
    expect(headRegion(feat(joints({ 0: [0.5, 0.2] })), 0.75)!.side).toBe(0.05);
  });

  it('yawNearCenter: mặt gần tâm vùng cắt', () => {
    expect(
      yawNearCenter([
        [0.1, 0.1, -0.5],
        [0.52, 0.48, 0.3],
      ]),
    ).toBe(0.3);
    expect(yawNearCenter([])).toBeNull();
    expect(yawNearCenter([[0.5, 0.5]])).toBeNull();
  });
});
