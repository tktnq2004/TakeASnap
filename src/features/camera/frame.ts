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
 * vùng đó. Không vừa (9:16 trên máy dài) thì tràn ra sau các thanh và không bao giờ cao quá màn
 * hình; có `cut` (giữa thanh trên và giữa hàng nút chụp, tọa độ màn hình) thì mép khung đi qua
 * đúng giữa hai cụm nút: khung đặt giữa hai đường đó và thấp lại cho vừa (phiếu Phase 5 lần 4:
 * mép khung cắt 3/4 nút chụp trông lệch). Không có `cut` thì đặt giữa màn hình.
 */
export function viewfinderRect(
  screenW: number,
  screenH: number,
  topH: number,
  bottomH: number,
  aspect: number,
  cut?: { top: number; bottom: number },
): Rect {
  let width = screenW;
  let height = width / aspect;
  if (height > screenH) {
    height = screenH;
    width = height * aspect;
  }
  const available = screenH - topH - bottomH;
  if (height <= available) {
    return { x: (screenW - width) / 2, y: topH + (available - height) / 2, width, height };
  }
  if (cut && cut.bottom > cut.top) {
    const span = cut.bottom - cut.top;
    if (height > span) {
      height = span;
      width = height * aspect;
    }
    const mid = (cut.top + cut.bottom) / 2;
    return { x: (screenW - width) / 2, y: mid - height / 2, width, height };
  }
  return { x: (screenW - width) / 2, y: (screenH - height) / 2, width, height };
}

/** Tỉ lệ cảm biến khi chụp (CameraView ratio "4:3"), dựng đứng: rộng / cao = 3 / 4. */
export const SENSOR_ASPECT = 3 / 4;

/**
 * Chỗ đặt màn xem trước của camera: hình 3:4 nhỏ nhất phủ kín khung ngắm, cùng tâm (góp ý Phase
 * 4, mục 4.4). Trước đây màn xem trước phủ cả màn hình dài nên ảnh 4:3 bị phóng thêm ~1,6 lần và
 * mọi mức zoom hẹp hơn app Camera của máy. Khung 3:4 giờ thấy đúng toàn bộ cảm biến như app gốc;
 * 1:1 và 9:16 cắt bớt cảm biến như app gốc.
 */
export function previewRect(frame: Rect, aspect: number = SENSOR_ASPECT): Rect {
  let width = frame.width;
  let height = width / aspect;
  if (height < frame.height) {
    height = frame.height;
    width = height * aspect;
  }
  return {
    x: frame.x + (frame.width - width) / 2,
    y: frame.y + (frame.height - height) / 2,
    width,
    height,
  };
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

/** Vùng cắt phủ cả ảnh (lệch tối đa 2 px do làm tròn): không cần cắt. */
export function isWholeImage(crop: Rect, photo: { width: number; height: number }): boolean {
  return (
    crop.x <= 1 && crop.y <= 1 && crop.width >= photo.width - 2 && crop.height >= photo.height - 2
  );
}
