/**
 * Thước cân bằng (business-flow §4.3). Hàm thuần, chạy được trên UI thread.
 *
 * Đầu vào là vector trọng lực của `useAnimatedSensor(SensorType.GRAVITY)` (Reanimated), đã xoay
 * theo hướng giao diện. Hai nền tảng ngược dấu nhau: iOS (CoreMotion) cho vector hướng XUỐNG,
 * máy dựng thẳng thì y ≈ −g; Android cho vector hướng LÊN, y ≈ +g. Đổi về quy ước Android trước.
 */

/**
 * Góc nghiêng của máy quanh trục vuông góc với màn hình, radian. Dương khi đỉnh máy nghiêng sang
 * phải (theo chiều kim đồng hồ). Máy dựng thẳng đứng → 0.
 */
export function deviceRoll(x: number, y: number, ios: boolean): number {
  'worklet';
  const ux = ios ? -x : x;
  const uy = ios ? -y : y;
  return Math.atan2(-ux, uy);
}

/**
 * Máy gần như nằm ngửa (trọng lực gần trùng trục z): góc nghiêng không còn ý nghĩa, ẩn thước.
 * `ratio` = độ dài phần trọng lực trong mặt phẳng màn hình / g.
 */
export function levelUsable(x: number, y: number, z: number, ratio = 0.35): boolean {
  'worklet';
  const g = Math.sqrt(x * x + y * y + z * z);
  if (g === 0) return false;
  return Math.sqrt(x * x + y * y) / g >= ratio;
}
