import type { Scene, Segment } from 'composition-critic';

import { sceneLines } from '../scene';

const seg = (ax: number, ay: number, bx: number, by: number): Segment => ({
  a: { x: ax, y: ay },
  b: { x: bx, y: by },
  angle: 0,
  length: Math.hypot(bx - ax, by - ay),
  support: 1,
  extent: { a: { x: ax, y: ay }, b: { x: bx, y: by }, coverage: 1 },
});

const scene = (o: Partial<Scene>): Scene => ({
  horizon: null,
  vanishing: null,
  pole: null,
  segments: [],
  ...o,
});

describe('sceneLines', () => {
  const horizon = scene({ horizon: { y: 0.3, angle: 0, seg: seg(0.2, 0.3, 0.6, 0.3) } });
  const lead = scene({
    vanishing: { point: { x: 0.7, y: 0.35 }, lines: [seg(0, 1, 0.7, 0.35), seg(1, 1, 0.7, 0.35)] },
  });

  it('chân trời kéo hết bề ngang khung', () => {
    const { lines, vp } = sceneLines('horizon', horizon);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.a).toEqual({ x: 0, y: 0.3 });
    expect(lines[0]!.b).toEqual({ x: 1, y: 0.3 });
    expect(vp).toBeNull();
  });

  it('đường dẫn: các đường hội tụ và điểm hội tụ, lật x khi cần', () => {
    expect(sceneLines('lead', lead).lines).toHaveLength(2);
    expect(sceneLines('lead', lead, true).vp!.x).toBeCloseTo(0.3);
  });

  it('chỉ vẽ đường của kỹ thuật đang dùng', () => {
    expect(sceneLines('thirds', horizon).lines).toHaveLength(0);
    expect(sceneLines('horizon', lead).lines).toHaveLength(0);
    expect(sceneLines('lead', null).lines).toHaveLength(0);
  });
});
