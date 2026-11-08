/**
 * Zoom camera theo kiểu app camera thật: pinch gấp đôi khoảng cách hai ngón → hệ số zoom ×2
 * (1× → 2× → 4×). `expo-camera` lại nhận `zoom` 0..1 tuyến tính trên toàn dải zoom của máy, nên
 * phải quy đổi: prop = (hệ số − 1) / (hệ số tối đa − 1).
 *
 * Spike A: lần 1 cộng tuyến tính ×0.6 (quá nhanh); lần 2 cộng log ×0.12 và làm tròn 0.01
 * (chậm, giật vì một lần pinch chỉ đi ~8 nấc). Bản này nhân hệ số và làm tròn 0.001.
 *
 * `expo-camera` không cho đọc hệ số zoom tối đa thật của máy, nên `maxFactor` là giá trị giả định
 * trong tokens; chữ "×" hiển thị là ước lượng.
 */

export function nextZoomFactor(current: number, scaleChange: number, maxFactor: number): number {
  'worklet';
  return Math.min(maxFactor, Math.max(1, current * scaleChange));
}

export function zoomFactorToProp(factor: number, maxFactor: number, precision: number): number {
  'worklet';
  const raw = (factor - 1) / (maxFactor - 1);
  const clamped = Math.min(1, Math.max(0, raw));
  return Math.round(clamped / precision) * precision;
}
