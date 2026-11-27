import { J, type PhotoFeatures } from 'composition-critic';

import {
  type Check,
  columnUnsure,
  GUIDE,
  type GuideState,
  gaveUpLines,
  guideLines,
  flipX,
  initialGuide,
  headYaw,
  lockColumn,
  type Measure,
  measure,
  step,
  stepOf,
} from '../guidance';

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

const checks = (m: Measure): Check[] => (m.kind === 'checks' ? m.checks : []);
const first = (m: Measure) => checks(m).find((c) => !c.ok) ?? null;

describe('measure: tiêu chí theo thứ tự', () => {
  it('1/3: chỉ cột và cắt khớp; người ở giữa nhìn sang phải → cột trái, xoay máy sang phải', () => {
    const f = person([0.4, 0.2, 0.6, 0.9], { x: 0.5, y: 0.45 }, 'right');
    const m = measure({ main: 'thirds' }, f, 0, false);
    expect(checks(m).map((c) => c.id)).toEqual(['thirdsColumn', 'noJointCut']);
    const c = first(m)!;
    expect(c.id).toBe('thirdsColumn');
    // Người cần dịch sang trái trên khung → xoay máy sang phải.
    expect(c.action).toBe('panRight');
    expect(c.target).toEqual({ kind: 'vline', x: 1 / 3 });
    // Một dòng, chỉ bảo người chụp, nói rõ cột (phiếu Phase 5b lần 3, mục 11.5).
    expect(guideLines(c)).toEqual([
      { text: 'Đi/xoay máy qua phải để người đứng cột trái', dir: 'right' },
    ]);
    // Camera trước: chỉ xoay máy.
    expect(guideLines(c, true)).toEqual([
      { text: 'Xoay máy qua phải để người đứng cột trái', dir: 'right' },
    ]);
  });

  it('camera trước (khung soi gương): cùng chiều camera sau (phiếu lần 4, mục 12.1.5)', () => {
    // Người cần sang cột trái → đưa máy qua phải, như camera sau.
    const f = person([0.4, 0.2, 0.6, 0.9], { x: 0.5, y: 0.45 }, 'right');
    expect(first(measure({ main: 'thirds' }, f, 0, true))!.action).toBe('panRight');
  });

  it('Ở giữa có máy thẳng đứng đầu (cảm biến)', () => {
    const f = person([0.4, 0.2, 0.6, 0.9], { x: 0.5, y: 1 / 3 });
    const m = measure({ main: 'center' }, f, 6, false);
    expect(first(m)!.id).toBe('level');
    expect(checks(measure({ main: 'center' }, f, 1, false)).every((c) => c.ok)).toBe(true);
    // Chỉ máy thẳng và trục giữa (phiếu lần 7, mục 15.7): mắt ở đâu cũng được.
    const low = person([0.4, 0.5, 0.6, 1], { x: 0.5, y: 0.6 });
    expect(checks(measure({ main: 'center' }, low, 0, false)).map((c) => c.id)).toEqual([
      'level',
      'centerAxis',
    ]);
  });

  it('Ở giữa theo trọng tâm vùng người, không theo mắt hay giữa khung (mục 13.4)', () => {
    // Người giơ tay trái, mặt nghiêng: khung 0,2–0,9 (giữa 0,55), mắt 0,6, trọng tâm 0,62.
    const f = person([0.2, 0.2, 0.9, 1], { x: 0.6, y: 1 / 3 });
    f.people[0]!.cx = 0.62;
    const c = first(measure({ main: 'center' }, f, 0, false))!;
    expect(c.id).toBe('centerAxis');
    expect(c.error).toBeCloseTo(0.12);
    // Người cần sang trái → xoay máy qua phải.
    expect(c.action).toBe('panRight');
    // Không thấy mặt: vẫn đo như vậy (không nhảy).
    const noFace = { ...f, eye: null };
    expect(first(measure({ main: 'center' }, noFace, 0, false))!.error).toBeCloseTo(0.12);
    // Camera trước: trọng tâm lật theo khung.
    expect(flipX(f).people[0]!.cx).toBeCloseTo(0.38);
  });

  it('bước chỉ qua khi vào sâu trong ngưỡng; sát mép ngưỡng vẫn nói thao tác', () => {
    // Người lệch trục 0,06 (ngưỡng 0,07, vào sâu 0,049): đúng theo ngưỡng nhưng vẫn nói xoay máy.
    const m = measure({ main: 'center' }, person([0.46, 0.2, 0.66, 0.9]), 0, false);
    const c = checks(m).find((x) => x.id === 'centerAxis')!;
    expect(c.ok).toBe(true);
    expect(c.action).toBe('panRight');
  });

  it('1/3: người to hơn khung, không thấy đầu: không biết người ở đâu → lùi ra', () => {
    const f = person([0, 0.2, 1, 0.9]);
    expect(first(measure({ main: 'thirds' }, f, 0, false, 1 / 3))!.action).toBe('back');
  });

  it('Lấp đầy: người nhỏ → tiến lại gần', () => {
    const c = first(measure({ main: 'fill' }, person([0.45, 0.4, 0.55, 0.7]), 0, false))!;
    expect(c.id).toBe('fillSize');
    expect(guideLines(c)).toEqual([{ text: 'Tiến lại gần để người lấp đầy khung', dir: null }]);
  });

  describe('Lấp đầy: đỉnh đầu theo mắt, không theo đỉnh vùng người', () => {
    /** Người to chạm mép trên; khớp: mắt, vai thấy rõ. */
    const big = (eyeY: number, shoulderW: number | null, eyeGap = 0.04): PhotoFeatures => {
      const joints = Array.from({ length: 33 }, () => ({ x: 0, y: 0, v: 0 }));
      joints[J.eyeL] = { x: 0.5 - eyeGap / 2, y: eyeY, v: 1 };
      joints[J.eyeR] = { x: 0.5 + eyeGap / 2, y: eyeY, v: 1 };
      if (shoulderW) {
        joints[J.shoulderL] = { x: 0.5 - shoulderW / 2, y: eyeY + 0.2, v: 1 };
        joints[J.shoulderR] = { x: 0.5 + shoulderW / 2, y: eyeY + 0.2, v: 1 };
      }
      return { ...person([0.2, 0, 0.8, 1], { x: 0.5, y: eyeY }), joints };
    };
    const head = (f: PhotoFeatures) =>
      checks(measure({ main: 'fill' }, f, 0, false)).find((c) => c.id === 'fillHead')!;

    it('tay giơ / mũ chạm mép, mắt còn thấp: không bắt ngửa máy', () => {
      // Đỉnh đầu đoán ở 0,4 − 0,6 × 0,4 × 0,75 = 0,22.
      expect(head(big(0.4, 0.4)).ok).toBe(true);
    });

    it('đầu ra ngoài thật: ngửa máy, độ lệch nhỏ dần khi ngửa', () => {
      const a = head(big(0.1, 0.4));
      const b = head(big(0.14, 0.4));
      expect(a.ok).toBe(false);
      expect(a.action).toBe('tiltUp');
      expect(b.error).toBeLessThan(a.error);
    });

    it('không thấy vai (chụp cận): theo khoảng hai mắt; mắt quá sát mép luôn tính chạm', () => {
      // Đỉnh đầu 0,4 − 2,6 × 0,1 × 0,75 = 0,205: không chạm.
      expect(head(big(0.4, null, 0.1)).ok).toBe(true);
      // Hai mắt sát nhau (mặt nghiêng): vẫn tính đỉnh đầu ít nhất 0,15 trên mắt.
      expect(head(big(0.12, null, 0.01)).ok).toBe(false);
    });

    it('không thấy mắt: theo đỉnh vùng người như trước', () => {
      expect(head(person([0.2, 0, 0.8, 1])).ok).toBe(false);
    });
  });

  it('cảnh không áp được: không người, không nhóm', () => {
    expect(measure({ main: 'thirds' }, null, 0, false).kind).toBe('noPerson');
    const f = person([0.3, 0.2, 0.5, 0.9]);
    expect(measure({ main: 'group' }, f, 0, false).kind).toBe('noGroup');
  });
});

