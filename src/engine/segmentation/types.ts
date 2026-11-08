/**
 * Tách người khỏi nền (roadmap §3.3). Mọi nơi trong app chỉ gọi qua interface này, để sau này
 * thay WebView bằng native (Vision / ML Kit) mà không sửa phần còn lại.
 */

/** Model đang được so sánh ở spike B (docs/spikes.md). */
export type SegmentModelId = 'multiclass' | 'selfie' | 'deeplab' | 'rmbg-cpu' | 'rmbg-gpu';

export type SegmentTimings = {
  /** Lần đầu dùng model: tải + khởi tạo. 0 nếu model đã nạp sẵn. */
  loadMs: number;
  /** Giải mã ảnh và chuẩn bị tensor trong WebView. */
  prepMs: number;
  /** Chạy model. */
  inferMs: number;
  /** Đổi kết quả thành mask PNG. */
  postMs: number;
};

/**
 * Nét phụ của pose, tọa độ chuẩn hóa 0..1:
 * - `face`: nét mặt, đoạn thẳng phẳng [x1, y1, x2, y2, …]. null = không thấy mặt (người mẫu quay
 *   lưng, nghiêng hoặc che mặt — business-flow §5.2).
 * - `bodyPoints`: 33 khớp MediaPipe phẳng [x, y, visibility, …]; giữ cho tính năng sau (khớp dáng).
 *   Ống tay chân dựng từ các khớp này đã thử và bỏ (góp ý lần 3: nét ước lượng chưa đủ tốt).
 */
export type Landmarks = {
  face: number[] | null;
  bodyPoints: number[] | null;
};

/** Kết quả thô từ WebView: mask PNG (trắng, alpha = xác suất là người) cùng kích thước ảnh vào. */
export type WebSegmentResult = {
  maskBase64: string;
  width: number;
  height: number;
  /** Ví dụ "mediapipe-GPU", "mediapipe-CPU", "ort-wasm". */
  backend: string;
  timings: SegmentTimings;
};

/** Kết quả cuối mà phần còn lại của app dùng (Phase 1). */
export type SegmentResult = {
  width: number;
  height: number;
  /** PNG trong Paths.document (không bao giờ trong cache, BR-08). */
  maskUri: string;
  /** Các vùng người tách rời, tọa độ chuẩn hóa 0..1. */
  regions: { bbox: [number, number, number, number]; areaRatio: number }[];
};

export interface Segmenter {
  /** Nạp model một lần. */
  ready(): Promise<void>;
  segment(imageUri: string): Promise<SegmentResult>;
}
