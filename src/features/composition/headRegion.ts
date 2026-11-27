/**
 * Vùng đầu người chính để dò lưới mặt lại trên ảnh gốc cỡ thật (phiếu Phase 5b lần 8, mục 16.2.2:
 * người đứng xa, đầu chỉ vài chục điểm ảnh trên ảnh chụp lặng 512, bộ dò mặt không thấy nên không
 * biết hướng nhìn, cột 1/3 rơi về cột mặc định). Không import gì ngoài kiểu để chạy được trong
 * script đo trên máy tính.
 */
import type { PhotoFeatures } from 'composition-critic';

/** Chỉ số khớp MediaPipe Pose. */
const NOSE = 0;
const EYE_L = 2;
const EYE_R = 5;
const EAR_L = 7;
const EAR_R = 8;
const SHOULDER_L = 11;
const SHOULDER_R = 12;
const VIS = 0.5;
/** Đỉnh vùng người cách mép trên dưới chừng này: coi như đầu ra ngoài khung. */
const EDGE = 0.02;

/**
 * Hình vuông quanh đầu: tâm (chuẩn hóa theo khung) và cạnh (phần chiều cao khung). `aspect` = rộng /
 * cao của khung. Khung xương không thấy đầu thì lấy đỉnh vùng người; null khi đỉnh vùng người chạm
 * mép trên (đầu ra ngoài khung).
 */
export function headRegion(
  f: PhotoFeatures,
  aspect: number,
): { x: number; y: number; side: number } | null {
  const j = f.joints;
  if (!j) return fromBox(f, aspect);
  const seen = (i: number) => {
    const q = j[i];
    return q && q.v >= VIS ? q : null;
  };
  // Khoảng cách theo đơn vị chiều cao khung.
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot((a.x - b.x) * aspect, a.y - b.y);
  const pts = [NOSE, EYE_L, EYE_R, EAR_L, EAR_R].map(seen).filter((q) => q != null);
  if (!pts.length) return fromBox(f, aspect);
  const cx = pts.reduce((s, q) => s + q.x, 0) / pts.length;
  const cy = pts.reduce((s, q) => s + q.y, 0) / pts.length;
  const el = j[EAR_L];
  const er = j[EAR_R];
  const sl = seen(SHOULDER_L);
  const sr = seen(SHOULDER_R);
  const ear = el && er ? dist(el, er) : 0;
  const sh = sl && sr ? dist(sl, sr) : 0;
  const side = Math.max(ear * 3, sh * 1.1, 0.05);
  return { x: cx, y: cy, side };
}

/** Đỉnh vùng người: cạnh theo cỡ người (đầu chừng 1/4 chiều cao nửa người), tâm theo trọng tâm. */
function fromBox(f: PhotoFeatures, aspect: number): { x: number; y: number; side: number } | null {
  const p = f.people[f.main];
  if (!p) return null;
  const [x0, y0, x1, y1] = p.box;
  if (y0 <= EDGE) return null;
  const side = Math.min(Math.max(Math.min((x1 - x0) * aspect * 0.6, (y1 - y0) * 0.3), 0.05), 0.3);
  return { x: p.cx ?? (x0 + x1) / 2, y: y0 + side * 0.45, side };
}

/** Độ quay đầu của mặt gần tâm vùng cắt nhất (`faceEyes` theo vùng cắt), null khi không thấy mặt. */
export function yawNearCenter(faces: number[][]): number | null {
  let best: number[] | null = null;
  for (const e of faces) {
    if (e.length < 3) continue;
    if (
      !best ||
      Math.hypot(e[0]! - 0.5, e[1]! - 0.5) < Math.hypot(best[0]! - 0.5, best[1]! - 0.5)
    ) {
      best = e;
    }
  }
  return best ? best[2]! : null;
}
