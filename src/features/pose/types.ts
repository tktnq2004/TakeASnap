import type { Contour } from '@/engine/contour';
import { poseColors } from '@/ui/tokens';

/** Style 3 lớp của một pose (business-flow §5.2). Thứ tự vẽ từ dưới lên: người → phủ → viền. */
export type PoseStyle = {
  outlineEnabled: boolean;
  /** Độ dày viền, px màn hình (1–12), không đổi khi phóng overlay. */
  outlineWidth: number;
  outlineColor: string;
  fillEnabled: boolean;
  fillColor: string;
  /** 0..1 */
  fillOpacity: number;
  /** Độ hiện của ảnh người, 0..1. */
  subjectOpacity: number;
};

/** Mặc định theo bảng ở business-flow §5.2. */
export const DEFAULT_STYLE: PoseStyle = {
  outlineEnabled: true,
  outlineWidth: 3,
  outlineColor: poseColors[0].value, // Trắng
  fillEnabled: true,
  fillColor: poseColors[1].value, // Cam
  fillOpacity: 0.4,
  subjectOpacity: 0,
};

export const STYLE_LIMITS = {
  outlineWidth: { min: 1, max: 12, step: 0.5 },
} as const;

export type PoseOrigin = 'sample' | 'library' | 'camera';

/**
 * Nguồn ảnh: số module (require) cho pose mẫu đóng gói trong app, hoặc URI file trong
 * Paths.document cho pose của người dùng.
 */
export type ImageSource = number | string;

export type Pose = {
  id: string;
  origin: PoseOrigin;
  source: ImageSource;
  width: number;
  height: number;
  /** Tọa độ chuẩn hóa 0..1. */
  contours: Contour[];
  style: PoseStyle;
  /** Nhóm của pose mẫu; null với pose của người dùng. */
  sampleGroup: string | null;
  /** Mask PNG trong Paths.document (dùng cho Sửa nét ở Phase 3); pose mẫu không có. */
  maskUri: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Pose mẫu chỉ đọc (BR-09); id có tiền tố này. */
export const SAMPLE_PREFIX = 'sample-';
export const isSampleId = (id: string) => id.startsWith(SAMPLE_PREFIX);
