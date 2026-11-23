/**
 * Hướng dẫn liên tục (Phase 5b, business-flow §6.10): từ kết quả phân tích một ảnh chụp lặng ra
 * tiêu chí đang làm và thao tác máy, và luật dừng (5 lần nhắc không tiến bộ + 10 s). Hàm thuần,
 * test được trong Jest; Camera gọi `measure` mỗi lượt (~1 s) rồi `step`.
 *
 * Toạ độ theo khung ngắm người dùng đang thấy (0..1, gốc trên trái). Camera trước: khung ngắm soi
 * gương, nên xoay máy ngang ngược chiều so với camera sau (bước ngang thì không đổi, vì vật gần
 * dịch so với điểm hội tụ ở xa theo cùng một chiều trên khung soi gương).
 */
import { J, type PhotoFeatures, RULE, type Scene, visible } from 'composition-critic';

import { t } from '@/ui/strings';
import { compositionUi } from '@/ui/tokens';

import { SENSOR } from './sensor';
import type { TechniqueId } from './techniques';

/** Bố cục chính có hướng dẫn liên tục (Góc thấp, Selfie chạy theo cảm biến). */
export type GuidedMain = 'thirds' | 'center' | 'fill' | 'group';
/** Bố cục phụ, theo cảnh. */
export type SceneTechnique = 'horizon' | 'lead';

export const GUIDED_MAIN: readonly TechniqueId[] = ['thirds', 'center', 'fill', 'group'];
export const SCENE_TECHNIQUES: readonly TechniqueId[] = ['horizon', 'lead'];
export const isGuidedMain = (t: TechniqueId | null): t is GuidedMain =>
  !!t && GUIDED_MAIN.includes(t);
export const isSceneTechnique = (t: TechniqueId | null): t is SceneTechnique =>
  !!t && SCENE_TECHNIQUES.includes(t);

export type CriterionId =
  | 'level'
  | 'thirdsColumn'
  | 'thirdsEye'
  | 'noJointCut'
  | 'centerAxis'
  | 'centerEye'
  | 'fillSize'
  | 'fillHead'
  | 'groupInFrame'
  | 'groupCenter'
  | 'horizonThird'
  | 'horizonNeck'
  | 'leadToPerson'
  | 'leadThird'
  /** Giả: mất người / mất đường giữa chừng (không tiến bộ được, nên bị nhắc rồi dừng). */
  | 'person'
  | 'horizonSeen'
  | 'leadSeen';

export type Action =
  | 'panLeft'
  | 'panRight'
  | 'tiltUp'
  | 'tiltDown'
  | 'closer'
  | 'back'
  | 'stepLeft'
  | 'stepRight'
  | 'raise'
  | 'lower'
  | 'rotateCw'
  | 'rotateCcw'
  | 'find';

/** Đích sáng trên khung ngắm của tiêu chí đang làm. */
export type Target =
  | { kind: 'vline'; x: number }
  | { kind: 'hline'; y: number }
  | { kind: 'point'; x: number; y: number }
  | { kind: 'frame' };

export type Check = {
  id: CriterionId;
  ok: boolean;
  /** Khoảng lệch còn lại (0 khi đạt), cùng đơn vị giữa các lượt của một tiêu chí. */
  error: number;
  action: Action | null;
  target: Target | null;
};

/** Một lượt đo: các tiêu chí theo thứ tự, hoặc cảnh không áp được. */
export type Measure =
  | { kind: 'checks'; checks: Check[] }
  | { kind: 'noPerson' }
  | { kind: 'noHorizon' }
  | { kind: 'noLead' }
  | { kind: 'noGroup' };

export type GuidePlan = { main: GuidedMain | null; scene: SceneTechnique | null };

/** Tiến bộ khi khoảng lệch nhỏ hơn mức tốt nhất của tiêu chí ít nhất chừng này (lọc rung tay). */
export const PROGRESS_EPS = 0.015;

const pan = (dx: number, front: boolean): Action =>
  // dx > 0: người cần dịch sang phải trên khung → xoay máy sang trái (camera sau).
  dx > 0 !== front ? 'panLeft' : 'panRight';
/** dy > 0: vật cần dịch xuống trên khung → ngửa máy lên. */
const tilt = (dy: number): Action => (dy > 0 ? 'tiltUp' : 'tiltDown');

const check = (
  id: CriterionId,
  error: number,
  band: number,
  action: Action | null,
  target: Target | null,
): Check => {
  const ok = error <= band;
  return { id, ok, error: ok ? 0 : error, action: ok ? null : action, target };
};

