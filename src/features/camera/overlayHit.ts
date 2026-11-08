/**
 * Chạm có trúng overlay không (business-flow §4.2: chạm vào overlay để vào chế độ chỉnh, chạm ra
 * vùng trống để thoát). Hàm thuần, chạy được trên UI thread.
 *
 * Overlay là hình chữ nhật w × h đặt ở tâm vùng nhận, rồi dịch (tx, ty), xoay `rotation` rad và
 * phóng `scale` quanh tâm của chính nó (đúng thứ tự transform của useTransformGesture).
 * `px`, `py` là tọa độ chạm tính từ TÂM vùng nhận. `slop`: nới thêm theo pt màn hình.
 */
export function hitOverlay(
  px: number,
  py: number,
  t: { x: number; y: number; scale: number; rotation: number },
  w: number,
  h: number,
  slop = 0,
): boolean {
  'worklet';
  const dx = px - t.x;
  const dy = py - t.y;
  const c = Math.cos(-t.rotation);
  const s = Math.sin(-t.rotation);
  const lx = (dx * c - dy * s) / t.scale;
  const ly = (dx * s + dy * c) / t.scale;
  const m = slop / t.scale;
  return Math.abs(lx) <= w / 2 + m && Math.abs(ly) <= h / 2 + m;
}

/** Kích thước ảnh pose khi đặt vừa (contain) trong khung w × h. */
export function containSize(imageW: number, imageH: number, w: number, h: number) {
  'worklet';
  const k = Math.min(w / imageW, h / imageH);
  return { width: imageW * k, height: imageH * k };
}
