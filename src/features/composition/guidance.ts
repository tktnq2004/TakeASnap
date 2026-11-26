/**
 * Hướng dẫn liên tục (Phase 5b, business-flow §6.10): từ kết quả phân tích một ảnh chụp lặng ra
 * tiêu chí đang làm và thao tác máy, và luật dừng (3 lần nhắc không tiến bộ + 10 s). Hàm thuần,
 * test được trong Jest; Camera gọi `measure` mỗi lượt (~1 s) rồi `step`.
 *
 * Toạ độ theo khung ngắm người dùng đang thấy (0..1, gốc trên trái). Camera trước: khung ngắm soi
 * gương; đưa / xoay máy qua trái thì người dịch sang phải trên khung, cùng chiều camera sau (phiếu
 * Phase 5b lần 4, mục 12.1.5).
 */
import { centerOf, J, type PhotoFeatures, RULE, visible } from 'composition-critic';

import { t } from '@/ui/strings';
import { compositionUi } from '@/ui/tokens';

import { SENSOR } from './sensor';
import type { TechniqueId } from './techniques';

/** Bố cục chính có hướng dẫn liên tục (Góc thấp, Selfie chạy theo cảm biến). */
export type GuidedMain = 'thirds' | 'center' | 'fill' | 'group';

export const GUIDED_MAIN: readonly TechniqueId[] = ['thirds', 'center', 'fill', 'group'];
export const isGuidedMain = (t: TechniqueId | null): t is GuidedMain =>
  !!t && GUIDED_MAIN.includes(t);

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
  /** Giả: mất người giữa chừng (không tiến bộ được, nên bị nhắc rồi dừng). */
  | 'person';

export type Action =
  | 'panLeft'
  | 'panRight'
  | 'tiltUp'
  | 'tiltDown'
  | 'closer'
  | 'back'
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
  { kind: 'checks'; checks: Check[] } | { kind: 'noPerson' } | { kind: 'noGroup' };

export type GuidePlan = { main: GuidedMain };

/** Tiến bộ khi khoảng lệch nhỏ hơn mức tốt nhất của tiêu chí ít nhất chừng này (lọc rung tay). */
export const PROGRESS_EPS = 0.015;

const pan = (dx: number): Action =>
  // dx > 0: người cần dịch sang phải trên khung → đi / xoay máy sang trái. Camera trước cũng vậy
  // (phiếu Phase 5b lần 4, mục 12.1.5: khung soi gương, đưa máy qua trái thì người dịch sang phải).
  dx > 0 ? 'panLeft' : 'panRight';
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
  // Lệch còn gần mép ngưỡng: vẫn nói thao tác, vì bước chỉ qua khi vào sâu trong ngưỡng
  // (`enterOf`).
  const quiet = error <= band * enterOf(id);
  return { id, ok, error, band, action: quiet ? null : action, target, at };
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

/**
 * Chỗ ngang của người chính: giữa hai mắt; không thấy mắt thì mũi, rồi giữa hai vai của khung
 * xương; không có thì giữa khung người. Khung người chạm mép khung ngắm mà không thấy đầu (người
 * đang ra khỏi khung): coi như đứng ở mép đó, vì giữa khung người lúc này nằm lệch vào trong (chạy
 * thử trên ảnh thật, người chụp làm ngược: câu đổi chiều sai khi mắt ra khỏi khung).
 */
function personX(f: PhotoFeatures): number {
  const [x0, , x1] = f.people[f.main]!.box;
  return seenX(f) ?? (x0 + x1) / 2;
}

/**
 * Như `personX`, nhưng null khi không biết người ở đâu: không thấy mắt, mũi, vai mà khung người
 * chạm cả hai mép (người to hơn khung, đầu đã ra ngoài). Lúc đó giữa khung người luôn là giữa
 * khung, nên bước ngang báo Đạt sai (chạy thử Ở giữa, người chụp làm ngược).
 */
function seenX(f: PhotoFeatures): number | null {
  if (f.eye) return f.eye.x;
  const j = f.joints;
  const nose = j?.[J.nose];
  if (nose && visible(nose)) return nose.x;
  const sl = j?.[J.shoulderL];
  const sr = j?.[J.shoulderR];
  if (sl && sr && visible(sl) && visible(sr)) return (sl.x + sr.x) / 2;
  const [x0, , x1] = f.people[f.main]!.box;
  const atLeft = x0 <= EDGE;
  const atRight = x1 >= 1 - EDGE;
  if (atLeft !== atRight) return atLeft ? x0 : x1;
  return atLeft ? null : (x0 + x1) / 2;
}

/** Khung người cách mép khung ngắm dưới chừng này là chạm mép. */
const EDGE = 0.01;