/** Cột 1/3 cho người chính: chừa chỗ phía người nhìn, nhìn thẳng thì cột gần nhất. */
export function thirdsColumn(f: PhotoFeatures, x: number): number {
  if (f.facing === 'right') return 1 / 3;
  if (f.facing === 'left') return 2 / 3;
  return x < 0.5 ? 1 / 3 : 2 / 3;
}

function personX(f: PhotoFeatures): number {
  const p = f.people[f.main]!;
  return f.eye?.x ?? (p.box[0] + p.box[2]) / 2;
}

/** Cắt ngang khớp: mép dưới qua gối / cổ chân, mép trái phải qua khuỷu / cổ tay → lùi ra. */
function jointCut(f: PhotoFeatures): Check {
  const j = f.joints;
  let cut = false;
  if (j) {
    const at = (i: number, lo: number, hi: number) => {
      const q = j[i];
      if (!q || q.v < RULE.cutVis) return false;
      const b = RULE.jointCut;
      return (q.y >= lo && q.y <= hi) || Math.abs(q.x) <= b || Math.abs(q.x - 1) <= b;
    };
    const bottom = [1 - RULE.jointCut, 1 + RULE.jointCut] as const;
    cut =
      at(J.kneeL, ...RULE.kneeCut) ||
      at(J.kneeR, ...RULE.kneeCut) ||
      at(J.ankleL, ...RULE.ankleCut) ||
      at(J.ankleR, ...RULE.ankleCut) ||
      [J.elbowL, J.elbowR, J.wristL, J.wristR].some((i) => at(i, ...bottom));
  }
  // Không đo được độ lệch: 1 khi còn cắt (không tiến bộ thì bị nhắc).
  return check('noJointCut', cut ? 1 : 0, 0, 'back', { kind: 'frame' });
}

function mainChecks(m: GuidedMain, f: PhotoFeatures, front: boolean): Check[] {
  const p = f.people[f.main]!;
  const [x0, y0, x1, y1] = p.box;
  switch (m) {
    case 'thirds': {
      const x = personX(f);
      const col = thirdsColumn(f, x);
      const out = [
        check('thirdsColumn', Math.abs(col - x), RULE.verticalBand, pan(col - x, front), {
          kind: 'vline',
          x: col,
        }),
      ];
      if (f.eye) {
        const dy = 1 / 3 - f.eye.y;
        out.push(
          check('thirdsEye', Math.abs(dy), RULE.eyeBand, tilt(dy), { kind: 'hline', y: 1 / 3 }),
        );
      }
      out.push(jointCut(f));
      return out;
    }
    case 'center': {
      const mid = f.eye ? (f.eye.x + (x0 + x1) / 2) / 2 : (x0 + x1) / 2;
      const out = [
        check('centerAxis', Math.abs(0.5 - mid), RULE.centerBand, pan(0.5 - mid, front), {
          kind: 'vline',
          x: 0.5,
        }),
      ];
      if (f.eye) {
        const dy = 1 / 3 - f.eye.y;
        out.push(
          check('centerEye', Math.abs(dy), RULE.eyeBand, tilt(dy), {
            kind: 'point',
            x: 0.5,
            y: 1 / 3,
          }),
        );
      }
      return out;
    }
    case 'fill': {
      const short = Math.min(RULE.fillHeight - (y1 - y0), RULE.fillArea - p.area);
      return [
        check('fillSize', Math.max(0, short), 0, 'closer', { kind: 'frame' }),
        // Đỉnh đầu chạm mép trên: ngửa máy lên để người dịch xuống.
        check('fillHead', Math.max(0, RULE.headTouch - y0), 0, 'tiltUp', { kind: 'frame' }),
      ];
    }
    case 'group': {
      const left = Math.min(...f.people.map((q) => q.box[0]));
      const right = Math.max(...f.people.map((q) => q.box[2]));
      const edge = Math.max(0, RULE.edge - left) + Math.max(0, right - (1 - RULE.edge));
      const mid = (left + right) / 2;
      return [
        check('groupInFrame', edge, 0, 'back', { kind: 'frame' }),
        check('groupCenter', Math.abs(0.5 - mid), RULE.centerBand, pan(0.5 - mid, front), {
          kind: 'vline',
          x: 0.5,
        }),
      ];
    }
  }
}

/**
 * Đường 1/3 cho chân trời: không trùng chỗ mắt người (mắt đã ở đường 1/3 trên thì chân trời ở
 * đường dưới), còn lại đường gần nhất.
 */
