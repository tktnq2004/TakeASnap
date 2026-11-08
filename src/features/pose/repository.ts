/**
 * Lưu và đọc pose. Một ảnh gốc (photos: ảnh, viền, nét mặt/khung xương) có nhiều bản pose
 * (pose_variants: style). File ảnh nằm trong Paths.document/poses/<photoId>/ (BR-08).
 * Pose mẫu không nằm trong DB: đọc từ sampleLibrary, chỉ đọc (BR-09).
 */
import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  type ContourRow,
  contoursToRows,
  type PhotoRow,
  poseToPhotoRow,
  poseToVariantRow,
  rowsToPose,
  styleToColumns,
  type VariantRow,
} from './mapping';
import { sampleLibrary } from './samples';
import { isSampleId, type Pose, type PoseStyle, SAMPLE_PREFIX } from './types';

export function photoDir(photoId: string): Directory {
  return new Directory(Paths.document, 'poses', photoId);
}

export function newId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

const now = () => new Date().toISOString();

/** Mọi bản pose của người dùng, mới sửa trước. */
export async function listUserPoses(db: SQLiteDatabase): Promise<Pose[]> {
  const variants = await db.getAllAsync<VariantRow>(
    'SELECT * FROM pose_variants ORDER BY updated_at DESC',
  );
  return loadPoses(db, variants);
}

export async function getPose(db: SQLiteDatabase, id: string): Promise<Pose | null> {
  if (isSampleId(id)) return sampleLibrary.find((p) => p.id === id) ?? null;
  const v = await db.getFirstAsync<VariantRow>('SELECT * FROM pose_variants WHERE id = ?', id);
  if (!v) return null;
  const [pose] = await loadPoses(db, [v]);
  return pose ?? null;
}

async function loadPoses(db: SQLiteDatabase, variants: VariantRow[]): Promise<Pose[]> {
  const photos = new Map<string, { row: PhotoRow; contours: ContourRow[] }>();
  const out: Pose[] = [];
  for (const v of variants) {
    let p = photos.get(v.photo_id);
    if (!p) {
      const row = await db.getFirstAsync<PhotoRow>('SELECT * FROM photos WHERE id = ?', v.photo_id);
      if (!row) continue;
      const contours = await db.getAllAsync<ContourRow>(
        'SELECT * FROM photo_contours WHERE photo_id = ? ORDER BY idx',
        v.photo_id,
      );
      p = { row, contours };
      photos.set(v.photo_id, p);
    }
    const pose = rowsToPose(p.row, v, p.contours);
    // Ảnh chép từ pose mẫu: luôn dùng viền và nét mặt MỚI NHẤT của pose mẫu đó, để bản đã lưu
    // trước khi app có tính năng mới cũng được cập nhật.
    const sample = pose.sampleId
      ? sampleLibrary.find((s) => s.sampleId === pose.sampleId)
      : undefined;
    out.push(sample ? { ...pose, contours: sample.contours, landmarks: sample.landmarks } : pose);
  }
  return out;
}