/**
 * Chỗ ngang của người cho Ở giữa: trọng tâm vùng người (`centerOf`, như nhận xét sau khi chụp).
 * Phiếu Phase 5b lần 5, mục 13.4: với người không đối xứng (giơ tay, tóc, váy một bên, mặt nghiêng)
 * trung bình mắt + giữa khung nhảy giữa các lượt (bộ dò mặt lúc thấy lúc không, tóc chạm mép làm
 * tưởng người đang ra khỏi khung) nên câu đổi trái / phải liên tục. Vùng người ổn định hơn nhiều.
 */
function centerX(f: PhotoFeatures): number {
  return centerOf(f.people[f.main]!);
}

/**
 * Bước ngang đưa người tới đường `x`. Không biết người ở đâu (`seenX` null): chưa đạt, bảo lùi ra
 * cho thấy lại đầu người.
 */
function sideCheck(
  id: CriterionId,
  f: PhotoFeatures,
  at: number | null,
  x: number,
  band: number,
): Check {
  const target: Target = { kind: 'vline', x };
  if (at == null) return check(id, 1, band, 'back', target, null);
  return check(id, Math.abs(x - at), band, pan(x - at), target, { x: at, y: personAt(f).y });
}

/**
 * Mắt lên đường 1/3 trên. Không thấy mắt mà khung người chạm mép trên: mắt đã ra khỏi khung phía
 * trên (ngửa / chúc máy quá tay), bước mắt vẫn còn và bảo ngửa máy lên, không bỏ bước (chạy thử
 * trên ảnh thật: bước mắt biến mất nên báo Đạt khi mắt đã ra khỏi khung). Không thấy mắt vì người
 * quay lưng thì bỏ bước như trước.
 */
function eyeCheck(id: 'thirdsEye' | 'centerEye', f: PhotoFeatures): Check | null {
  const [, y0, , y1] = f.people[f.main]!.box;
  // Mắt ở phần dưới khung người là bắt nhầm (chạy thử trên ảnh người dùng gửi, phiếu Phase 5b lần 5:
  // khung xương đặt "mắt" ở bàn tay cuối khung): coi như không thấy mắt. Không lấy hẹp hơn: người
  // giơ tay cao thì khung người bắt đầu từ bàn tay, mắt nằm khá thấp trong khung. Lượt đó không đo
  // bước mắt (không suy ra "mắt ra mép trên").
  const eye = f.eye ?? earLevel(f);
  if (eye) {
    if (eye.y > y0 + EYE_LOW * (y1 - y0)) return null;
    const dy = 1 / 3 - eye.y;
    return check(id, Math.abs(dy), RULE.eyeBand, tilt(dy), { kind: 'hline', y: 1 / 3 }, eye);
  }
  if (y0 > EDGE) return null;
  return check(id, 1 / 3 + RULE.eyeBand, RULE.eyeBand, 'tiltUp', { kind: 'hline', y: 1 / 3 }, null);
}

/**
 * Độ cao mắt đoán từ tai khi không thấy mắt (người quay lưng, phiếu Phase 5b lần 6, mục 14.2.4:
 * "không thấy mắt thì lấy đầu"). Đo trên 2.436 ảnh thấy cả mắt lẫn hai tai: tai thấp hơn mắt
 * trung vị 0,009 chiều cao ảnh, sau khi trừ đi thì 90% lệch dưới 0,027 (ngưỡng bước mắt 0,07).
 * Đoán từ vai thì lệch tới 0,086 nên không dùng.
 */
function earLevel(f: PhotoFeatures): { x: number; y: number } | null {
  const j = f.joints;
  const ears = [j?.[J.earL], j?.[J.earR]].filter((q) => visible(q)).map((q) => q!);
  if (!ears.length) return null;
  const x = ears.reduce((s, q) => s + q.x, 0) / ears.length;
  const y = ears.reduce((s, q) => s + q.y, 0) / ears.length;
  return { x, y: y - EAR_BELOW_EYE };
}

/** Tai thấp hơn mắt chừng này (phần chiều cao ảnh, trung vị đo trên bộ ảnh mẫu). */
const EAR_BELOW_EYE = 0.009;

/** Mắt thấp hơn chừng này chiều cao khung người (tính từ đỉnh) là bắt nhầm. */
const EYE_LOW = 0.75;

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
  const [, y0, , y1] = p.box;
  switch (m) {
    case 'thirds': {
      const c = col ?? thirdsColumn(f, personX(f));
      const out = [sideCheck('thirdsColumn', f, seenX(f), c, RULE.verticalBand)];
      const eye = eyeCheck('thirdsEye', f);
      if (eye) out.push(eye);
      out.push(jointCut(f));
      return out;
    }
    case 'center': {
      const out = [sideCheck('centerAxis', f, centerX(f), 0.5, RULE.centerBand)];
      const eye = eyeCheck('centerEye', f);
      if (eye) out.push(eye);
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
          pan(0.5 - mid),
          { kind: 'vline', x: 0.5 },
          { x: mid, y: 0.5 },
        ),
      ];
    }
  }
}

