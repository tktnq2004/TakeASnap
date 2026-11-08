/**
 * Hình học khung ngắm và ảnh chụp (business-flow §4.3, BR-02). Hàm thuần, có unit test.
 *
 * Preview của expo-camera phủ kín (cover) view của nó; view đó phủ kín màn hình. Khung ngắm là
 * một hình chữ nhật theo tỉ lệ đã chọn. Ảnh lưu phải TRÙNG đúng vùng khung ngắm (sửa lỗi L7 của
 * bản cũ: cắt cố định 15%–75% chiều cao, lệch khung).
 */

export type AspectId = '3:4' | '9:16' | '1:1';

/** Rộng / cao. */
export const ASPECTS: Record<AspectId, number> = { '3:4': 3 / 4, '9:16': 9 / 16, '1:1': 1 };

export type Rect = { x: number; y: number; width: number; height: number };

/**
 * Khung ngắm rộng bằng màn hình, cao theo tỉ lệ. Vừa giữa thanh trên và thanh dưới thì đặt giữa
 * vùng đó; không vừa (9:16 trên máy dài) thì được tràn ra sau các thanh, đặt giữa màn hình, và
 * không bao giờ cao quá màn hình.
 */
export function viewfinderRect(
  screenW: number,
  screenH: number,
  topH: number,
  bottomH: number,
  aspect: number,
): Rect {
  let width = screenW;
  let height = width / aspect;
  if (height > screenH) {
    height = screenH;
    width = height * aspect;
  }
  const available = screenH - topH - bottomH;
  const y = height <= available ? topH + (available - height) / 2 : (screenH - height) / 2;
  return { x: (screenW - width) / 2, y, width, height };
}

/**
 * Vùng trên ảnh chụp (pixel) ứng với khung ngắm, khi preview kích thước previewW × previewH hiển
 * thị ảnh photoW × photoH kiểu cover, căn giữa. Kẹp trong ảnh, làm tròn.
 */
export function frameToPhotoCrop(
  frame: Rect,
  previewW: number,
  previewH: number,
  photoW: number,
  photoH: number,
): Rect {
  const s = Math.max(previewW / photoW, previewH / photoH);
  const offX = (previewW - photoW * s) / 2;
  const offY = (previewH - photoH * s) / 2;
  let x = (frame.x - offX) / s;
  let y = (frame.y - offY) / s;
  let width = frame.width / s;
  let height = frame.height / s;
  x = Math.max(0, x);
  y = Math.max(0, y);
  width = Math.min(width, photoW - x);
  height = Math.min(height, photoH - y);
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.floor(width),
    height: Math.floor(height),
  };
}
