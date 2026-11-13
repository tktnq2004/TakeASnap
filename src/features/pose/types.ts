import type { Contour } from '@/engine/contour';
import type { Landmarks } from '@/engine/segmentation/types';
import { poseColors } from '@/ui/tokens';

/**
 * Style của một bản pose (business-flow §5.2). Thứ tự vẽ từ dưới lên:
 * nền (ảnh ngoài người) → người → phủ → nét mặt → viền.
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
   * Nét mặt: viền mặt, mắt, lông mày, mũi, môi. Không có mặt = người mẫu quay lưng.
   * Chỉnh RIÊNG với viền (màu, độ dày), cùng nằm trong tab Viền (góp ý lần 3).
   */
  faceEnabled: boolean;
  faceColor: string;
  /** px màn hình. */
  faceWidth: number;
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
  faceColor: poseColors[0].value, // Trắng
  faceWidth: 1.5,
};

export const STYLE_LIMITS = {
  outlineWidth: { min: 1, max: 12, step: 0.5 },
  faceWidth: { min: 0.5, max: 5, step: 0.5 },
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
  /**
   * Nét phụ gốc trước khi lọc theo viền đã Sửa nét (chỉ có khi viền đã sửa). Màn Chỉnh pose lọc
   * lại từ đây, để tô lại vùng mặt thì nét mặt hiện lại.
   */
  rawLandmarks?: Landmarks | null;
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
