/**
 * Zoom camera. "Hệ số" ở đây là số hiển thị cho người dùng, tính theo ống chính (1× = ống chính,
 * 0,5× = ống góc rộng), giống app camera của máy. Pinch gấp đôi khoảng cách → hệ số ×2.
 *
 * `expo-camera` nhận `zoom` 0..1 và quy đổi khác nhau trên hai nền tảng (đọc mã gốc 58.0.x):
 * - iOS: videoZoomFactor = M^zoom (M = zoom tối đa của định dạng đang dùng) → zoom = ln f / ln M.
 * - Android: tỉ lệ = zoom · M, kẹp ≥ 1 → zoom = f / M.
 * JS không đọc được M, nên M là giá trị giả định trong tokens; số hiển thị là ước lượng.
 *
 * Dưới 1× chỉ có trên iPhone có ống góc rộng: đổi ống qua `selectedLens`, và trên ống đó
 * hệ số ống = hệ số hiển thị / 0,5.
 */

export const ULTRA_WIDE_FACTOR = 0.5;

export type ZoomPlatform = 'ios' | 'android';

export type ZoomConfig = {
  platform: ZoomPlatform;
  hasUltraWide: boolean;
  /** iOS: hệ số zoom tối đa M của ống (giả định). */
  iosMaxFactor: number;
  /** Android: maxZoomRatio của CameraX (giả định). */
  androidMaxRatio: number;
  precision: number;
};

export function nextZoomFactor(
  current: number,
  scaleChange: number,
  min: number,
  max: number,
): number {
  'worklet';
  return Math.min(max, Math.max(min, current * scaleChange));
}

/** Hệ số hiển thị → dùng ống góc rộng hay không, và prop `zoom` 0..1 cho ống đó. */
export function zoomTarget(factor: number, c: ZoomConfig): { ultra: boolean; prop: number } {
  'worklet';
  const ultra = c.platform === 'ios' && c.hasUltraWide && factor < 1 - 1e-6;
  const lensFactor = Math.max(1, ultra ? factor / ULTRA_WIDE_FACTOR : factor);
  const raw =
    c.platform === 'ios'
      ? Math.log(lensFactor) / Math.log(c.iosMaxFactor)
      : lensFactor <= 1
        ? 0
        : lensFactor / c.androidMaxRatio;
  const clamped = Math.min(1, Math.max(0, raw));
  return { ultra, prop: Math.round(clamped / c.precision) * c.precision };
}

/** "1,5×" (dấu phẩy thập phân kiểu Việt). */
export function formatZoom(factor: number): string {
  'worklet';
  return `${factor.toFixed(1).replace('.', ',')}×`;
}
