/**
 * Hướng dẫn liên tục (Phase 5b, business-flow §6.10): từ kết quả phân tích một ảnh chụp lặng ra
 * tiêu chí đang làm và thao tác máy, và luật dừng (3 lần nhắc không tiến bộ + 10 s). Hàm thuần,
 * test được trong Jest; Camera gọi `measure` mỗi lượt (~1 s) rồi `step`.
 *
 * Toạ độ theo khung ngắm người dùng đang thấy (0..1, gốc trên trái). Camera trước: khung ngắm soi
 * gương; đưa / xoay máy qua trái thì người dịch sang phải trên khung, cùng chiều camera sau (phiếu
 * Phase 5b lần 4, mục 12.1.5).
 */
import { centerOf, type Figure, J, type PhotoFeatures, RULE, visible } from 'composition-critic';

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
  | 'noJointCut'
  | 'centerAxis'
  | 'fillSize'
  | 'fillHead'
  | 'groupInFrame'
  | 'groupHead'
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
  /** Số lượt đúng liền cần để tính đạt, khác `GUIDE.confirmTurns`. */
  confirm?: number;
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

/** Cột 1/3 cho người chính: chừa chỗ phía người nhìn, không biết hướng nhìn thì cột phải. */
export function thirdsColumn(f: PhotoFeatures): number {
  return f.facing === 'right' ? 1 / 3 : 2 / 3;
}

/**
 * Cột 1/3 trong một lần hướng dẫn: **bỏ phiếu** theo hướng nhìn qua các lượt (phiếu Phase 5b lần 9,
 * mục 17.8–17.10: một lượt khung xương / lưới mặt đoán sai là chốt cột sai; người nhìn gần thẳng thì
 * hướng lắc qua lại, cột đổi liên tục). Mỗi lượt thấy người nhìn phải cộng phiếu (nhìn trái trừ):
 * quay đầu rõ (lưới mặt từ `GUIDE.leanFlip`, hoặc khung xương) 2 phiếu, quay nhẹ 1 phiếu; tổng giữ
 * trong ±`GUIDE.leanVotes`. Chưa có phiếu nào: **cột phải** (phiếu lần 12, mục 20.5: không biết
 * người nhìn về đâu thì để chủ thể bên phải, mắt người xem quen nhìn về đó; trước đây cột gần người
 * nhất). Tổng âm: cột phải. Sang cột trái (chừa chỗ bên phải): lượt đầu thấy nhìn phải là sang
 * ngay (chưa hiện câu nào nên không thành đổi chiều; mô phỏng: bắt đợi thêm lượt thì người quay đầu
 * nhẹ bị bảo dời về cột phải rồi lại dời ngược), giữa chừng thì tổng phải tới `GUIDE.leftVotes` (mô
 * phỏng ảnh lần 11: một lượt khung xương đoán nhầm "nhìn phải" giữa chừng là sang cột trái rồi kẹt
 * ở đó, lượt đúng sau chỉ kéo phiếu về 0). Còn lại giữ cột đang có.
 */
export type ColumnLock = { col: number; score: number };

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
 * coi là nhìn thẳng, app chọn cột mặc định dù người nhìn về chính cột đó). Không có mặt: theo
 * khung xương (`f.facing`).
 */
export function leanOf(f: PhotoFeatures, yaw: number | null): 'left' | 'right' | null {
  if (yaw == null) return f.facing;
  if (Math.abs(yaw) < GUIDE.leanTurn) return null;
  return yaw > 0 ? 'right' : 'left';
}

/** `yaw`: độ quay đầu của người chính (`headYaw`, đã lật theo khung ngắm), null khi không có mặt. */
export function lockColumn(
  lock: ColumnLock | null,
  f: PhotoFeatures,
  yaw: number | null = null,
): ColumnLock {
  const prev = lock ?? { col: 2 / 3, score: 0 };
  const lean = leanOf(f, yaw);
  if (!lean) return prev;
  const w = yaw == null || Math.abs(yaw) >= GUIDE.leanFlip ? 2 : 1;
  const max = GUIDE.leanVotes;
  const score = Math.max(-max, Math.min(max, prev.score + (lean === 'right' ? w : -w)));
  // Lượt đầu chưa hiện câu nào nên thấy nhìn phải là sang ngay; giữa chừng cần đủ phiếu.
  const need = lock ? GUIDE.leftVotes : 1;
  const col = score >= need ? 1 / 3 : score < 0 ? 2 / 3 : prev.col;
  return { col, score };
}

/**
 * Cột chưa theo hướng nhìn: chưa có phiếu, hoặc có phiếu nhìn phải nhưng chưa đủ rời cột phải mặc
 * định. Khi đó bước cột cần `GUIDE.gazeTurns` lượt đúng.
 */
