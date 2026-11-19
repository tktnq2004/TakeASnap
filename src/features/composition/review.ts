/**
 * Nhận xét sau khi chụp (business-flow §6.5, design.md §6.15 bản A): từ đặc trưng ảnh và kỹ
 * thuật lúc chụp ra 1–3 dòng đạt / chưa đạt, và khung cắt gợi ý khi cắt lại sẽ đạt. Hàm thuần;
 * chữ của từng dòng ở `t.review.notes` (khóa `NoteId`).
 *
 * App không chấm ảnh "đẹp", chỉ nói ảnh có theo kỹ thuật đã chọn không (BR-04).
 */
import { type Joint, J, type PhotoFeatures, visible } from './features';
import type { Pt } from './guides';
import type { TechniqueId } from './techniques';

export type NoteId =
  | 'eyeOnThird'
  | 'eyeOffThird'
  | 'onVertical'
  | 'inMiddle'
  | 'offVertical'
  | 'centered'
  | 'offCenter'
  | 'fillOk'
  | 'fillSmall'
  | 'headsStaggered'
  | 'headsLevel'
  | 'feetIn'
  | 'feetCut'
  | 'eyesHigh'
  | 'faceLow'
  | 'headTouch'
  | 'headroomBig'
  | 'edgeLeft'
  | 'edgeRight'
  | 'cutKnee'
  | 'cutAnkle'
  | 'cutElbow'
  | 'cutWrist'
  | 'noLookRoom';

export type Note = { id: NoteId; ok: boolean };

/** Khung cắt chuẩn hóa 0..1 theo ảnh, cùng tỉ lệ với ảnh. */
export type Crop = { x: number; y: number; w: number; h: number };

export type Review = { notes: Note[]; crop: Crop | null };

/** Ngưỡng (theo phần của cạnh ảnh). */
export const RULE = {
  /** Mắt cách đường 1/3 trên trong khoảng này là đạt. */
  eyeBand: 0.07,
  /**
   * Người (mắt hoặc tâm) cách đường dọc 1/3 trong khoảng này là đạt. 0,09: khớp ảnh "bố cục 1/3"
   * của nhiếp ảnh gia hơn 0,08 mà khung cắt thử vẫn đúng (scripts/eval-review.mts).
   */
  verticalBand: 0.09,
  /** Coi là "đứng giữa khung". */
  middleBand: 0.1,
  /**
   * Đặt ở giữa: trung bình mắt và tâm khung người cách trục giữa trong khoảng này. Chỉ xét mắt thì
   * hụt ảnh mặt nghiêng mà thân vẫn ở giữa (ảnh "bố cục giữa" của nhiếp ảnh gia).
   */
  centerBand: 0.07,
  /** Lấp đầy khung: người cao từ chừng này phần khung, hoặc chiếm từ `fillArea` diện tích. */
  fillHeight: 0.7,
  fillArea: 0.3,
  /**
   * Đỉnh các đầu chênh dưới chừng này nhân chiều cao người thấp nhất trong ảnh là thẳng hàng
   * (đầu cao khoảng 1/7 người: chênh dưới chừng một nửa chiều cao đầu).
   */
  headsLevel: 0.07,
  headTouch: 0.015,
  /** Thừa khoảng trên đầu: mắt thấp hơn chừng này (không thấy mắt: đỉnh đầu thấp hơn `headroomTop`). */
  headroomEye: 0.45,
  headroomTop: 0.3,
  edge: 0.012,
  /** Mép trái / phải cách khớp trong khoảng này là cắt ngang khớp. */
  jointCut: 0.035,
  /**
   * Mép dưới cắt ngang gối / cổ chân khi khớp (model đoán) nằm trong khoảng [từ, tới] theo chiều
   * cao ảnh. Lệch vào trong vì khớp bị cắt thì model kéo khớp vào trong ảnh: đo bằng
   * `scripts/eval-review.mts` (khung cắt đúng ngang gối → gối đoán ở 0,87–0,95; cắt giữa đùi → gối
   * đoán ở 0,95–1,05). Gối: đúng ~76%, cổ chân: ~89%.
   */
  kneeCut: [0.88, 1.0],
  ankleCut: [0.92, 1.04],
  /** Khớp mờ hơn mức này (model không chắc) thì không xét cắt khớp. */
  cutVis: 0.3,
  maxNotes: 3,
} as const;

const THIRDS = [1 / 3, 2 / 3];
const near = (v: number, list: number[], band: number) => list.some((l) => Math.abs(v - l) <= band);

