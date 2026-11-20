/**
 * Chuyển đổi Pose ↔ dòng SQLite (schema v3 ở src/db/migrations.ts). Hàm thuần, có unit test.
 */
import { type Contour, segmentsInContours } from '@/engine/contour';
import type { Landmarks } from '@/engine/segmentation/types';

import { DEFAULT_STYLE, type Pose, type PoseOrigin, type PoseStyle } from './types';

export type PhotoRow = {
  id: string;
  origin: PoseOrigin;
  sample_id: string | null;
  source_uri: string;
  mask_uri: string | null;
  width: number;
  height: number;
  bbox_json: string;
  sample_group: string | null;
  landmarks_json: string | null;
  /** 1 = viền đã Sửa nét (v4). Không có khi chèn mới: DB mặc định 0. */
  contours_edited?: number;
  /**
   * Dáng mọi người trong ảnh lúc tạo pose, JSON Contour[] (v5), cho cọ Thêm. Ảnh tạo trước bản này
   * thì ghi lần đầu Sửa nét (viền lúc đó).
   */
  original_contours_json?: string | null;
  created_at: string;
};

export type VariantRow = {
  id: string;
  photo_id: string;
  outline_enabled: number;
  outline_width: number;
  outline_color: string;
  fill_enabled: number;
  fill_color: string;
  fill_opacity: number;
  subject_opacity: number;
  background_opacity: number;
  face_enabled: number;
  /** Không dùng (ống tay chân đã thử và bỏ); cột vẫn còn trong schema v3, mặc định 0. */
  body_enabled?: number;
  /** Tên cột từ v3; nay lưu màu và độ dày của nét mặt. */
  lines_color: string;
  lines_width: number;
  created_at: string;
  updated_at: string;
};

export type ContourRow = {
  photo_id: string;
  idx: number;
  points_json: string;
  is_hole: number;
};

export function styleToColumns(s: PoseStyle) {
  return {
    outline_enabled: s.outlineEnabled ? 1 : 0,
    outline_width: s.outlineWidth,
    outline_color: s.outlineColor,
    fill_enabled: s.fillEnabled ? 1 : 0,
    fill_color: s.fillColor,
    fill_opacity: s.fillOpacity,
    subject_opacity: s.subjectOpacity,
    background_opacity: s.backgroundOpacity,
    face_enabled: s.faceEnabled ? 1 : 0,
    lines_color: s.faceColor,
    lines_width: s.faceWidth,
  };
}

export function rowToStyle(r: VariantRow): PoseStyle {
  return {
    outlineEnabled: r.outline_enabled === 1,
    outlineWidth: r.outline_width,
    outlineColor: r.outline_color,
    fillEnabled: r.fill_enabled === 1,
    fillColor: r.fill_color,
    fillOpacity: r.fill_opacity,
    subjectOpacity: r.subject_opacity,
    backgroundOpacity: r.background_opacity ?? DEFAULT_STYLE.backgroundOpacity,
    faceEnabled: r.face_enabled === 1,
    faceColor: r.lines_color ?? DEFAULT_STYLE.faceColor,
    faceWidth: r.lines_width ?? DEFAULT_STYLE.faceWidth,
  };
}

export function contoursToRows(photoId: string, contours: Contour[]): ContourRow[] {
  return contours.map((c, idx) => ({
    photo_id: photoId,
    idx,
    // [[x, y], …] gọn hơn [{x, y}, …] khoảng một nửa.
    points_json: JSON.stringify(c.points.map((p) => [p.x, p.y])),
    is_hole: c.isHole ? 1 : 0,
  }));
}

export function rowsToContours(rows: ContourRow[]): Contour[] {
  return [...rows]
    .sort((a, b) => a.idx - b.idx)
    .map((r) => ({
      isHole: r.is_hole === 1,
      points: (JSON.parse(r.points_json) as [number, number][]).map(([x, y]) => ({ x, y })),
    }));
}

/** Khung bao của các đường bao ngoài, tọa độ chuẩn hóa. Rỗng → cả ảnh. */
export function bboxOf(contours: Contour[]): { x: number; y: number; w: number; h: number } {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const c of contours) {
    if (c.isHole) continue;
    for (const p of c.points) {
      x0 = Math.min(x0, p.x);
      y0 = Math.min(y0, p.y);
      x1 = Math.max(x1, p.x);
      y1 = Math.max(y1, p.y);
    }
  }
  if (!Number.isFinite(x0)) return { x: 0, y: 0, w: 1, h: 1 };
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function poseToPhotoRow(p: Pose & { source: string }): PhotoRow {
  const lm = p.rawLandmarks ?? p.landmarks;
  return {
    id: p.photoId,
    origin: p.origin,
    sample_id: p.sampleId,
    source_uri: p.source,
    mask_uri: p.maskUri,
    width: p.width,
    height: p.height,
    bbox_json: JSON.stringify(bboxOf(p.contours)),
    sample_group: p.sampleGroup,
    // Luôn lưu nét gốc; bản đã lọc theo viền chỉ để vẽ.
    landmarks_json: lm ? JSON.stringify(lm) : null,
    original_contours_json: p.originalContours ? JSON.stringify(p.originalContours) : null,
    created_at: p.createdAt,
  };
}

export function poseToVariantRow(p: Pose): VariantRow {
  return {
    id: p.id,
    photo_id: p.photoId,
    ...styleToColumns(p.style),
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

/**
 * Nét phụ khớp với viền đã Sửa nét: nét mặt nằm trên vùng đã xóa thì ẩn. Không đổi dữ liệu gốc,
 * nên tô lại vùng mặt thì nét mặt hiện lại.
 */
export function landmarksForContours(lm: Landmarks | null, contours: Contour[]): Landmarks | null {
  if (!lm) return null;
  return { ...lm, face: segmentsInContours(lm.face, contours) };
}

export function rowsToPose(photo: PhotoRow, variant: VariantRow, contours: ContourRow[]): Pose {
  const outline = rowsToContours(contours);
  const landmarks = photo.landmarks_json ? (JSON.parse(photo.landmarks_json) as Landmarks) : null;
  return {
    id: variant.id,
    photoId: photo.id,
    origin: photo.origin,
    sampleId: photo.sample_id,
    source: photo.source_uri,
    width: photo.width,
    height: photo.height,
    contours: outline,
    // Viền khác dáng gốc (đã Sửa nét, hoặc chỉ chọn một số người): nét mặt lọc theo viền.
    ...(photo.contours_edited || photo.original_contours_json
      ? { landmarks: landmarksForContours(landmarks, outline), rawLandmarks: landmarks }
      : { landmarks }),
    ...(photo.original_contours_json
      ? { originalContours: JSON.parse(photo.original_contours_json) as Contour[] }
      : {}),
    sampleGroup: photo.sample_group,
    maskUri: photo.mask_uri,
    style: rowToStyle(variant),
    createdAt: variant.created_at,
    updatedAt: variant.updated_at,
  };
}