export function horizonLine(f: PhotoFeatures, y: number): number {
  if (f.eye && Math.abs(f.eye.y - 1 / 3) <= RULE.eyeBand * 1.5) return 2 / 3;
  if (f.eye && Math.abs(f.eye.y - 2 / 3) <= RULE.eyeBand * 1.5) return 1 / 3;
  return Math.abs(y - 1 / 3) <= Math.abs(y - 2 / 3) ? 1 / 3 : 2 / 3;
}

function horizonChecks(f: PhotoFeatures, h: NonNullable<Scene['horizon']>): Check[] {
  const line = horizonLine(f, h.y);
  const out = [
    check('horizonThird', Math.abs(line - h.y), RULE.horizonBand, tilt(line - h.y), {
      kind: 'hline',
      y: line,
    }),
  ];
  if (f.eye) {
    const j = f.joints;
    const shoulders = j
      ? [j[J.shoulderL], j[J.shoulderR]].filter((q) => visible(q)).map((q) => q!.y)
      : [];
    const neck = shoulders.length ? Math.max(...shoulders) : f.eye.y + 0.08;
    const top = f.eye.y - 0.02;
    // Lệch: khoảng phải hạ chân trời xuống dưới vai (hạ máy làm chân trời đi qua người thấp hơn).
    const err = h.y >= top && h.y <= neck ? neck - h.y + 0.01 : 0;
    out.push(check('horizonNeck', err, 0, 'lower', { kind: 'hline', y: line }));
  }
  return out;
}

function leadChecks(f: PhotoFeatures, v: NonNullable<Scene['vanishing']>, front: boolean): Check[] {
  const p = f.people[f.main]!;
  const [x0, y0, x1, y1] = p.box;
  const pt = v.point;
  const inBox =
    pt.x >= x0 - RULE.leadPad &&
    pt.x <= x1 + RULE.leadPad &&
    pt.y >= y0 - RULE.leadPad &&
    pt.y <= y1;
  const nearEye = f.eye ? Math.hypot(pt.x - f.eye.x, pt.y - f.eye.y) <= RULE.leadEye : false;
  const x = personX(f);
  // Bước ngang: vật gần dịch ngược chiều bước, điểm hội tụ ở xa đứng yên. Điểm hội tụ bên phải
  // người → bước sang trái để người dịch sang phải tới điểm đó.
  const out = [
    check(
      'leadToPerson',
      inBox || nearEye ? 0 : Math.abs(pt.x - x),
      0,
      pt.x > x ? 'stepLeft' : 'stepRight',
      { kind: 'point', x: pt.x, y: pt.y },
    ),
  ];
  const col = thirdsColumn(f, x);
  out.push(
    check('leadThird', Math.abs(col - x), RULE.verticalBand, pan(col - x, front), {
      kind: 'vline',
      x: col,
    }),
  );
  return out;
}

/**
 * Đo một lượt. Thứ tự: máy thẳng (khi có bố cục cần thẳng) → bố cục chính → bố cục phụ; tiêu chí
 * trùng (đường dẫn ② "người ở 1/3" khi bố cục chính là 1/3) chỉ giữ lần đầu.
 */
export function measure(
  plan: GuidePlan,
  f: PhotoFeatures | null,
  scene: Scene | null,
  rollDeg: number,
  front: boolean,
): Measure {
  if (!f || f.main < 0 || !f.people[f.main]) return { kind: 'noPerson' };
  if (plan.main === 'group' && f.people.length < 2 && f.heads.length < 2)
    return { kind: 'noGroup' };
  if (plan.scene === 'horizon' && !scene?.horizon) return { kind: 'noHorizon' };
  if (plan.scene === 'lead' && !scene?.vanishing) return { kind: 'noLead' };

  const checks: Check[] = [];
  if (plan.main === 'center' || plan.scene === 'horizon') {
    const r = Math.abs(rollDeg);
    checks.push(
      check('level', r, SENSOR.levelIn, rollDeg > 0 ? 'rotateCcw' : 'rotateCw', { kind: 'frame' }),
    );
  }
  if (plan.main) checks.push(...mainChecks(plan.main, f, front));
  if (plan.scene === 'horizon') checks.push(...horizonChecks(f, scene!.horizon!));
  if (plan.scene === 'lead') {
    const lead = leadChecks(f, scene!.vanishing!, front);
    checks.push(...(plan.main === 'thirds' ? lead.filter((c) => c.id !== 'leadThird') : lead));
  }
  return { kind: 'checks', checks };
}

// ---- Luật dừng ----

