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
  /**
   * iOS: đang dùng camera ảo (Triple / Dual Wide) gộp ống góc rộng và ống chính. Hệ số thiết bị 1
   * là ống góc rộng (0,5× hiển thị); máy tự chuyển ống khi zoom, không phải dựng lại phiên camera
   * nên không chớp khi qua mốc 1× (góp ý Phase 4).
   */
  virtual?: boolean;
  /** iOS: hệ số zoom tối đa M của ống (giả định). */
  iosMaxFactor: number;
  /** iOS: hệ số zoom tối đa của camera ảo, tính từ ống góc rộng (giả định). */
  iosVirtualMaxFactor?: number;
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
  if (c.platform === 'ios' && c.virtual) {
    const deviceFactor = Math.max(1, factor / ULTRA_WIDE_FACTOR);
    const m = c.iosVirtualMaxFactor ?? c.iosMaxFactor;
    const v = Math.min(1, Math.max(0, Math.log(deviceFactor) / Math.log(m)));
    return { ultra: false, prop: Math.round(v / c.precision) * c.precision };
  }
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

/** Thước cuộn (design.md §6.1, kiểu B): mỗi lần gấp đôi hệ số cách nhau chừng này px. */
export const TAPE_PX_PER_DOUBLING = 70;

/** Vị trí của một hệ số trên thước, tính từ mốc 1×. */
export function tapeOffset(factor: number): number {
  'worklet';
  return Math.log2(factor) * TAPE_PX_PER_DOUBLING;
}

/**
 * Kéo thước: thước chạy theo ngón tay dưới kim đứng yên, nên kéo sang trái là tăng zoom.
 * Làm tròn bước 0,1.
 */
export function factorFromTape(start: number, dx: number, min: number, max: number): number {
  'worklet';
  const f = start * Math.pow(2, -dx / TAPE_PX_PER_DOUBLING);
  return Math.min(max, Math.max(min, Math.round(f * 10) / 10));
}

/** Nút nhanh đang "chứa" hệ số hiện tại: nút lớn nhất không vượt quá hệ số đó. */
export function presetIndex(factor: number, presets: readonly number[]): number {
  'worklet';
  let i = 0;
  for (let k = 0; k < presets.length; k++) if (factor >= presets[k]! - 0.05) i = k;
  return i;
}

/** Có đi qua một mốc nút nhanh giữa hai giá trị không (để rung). */
export function crossedPreset(a: number, b: number, presets: readonly number[]): boolean {
  'worklet';
  if (a === b) return false;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  for (const p of presets) if (p > lo && p <= hi) return true;
  return false;
}
