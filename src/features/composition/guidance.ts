/**
 * Hướng dẫn liên tục (Phase 5b, business-flow §6.10): từ kết quả phân tích một ảnh chụp lặng ra
 * tiêu chí đang làm và thao tác máy, và luật dừng (3 lần nhắc không tiến bộ + 10 s). Hàm thuần,
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
  /** Lượt này đạt (`error` ≤ `band`). */
  ok: boolean;
  /** Khoảng lệch đo được, cùng đơn vị giữa các lượt của một tiêu chí. */
  error: number;
  /** Lệch tới mức này vẫn đạt. */
  band: number;
  action: Action | null;
  target: Target | null;
  /** Chỗ của người / mắt / chân trời lúc này (gốc mũi tên tới đích), null khi không vẽ mũi tên. */
  at: { x: number; y: number } | null;
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
  at: { x: number; y: number } | null = null,
): Check => {
  const ok = error <= band;
  return { id, ok, error, band, action: ok ? null : action, target, at };
};

/** Cột 1/3 cho người chính: chừa chỗ phía người nhìn, nhìn thẳng thì cột gần nhất. */
export function thirdsColumn(f: PhotoFeatures, x: number): number {
  if (f.facing === 'right') return 1 / 3;
  if (f.facing === 'left') return 2 / 3;
  return x < 0.5 ? 1 / 3 : 2 / 3;
}

/**
 * Cột 1/3 đã chốt trong một lần hướng dẫn (phiếu Phase 5b lần 1: người đứng giữa khung thì cột gần
 * nhất đổi qua lại theo rung tay, câu nhảy "xoay trái" / "xoay phải"). Chốt ở lượt đầu.
 * - Chốt theo hướng nhìn (`sure`): chỉ đổi khi thấy người nhìn về phía kia `GUIDE.confirmTurns`
 *   lượt (không tính các lượt không đoán được hướng).
 * - Chốt theo cột gần nhất (lượt đầu không đoán được hướng): lượt đầu tiên thấy hướng nhìn thì đổi
 *   theo ngay (phiếu Phase 5b lần 2, mục 10.3.1: chọn 1/3 khi người đã quay đầu mà cột vẫn sai).
 * Lượt không đoán được hướng không xóa số lượt đang đếm: hướng nhìn của người đứng xa lúc có lúc
 * không, xóa thì cột không bao giờ đổi.
 */
export type ColumnLock = { col: number; sure: boolean; pending: number | null; count: number };

/**
 * Độ quay đầu của người chính theo lưới mặt (`faceEyes[i][2]`, > 0: mũi lệch sang phải ảnh): mặt
 * trong khung người chính, gần mắt nhất. Null khi không có mặt.
 */
export function headYaw(f: PhotoFeatures, faces: number[][] | null | undefined): number | null {
  const p = f.people[f.main];
  if (!p || !faces?.length) return null;
  const [x0, y0, x1, y1] = p.box;
  const at = f.eye ?? { x: (x0 + x1) / 2, y: y0 };
  let best: number[] | null = null;
  for (const e of faces) {
    if (e.length < 3 || e[0]! < x0 || e[0]! > x1 || e[1]! < y0 || e[1]! > y1) continue;
    if (
      !best ||
      Math.hypot(e[0]! - at.x, e[1]! - at.y) < Math.hypot(best[0]! - at.x, best[1]! - at.y)
    ) {
      best = e;
    }
  }
  return best ? best[2]! : null;
}

/**
 * Hướng nhìn để chọn cột 1/3: theo độ quay đầu của lưới mặt với ngưỡng thấp hơn ngưỡng "đang quay
 * đầu" của nhận xét (phiếu Phase 5b lần 3, mục 11.3.1–11.3.4: người chỉ quay đầu vừa phải thì bị
 * coi là nhìn thẳng, app chọn cột gần người nhất, nên khi người đứng gần cột phía mình nhìn thì app
 * chọn đúng cột đó). Không có mặt: theo khung xương (`f.facing`).
 */
export function leanOf(f: PhotoFeatures, yaw: number | null): 'left' | 'right' | null {
  if (yaw == null) return f.facing;
  if (Math.abs(yaw) < GUIDE.leanTurn) return null;
  return yaw > 0 ? 'right' : 'left';
}