/** Khớp nằm sát mép dưới (trong khoảng `bottom`) hoặc sát mép trái / phải: mép đó cắt ngang khớp. */
function cutAt(j: Joint | undefined, bottom: readonly [number, number]): boolean {
  if (!j || j.v < RULE.cutVis) return false;
  const b = RULE.jointCut;
  return (j.y >= bottom[0] && j.y <= bottom[1]) || Math.abs(j.x) <= b || Math.abs(j.x - 1) <= b;
}

/** Khuỷu, cổ tay: mép dưới xét như hai bên (chưa đo riêng). */
const EDGE_BOTTOM = [1 - RULE.jointCut, 1 + RULE.jointCut] as const;

function jointNotes(joints: Joint[] | null): Note[] {
  if (!joints) return [];
  const pairs: [NoteId, number, number, readonly [number, number]][] = [
    ['cutKnee', J.kneeL, J.kneeR, RULE.kneeCut],
    ['cutAnkle', J.ankleL, J.ankleR, RULE.ankleCut],
    ['cutElbow', J.elbowL, J.elbowR, EDGE_BOTTOM],
    ['cutWrist', J.wristL, J.wristR, EDGE_BOTTOM],
  ];
  for (const [id, a, b, bottom] of pairs) {
    if (cutAt(joints[a], bottom) || cutAt(joints[b], bottom)) return [{ id, ok: false }];
  }
  return [];
}

/** Dòng chung cho mọi kỹ thuật: khoảng trên đầu, sát mép, cắt khớp, khoảng phía nhìn. */
function generalNotes(f: PhotoFeatures): Note[] {
  const p = f.people[f.main];
  if (!p) return [];
  const [x0, y0, x1, y1] = p.box;
  const out: Note[] = [];
  const h = y1 - y0;
  if (y0 <= RULE.headTouch) out.push({ id: 'headTouch', ok: false });
  else if (h >= 0.45 && (f.eye ? f.eye.y > RULE.headroomEye : y0 > RULE.headroomTop)) {
    out.push({ id: 'headroomBig', ok: false });
  }
  if (x1 - x0 < 0.6) {
    if (x0 <= RULE.edge) out.push({ id: 'edgeLeft', ok: false });
    else if (x1 >= 1 - RULE.edge) out.push({ id: 'edgeRight', ok: false });
  }
  out.push(...jointNotes(f.joints));
  const cx = (x0 + x1) / 2;
  if ((f.facing === 'right' && cx > 0.62) || (f.facing === 'left' && cx < 0.38)) {
    out.push({ id: 'noLookRoom', ok: false });
  }
  return out;
}

function techniqueNotes(t: TechniqueId, f: PhotoFeatures): Note[] {
  const p = f.people[f.main];
  if (!p) return [];
  const cx = f.eye?.x ?? (p.box[0] + p.box[2]) / 2;
  switch (t) {
    case 'thirds': {
      const out: Note[] = [];
      if (f.eye) {
        out.push({
          id: Math.abs(f.eye.y - 1 / 3) <= RULE.eyeBand ? 'eyeOnThird' : 'eyeOffThird',
          ok: Math.abs(f.eye.y - 1 / 3) <= RULE.eyeBand,
        });
      }
      if (near(cx, THIRDS, RULE.verticalBand)) out.push({ id: 'onVertical', ok: true });
      else if (Math.abs(cx - 0.5) <= RULE.middleBand) out.push({ id: 'inMiddle', ok: false });
      else out.push({ id: 'offVertical', ok: false });
      return out;
    }
    case 'center': {
      const mid = f.eye ? (f.eye.x + (p.box[0] + p.box[2]) / 2) / 2 : cx;
      const ok = Math.abs(mid - 0.5) <= RULE.centerBand;
      return [{ id: ok ? 'centered' : 'offCenter', ok }];
    }
    case 'fill': {
      const ok = p.box[3] - p.box[1] >= RULE.fillHeight || p.area >= RULE.fillArea;
      return [{ id: ok ? 'fillOk' : 'fillSmall', ok }];
    }
    case 'lead':
      return near(cx, THIRDS, RULE.verticalBand) ? [{ id: 'onVertical', ok: true }] : [];
    case 'group': {
      if (f.people.length < 2) return [];
      const tops = f.people.map((q) => q.box[1]);
      const minH = Math.min(...f.people.map((q) => q.box[3] - q.box[1]));
      const spread = Math.max(...tops) - Math.min(...tops);
      const level = spread <= RULE.headsLevel * minH;
      return [{ id: level ? 'headsLevel' : 'headsStaggered', ok: !level }];
    }
    case 'low': {
      const j = f.joints;
      if (!j) return [];
      // Cùng mốc với "cắt ngang cổ chân": cổ chân thấp hơn mốc đó là bàn chân đã bị cắt.
      const inFrame = (q: Joint | undefined) => visible(q) && q!.y < RULE.ankleCut[0];
      const ok = inFrame(j[J.ankleL]) && inFrame(j[J.ankleR]);
      return [{ id: ok ? 'feetIn' : 'feetCut', ok }];
    }
    case 'selfie':
      if (!f.eye) return [];
      return [{ id: f.eye.y <= 0.5 ? 'eyesHigh' : 'faceLow', ok: f.eye.y <= 0.5 }];
    default:
      return [];
  }
}