export const GUIDE = {
  /** Số lần nhắc không tiến bộ của một tiêu chí trước khi đếm lùi. */
  reminders: 5,
  /** Xét tiến bộ (và nhắc nếu không tiến bộ) mỗi chừng này (ms). */
  remindGapMs: 2000,
  /** Sau lần nhắc cuối còn chừng này (ms) rồi dừng. */
  graceMs: compositionUi.guideGraceMs,
} as const;

export type GuideState = {
  status: 'running' | 'reached' | 'gaveUp' | 'notApplicable';
  /** Tiêu chí đang làm (chưa đạt đầu tiên), null trước lượt đầu hoặc khi đạt hết. */
  current: Check | null;
  /** Mỗi tiêu chí: số lần nhắc, lệch tốt nhất, lệch tốt nhất ở đầu khoảng xét tiến bộ. */
  memo: Partial<Record<CriterionId, { reminders: number; best: number; ref: number }>>;
  /** Đầu khoảng xét tiến bộ hiện tại (lần đổi tiêu chí hoặc lần xét trước). */
  lastRemindAt: number;
  /** Hết hạn (ms) sau lần nhắc thứ 5 của tiêu chí đang làm. */
  deadline: number | null;
  /** Lượt gần nhất: tiêu chí đã đạt (theo thứ tự), dùng cho viên kết thúc. */
  passed: CriterionId[];
  /** Cảnh không áp được (lượt đầu). */
  missing: 'person' | 'horizon' | 'lead' | 'group' | null;
  /** Lượt đầu đã qua (cảnh áp được). */
  started: boolean;
};

export type GuideEvent = 'instruct' | 'remind' | 'reached' | 'gaveUp' | 'notApplicable' | null;

export const initialGuide = (): GuideState => ({
  status: 'running',
  current: null,
  memo: {},
  lastRemindAt: -Infinity,
  deadline: null,
  passed: [],
  missing: null,
  started: false,
});

const MISSING = {
  noPerson: ['person', 'person'],
  noHorizon: ['horizon', 'horizonSeen'],
  noLead: ['lead', 'leadSeen'],
  noGroup: ['group', 'person'],
} as const;

/** Một lượt: cập nhật trạng thái theo kết quả đo lúc `now` (ms). */
export function step(
  s: GuideState,
  m: Measure,
  now: number,
): { state: GuideState; event: GuideEvent } {
  if (s.status !== 'running') return { state: s, event: null };

  let checks: Check[];
  if (m.kind === 'checks') checks = m.checks;
  else {
    const [missing, id] = MISSING[m.kind];
    // Lượt đầu: cảnh không áp được thì dừng ngay.
    if (!s.started) {
      return { state: { ...s, status: 'notApplicable', missing }, event: 'notApplicable' };
    }
    // Giữa chừng mất người / mất đường: một tiêu chí giả không bao giờ tiến bộ.
    checks = [
      ...s.passed.map((p) => ({ id: p, ok: true, error: 0, action: null, target: null })),
      { id, ok: false, error: 1, action: 'find', target: null },
    ];
  }

  const failing = checks.find((c) => !c.ok) ?? null;
  const passed = checks.filter((c) => c.ok).map((c) => c.id);
  const base = { ...s, started: true, passed };
  if (!failing) {
    return {
      state: { ...base, status: 'reached', current: null, deadline: null },
      event: 'reached',
    };
  }

  const prev = s.memo[failing.id];
  // Đổi tiêu chí (sang tiêu chí sau, hoặc quay lại tiêu chí trước vừa vỡ): câu mới.
  if (s.current?.id !== failing.id) {
    const memo = {
      ...s.memo,
      [failing.id]: { reminders: prev?.reminders ?? 0, best: failing.error, ref: failing.error },
    };
    const done = (prev?.reminders ?? 0) >= GUIDE.reminders;
    return {
      state: {
        ...base,
        current: failing,
        memo,
        deadline: done ? now + GUIDE.graceMs : null,
        lastRemindAt: now,
      },
      event: 'instruct',
    };
  }

  // Tiến bộ xét theo từng khoảng `remindGapMs`: trong khoảng đó lệch tốt nhất có nhỏ đi hơn
  // `PROGRESS_EPS` so với đầu khoảng không. Xét từng lượt thì người làm theo chậm mà đều cũng bị
  // nhắc (lượt nào nhỏ đi ít hơn ngưỡng là tính).
  const reminders = prev?.reminders ?? 0;
  const best = Math.min(prev?.best ?? failing.error, failing.error);
  const ref = prev?.ref ?? best;
  let memo = { ...s.memo, [failing.id]: { reminders, best, ref } };
  let event: GuideEvent = null;
  let lastRemindAt = s.lastRemindAt;
  let deadline = s.deadline;
  if (now - s.lastRemindAt >= GUIDE.remindGapMs) {
    lastRemindAt = now;
    if (best < ref - PROGRESS_EPS) {
      memo = { ...memo, [failing.id]: { reminders, best, ref: best } };
    } else if (reminders < GUIDE.reminders) {
      memo = { ...memo, [failing.id]: { reminders: reminders + 1, best, ref: best } };
      event = 'remind';
      if (reminders + 1 >= GUIDE.reminders) deadline = now + GUIDE.graceMs;
    }
  }
  if (deadline !== null && now >= deadline) {
    return {
      state: { ...base, status: 'gaveUp', current: failing, memo, deadline },
      event: 'gaveUp',
    };
  }
  return { state: { ...base, current: failing, memo, lastRemindAt, deadline }, event };
}