export const columnUnsure = (l: ColumnLock) => l.score === 0 || (l.score > 0 && l.col === 2 / 3);

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
 * Phần trên của người phủ gần hết bề ngang khung (nằm, dang tay, cận quá): xoay máy thì trọng tâm
 * trượt theo khung, không bao giờ tới đường đích (mô phỏng phiếu lần 12: câu xoay mãi rồi tự dừng;
 * Ở giữa thì báo Đạt dù đầu đã ra ngoài khung). Lúc này phải lùi ra.
 */
function tooWide(f: PhotoFeatures): boolean {
  const w = f.people[f.main]!.upperW;
  return w != null && w >= GUIDE.wideUpper;
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

/** Cắt ngang khớp: mép dưới qua gối / cổ chân, mép trái phải qua khuỷu / cổ tay → lùi ra. */
/**
 * Đỉnh đầu ra ngoài mép trên bao nhiêu (phần khung), 0 khi không chạm. Đỉnh vùng người chạm mép
 * chưa chắc là đầu: tay giơ lên, mũ, vùng người lan ra nền cũng chạm, và app bảo ngửa máy mãi tới
 * lúc mắt xuống đáy khung (mô phỏng Lấp đầy). Vùng người không cho biết đầu ra ngoài bao xa, nên
 * ngửa máy mà độ lệch đứng yên, app tưởng không làm theo. Thấy mắt thì đoán đỉnh đầu từ mắt (trên
 * mắt `GUIDE.crownShoulder` bề ngang vai, không thấy vai thì `GUIDE.crownEyes` khoảng hai mắt):
 * chỉ đỉnh đầu đoán được chạm mép mới tính, và số này nhỏ dần khi ngửa máy.
 */
/**
 * Nhóm: đỉnh đầu từng người theo khung xương ra ngoài mép trên bao nhiêu. Thấy đầu: đỉnh trên mắt /
 * tai `crownShoulder` × bề ngang vai; không thấy đầu (đầu đã ra ngoài khung, hoặc quay lưng): đỉnh
 * trên vai `crownNoHead` × bề ngang vai, vai còn thấp thì coi như đầu vẫn trong khung.
 * Không xét người có vùng người phủ lên mà đỉnh vùng còn trong khung.
 */
function groupHeadOut(f: PhotoFeatures, figs: readonly Figure[]): number {
  let out = 0;
  for (const g of figs) {
    // Vùng người phủ người này mà đỉnh còn trong khung: đầu chưa ra ngoài (ước theo vai hay cao
    // quá khi chụp cận, mô phỏng Nhóm 2026-11-28).
    const cx = (g.x0 + g.x1) / 2;
    const inside = f.people.some(
      (p) => p.box[0] <= cx && cx <= p.box[2] && p.box[1] >= RULE.headTouch && p.box[1] <= g.top,
    );
    if (inside) continue;
    const crown = g.top - (g.head ? GUIDE.crownShoulder : GUIDE.crownNoHead) * g.span;
    out = Math.max(out, RULE.headTouch - crown);
  }
  return out;
}

function headOut(f: PhotoFeatures, top: number): number {
  const touch = Math.max(0, RULE.headTouch - top);
  const j = f.joints;
  const e = f.eye;
  if (!touch || !j || !e) return touch;
  const span = (a: number, b: number) => {
    const p = j[a];
    const q = j[b];
    return visible(p) && visible(q) ? Math.hypot((p!.x - q!.x) * f.aspect, p!.y - q!.y) : 0;
  };
  const shoulders = span(J.shoulderL, J.shoulderR);
  const eyes = span(J.eyeL, J.eyeR);
  const up = shoulders ? GUIDE.crownShoulder * shoulders : eyes ? GUIDE.crownEyes * eyes : null;
  return up == null ? touch : Math.max(0, RULE.headTouch - (e.y - Math.max(up, GUIDE.crownMin)));
}

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
  colUnsure: boolean,
): Check[] {
  const p = f.people[f.main]!;
  const [, y0, , y1] = p.box;
  switch (m) {
    case 'thirds': {
      const c = col ?? thirdsColumn(f);
      // Chỉ tiêu chí cốt lõi (phiếu Phase 5b lần 7, mục 15.7): người trên cột, không cắt khớp. Mắt
      // ở đâu tuỳ cỡ cảnh (chụp cận mắt quanh đường trên; toàn thân, người ngồi thì thấp hơn).
      // Chỗ người: trọng tâm phần trên vùng người như Ở giữa (phiếu lần 9, mục 17.8: mắt / mũi của
      // khung xương lúc thấy lúc không, lúc bắt nhầm cảnh, câu đổi trái phải mỗi lượt).
      // Luôn một cách đo (đổi qua lại giữa mắt và vùng người là câu nhảy trái phải). Trọng tâm
      // phần trên vùng người có ở mọi ảnh của app, kể cả chụp cận (phần trên là đầu). Dữ liệu cũ
      // không có trọng tâm: người to hơn khung thì theo mắt / mũi, không thấy thì lùi ra.
      const p = f.people[f.main]!;
      const wide = p.box[0] <= EDGE && p.box[2] >= 1 - EDGE;
      const at = tooWide(f) ? null : p.cx == null && wide ? seenX(f) : centerX(f);
      const column = sideCheck('thirdsColumn', f, at, c, RULE.verticalBand);
      // Chưa lượt nào thấy hướng nhìn (cột đang là cột phải mặc định): cần thêm lượt đúng mới đạt, để
      // kịp thấy người nhìn về phía nào (phiếu lần 10, mục 18.1: đưa người vào cột trong 2 lượt
      // là Đạt, trong khi người nhìn về chính cột đó).
      if (colUnsure) column.confirm = GUIDE.gazeTurns;
      return [column, jointCut(f)];
    }
    case 'center': {
      // Máy thẳng (ở `measure`) và trục giữa chia đôi người: hai bên cân (mục 15.7).
      return [sideCheck('centerAxis', f, tooWide(f) ? null : centerX(f), 0.5, RULE.centerBand)];
    }
    case 'fill': {
      const short = Math.min(RULE.fillHeight - (y1 - y0), RULE.fillArea - p.area);
      return [
        check('fillSize', Math.max(0, short), 0, 'closer', { kind: 'frame' }),
        // Đỉnh đầu chạm mép trên: ngửa máy lên để người dịch xuống.
        check('fillHead', headOut(f, y0), 0, 'tiltUp', { kind: 'frame' }),
      ];
    }
    case 'group': {
      // Khung người hụt người nhỏ trong nhóm (gộp vào người gần nhất): thêm bề ngang khung xương.
      const figs = f.figures ?? [];
      const left = Math.min(...f.people.map((q) => q.box[0]), ...figs.map((g) => g.x0));
      const right = Math.max(...f.people.map((q) => q.box[2]), ...figs.map((g) => g.x1));
      const edge = Math.max(0, RULE.edge - left) + Math.max(0, right - (1 - RULE.edge));
      const mid = (left + right) / 2;
      return [
        check('groupInFrame', edge, 0, 'back', { kind: 'frame' }),
        // Đầu ai đó ra ngoài mép trên (đỉnh đầu đoán theo vai từng người, như Lấp đầy).
        check('groupHead', groupHeadOut(f, figs), 0, 'tiltUp', { kind: 'frame' }),
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
  /** Cột 1/3 chưa theo hướng nhìn (chưa lượt nào thấy người nhìn về đâu). */
  colUnsure = false,
): Measure {
  if (!f || f.main < 0 || !f.people[f.main]) return { kind: 'noPerson' };
  // Một người mà vùng người chạm mép trái / phải: có thể người kia bị mép cắt (vùng người hai
  // người đứng sát dính làm một, mặt và khung xương người bị cắt ở ngoài khung): bảo lùi ra trước
  // (phiếu Phase 5b lần 16, mục 24.2: 26/94 lần báo không thấy nhóm rồi dừng).
  if (
    plan.main === 'group' &&
    f.people.length < 2 &&
    f.heads.length < 2 &&
    (f.figures?.length ?? 0) < 2 &&
    !f.people.some((p) => p.box[0] <= RULE.edge || p.box[2] >= 1 - RULE.edge)
  )
    return { kind: 'noGroup' };

  const checks: Check[] = [];
  if (plan.main === 'center') {
    const r = Math.abs(rollDeg);
    checks.push(
      check('level', r, SENSOR.levelIn, rollDeg > 0 ? 'rotateCcw' : 'rotateCw', { kind: 'frame' }),
    );
  }
  checks.push(...mainChecks(plan.main, f, front, col, colUnsure));
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
  /**
   * Cột đã chốt theo hướng nhìn chỉ đổi khi quay đầu rõ chừng này (phiếu Phase 5b lần 8, mục 16.4:
   * người nhìn gần thẳng thì độ quay lắc quanh `leanTurn`, cột đổi trái phải liên tục khi máy đứng
   * im). Khung xương (không thấy mặt) đã có ngưỡng riêng cao hơn nên luôn tính.
   */
  leanFlip: 0.2,
  /** Tổng phiếu hướng nhìn giữ trong ± chừng này: quay đầu hẳn sang phía kia 2–3 lượt là đổi cột. */
  leanVotes: 3,
  /** Tổng phiếu nhìn phải cần để rời cột phải mặc định sang cột trái (`lockColumn`). */
  leftVotes: 3,
  /** Phần trên của người rộng từ chừng này bề ngang khung: bảo lùi ra (`tooWide`). */
  wideUpper: 0.9,
  /**
   * Lấp đầy: đỉnh đầu đoán ở trên mắt chừng này bề ngang vai (`headOut`); trung vị trên 923 ảnh
   * thấy cả đầu (đỉnh vùng người, có lẫn mũ, tay giơ nên lấy trung vị, không lấy cao hơn).
   */
  crownShoulder: 0.6,
  /** Như trên khi không thấy vai (chụp cận): chừng này khoảng cách hai mắt; trung vị 929 ảnh. */
  crownEyes: 2.6,
  /**
   * Đỉnh đầu ít nhất chừng này (phần khung) trên mắt: mặt nghiêng thì hai mắt gần nhau, đoán đỉnh
   * đầu thấp quá (mô phỏng: 13 lần Đạt khi mắt đã ở 0,15 khung trên cùng).
   */
  crownMin: 0.15,
  /** Nhóm, không thấy đầu: đỉnh đầu trên vai chừng này × bề ngang vai (`groupHeadOut`). */
  crownNoHead: 0.9,
  /** 1/3 chưa thấy hướng nhìn: bước cột cần chừng này lượt đúng liền (thay `confirmTurns`). */
  gazeTurns: 3,
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

/** Nửa bề rộng vùng đạt của tiêu chí chưa đạt (dải đích vẽ trên khung ngắm). */
export const bandOf = (c: Check) => c.band * enterOf(c.id);

/** Thứ tự tiêu chí trong một lượt đo (`measure` luôn đo theo thứ tự này). */
const ORDER: CriterionId[] = [
  'level',
  'thirdsColumn',
  'noJointCut',
  'centerAxis',
  'fillSize',
  'fillHead',
  'groupInFrame',
  'groupHead',
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

/**
 * Tạm dừng `ms` (máy cầm ngang) rồi làm tiếp: dời các mốc giờ đi chừng đó, như thời gian đứng
 * yên. Lúc tạm dừng không tính vào khoảng xét tiến bộ, không làm hết hạn.
 */
export function resumeGuide(s: GuideState, ms: number): GuideState {
  if (ms <= 0) return s;
  return {
    ...s,
    lastRemindAt: s.lastRemindAt + ms,
    deadline: s.deadline == null ? null : s.deadline + ms,
    passedAt: s.passedAt + ms,
  };
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
    // Nhóm: vẫn thấy người mà chỉ một (vd đã lùi ra theo câu "Lùi ra" lúc vùng người chạm mép,
    // mục 24.2): cảnh không áp được, dừng như lượt đầu.
    if (m.kind === 'noGroup') {
      return { state: { ...s, lost, status: 'notApplicable', missing }, event: 'notApplicable' };
    }
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
    good(c) && (was.has(c.id) || (okRun[c.id] ?? 0) >= (c.confirm ?? GUIDE.confirmTurns));

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

/** Kết quả theo tên đường đích (phiếu Phase 5b lần 3, mục 11.5: nói rõ cột trái / phải / trên / dưới). */
function goalOf(c: Check): string {
  const tg = c.target;
  if (c.id === 'centerAxis') return G.to.center;
  if (c.id === 'groupCenter') return G.to.group;
  if (tg?.kind === 'vline') return tg.x < 0.5 ? G.to.left : G.to.right;
  return G.goals[c.id];
}

/**
 * Viên hướng dẫn: **một dòng**, chỉ bảo người chụp (phiếu Phase 5b lần 3, mục 11.2.1, 11.2.8,
 * 11.5): gộp hai cách làm cùng chiều của người chụp, một mũi tên, rồi tên đường đích: "Đi/xoay máy
 * qua trái để người đứng cột phải" (camera sau: bước sang trái hay xoay máy sang trái thì người trên
 * khung đều dịch sang phải). Camera trước chỉ nói
 * xoay máy (bước ngang thì người cầm máy đi theo máy). Tiêu chí khác: một câu "hành động + kết quả".
 */
export function guideLines(c: Check, front = false): GuideLine[] {
  // Mất người: chỉ báo không tìm thấy (phiếu Phase 5b lần 8, mục 16.4).
  if (c.id === 'person') return [{ text: G.lost, dir: null }];
  if (!c.action) return [{ text: G.done[c.id], dir: null }];
  const dir = ACTION_DIR[c.action] ?? null;
  if (SIDEWAYS.includes(c.id) && (dir === 'left' || dir === 'right')) {
    return [{ text: `${front ? G.turn[dir] : G.move[dir]} ${goalOf(c)}`, dir }];
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
