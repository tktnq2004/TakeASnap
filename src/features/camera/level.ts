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

/** Cách cầm máy, theo bước 90°: 0 dọc, 90 đỉnh máy quay sang phải, −90 sang trái, 180 lộn ngược. */
export type Hold = 0 | 90 | -90 | 180;

/**
 * Lệch khỏi cách cầm hiện tại quá chừng này (độ) thì đổi sang cách cầm gần nhất. 60° có độ trễ
 * 30° hai phía: từ dọc nghiêng tới 60° mới tính là cầm ngang, từ ngang về dưới 30° mới là dọc.
 */
export const HOLD_SWITCH_DEG = 60;

/** Cách cầm máy sau khi đọc góc nghiêng `rollDeg` (−180..180), có độ trễ theo cách cầm `prev`. */
export function holdOf(rollDeg: number, prev: Hold): Hold {
  'worklet';
  let d = rollDeg - prev;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  if (Math.abs(d) <= HOLD_SWITCH_DEG) return prev;
  const q = Math.round(rollDeg / 90) * 90;
  return (q === -180 ? 180 : q) as Hold;
}

/**
 * Góc nghiêng so với cách cầm `turnDeg` (0 dọc, ±90 ngang), radian trong (−π, π]: cầm ngang thì
 * "thẳng" là đỉnh máy nằm ngang (phiếu Phase 5b lần 18).
 */
export function rollFrom(rollRad: number, turnDeg: number): number {
  'worklet';
  let d = rollRad - (turnDeg * Math.PI) / 180;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d <= -Math.PI) d += 2 * Math.PI;
  return d;
}