/**
 * Khung cắt cùng tỉ lệ ảnh, nhỏ nhất 70% cạnh, đặt mắt (1/3) hoặc người (giữa) vào chỗ của kỹ
 * thuật. Null khi không cắt được cho đạt (người đã đúng chỗ, hoặc mắt quá sát mép ảnh).
 */
export function suggestCrop(t: TechniqueId, f: PhotoFeatures): Crop | null {
  const p = f.people[f.main];
  if (!p) return null;
  if (t === 'fill') return fillCrop(p.box);
  let target: Pt;
  let anchor: Pt;
  if (t === 'thirds' && f.eye) {
    anchor = f.eye;
    // Chừa chỗ phía người nhìn; nhìn thẳng thì giao điểm gần nhất.
    const tx =
      f.facing === 'right' ? 1 / 3 : f.facing === 'left' ? 2 / 3 : anchor.x < 0.5 ? 1 / 3 : 2 / 3;
    target = { x: tx, y: 1 / 3 };
  } else if (t === 'center') {
    anchor = { x: (p.box[0] + p.box[2]) / 2, y: f.eye?.y ?? p.box[1] };
    target = { x: 0.5, y: f.eye ? 1 / 3 : anchor.y };
  } else {
    return null;
  }
  for (const k of [0.85, 0.75, 0.7]) {
    const x = clamp(anchor.x - target.x * k, 0, 1 - k);
    const y = clamp(anchor.y - target.y * k, 0, 1 - k);
    const ax = (anchor.x - x) / k;
    const ay = (anchor.y - y) / k;
    const ok =
      Math.abs(ax - target.x) <= RULE.verticalBand / 2 &&
      (t === 'center' && !f.eye ? true : Math.abs(ay - target.y) <= RULE.eyeBand / 2);
    // Không cắt mất đầu người.
    if (ok && y <= p.box[1]) return { x, y, w: k, h: k };
  }
  return null;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Lấp đầy khung: khung cắt cùng tỉ lệ ảnh ôm sát người (chừa 8% mỗi bên, chừa trên đầu), không
 * nhỏ hơn 45% cạnh ảnh để không vỡ ảnh. Null khi cắt không bớt được bao nhiêu.
 */
function fillCrop([x0, y0, x1, y1]: [number, number, number, number]): Crop | null {
  const k = clamp(Math.max(x1 - x0, y1 - y0) * 1.16, 0.45, 1);
  if (k >= 0.9) return null;
  const x = clamp((x0 + x1) / 2 - k / 2, 0, 1 - k);
  const y = clamp(y0 - 0.06 * k, 0, 1 - k);
  return { x, y, w: k, h: k };
}

/**
 * Nhận xét: dòng chưa đạt trước, tối đa `RULE.maxNotes` dòng; kỹ thuật đang dùng trước dòng
 * chung. Có khung cắt gợi ý khi kỹ thuật chưa đạt và cắt lại được.
 */
export function reviewPhoto(t: TechniqueId, f: PhotoFeatures): Review {
  const uniq = allNotes(t, f);
  const notes = [...uniq.filter((n) => !n.ok), ...uniq.filter((n) => n.ok)].slice(0, RULE.maxNotes);
  const techniqueFails = techniqueNotes(t, f).some((n) => !n.ok);
  return { notes, crop: techniqueFails ? suggestCrop(t, f) : null };
}

/**
 * Mọi dòng nhận xét (chưa cắt còn `maxNotes`, chưa xếp): kỹ thuật trước, dòng chung sau, không
 * trùng. Script đo độ đúng (`scripts/eval-review.mts`) chấm trên danh sách đầy đủ này.
 */
export function allNotes(t: TechniqueId, f: PhotoFeatures): Note[] {
  if (t === 'off' || f.main < 0) return [];
  const own = techniqueNotes(t, f);
  // "Mắt chưa ở đường 1/3" đã nói cùng ý với "thừa khoảng trên đầu".
  const general = generalNotes(f).filter(
    (n) => !(n.id === 'headroomBig' && own.some((o) => o.id === 'eyeOffThird')),
  );
  const seen = new Set<NoteId>();
  return [...own, ...general].filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)));
}
