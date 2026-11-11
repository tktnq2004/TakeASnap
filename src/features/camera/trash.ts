/**
 * Hiệu ứng "sắp xóa" của overlay (góp ý Phase 2): khi ngón tay vào vùng xóa, overlay mờ đi và
 * thu nhỏ về phía thùng rác; thả tay thì mờ hẳn rồi mới gỡ. Hàm thuần, chạy trên UI thread.
 *
 * Style này gắn lên khung bọc cỡ khung ngắm (tâm C = tâm khung). Bên trong, overlay đã dịch
 * `t` nên tâm overlay là C + t. Transform của RN áp quanh tâm khung bọc theo thứ tự liệt kê:
 * x' = C + a + s·(x − C). Muốn tâm overlay đi tới C + t + p·(g − t) thì a = t + p·(g − t) − s·t.
 */

/** Cỡ còn lại khi đã vào hẳn vùng xóa / khi đã mờ hẳn. */
export const TRASH_SCALE = 0.25;
const TRASH_OPACITY = 0.45;

/**
 * @param p 0..1, mức đã vào vùng xóa.
 * @param vanish 0..1, mức đã mờ hẳn sau khi thả tay trong vùng xóa.
 * @param t vị trí overlay (tính từ tâm khung).
 * @param goal tâm thùng rác (tính từ tâm khung).
 */
export function trashTransform(
  p: number,
  vanish: number,
  t: { x: number; y: number },
  goal: { x: number; y: number },
) {
  'worklet';
  const s = (1 - (1 - TRASH_SCALE) * p) * (1 - 0.5 * vanish);
  return {
    opacity: (1 - (1 - TRASH_OPACITY) * p) * (1 - vanish),
    transform: [
      { translateX: t.x + p * (goal.x - t.x) - s * t.x },
      { translateY: t.y + p * (goal.y - t.y) - s * t.y },
      { scale: s },
    ],
  };
}
