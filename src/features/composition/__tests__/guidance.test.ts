import type { PhotoFeatures, Scene } from 'composition-critic';

import {
  type Check,
  GUIDE,
  type GuideState,
  gaveUpLines,
  guideLine,
  horizonLine,
  initialGuide,
  type Measure,
  measure,
  step,
} from '../guidance';
import { combinedShape } from '../guides';

/** Một người, khung [x0, y0, x1, y1], mắt tuỳ chọn. */
const person = (
  box: [number, number, number, number],
  eye: { x: number; y: number } | null = null,
  facing: PhotoFeatures['facing'] = null,
): PhotoFeatures => ({
  aspect: 3 / 4,
  people: [{ box, area: (box[2] - box[0]) * (box[3] - box[1]) } as PhotoFeatures['people'][number]],
  main: 0,
  eye,
  joints: null,
  facing,
  heads: [],
});

const horizonAt = (y: number) =>
  ({
    horizon: { y, angle: 0, seg: {} },
    vanishing: null,
    pole: null,
    segments: [],
  }) as unknown as Scene;
const vanishingAt = (x: number, y: number) =>
  ({
    horizon: null,
    vanishing: { point: { x, y }, lines: [] },
    pole: null,
    segments: [],
  }) as unknown as Scene;

const checks = (m: Measure): Check[] => (m.kind === 'checks' ? m.checks : []);
const first = (m: Measure) => checks(m).find((c) => !c.ok) ?? null;

describe('measure: tiêu chí theo thứ tự', () => {
  it('1/3: cột trước, rồi mắt; người ở giữa nhìn sang phải → cột trái, xoay máy sang phải', () => {
    const f = person([0.4, 0.2, 0.6, 0.9], { x: 0.5, y: 0.45 }, 'right');
    const m = measure({ main: 'thirds', scene: null }, f, null, 0, false);
    expect(checks(m).map((c) => c.id)).toEqual(['thirdsColumn', 'thirdsEye', 'noJointCut']);
    const c = first(m)!;
    expect(c.id).toBe('thirdsColumn');
    // Người cần dịch sang trái trên khung → xoay máy sang phải.
    expect(c.action).toBe('panRight');
    expect(c.target).toEqual({ kind: 'vline', x: 1 / 3 });
    expect(guideLine(c)).toBe('Xoay máy sang phải để đưa người vào cột 1/3');
  });

  it('camera trước (khung soi gương): xoay ngang đổi chiều', () => {
    const f = person([0.4, 0.2, 0.6, 0.9], { x: 0.5, y: 0.45 }, 'right');
    expect(first(measure({ main: 'thirds', scene: null }, f, null, 0, true))!.action).toBe(
      'panLeft',
    );
  });

  it('1/3: cột đạt thì sang mắt; mắt thấp → chúc máy xuống', () => {
    const f = person([0.25, 0.3, 0.42, 0.95], { x: 1 / 3, y: 0.5 });
    const c = first(measure({ main: 'thirds', scene: null }, f, null, 0, false))!;
    expect(c.id).toBe('thirdsEye');
    expect(c.action).toBe('tiltDown');
    expect(guideLine(c)).toBe('Chúc máy xuống để đưa mắt lên đường 1/3');
  });

  it('Ở giữa và Chân trời có máy thẳng đứng đầu (cảm biến)', () => {
    const f = person([0.4, 0.2, 0.6, 0.9], { x: 0.5, y: 1 / 3 });
    const m = measure({ main: 'center', scene: null }, f, null, 6, false);
    expect(first(m)!.id).toBe('level');
    expect(
      checks(measure({ main: 'center', scene: null }, f, null, 1, false)).every((c) => c.ok),
    ).toBe(true);
  });

  it('Lấp đầy: người nhỏ → tiến lại gần', () => {
    const c = first(
      measure({ main: 'fill', scene: null }, person([0.45, 0.4, 0.55, 0.7]), null, 0, false),
    )!;
    expect(c.id).toBe('fillSize');
    expect(guideLine(c)).toBe('Tiến lại gần để người lấp đầy khung');
  });

  it('cảnh không áp được: không người, không chân trời, không đường dẫn, không nhóm', () => {
    expect(measure({ main: 'thirds', scene: null }, null, null, 0, false).kind).toBe('noPerson');
    const f = person([0.3, 0.2, 0.5, 0.9]);
    expect(measure({ main: null, scene: 'horizon' }, f, null, 0, false).kind).toBe('noHorizon');
    expect(measure({ main: null, scene: 'lead' }, f, horizonAt(0.5), 0, false).kind).toBe('noLead');
    expect(measure({ main: 'group', scene: null }, f, null, 0, false).kind).toBe('noGroup');
  });
});

