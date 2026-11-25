/**
 * Pose dính đường bố cục khi thả tay (business-flow §6.7). Hàm thuần.
 *
 * Điểm neo của pose là giữa hai mắt (khớp MediaPipe 2 và 5) của người đầu tiên, không có thì
 * giữa mép trên khung người. Pose vẽ kiểu "contain" vào khung rồi xoay + phóng quanh tâm, dời
 * theo (x, y) tính từ tâm khung.
 */
import type { Placement } from '@/gestures/useTransformGesture';

import type { Pt } from './guides';
import type { TechniqueId } from './techniques';

const EYE_L = 2;
const EYE_R = 5;
const MIN_VIS = 0.5;

/** Điểm neo chuẩn hóa 0..1 trong ảnh pose, hoặc null. `body` = 33 khớp phẳng [x, y, vis, …]. */
export function poseAnchor(
  body: number[] | null | undefined,
  contours: { points: Pt[]; isHole?: boolean }[] | null | undefined,
): Pt | null {
  if (body && body.length >= (EYE_R + 1) * 3) {
    const l = EYE_L * 3;
    const r = EYE_R * 3;
    if (body[l + 2]! >= MIN_VIS && body[r + 2]! >= MIN_VIS) {
      return { x: (body[l]! + body[r]!) / 2, y: (body[l + 1]! + body[r + 1]!) / 2 };
    }
  }
  if (!contours || contours.length === 0) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  for (const c of contours) {
    if (c.isHole) continue;
    for (const { x, y } of c.points) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
    }
  }
  if (!Number.isFinite(minX)) return null;
  // Mắt nằm khoảng 1/10 chiều cao người dưới đỉnh đầu; không biết chiều cao thì lấy đỉnh.
  return { x: (minX + maxX) / 2, y: minY };
}

/** Điểm neo đang ở đâu trong khung, tính từ tâm khung (px). */
export function anchorOnFrame(
  a: Pt,
  box: { width: number; height: number },
  p: Placement,
  mirrored: boolean,
): Pt {
  const ax = (mirrored ? 1 - a.x : a.x) - 0.5;
  const lx = ax * box.width * p.scale;
  const ly = (a.y - 0.5) * box.height * p.scale;
  const c = Math.cos(p.rotation);
  const s = Math.sin(p.rotation);
  return { x: p.x + lx * c - ly * s, y: p.y + lx * s + ly * c };
}

export type SnapTargets = {
  /** Điểm dính (cả hai trục cùng lúc): giao điểm 1/3, điểm hội tụ. */
  points: Pt[];
  /** Đường dọc dính riêng trục x (trục giữa). */
  v: number[];
};

/**
 * Chỗ dính theo kỹ thuật, tính từ tâm khung (px). 1/3 và đường dẫn chỉ dính vào GIAO ĐIỂM
 * (phiếu Phase 5 lần 3: dính từng trục riêng làm mặt bị kéo vào cột dọc dù còn xa vòng đích).
 * Đặt ở giữa dính trục dọc (đúng nghĩa kỹ thuật) và điểm đích trên trục.
 */
export function snapTargets(t: TechniqueId, frame: { width: number; height: number }): SnapTargets {
  const w = frame.width;
  const h = frame.height;
  switch (t) {
    // 1/3: chỉ hai giao điểm trên, khớp chấm đích và nhận xét (phiếu phase5a 1.5).
    case 'thirds':
      return { points: [-w / 6, w / 6].map((x) => ({ x, y: -h / 6 })), v: [] };
    case 'center':
      return { points: [{ x: 0, y: -h / 6 }], v: [0] };
    default:
      return { points: [], v: [] };
  }
}

/**
 * Dời placement để điểm neo dính vào chỗ gần nhất: trước hết điểm trong bán kính `pointRadius`
 * (dời cả hai trục), không có thì đường dọc trong `lineRadius` (chỉ dời x). Null khi không dính.
 */
export function snapPlacement(
  p: Placement,
  anchor: Pt,
  targets: SnapTargets,
  pointRadius: number,
  lineRadius: number,
): Placement | null {
  let best: Pt | null = null;
  let bestD = pointRadius;
  for (const q of targets.points) {
    const d = Math.hypot(q.x - anchor.x, q.y - anchor.y);
    if (d <= bestD) {
      best = q;
      bestD = d;
    }
  }
  if (best) return { ...p, x: p.x + best.x - anchor.x, y: p.y + best.y - anchor.y };

  let line: number | null = null;
  for (const l of targets.v) {
    const d = Math.abs(l - anchor.x);
    if (d <= lineRadius && (line == null || d < Math.abs(line - anchor.x))) line = l;
  }
  if (line == null) return null;
  return { ...p, x: p.x + line - anchor.x };
}