/** Đo một lượt. Thứ tự: máy thẳng (Ở giữa) → các tiêu chí của bố cục. */
export function measure(
  plan: GuidePlan,
  f: PhotoFeatures | null,
  rollDeg: number,
  front: boolean,
  /** Cột 1/3 đã chốt (`lockColumn`); không có thì chọn theo lượt này. */
  col?: number,
): Measure {
  if (!f || f.main < 0 || !f.people[f.main]) return { kind: 'noPerson' };
  if (plan.main === 'group' && f.people.length < 2 && f.heads.length < 2)
    return { kind: 'noGroup' };

  const checks: Check[] = [];
  if (plan.main === 'center') {
    const r = Math.abs(rollDeg);
    checks.push(
      check('level', r, SENSOR.levelIn, rollDeg > 0 ? 'rotateCcw' : 'rotateCw', { kind: 'frame' }),
    );
  }
  checks.push(...mainChecks(plan.main, f, front, col));
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
  /**
   * Tiêu chí chưa đạt chỉ tính là đúng khi lệch dưới ngưỡng × chừng này (phiếu Phase 5b lần 5, mục
   * 13.1.4–13.1.5: mắt nằm sát ngưỡng thì rung tay một lượt đã cho qua, vừa nói chưa kịp làm đã
   * báo Đạt).
   */
  enterBand: 0.8,
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
  missing: 'person' | 'group' | null;
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
  noGroup: ['group', 'person'],
} as const;

/**
 * Phần ngưỡng một tiêu chí chưa đạt phải vào tới mới tính là đúng: `GUIDE.enterBand` với tiêu chí
 * đo trên ảnh (rung số giữa các lượt); máy thẳng đọc cảm biến, không rung, dùng cả ngưỡng (chạy thử:
 * xoay nhanh thì quá tay qua lại quanh ngưỡng hẹp, kẹt ở bước máy thẳng).
 */
function enterOf(id: CriterionId): number {
  return id === 'level' ? 1 : GUIDE.enterBand;
}

/** Thứ tự tiêu chí trong một lượt đo (`measure` luôn đo theo thứ tự này). */
const ORDER: CriterionId[] = [
  'level',
  'thirdsColumn',
  'thirdsEye',
  'noJointCut',
  'centerAxis',
  'centerEye',
  'fillSize',
  'fillHead',
  'groupInFrame',
  'groupCenter',
  'person',
];

/**
 * Tiêu chí lượt trước có mà lượt này không đo được (mắt lúc thấy lúc không: mặt nghiêng, người
 * đứng xa): đã đạt thì giữ là đạt; đang làm thì giữ kết quả cũ, chưa đạt (phiếu Phase 5b lần 5,
 * mục 13.1.4: bước mắt biến mất nên app báo Đạt khi chưa kịp làm). Chưa tới lượt thì bỏ như trước.
 */
function fillMissing(s: GuideState, checks: Check[]): Check[] {
  const have = new Set(checks.map((c) => c.id));
  const extra: Check[] = [];
  for (const id of s.steps) {
    if (have.has(id)) continue;
    if (s.passed.includes(id)) {
      extra.push({ id, ok: true, error: 0, band: 0, action: null, target: null, at: null });
    } else if (s.current?.id === id) {
      extra.push({ ...s.current, ok: false });
    }
  }
  if (!extra.length) return checks;
  return [...checks, ...extra].sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
}

/** Một lượt: cập nhật trạng thái theo kết quả đo lúc `now` (ms). */
export function step(
  s: GuideState,
  m: Measure,
  now: number,
): { state: GuideState; event: GuideEvent } {
  if (s.status !== 'running') return { state: s, event: null };

  let checks: Check[];
  let lost = 0;
  if (m.kind === 'checks') checks = fillMissing(s, m.checks);
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
  const good = (c: Check) =>
    was.has(c.id) ? c.error <= c.band * GUIDE.holdBand : c.ok && c.error <= c.band * enterOf(c.id);
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
};

/** Đưa người / nhóm sang ngang: xoay máy hay người chụp bước ngang đều được. */
const SIDEWAYS: CriterionId[] = ['thirdsColumn', 'centerAxis', 'groupCenter'];
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
export function flipX(f: PhotoFeatures): PhotoFeatures {
  const fx = (x: number) => 1 - x;
  return {
    ...f,
    people: f.people.map((p) => ({
      ...p,
      box: [fx(p.box[2]), p.box[1], fx(p.box[0]), p.box[3]],
      ...(p.cx == null ? {} : { cx: fx(p.cx) }),
    })),
    eye: f.eye ? { ...f.eye, x: fx(f.eye.x) } : null,
    joints: f.joints ? f.joints.map((j) => ({ ...j, x: fx(j.x) })) : null,
    facing: f.facing === 'left' ? 'right' : f.facing === 'right' ? 'left' : null,
    heads: f.heads.map((h) => ({ ...h, x: fx(h.x) })),
  };
}
