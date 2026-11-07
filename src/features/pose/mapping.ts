/**
 * Chuyển đổi Pose ↔ dòng SQLite (schema ở src/db/migrations.ts). Hàm thuần, có unit test.
 */
import type { Contour } from '@/engine/contour';

import { DEFAULT_STYLE, type Pose, type PoseOrigin, type PoseStyle } from './types';

export type PoseRow = {
  id: string;
  origin: PoseOrigin;
  source_uri: string;
  mask_uri: string | null;
  thumbnail_uri: string | null;
  width: number;
  height: number;
  bbox_json: string;
  sample_group: string | null;
  created_at: string;
  updated_at: string;
};

export type StyleRow = {
  pose_id: string;
  outline_enabled: number;
  outline_width: number;
  outline_color: string;
  fill_enabled: number;
  fill_color: string;
  fill_opacity: number;
  subject_opacity: number;
};

export type ContourRow = {
  pose_id: string;
  idx: number;
  points_json: string;
  is_hole: number;
};

export function styleToRow(poseId: string, s: PoseStyle): StyleRow {
  return {
    pose_id: poseId,
    outline_enabled: s.outlineEnabled ? 1 : 0,
    outline_width: s.outlineWidth,
    outline_color: s.outlineColor,
    fill_enabled: s.fillEnabled ? 1 : 0,
    fill_color: s.fillColor,
    fill_opacity: s.fillOpacity,
    subject_opacity: s.subjectOpacity,
  };
}

export function rowToStyle(r: StyleRow): PoseStyle {
  return {
    outlineEnabled: r.outline_enabled === 1,
    outlineWidth: r.outline_width,
    outlineColor: r.outline_color,
    fillEnabled: r.fill_enabled === 1,
    fillColor: r.fill_color,
    fillOpacity: r.fill_opacity,
    subjectOpacity: r.subject_opacity,
  };
}

export function contoursToRows(poseId: string, contours: Contour[]): ContourRow[] {
  return contours.map((c, idx) => ({
    pose_id: poseId,
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

export function poseToRow(p: Pose & { source: string }): PoseRow {
  return {
    id: p.id,
    origin: p.origin,
    source_uri: p.source,
    mask_uri: p.maskUri,
    thumbnail_uri: null,
    width: p.width,
    height: p.height,
    bbox_json: JSON.stringify(bboxOf(p.contours)),
    sample_group: p.sampleGroup,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

export function rowToPose(r: PoseRow, style: StyleRow | null, contours: ContourRow[]): Pose {
  return {
    id: r.id,
    origin: r.origin,
    source: r.source_uri,
    width: r.width,
    height: r.height,
    contours: rowsToContours(contours),
    style: style ? rowToStyle(style) : DEFAULT_STYLE,
    sampleGroup: r.sample_group,
    maskUri: r.mask_uri,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