/** Số lần đã nhắc tiêu chí đang làm (chấm nhắc). */
export const remindersOf = (s: GuideState) =>
  s.current ? (s.memo[s.current.id]?.reminders ?? 0) : 0;

// ---- Chữ ----

const G = t.composition.guide;

/** Câu "hành động + kết quả" của tiêu chí đang làm. */
export const guideLine = (c: Check) =>
  c.action ? `${G.actions[c.action]} ${G.goals[c.id]}` : G.done[c.id];

/** Viên kết thúc khi dừng giữa chừng: [đã đạt, chưa đạt]. */
export function gaveUpLines(s: GuideState): [string | null, string] {
  const failed = s.current ? G.failed(G.done[s.current.id]) : G.stopped;
  const passed = s.passed.filter((id) => id !== 'level' && id !== s.current?.id);
  return [passed.length ? G.passed(passed.map((id) => G.done[id]).join(', ')) : null, failed];
}

// ---- Khung ngắm, gợi ý bố cục phụ ----

/**
 * Lật ngang kết quả phân tích (ảnh không lật như khung ngắm: camera trước, tắt Lưu soi gương),
 * để đo theo đúng hình người dùng đang thấy.
 */
export function flipX(
  f: PhotoFeatures,
  scene: Scene | null,
): { f: PhotoFeatures; scene: Scene | null } {
  const fx = (x: number) => 1 - x;
  const flipped: PhotoFeatures = {
    ...f,
    people: f.people.map((p) => ({ ...p, box: [fx(p.box[2]), p.box[1], fx(p.box[0]), p.box[3]] })),
    eye: f.eye ? { ...f.eye, x: fx(f.eye.x) } : null,
    joints: f.joints ? f.joints.map((j) => ({ ...j, x: fx(j.x) })) : null,
    facing: f.facing === 'left' ? 'right' : f.facing === 'right' ? 'left' : null,
    heads: f.heads.map((h) => ({ ...h, x: fx(h.x) })),
  };
  if (!scene) return { f: flipped, scene };
  const seg = <S extends { a: { x: number; y: number }; b: { x: number; y: number } }>(
    s: S,
  ): S => ({
    ...s,
    a: { ...s.a, x: fx(s.a.x) },
    b: { ...s.b, x: fx(s.b.x) },
  });
  return {
    f: flipped,
    scene: {
      ...scene,
      horizon: scene.horizon
        ? { ...scene.horizon, angle: -scene.horizon.angle, seg: seg(scene.horizon.seg) }
        : null,
      vanishing: scene.vanishing
        ? {
            point: { ...scene.vanishing.point, x: fx(scene.vanishing.point.x) },
            lines: scene.vanishing.lines.map(seg),
          }
        : null,
      pole: scene.pole ? seg(scene.pole) : null,
      segments: scene.segments.map(seg),
    },
  };
}

/**
 * Bố cục phụ để gợi ý, trừ cái đang bật (người dùng chốt 2026-11-23 sau khi đo bộ dò):
 * - Đường chân trời: có người, bộ dò thấy chân trời VÀ model lọc cho xác suất từ `minP`
 *   (bộ dò một mình đúng ~25%, ghép model ~60%). Chưa có model (`pHorizon` null): không gợi ý.
 * - Đường dẫn: không gợi ý (bộ dò điểm hội tụ gần như ngẫu nhiên); vẫn tự chọn được.
 */
export function sceneSuggestions(
  f: PhotoFeatures | null,
  scene: Scene | null,
  current: SceneTechnique | null,
  pHorizon: number | null,
  minP: number,
): SceneTechnique[] {
  if (!f || f.main < 0 || !scene) return [];
  if (scene.horizon && current !== 'horizon' && pHorizon != null && pHorizon >= minP) {
    return ['horizon'];
  }
  return [];
}