describe('measure: ghép bố cục chính + phụ', () => {
  it('1/3 + chân trời: chính trước phụ; mắt ở 1/3 trên thì chân trời về đường dưới', () => {
    const f = person([0.25, 0.25, 0.42, 0.95], { x: 1 / 3, y: 1 / 3 });
    expect(horizonLine(f, 0.4)).toBe(2 / 3);
    const m = measure({ main: 'thirds', scene: 'horizon' }, f, horizonAt(0.5), 0, false);
    expect(checks(m).map((c) => c.id)).toEqual([
      'level',
      'thirdsColumn',
      'thirdsEye',
      'noJointCut',
      'horizonThird',
      'horizonNeck',
    ]);
    const c = first(m)!;
    expect(c.id).toBe('horizonThird');
    // Chân trời cần dịch xuống (0,5 → 2/3) → ngửa máy lên.
    expect(c.action).toBe('tiltUp');
  });

  it('chân trời cắt cổ → hạ máy xuống', () => {
    const f = person([0.25, 0.25, 0.42, 0.95], { x: 1 / 3, y: 0.62 });
    const m = measure({ main: null, scene: 'horizon' }, f, horizonAt(0.66), 0, false);
    const c = checks(m).find((x) => x.id === 'horizonNeck')!;
    expect(c.ok).toBe(false);
    expect(guideLine(c)).toBe('Hạ máy xuống để chân trời không cắt cổ');
  });

  it('đường dẫn: điểm hội tụ bên phải người → bước sang trái; 1/3 + đường dẫn không lặp cột 1/3', () => {
    const f = person([0.1, 0.3, 0.2, 0.9], { x: 0.15, y: 0.35 });
    const lead = measure({ main: null, scene: 'lead' }, f, vanishingAt(0.7, 0.4), 0, false);
    expect(first(lead)!.id).toBe('leadToPerson');
    expect(first(lead)!.action).toBe('stepLeft');
    const both = measure({ main: 'thirds', scene: 'lead' }, f, vanishingAt(0.7, 0.4), 0, false);
    expect(checks(both).map((c) => c.id)).not.toContain('leadThird');
  });
});

describe('step: luật nhắc và dừng', () => {
  const fail = (error: number, id: Check['id'] = 'thirdsColumn'): Measure => ({
    kind: 'checks',
    checks: [{ id, ok: false, error, action: 'panLeft', target: null }],
  });
  const run = (s: GuideState, m: Measure, now: number) => step(s, m, now);

  it('lượt đầu cảnh không áp được → dừng ngay', () => {
    const r = run(initialGuide(), { kind: 'noHorizon' }, 0);
    expect(r.event).toBe('notApplicable');
    expect(r.state.missing).toBe('horizon');
  });

  it('đang tiến bộ thì không bị nhắc', () => {
    let s = run(initialGuide(), fail(0.3), 0).state;
    for (let i = 1; i <= 20; i++) {
      const r = run(s, fail(0.3 - i * 0.012), i * 1000);
      // Mỗi lượt nhỏ đi 0,012 < ngưỡng tiến bộ 0,015: hai lượt mới tính một lần tiến bộ.
      s = r.state;
    }
    expect(s.memo.thirdsColumn!.reminders).toBeLessThan(GUIDE.reminders);
  });

  it('đứng yên: nhắc mỗi 2 s, sau lần thứ 5 còn 10 s rồi dừng, báo phần đã đạt', () => {
    const m: Measure = {
      kind: 'checks',
      checks: [
        { id: 'thirdsColumn', ok: true, error: 0, action: null, target: null },
        { id: 'thirdsEye', ok: false, error: 0.2, action: 'tiltDown', target: null },
      ],
    };
    let r = run(initialGuide(), m, 0);
    expect(r.event).toBe('instruct');
    const events: string[] = [];
    let now = 0;
    while (r.state.status === 'running' && now < 60000) {
      now += 1000;
      r = run(r.state, m, now);
      if (r.event) events.push(r.event);
    }
    expect(events.filter((e) => e === 'remind')).toHaveLength(GUIDE.reminders);
    expect(events.at(-1)).toBe('gaveUp');
    // 5 lần nhắc cách 2 s (tới 10 s) + 10 s.
    expect(now).toBe(20000);
    expect(gaveUpLines(r.state)).toEqual([
      'Đạt: người trên cột 1/3',
      'Chưa đạt: mắt trên đường 1/3',
    ]);
  });

  it('đạt hết → reached; tiêu chí trước vỡ thì quay lại tiêu chí đó', () => {
    let r = run(initialGuide(), fail(0.2, 'thirdsEye'), 0);
    r = run(r.state, fail(0.2, 'thirdsColumn'), 1000);
    expect(r.event).toBe('instruct');
    expect(r.state.current!.id).toBe('thirdsColumn');
    r = run(r.state, { kind: 'checks', checks: [] }, 2000);
    expect(r.event).toBe('reached');
  });

  it('mất người giữa chừng: không tiến bộ được, bị nhắc rồi dừng', () => {
    let r = run(initialGuide(), fail(0.2), 0);
    let now = 0;
    while (r.state.status === 'running' && now < 60000) {
      now += 1000;
      r = run(r.state, { kind: 'noPerson' }, now);
    }
    expect(r.state.status).toBe('gaveUp');
    expect(r.state.current!.id).toBe('person');
  });
});

describe('combinedShape: lớp kẻ bố cục chính + phụ', () => {
  it('1/3 + chân trời: lưới 3×3, hai đường ngang tô màu nhấn, không vẽ trùng', () => {
    const g = combinedShape('thirds', 'horizon', { x: 0.3, y: 0.3 });
    expect(g.v).toEqual([1 / 3, 2 / 3]);
    expect(g.h).toEqual([]);
    expect(g.accentH).toEqual([1 / 3, 2 / 3]);
    expect(g.target).toEqual({ x: 1 / 3, y: 1 / 3 });
  });

  it('chỉ bố cục phụ (chính Tắt) vẫn vẽ', () => {
    expect(combinedShape('off', 'lead').diagonals).toHaveLength(2);
  });
});