async function insertPhoto(db: SQLiteDatabase, pose: Pose & { source: string }) {
  const r = poseToPhotoRow(pose);
  await db.runAsync(
    `INSERT INTO photos
      (id, origin, sample_id, source_uri, mask_uri, width, height, bbox_json, sample_group, landmarks_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    r.id,
    r.origin,
    r.sample_id,
    r.source_uri,
    r.mask_uri,
    r.width,
    r.height,
    r.bbox_json,
    r.sample_group,
    r.landmarks_json,
    r.created_at,
  );
  for (const c of contoursToRows(pose.photoId, pose.contours)) {
    await db.runAsync(
      'INSERT INTO photo_contours (photo_id, idx, points_json, is_hole) VALUES (?, ?, ?, ?)',
      c.photo_id,
      c.idx,
      c.points_json,
      c.is_hole,
    );
  }
}

async function insertVariant(db: SQLiteDatabase, pose: Pose) {
  const v = poseToVariantRow(pose);
  await db.runAsync(
    `INSERT INTO pose_variants
      (id, photo_id, outline_enabled, outline_width, outline_color, fill_enabled, fill_color,
       fill_opacity, subject_opacity, background_opacity, face_enabled, lines_color,
       lines_width, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    v.id,
    v.photo_id,
    v.outline_enabled,
    v.outline_width,
    v.outline_color,
    v.fill_enabled,
    v.fill_color,
    v.fill_opacity,
    v.subject_opacity,
    v.background_opacity,
    v.face_enabled,
    v.lines_color,
    v.lines_width,
    v.created_at,
    v.updated_at,
  );
}

/** "Lưu pose": ghi đè style của bản đang sửa. */
export async function updateStyle(db: SQLiteDatabase, variantId: string, style: PoseStyle) {
  const c = styleToColumns(style);
  await db.runAsync(
    `UPDATE pose_variants SET
      outline_enabled = ?, outline_width = ?, outline_color = ?, fill_enabled = ?, fill_color = ?,
      fill_opacity = ?, subject_opacity = ?, background_opacity = ?, face_enabled = ?,
      lines_color = ?, lines_width = ?, updated_at = ?
     WHERE id = ?`,
    c.outline_enabled,
    c.outline_width,
    c.outline_color,
    c.fill_enabled,
    c.fill_color,
    c.fill_opacity,
    c.subject_opacity,
    c.background_opacity,
    c.face_enabled,
    c.lines_color,
    c.lines_width,
    now(),
    variantId,
  );
}

/** "Lưu thành bản mới": thêm một bản pose cho cùng ảnh gốc, không chép lại ảnh. */
export async function createVariant(db: SQLiteDatabase, base: Pose, style: PoseStyle) {
  if (isSampleId(base.id)) return createFromSample(db, base, style);
  const t = now();
  const pose: Pose = { ...base, id: newId('v'), style, createdAt: t, updatedAt: t };
  await insertVariant(db, pose);
  return pose;
}

/**
 * Pose mẫu chỉ đọc (BR-09): lưu = thêm bản vào "Pose của bạn". Lần đầu chép ảnh gốc vào
 * Paths.document; các lần sau dùng lại ảnh đã chép (tìm theo sample_id).
 */
export async function createFromSample(
  db: SQLiteDatabase,
  sample: Pose,
  style: PoseStyle,
): Promise<Pose> {
  const sampleId = sample.id.slice(SAMPLE_PREFIX.length);
  const t = now();
  const existing = await db.getFirstAsync<{ id: string; source_uri: string }>(
    'SELECT id, source_uri FROM photos WHERE sample_id = ? LIMIT 1',
    sampleId,
  );
  let photoId: string;
  let source: string;
  if (existing) {
    photoId = existing.id;
    source = existing.source_uri;
  } else {
    photoId = newId('ph');
    const dir = photoDir(photoId);
    dir.create({ intermediates: true, idempotent: true });
    const [asset] = await Asset.loadAsync(sample.source as number);
    if (!asset?.localUri) throw new Error('Không đọc được ảnh pose mẫu');
    const dest = new File(dir, 'source.jpg');
    await new File(asset.localUri).copy(dest);
    source = dest.uri;
  }
  const pose: Pose & { source: string } = {
    ...sample,
    id: newId('v'),
    photoId,
    origin: 'library',
    sampleId,
    source,
    style,
    createdAt: t,
    updatedAt: t,
  };
  await db.withTransactionAsync(async () => {
    if (!existing) await insertPhoto(db, pose);
    await insertVariant(db, pose);
  });
  return pose;
}

/**
 * Xóa một bản pose. Bản cuối cùng của ảnh thì xóa luôn ảnh gốc và MỌI file của nó (lỗi L10 của
 * bản cũ: còn sót file).
 */
export async function deleteVariant(db: SQLiteDatabase, variantId: string) {
  if (isSampleId(variantId)) return;
  const v = await db.getFirstAsync<{ photo_id: string }>(
    'SELECT photo_id FROM pose_variants WHERE id = ?',
    variantId,
  );
  if (!v) return;
  await db.runAsync('DELETE FROM pose_variants WHERE id = ?', variantId);
  const left = await db.getFirstAsync<{ n: number }>(
    'SELECT count(*) AS n FROM pose_variants WHERE photo_id = ?',
    v.photo_id,
  );
  if ((left?.n ?? 0) === 0) {
    await db.runAsync('DELETE FROM photos WHERE id = ?', v.photo_id);
    const dir = photoDir(v.photo_id);
    if (dir.exists) dir.delete();
  }
}
