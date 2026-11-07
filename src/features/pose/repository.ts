/**
 * Lưu và đọc pose: SQLite cho dữ liệu, Paths.document/poses/<id>/ cho file (BR-08).
 * Pose mẫu không nằm trong DB: đọc từ sampleLibrary, chỉ đọc (BR-09).
 */
import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  type ContourRow,
  contoursToRows,
  poseToRow,
  type PoseRow,
  rowToPose,
  styleToRow,
  type StyleRow,
} from './mapping';
import { sampleLibrary } from './samples';
import { isSampleId, type Pose, type PoseStyle } from './types';

export function poseDir(id: string): Directory {
  return new Directory(Paths.document, 'poses', id);
}

export function newPoseId(): string {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function listUserPoses(db: SQLiteDatabase): Promise<Pose[]> {
  const rows = await db.getAllAsync<PoseRow>('SELECT * FROM poses ORDER BY created_at DESC');
  return Promise.all(rows.map((r) => loadRest(db, r)));
}

export async function getPose(db: SQLiteDatabase, id: string): Promise<Pose | null> {
  if (isSampleId(id)) return sampleLibrary.find((p) => p.id === id) ?? null;
  const row = await db.getFirstAsync<PoseRow>('SELECT * FROM poses WHERE id = ?', id);
  return row ? loadRest(db, row) : null;
}

async function loadRest(db: SQLiteDatabase, row: PoseRow): Promise<Pose> {
  const style = await db.getFirstAsync<StyleRow>(
    'SELECT * FROM pose_styles WHERE pose_id = ?',
    row.id,
  );
  const contours = await db.getAllAsync<ContourRow>(
    'SELECT * FROM pose_contours WHERE pose_id = ? ORDER BY idx',
    row.id,
  );
  return rowToPose(row, style, contours);
}

/** Ghi đè toàn bộ pose (dữ liệu, style, viền) trong một transaction. */
export async function savePose(db: SQLiteDatabase, pose: Pose & { source: string }) {
  const r = poseToRow(pose);
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT OR REPLACE INTO poses
        (id, origin, source_uri, mask_uri, thumbnail_uri, width, height, bbox_json, sample_group, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      r.id,
      r.origin,
      r.source_uri,
      r.mask_uri,
      r.thumbnail_uri,
      r.width,
      r.height,
      r.bbox_json,
      r.sample_group,
      r.created_at,
      r.updated_at,
    );
    await writeStyle(db, pose.id, pose.style);
    await db.runAsync('DELETE FROM pose_contours WHERE pose_id = ?', pose.id);
    for (const c of contoursToRows(pose.id, pose.contours)) {
      await db.runAsync(
        'INSERT INTO pose_contours (pose_id, idx, points_json, is_hole) VALUES (?, ?, ?, ?)',
        c.pose_id,
        c.idx,
        c.points_json,
        c.is_hole,
      );
    }
  });
}

async function writeStyle(db: SQLiteDatabase, poseId: string, style: PoseStyle) {
  const s = styleToRow(poseId, style);
  await db.runAsync(
    `INSERT OR REPLACE INTO pose_styles
      (pose_id, outline_enabled, outline_width, outline_color, fill_enabled, fill_color, fill_opacity, subject_opacity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    s.pose_id,
    s.outline_enabled,
    s.outline_width,
    s.outline_color,
    s.fill_enabled,
    s.fill_color,
    s.fill_opacity,
    s.subject_opacity,
  );
}

export async function updateStyle(db: SQLiteDatabase, id: string, style: PoseStyle) {
  await db.withTransactionAsync(async () => {
    await writeStyle(db, id, style);
    await db.runAsync('UPDATE poses SET updated_at = ? WHERE id = ?', new Date().toISOString(), id);
  });
}

/**
 * Pose mẫu chỉ đọc (BR-09): sửa = tạo bản sao vào thư viện của người dùng, chép ảnh gốc vào
 * Paths.document để không phụ thuộc file đóng gói.
 */
export async function createFromSample(
  db: SQLiteDatabase,
  sample: Pose,
  style: PoseStyle,
): Promise<Pose> {
  const id = newPoseId();
  const dir = poseDir(id);
  dir.create({ intermediates: true, idempotent: true });
  const [asset] = await Asset.loadAsync(sample.source as number);
  if (!asset?.localUri) throw new Error('Không đọc được ảnh pose mẫu');
  const dest = new File(dir, 'source.jpg');
  await new File(asset.localUri).copy(dest);
  const now = new Date().toISOString();
  const pose = {
    ...sample,
    id,
    origin: 'library' as const,
    source: dest.uri,
    style,
    createdAt: now,
    updatedAt: now,
  };
  await savePose(db, pose);
  return pose;
}

/** Xóa pose và MỌI file của nó (lỗi L10 của bản cũ: còn sót file). */
export async function deletePose(db: SQLiteDatabase, id: string) {
  if (isSampleId(id)) return;
  await db.runAsync('DELETE FROM poses WHERE id = ?', id);
  const dir = poseDir(id);
  if (dir.exists) dir.delete();
}
