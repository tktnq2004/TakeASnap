import type { Contour } from '@/engine/contour';
import type { Landmarks } from '@/engine/segmentation/types';
import { poseColors } from '@/ui/tokens';

/**
 * Style của một bản pose (business-flow §5.2). Thứ tự vẽ từ dưới lên:
 * nền (ảnh ngoài người) → người → phủ → ống tay chân → nét mặt → viền.
 */
export type PoseStyle = {
  outlineEnabled: boolean;
  /** Độ dày viền, px màn hình (1–12), không đổi khi phóng overlay. */
  outlineWidth: number;
  outlineColor: string;
  fillEnabled: boolean;
  fillColor: string;
  /** 0..1 */
  fillOpacity: number;
  /** Độ hiện của người trong ảnh gốc, 0..1. */
  subjectOpacity: number;
  /** Độ hiện của nền trong ảnh gốc (phần ngoài người), 0..1. */
  backgroundOpacity: number;
  /**
   * Nét mặt (viền mặt, mắt, lông mày, mũi, môi), vẽ CÙNG màu với viền, mảnh hơn (0.6 × độ dày).
   * Không có mặt = người mẫu quay lưng.
   */
  faceEnabled: boolean;
  /**
   * Ống tay, ống chân (src/engine/limbs.ts), vẽ CÙNG màu và độ dày với viền, chỉ ở chỗ tay chân
   * nằm trên thân (chỗ khác viền ngoài đã có).
   */
  limbsEnabled: boolean;
};

/** Mặc định theo business-flow §5.2. */
export const DEFAULT_STYLE: PoseStyle = {
  outlineEnabled: true,
  outlineWidth: 3,
  outlineColor: poseColors[0].value, // Trắng
  fillEnabled: true,
  fillColor: poseColors[1].value, // Cam
  fillOpacity: 0.4,
  subjectOpacity: 0,
  backgroundOpacity: 0,
  faceEnabled: true,
  limbsEnabled: true,
};

export const STYLE_LIMITS = {
  outlineWidth: { min: 1, max: 12, step: 0.5 },
} as const;

export type PoseOrigin = 'sample' | 'library' | 'camera';

/**
 * Nguồn ảnh: số module (require) cho pose mẫu đóng gói trong app, hoặc URI file trong
 * Paths.document cho ảnh của người dùng.
 */
export type ImageSource = number | string;

/**
 * Một bản pose = ảnh gốc (dùng chung giữa các bản) + style riêng. Một ảnh gốc có nhiều bản
 * (DB: photos 1 → n pose_variants).
 */
export type Pose = {
  /** Id của bản pose. */
  id: string;
  photoId: string;
  origin: PoseOrigin;
  /** Ảnh chép từ pose mẫu nào (để lưu nhiều lần không chép lại ảnh). */
  sampleId: string | null;
  source: ImageSource;
  width: number;
  height: number;
  /** Tọa độ chuẩn hóa 0..1. */
  contours: Contour[];
  /** Nét mặt + khung xương; null nếu chưa có (dữ liệu cũ trước v3). */
  landmarks: Landmarks | null;
  /** Nhóm của pose mẫu; null với ảnh của người dùng. */
  sampleGroup: string | null;
  /** Mask PNG trong Paths.document (Sửa nét ở Phase 3); pose mẫu không có. */
  maskUri: string | null;
  style: PoseStyle;
  createdAt: string;
  updatedAt: string;
};

/** Pose mẫu chỉ đọc (BR-09); id có tiền tố này. */
export const SAMPLE_PREFIX = 'sample-';
export const isSampleId = (id: string) => id.startsWith(SAMPLE_PREFIX);