const leanColumn = (lean: 'left' | 'right' | null) =>
  lean === 'right' ? 1 / 3 : lean === 'left' ? 2 / 3 : null;

/** `yaw`: độ quay đầu của người chính (`headYaw`, đã lật theo khung ngắm), null khi không có mặt. */
export function lockColumn(
  lock: ColumnLock | null,
  f: PhotoFeatures,
  yaw: number | null = null,
): ColumnLock {
  const want = leanColumn(leanOf(f, yaw));
  if (!lock) {
    return want == null
      ? { col: personX(f) < 0.5 ? 1 / 3 : 2 / 3, sure: false, pending: null, count: 0 }
      : { col: want, sure: true, pending: null, count: 0 };
  }
  if (want == null) return lock;
  if (want === lock.col) return { col: lock.col, sure: true, pending: null, count: 0 };
  if (!lock.sure) return { col: want, sure: true, pending: null, count: 0 };
  const count = lock.pending === want ? lock.count + 1 : 1;
  return count >= GUIDE.confirmTurns
    ? { col: want, sure: true, pending: null, count: 0 }
    : { ...lock, pending: want, count };
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

/** Gốc mũi tên ngang: ngang mắt, không có mắt thì giữa khung người. */
const personAt = (f: PhotoFeatures) => {
  const [, y0, , y1] = f.people[f.main]!.box;
  return { x: personX(f), y: f.eye?.y ?? (y0 + y1) / 2 };
};

function mainChecks(
  m: GuidedMain,
  f: PhotoFeatures,
  front: boolean,
  col: number | undefined,
): Check[] {
  const p = f.people[f.main]!;
  const [x0, y0, x1, y1] = p.box;
  switch (m) {
    case 'thirds': {
      const x = personX(f);
      const c = col ?? thirdsColumn(f, x);
      const out = [
        check(
          'thirdsColumn',
          Math.abs(c - x),
          RULE.verticalBand,
          pan(c - x, front),
          { kind: 'vline', x: c },
          personAt(f),
        ),
      ];
      if (f.eye) {
        const dy = 1 / 3 - f.eye.y;
        out.push(
          check(
            'thirdsEye',
            Math.abs(dy),
            RULE.eyeBand,
            tilt(dy),
            { kind: 'hline', y: 1 / 3 },
            f.eye,
          ),
        );
      }
      out.push(jointCut(f));
      return out;
    }
    case 'center': {
      const mid = f.eye ? (f.eye.x + (x0 + x1) / 2) / 2 : (x0 + x1) / 2;
      const out = [
        check(
          'centerAxis',
          Math.abs(0.5 - mid),
          RULE.centerBand,
          pan(0.5 - mid, front),
          { kind: 'vline', x: 0.5 },
          { x: mid, y: f.eye?.y ?? (y0 + y1) / 2 },
        ),
      ];
      if (f.eye) {
        const dy = 1 / 3 - f.eye.y;
        out.push(
          check(
            'centerEye',
            Math.abs(dy),
            RULE.eyeBand,
            tilt(dy),
            { kind: 'hline', y: 1 / 3 },
            f.eye,
          ),
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
        check(
          'groupCenter',
          Math.abs(0.5 - mid),
          RULE.centerBand,
          pan(0.5 - mid, front),
          { kind: 'vline', x: 0.5 },
          { x: mid, y: 0.5 },
        ),
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
  // Mũi tên dọc ở phía không có người.
  const ax = personX(f) < 0.5 ? 0.75 : 0.25;
  const out = [
    check(
      'horizonThird',
      Math.abs(line - h.y),
      RULE.horizonBand,
      tilt(line - h.y),
      { kind: 'hline', y: line },
      { x: ax, y: h.y },
    ),
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

function leadChecks(
  f: PhotoFeatures,
  v: NonNullable<Scene['vanishing']>,
  front: boolean,
  col: number | undefined,
): Check[] {
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
      personAt(f),
    ),
  ];
  const c = col ?? thirdsColumn(f, x);
  out.push(
    check(
      'leadThird',
      Math.abs(c - x),
      RULE.verticalBand,
      pan(c - x, front),
      { kind: 'vline', x: c },
      personAt(f),
    ),
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
  /** Cột 1/3 đã chốt (`lockColumn`); không có thì chọn theo lượt này. */
  col?: number,
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
  if (plan.main) checks.push(...mainChecks(plan.main, f, front, col));
  if (plan.scene === 'horizon') checks.push(...horizonChecks(f, scene!.horizon!));
  if (plan.scene === 'lead') {
    const lead = leadChecks(f, scene!.vanishing!, front, col);
    checks.push(...(plan.main === 'thirds' ? lead.filter((c) => c.id !== 'leadThird') : lead));
  }
  return { kind: 'checks', checks };
}

// ---- Luật dừng ----

export const GUIDE = {
  /**
   * Số lần nhắc không tiến bộ của một bước trước khi đếm lùi (phiếu Phase 5b lần 2, mục 10.6.1:
   * mỗi bước nhắc 3 lần, đếm lại từ đầu khi sang bước khác).
   */
  reminders: 3,
  /** Xét tiến bộ (và nhắc nếu không tiến bộ) mỗi chừng này (ms). */
  remindGapMs: 2000,
  /** Sau lần nhắc cuối còn chừng này (ms) rồi dừng. */
  graceMs: compositionUi.guideGraceMs,
  /**
   * Một tiêu chí chỉ tính đạt khi đúng chừng này lượt liền (phiếu Phase 5b lần 1: một lượt may
   * mắn làm câu nhảy sang tiêu chí sau trước khi người dùng kịp làm). Cũng là số lượt để đổi cột.
   */
  confirmTurns: 2,
  /**
   * Độ quay đầu (lưới mặt) từ chừng này là đã quay để chọn cột 1/3; thấp hơn `FACE_TURN` 0,15 của
   * nhận xét (phiếu Phase 5b lần 3, mục 11.3). Nhìn thẳng mà lệch nhẹ qua ngưỡng thì cột chọn theo
   * phía đó, vẫn là một bố cục đúng.
   */
  leanTurn: 0.07,
  /** Tiêu chí đã đạt chỉ tính là vỡ khi lệch quá ngưỡng × chừng này (rung tay không làm vỡ). */
  holdBand: 1.5,
  /** Mất người / mất đường chừng này lượt liền mới tính là mất (một lượt dò hụt thì bỏ qua). */
  lostTurns: 2,
} as const;

export type GuideState = {
  status: 'running' | 'reached' | 'gaveUp' | 'notApplicable';
  /** Tiêu chí đang làm (chưa đạt đầu tiên), null trước lượt đầu hoặc khi đạt hết. */
  current: Check | null;
  /** Tiêu chí đang làm vừa đúng, đợi lượt sau xác nhận ("Đúng rồi, giữ yên máy"). */
  holding: boolean;
  /** Mỗi tiêu chí: số lần nhắc, lệch tốt nhất, lệch tốt nhất ở đầu khoảng xét tiến bộ. */
  memo: Partial<Record<CriterionId, { reminders: number; best: number; ref: number }>>;
  /** Số lượt đúng liền của từng tiêu chí. */
  okRun: Partial<Record<CriterionId, number>>;
  /** Đầu khoảng xét tiến bộ hiện tại (lần đổi tiêu chí hoặc lần xét trước). */
  lastRemindAt: number;
  /** Hết hạn (ms) sau lần nhắc cuối của tiêu chí đang làm. */
  deadline: number | null;
  /** Tiêu chí đã đạt (đã xác nhận, theo thứ tự), dùng cho viên kết thúc. */
  passed: CriterionId[];
  /** Các bước của lượt đo gần nhất, theo thứ tự ("Bước 2/3"). */
  steps: CriterionId[];
  /** Tiêu chí vừa đạt ở lượt này và lúc đạt (viên "Đạt: …" ngắn trước câu sau). */
  justPassed: CriterionId | null;
  passedAt: number;
  /** Số lượt mất người / mất đường liền. */
  lost: number;
  /** Cảnh không áp được (lượt đầu). */
  missing: 'person' | 'horizon' | 'lead' | 'group' | null;
  /** Lượt đầu đã qua (cảnh áp được). */
  started: boolean;
};

export type GuideEvent =
  'instruct' | 'passed' | 'remind' | 'reached' | 'gaveUp' | 'notApplicable' | null;

export const initialGuide = (): GuideState => ({
  status: 'running',
  current: null,
  holding: false,
  memo: {},
  okRun: {},
  lastRemindAt: -Infinity,
  deadline: null,
  passed: [],
  steps: [],
  justPassed: null,
  passedAt: -Infinity,
  lost: 0,
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
  let lost = 0;
  if (m.kind === 'checks') checks = m.checks;
  else {
    const [missing, id] = MISSING[m.kind];
    // Lượt đầu: cảnh không áp được thì dừng ngay.
    if (!s.started) {
      return { state: { ...s, status: 'notApplicable', missing }, event: 'notApplicable' };
    }
    // Một lượt dò hụt: giữ nguyên, không đổi câu.
    lost = s.lost + 1;
    if (lost < GUIDE.lostTurns) return { state: { ...s, lost }, event: null };
    // Mất thật: một tiêu chí giả không bao giờ tiến bộ (bị nhắc rồi dừng).
    checks = [
      ...s.passed.map((p): Check => ({
        id: p,
        ok: true,
        error: 0,
        band: 0,
        action: null,
        target: null,
        at: null,
      })),
      { id, ok: false, error: 1, band: 0, action: 'find', target: null, at: null },
    ];
  }

  // Đúng lượt này: trong ngưỡng, hoặc đã đạt trước đó và chưa lệch quá ngưỡng × holdBand.
  const was = new Set(s.passed);
  const good = (c: Check) => c.ok || (was.has(c.id) && c.error <= c.band * GUIDE.holdBand);
  const okRun: GuideState['okRun'] = {};
  for (const c of checks) okRun[c.id] = good(c) ? (s.okRun[c.id] ?? 0) + 1 : 0;
  const confirmed = (c: Check) =>
    good(c) && (was.has(c.id) || (okRun[c.id] ?? 0) >= GUIDE.confirmTurns);

  const failing = checks.find((c) => !confirmed(c)) ?? null;
  const passed = checks.filter(confirmed).map((c) => c.id);
  // Tiêu chí đang làm vừa được xác nhận: báo "Đạt: …" trước câu sau.
  const prevId = s.current?.id;
  const fresh = prevId != null && !was.has(prevId) && passed.includes(prevId);
  const base: GuideState = {
    ...s,
    started: true,
    passed,
    steps: m.kind === 'checks' ? checks.map((c) => c.id) : s.steps,
    okRun,
    lost,
    justPassed: fresh ? prevId : s.justPassed,
    passedAt: fresh ? now : s.passedAt,
  };
  if (!failing) {
    return {
      state: { ...base, status: 'reached', current: null, holding: false, deadline: null },
      event: 'reached',
    };
  }

  const holding = good(failing);
  const prev = s.memo[failing.id];
  // Đổi tiêu chí (sang tiêu chí sau, hoặc quay lại tiêu chí trước vừa vỡ): câu mới.
  if (prevId !== failing.id) {
    const memo = {
      ...s.memo,
      [failing.id]: { reminders: prev?.reminders ?? 0, best: failing.error, ref: failing.error },
    };
    const done = (prev?.reminders ?? 0) >= GUIDE.reminders;
    return {
      state: {
        ...base,
        current: failing,
        holding,
        memo,
        deadline: done ? now + GUIDE.graceMs : null,
        lastRemindAt: now,
      },
      event: fresh ? 'passed' : 'instruct',
    };
  }

  // Đang đúng, đợi xác nhận: không nhắc, không hết hạn; khoảng xét tiến bộ tính lại từ đây.
  if (holding) {
    return {
      state: { ...base, current: failing, holding, lastRemindAt: now },
      event: null,
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
      state: { ...base, status: 'gaveUp', current: failing, holding, memo, deadline },
      event: 'gaveUp',
    };
  }
  return {
    state: { ...base, current: failing, holding, memo, lastRemindAt, deadline },
    event,
  };
}

/** Số lần đã nhắc tiêu chí đang làm (chấm nhắc). */
export const remindersOf = (s: GuideState) =>
  s.current ? (s.memo[s.current.id]?.reminders ?? 0) : 0;

// ---- Chữ ----

const G = t.composition.guide;

/** Chiều của một dòng hướng dẫn (icon mũi tên của dòng). */
export type Dir = 'left' | 'right' | 'up' | 'down';
export type GuideLine = { text: string; dir: Dir | null };

const ACTION_DIR: Partial<Record<Action, Dir>> = {
  panLeft: 'left',
  panRight: 'right',
  tiltUp: 'up',
  tiltDown: 'down',
  stepLeft: 'left',
  stepRight: 'right',
  raise: 'up',
  lower: 'down',
};

/** Đưa người / nhóm sang ngang: xoay máy hay người chụp bước ngang đều được. */
const SIDEWAYS: CriterionId[] = ['thirdsColumn', 'centerAxis', 'groupCenter', 'leadThird'];
/** Đưa mắt lên / xuống: chúc / ngửa máy hay hạ / nâng máy đều được (vật gần dịch ngược chiều máy). */
const EYE: CriterionId[] = ['thirdsEye', 'centerEye'];

/** Kết quả theo tên đường đích (phiếu Phase 5b lần 3, mục 11.5: nói rõ cột trái / phải / trên / dưới). */
function goalOf(c: Check): string {
  const tg = c.target;
  if (c.id === 'centerAxis') return G.to.center;
  if (c.id === 'groupCenter') return G.to.group;
  if (tg?.kind === 'vline') return tg.x < 0.5 ? G.to.left : G.to.right;
  if (tg?.kind === 'hline') return tg.y < 0.5 ? G.to.eyeUpper : G.to.eyeLower;
  return G.goals[c.id];
}

/**
 * Viên hướng dẫn: **một dòng**, chỉ bảo người chụp (phiếu Phase 5b lần 3, mục 11.2.1, 11.2.8,
 * 11.5): gộp hai cách làm cùng chiều của người chụp, một mũi tên, rồi tên đường đích: "Đi/xoay máy
 * qua trái để người đứng cột phải" (camera sau: bước sang trái hay xoay máy sang trái thì người trên
 * khung đều dịch sang phải), "Chúc/hạ máy xuống để mắt người trên cột trên". Camera trước chỉ nói
 * xoay máy (bước ngang thì người cầm máy đi theo máy). Tiêu chí khác: một câu "hành động + kết quả".
 */
export function guideLines(c: Check, front = false): GuideLine[] {
  if (!c.action) return [{ text: G.done[c.id], dir: null }];
  const dir = ACTION_DIR[c.action] ?? null;
  if (SIDEWAYS.includes(c.id) && (dir === 'left' || dir === 'right')) {
    return [{ text: `${front ? G.turn[dir] : G.move[dir]} ${goalOf(c)}`, dir }];
  }
  if (EYE.includes(c.id) && (dir === 'up' || dir === 'down')) {
    return [{ text: `${G.tilt[dir]} ${goalOf(c)}`, dir }];
  }
  return [{ text: `${G.actions[c.action]} ${G.goals[c.id]}`, dir }];
}

/** Bước đang làm / số bước (bắt đầu từ 1), null khi tiêu chí đang làm không phải một bước. */
export function stepOf(s: GuideState): { index: number; total: number } | null {
  if (!s.current) return null;
  const i = s.steps.indexOf(s.current.id);
  return i < 0 ? null : { index: i + 1, total: s.steps.length };
}

/** Viên kết thúc khi dừng giữa chừng: [đã đạt, chưa đạt]. */
export function gaveUpLines(s: GuideState): [string | null, string] {
  const failed = s.current ? G.failed(G.done[s.current.id]) : G.stopped;
  const passed = s.passed.filter((id) => id !== 'level' && id !== s.current?.id);
  return [passed.length ? G.passed(passed.map((id) => G.done[id]).join(', ')) : null, failed];
}

// ---- Khung ngắm ----

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