/** Một tiêu chí, ngưỡng 0,05. */
const crit = (id: Check['id'], error: number): Check => ({
  id,
  ok: error <= 0.05,
  error,
  band: 0.05,
  action: error <= 0.05 ? null : 'panLeft',
  target: null,
  at: null,
});
const turn = (...cs: Check[]): Measure => ({ kind: 'checks', checks: cs });

describe('step: luật nhắc và dừng', () => {
  const fail = (error: number, id: Check['id'] = 'thirdsColumn'): Measure => turn(crit(id, error));
  const run = (s: GuideState, m: Measure, now: number) => step(s, m, now);

  it('lượt đầu cảnh không áp được → dừng ngay', () => {
    const r = run(initialGuide(), { kind: 'noGroup' }, 0);
    expect(r.event).toBe('notApplicable');
    expect(r.state.missing).toBe('group');
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

  it('đứng yên: nhắc mỗi 2 s, sau lần thứ 3 còn 10 s rồi dừng, báo phần đã đạt', () => {
    const m = turn(crit('thirdsColumn', 0), crit('noJointCut', 0.2));
    // Lượt đầu cột đúng nhưng chưa xác nhận: giữ yên; lượt sau mới qua bước.
    let r = run(initialGuide(), m, 0);
    expect(r.state.current!.id).toBe('thirdsColumn');
    expect(r.state.holding).toBe(true);
    const events: string[] = [];
    let now = 0;
    while (r.state.status === 'running' && now < 60000) {
      now += 1000;
      r = run(r.state, m, now);
      if (r.event) events.push(r.event);
    }
    expect(events.filter((e) => e === 'remind')).toHaveLength(GUIDE.reminders);
    expect(events.at(-1)).toBe('gaveUp');
    // Qua bước cột ở 1 s, rồi 3 lần nhắc cách 2 s (tới 7 s) + 10 s.
    expect(events[0]).toBe('passed');
    expect(now).toBe(17000);
    expect(stepOf(r.state)).toEqual({ index: 2, total: 2 });
    expect(gaveUpLines(r.state)).toEqual([
      'Đạt: người đứng đúng cột',
      'Chưa đạt: không cắt ngang tay chân',
    ]);
  });

  it('đạt hết → reached; tiêu chí trước vỡ thì quay lại tiêu chí đó', () => {
    let r = run(initialGuide(), fail(0.2, 'noJointCut'), 0);
    r = run(r.state, fail(0.2, 'thirdsColumn'), 1000);
    expect(r.event).toBe('instruct');
    expect(r.state.current!.id).toBe('thirdsColumn');
  });

  it('tiêu chí đang làm không đo được lượt này: giữ, không báo Đạt (mục 13.1.4)', () => {
    const both = (eye: number | null) =>
      turn(crit('thirdsColumn', 0), ...(eye == null ? [] : [crit('noJointCut', eye)]));
    let r = run(initialGuide(), both(0.2), 0);
    r = run(r.state, both(0.2), 1000);
    expect(r.state.current!.id).toBe('noJointCut');
    // Mắt không thấy hai lượt liền: bước mắt giữ nguyên, ô bước không đổi.
    r = run(r.state, both(null), 2000);
    r = run(r.state, both(null), 3000);
    expect(r.state.status).toBe('running');
    expect(r.state.current!.id).toBe('noJointCut');
    expect(r.state.steps).toEqual(['thirdsColumn', 'noJointCut']);
    // Thấy lại và đúng hai lượt: đạt.
    r = run(r.state, both(0.01), 4000);
    r = run(r.state, both(0.01), 5000);
    expect(r.event).toBe('reached');
  });

  it('đúng một lượt rồi lệch lại: chưa qua bước, không nhảy tiêu chí', () => {
    let r = run(initialGuide(), turn(crit('thirdsColumn', 0.2), crit('noJointCut', 0.2)), 0);
    r = run(r.state, turn(crit('thirdsColumn', 0.03), crit('noJointCut', 0.2)), 1000);
    expect(r.state.current!.id).toBe('thirdsColumn');
    expect(r.state.holding).toBe(true);
    r = run(r.state, turn(crit('thirdsColumn', 0.07), crit('noJointCut', 0.2)), 2000);
    expect(r.state.current!.id).toBe('thirdsColumn');
    expect(r.state.holding).toBe(false);
    expect(r.state.passed).toEqual([]);
  });

  it('đúng hai lượt liền: qua bước, báo "Đạt", sang tiêu chí sau', () => {
    let r = run(initialGuide(), turn(crit('thirdsColumn', 0.2), crit('noJointCut', 0.2)), 0);
    r = run(r.state, turn(crit('thirdsColumn', 0.03), crit('noJointCut', 0.2)), 1000);
    r = run(r.state, turn(crit('thirdsColumn', 0.02), crit('noJointCut', 0.2)), 2000);
    expect(r.event).toBe('passed');
    expect(r.state.justPassed).toBe('thirdsColumn');
    expect(r.state.passedAt).toBe(2000);
    expect(r.state.current!.id).toBe('noJointCut');
  });

  it('bước đã qua chỉ vỡ khi lệch quá 1,5 lần ngưỡng (rung tay không làm vỡ)', () => {
    let r = run(initialGuide(), turn(crit('thirdsColumn', 0.02), crit('noJointCut', 0.2)), 0);
    r = run(r.state, turn(crit('thirdsColumn', 0.02), crit('noJointCut', 0.2)), 1000);
    expect(r.state.passed).toEqual(['thirdsColumn']);
    // 0,07 > ngưỡng 0,05 nhưng ≤ 0,075: vẫn giữ bước cột.
    r = run(r.state, turn(crit('thirdsColumn', 0.07), crit('noJointCut', 0.2)), 2000);
    expect(r.state.current!.id).toBe('noJointCut');
    // 0,1 > 0,075: vỡ thật, quay lại bước cột.
    r = run(r.state, turn(crit('thirdsColumn', 0.1), crit('noJointCut', 0.2)), 3000);
    expect(r.state.current!.id).toBe('thirdsColumn');
  });

  it('đạt hết phải giữ hai lượt mới dừng', () => {
    let r = run(initialGuide(), turn(crit('thirdsColumn', 0.01)), 0);
    expect(r.state.status).toBe('running');
    r = run(r.state, turn(crit('thirdsColumn', 0.01)), 1000);
    expect(r.event).toBe('reached');
  });

  it('mất người một lượt: bỏ qua, giữ nguyên câu', () => {
    let r = run(initialGuide(), fail(0.2), 0);
    const before = r.state.current;
    r = run(r.state, { kind: 'noPerson' }, 1000);
    expect(r.event).toBeNull();
    expect(r.state.current).toBe(before);
    r = run(r.state, fail(0.2), 2000);
    expect(r.state.lost).toBe(0);
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

describe('lockColumn: cột 1/3 chốt trong một lần hướng dẫn', () => {
  it('chưa biết hướng nhìn: cột phải dù người ở bên trái, người lắc qua giữa không đổi (mục 20.5)', () => {
    let lock = lockColumn(null, person([0.1, 0.2, 0.3, 0.9], { x: 0.2, y: 0.4 }));
    expect(lock).toEqual({ col: 2 / 3, score: 0 });
    lock = lockColumn(lock, person([0.4, 0.2, 0.58, 0.9], { x: 0.49, y: 0.4 }));
    lock = lockColumn(lock, person([0.42, 0.2, 0.6, 0.9], { x: 0.51, y: 0.4 }));
    expect(lock.col).toBe(2 / 3);
  });

  it('bỏ phiếu: nhìn phải hai lượt mới rời cột phải; nhìn trái hai lượt là về lại', () => {
    const right = person([0.4, 0.2, 0.6, 0.9], { x: 0.49, y: 0.4 }, 'right');
    const left = person([0.4, 0.2, 0.6, 0.9], { x: 0.5, y: 0.4 }, 'left');
    // Lượt đầu quay đầu rõ: chọn ngay (chưa hiện câu nào).
    expect(lockColumn(null, right)).toEqual({ col: 1 / 3, score: 2 });
    // Lượt đầu không thấy hướng: cột phải; sau đó cần hai lượt nhìn phải.
    let lock = lockColumn(lockColumn(null, person([0.4, 0.2, 0.6, 0.9])), right);
    expect(lock).toEqual({ col: 2 / 3, score: 2 });
    expect(columnUnsure(lock)).toBe(true);
    lock = lockColumn(lock, right);
    expect(lock).toEqual({ col: 1 / 3, score: 3 });
    expect(columnUnsure(lock)).toBe(false);
    lock = lockColumn(lock, left);
    expect(lock.col).toBe(1 / 3);
    lock = lockColumn(lock, left);
    expect(lock.col).toBe(2 / 3);
    expect(columnUnsure(lock)).toBe(false);
  });

  it('một lượt đoán nhầm "nhìn phải" không làm kẹt cột trái (mô phỏng ảnh lần 11)', () => {
    const f = person([0.4, 0.2, 0.6, 0.9], { x: 0.5, y: 0.4 });
    // Giữa chừng khung xương đoán nhầm "nhìn phải" một lượt: vẫn cột phải.
    let lock = lockColumn(lockColumn(null, f), person([0.4, 0.2, 0.6, 0.9], null, 'right'));
    expect(lock.col).toBe(2 / 3);
    // Lượt đầu đoán nhầm: sang cột trái, hai lượt thấy nhìn trái là về lại.
    lock = lockColumn(null, person([0.4, 0.2, 0.6, 0.9], null, 'right'));
    expect(lock.col).toBe(1 / 3);
    lock = lockColumn(lock, f, -0.3);
    expect(lock).toEqual({ col: 1 / 3, score: 0 });
    lock = lockColumn(lock, f, -0.3);
    expect(lock.col).toBe(2 / 3);
    // Một lượt sai nữa không đổi.
    lock = lockColumn(lock, person([0.4, 0.2, 0.6, 0.9], null, 'right'));
    expect(lock.col).toBe(2 / 3);
  });

  it('lượt không đoán được hướng không đổi phiếu', () => {
    const none = person([0.4, 0.2, 0.6, 0.9], { x: 0.5, y: 0.4 });
    const lock = lockColumn(null, none, -0.3);
    expect(lockColumn(lock, none)).toEqual(lock);
  });

  it('độ quay nhẹ lắc qua lại không đổi cột (mục 16.4)', () => {
    const f = person([0.4, 0.2, 0.6, 0.9], { x: 0.5, y: 0.4 });
    // Lượt đầu chưa thấy hướng, sau đó lắc nhẹ: giữ cột phải.
    let lock = lockColumn(null, f);
    for (const y of [0.09, -0.1, 0.12, -0.08, 0.15, -0.11]) lock = lockColumn(lock, f, y);
    expect(lock.col).toBe(2 / 3);
    // Quay nhẹ sang phải ba lượt: cột trái, rồi lắc nhẹ không đổi lại.
    for (const y of [0.1, 0.12, 0.09]) lock = lockColumn(lock, f, y);
    expect(lock.col).toBe(1 / 3);
    for (const y of [-0.1, 0.12, -0.08]) lock = lockColumn(lock, f, y);
    expect(lock.col).toBe(1 / 3);
    lock = lockColumn(lock, f, -0.3);
    lock = lockColumn(lock, f, -0.28);
    expect(lock.col).toBe(2 / 3);
  });

  it('quay đầu vừa phải (dưới ngưỡng nhận xét) vẫn chọn cột theo hướng nhìn (mục 11.3)', () => {
    // Người đứng gần cột phải, quay đầu sang phải nhẹ: khung xương coi là nhìn thẳng.
    const f = person([0.55, 0.2, 0.72, 0.9], { x: 0.64, y: 0.4 });
    expect(lockColumn(null, f).col).toBe(2 / 3);
    // Lượt đầu: sang cột trái ngay (chưa hiện câu nào).
    expect(lockColumn(null, f, 0.1).col).toBe(1 / 3);
    // Giữa chừng: cần ba lượt.
    let lock = lockColumn(lockColumn(null, f), f, 0.1);
    expect(columnUnsure(lock)).toBe(true);
    lock = lockColumn(lockColumn(lock, f, 0.1), f, 0.1);
    expect(lock.col).toBe(1 / 3);
    expect(lockColumn(null, f, -0.1)).toEqual({ col: 2 / 3, score: -1 });
    // Nhìn thẳng thật: cột phải mặc định, chưa có phiếu.
    expect(lockColumn(null, f, 0.02)).toEqual({ col: 2 / 3, score: 0 });
  });

  it('headYaw: mặt trong khung người chính, gần mắt nhất', () => {
    const f = person([0.3, 0.2, 0.6, 0.9], { x: 0.45, y: 0.3 });
    expect(
      headYaw(f, [
        [0.8, 0.3, -0.4],
        [0.46, 0.31, 0.12],
        [0.4, 0.6, -0.2],
      ]),
    ).toBe(0.12);
    expect(headYaw(f, [[0.8, 0.3, 0.3]])).toBeNull();
    expect(headYaw(f, [[0.45, 0.3]])).toBeNull();
    expect(headYaw(f, null)).toBeNull();
  });

  it('chỗ người 1/3 theo trọng tâm vùng người, không theo mắt (mục 17.8)', () => {
    // Mắt bắt nhầm ngoài người không làm đổi chiều: trọng tâm vùng người mới tính.
    const f = { ...person([0.6, 0.2, 0.9, 0.9], { x: 0.3, y: 0.3 }) };
    f.people = [{ ...f.people[0]!, cx: 0.85 }];
    const c = first(measure({ main: 'thirds' }, f, 0, false, 2 / 3))!;
    expect(c.action).toBe('panRight');
    expect(c.at!.x).toBeCloseTo(0.85);
  });

  it('chưa thấy hướng nhìn: bước cột cần 3 lượt đúng mới đạt (mục 18.1)', () => {
    const f = person([0.25, 0.2, 0.42, 0.9]);
    f.people = [{ ...f.people[0]!, cx: 1 / 3 }];
    const m = measure({ main: 'thirds' }, f, 0, false, 1 / 3, true);
    let s = initialGuide();
    s = step(s, m, 0).state;
    s = step(s, m, 1000).state;
    expect(s.passed).not.toContain('thirdsColumn');
    s = step(s, m, 2000).state;
    expect(s.passed).toContain('thirdsColumn');
    // Đã thấy hướng nhìn: 2 lượt như cũ.
    const m2 = measure({ main: 'thirds' }, f, 0, false, 1 / 3, false);
    let s2 = step(initialGuide(), m2, 0).state;
    s2 = step(s2, m2, 1000).state;
    expect(s2.passed).toContain('thirdsColumn');
  });

  it('phần trên của người phủ gần hết khung: bảo lùi ra, không xoay mãi (lần 12)', () => {
    const f = person([0, 0.2, 1, 0.9]);
    f.people = [{ ...f.people[0]!, cx: 0.5, upperW: 0.95 }];
    expect(first(measure({ main: 'thirds' }, f, 0, false, 1 / 3))!.action).toBe('back');
    expect(first(measure({ main: 'center' }, f, 0, false))!.action).toBe('back');
    // Chụp cận nhưng đầu hẹp hơn khung: vẫn xoay tới cột.
    f.people = [{ ...f.people[0]!, cx: 0.5, upperW: 0.4 }];
    expect(first(measure({ main: 'thirds' }, f, 0, false, 1 / 3))!.action).toBe('panRight');
  });

  it('measure dùng cột đã chốt', () => {
    const f = person([0.45, 0.2, 0.65, 0.9], { x: 0.55, y: 0.4 });
    const c = first(measure({ main: 'thirds' }, f, 0, false, 1 / 3))!;
    expect(c.target).toEqual({ kind: 'vline', x: 1 / 3 });
    expect(c.action).toBe('panRight');
    expect(c.at).toEqual({ x: 0.55, y: 0.4 });
  });
});
