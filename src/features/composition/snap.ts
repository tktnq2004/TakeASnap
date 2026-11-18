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

/** Đường dính theo kỹ thuật, tính từ tâm khung (px). */
export function snapLines(t: TechniqueId, frame: { width: number; height: number }) {
  const w = frame.width;
  const h = frame.height;
  switch (t) {
    case 'thirds':
      return { v: [-w / 6, w / 6], h: [-h / 6, h / 6] };
    case 'lead':
      return { v: [-w / 6, w / 6], h: [-h / 6] };
    case 'center':
      return { v: [0], h: [-h / 6] };
    default:
      return { v: [], h: [] };
  }
}

/**
 * Dời placement để điểm neo dính vào đường gần nhất trong khoảng `radius` px (mỗi trục riêng).
 * Trả về null khi không dính đường nào.
 */
export function snapPlacement(
  p: Placement,
  anchor: Pt,
  lines: { v: number[]; h: number[] },
  radius: number,
): Placement | null {
  const near = (v: number, list: number[]) => {
    let best: number | null = null;
    for (const l of list) {
      if (Math.abs(l - v) <= radius && (best == null || Math.abs(l - v) < Math.abs(best - v))) {
        best = l;
      }
    }
    return best;
  };
  const sx = near(anchor.x, lines.v);
  const sy = near(anchor.y, lines.h);
  if (sx == null && sy == null) return null;
  return {
    ...p,
    x: p.x + (sx == null ? 0 : sx - anchor.x),
    y: p.y + (sy == null ? 0 : sy - anchor.y),
  };
}
