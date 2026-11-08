/**
 * Toán biến đổi overlay (roadmap §3.5). Hàm thuần, chạy được cả trên UI thread (worklet) lẫn
 * trong Jest. Tọa độ: gốc tại TÂM vùng nhận cử chỉ; `t` là độ lệch của tâm overlay so với gốc.
 *
 * Bản cũ (legacy-v0) giật vì tính lại từ điểm đầu mỗi lần chạm (lỗi L1–L3). Ở đây mọi hàm nhận
 * phần THAY ĐỔI của frame này và cộng dồn vào trạng thái hiện tại.
 */

export type Vec = { x: number; y: number };

export function clamp(v: number, lo: number, hi: number): number {
  'worklet';
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Phóng to/thu nhỏ quanh điểm f: điểm nằm dưới tâm hai ngón tay đứng yên.
 * t' = f − (f − t)·k
 */
export function scaleAbout(t: Vec, f: Vec, k: number): Vec {
  'worklet';
  return { x: f.x - (f.x - t.x) * k, y: f.y - (f.y - t.y) * k };
}

/** Xoay quanh điểm neo a một góc d (radian): t' = a + R(d)·(t − a). */
export function rotateAbout(t: Vec, a: Vec, d: number): Vec {
  'worklet';
  const c = Math.cos(d);
  const s = Math.sin(d);
  const dx = t.x - a.x;
  const dy = t.y - a.y;
  return { x: a.x + dx * c - dy * s, y: a.y + dx * s + dy * c };
}

/**
 * Hệ số phóng thực sự được áp sau khi kẹp scale trong [min, max].
 * Ví dụ đang 3.9×, ngón tay muốn ×1.1 → chỉ được ×(4/3.9).
 */
export function clampedScaleChange(
  current: number,
  change: number,
  min: number,
  max: number,
): number {
  'worklet';
  const next = clamp(current * change, min, max);
  return next / current;
}

/**
 * Góc hít gần nhất (bội của 90°) nếu lệch dưới ngưỡng, ngược lại trả null.
 * Góc đầu vào có thể đã quay nhiều vòng; giữ nguyên số vòng.
 */
export function snapAngle(rad: number, thresholdDeg: number): number | null {
  'worklet';
  const quarter = Math.PI / 2;
  const nearest = Math.round(rad / quarter) * quarter;
  return Math.abs(rad - nearest) <= (thresholdDeg * Math.PI) / 180 ? nearest : null;
}

/** Đổi tọa độ trong view (gốc góc trên-trái) sang tọa độ gốc tại tâm. */
export function toCentered(x: number, y: number, width: number, height: number): Vec {
  'worklet';
  return { x: x - width / 2, y: y - height / 2 };
}

/**
 * Kẹp độ lệch để ảnh (kích thước hiển thị dispW × dispH, tâm lệch t so với tâm khung) luôn phủ kín
 * khung areaW × areaH: không bao giờ lộ phần ngoài mép ảnh (góp ý lần 4: không thấy caro thừa).
 */
export function clampPan(t: Vec, dispW: number, dispH: number, areaW: number, areaH: number): Vec {
  'worklet';
  const mx = Math.max(0, (dispW - areaW) / 2);
  const my = Math.max(0, (dispH - areaH) / 2);
  return { x: clamp(t.x, -mx, mx), y: clamp(t.y, -my, my) };
}

/** Hệ số phóng để ảnh phủ kín khung (cover). */
export function coverScale(imgW: number, imgH: number, areaW: number, areaH: number): number {
  'worklet';
  return Math.max(areaW / imgW, areaH / imgH);
}
