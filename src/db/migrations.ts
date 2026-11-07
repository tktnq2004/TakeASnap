import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Migration theo PRAGMA user_version. Mỗi phần tử là một bước nâng version, không bao giờ sửa
 * bước cũ, chỉ thêm bước mới. Mô hình dữ liệu: docs/business-flow.md §9.
 */
const steps: string[] = [
  // v1 — pose, style 3 lớp, contour, placement overlay.
  `
  CREATE TABLE poses (
    id             TEXT PRIMARY KEY NOT NULL,
    origin         TEXT NOT NULL CHECK (origin IN ('sample', 'library', 'camera')),
    source_uri     TEXT NOT NULL,
    mask_uri       TEXT NOT NULL,
    thumbnail_uri  TEXT,
    width          INTEGER NOT NULL,
    height         INTEGER NOT NULL,
    bbox_json      TEXT NOT NULL,
    sample_group   TEXT,
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL
  );

  CREATE TABLE pose_styles (
    pose_id          TEXT PRIMARY KEY NOT NULL REFERENCES poses(id) ON DELETE CASCADE,
    outline_enabled  INTEGER NOT NULL DEFAULT 1,
    outline_width    REAL    NOT NULL DEFAULT 3,
    outline_color    TEXT    NOT NULL DEFAULT '#ffffff',
    fill_enabled     INTEGER NOT NULL DEFAULT 1,
    fill_color       TEXT    NOT NULL DEFAULT '#ff4a1f',
    fill_opacity     REAL    NOT NULL DEFAULT 0.4,
    subject_opacity  REAL    NOT NULL DEFAULT 0
  );

  CREATE TABLE pose_contours (
    pose_id      TEXT    NOT NULL REFERENCES poses(id) ON DELETE CASCADE,
    idx          INTEGER NOT NULL,
    points_json  TEXT    NOT NULL,
    is_hole      INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (pose_id, idx)
  );

  CREATE TABLE overlay_placements (
    pose_id   TEXT PRIMARY KEY NOT NULL REFERENCES poses(id) ON DELETE CASCADE,
    x         REAL NOT NULL DEFAULT 0,
    y         REAL NOT NULL DEFAULT 0,
    scale     REAL NOT NULL DEFAULT 1,
    rotation  REAL NOT NULL DEFAULT 0,
    mirrored  INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX poses_created_at ON poses (created_at DESC);
  `,

  // v2 — mask_uri cho phép rỗng (bản sao của pose mẫu không có mask). Ở thời điểm v2 các bảng
  // chưa từng có dữ liệu thật (Phase 0 chỉ tạo bảng), nên tạo lại thay vì chép dữ liệu.
  `
  DROP TABLE IF EXISTS overlay_placements;
  DROP TABLE IF EXISTS pose_contours;
  DROP TABLE IF EXISTS pose_styles;
  DROP TABLE IF EXISTS poses;

  CREATE TABLE poses (
    id             TEXT PRIMARY KEY NOT NULL,
    origin         TEXT NOT NULL CHECK (origin IN ('sample', 'library', 'camera')),
    source_uri     TEXT NOT NULL,
    mask_uri       TEXT,
    thumbnail_uri  TEXT,
    width          INTEGER NOT NULL,
    height         INTEGER NOT NULL,
    bbox_json      TEXT NOT NULL,
    sample_group   TEXT,
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL
  );

  CREATE TABLE pose_styles (
    pose_id          TEXT PRIMARY KEY NOT NULL REFERENCES poses(id) ON DELETE CASCADE,
    outline_enabled  INTEGER NOT NULL DEFAULT 1,
    outline_width    REAL    NOT NULL DEFAULT 3,
    outline_color    TEXT    NOT NULL DEFAULT '#ffffff',
    fill_enabled     INTEGER NOT NULL DEFAULT 1,
    fill_color       TEXT    NOT NULL DEFAULT '#ff4a1f',
    fill_opacity     REAL    NOT NULL DEFAULT 0.4,
    subject_opacity  REAL    NOT NULL DEFAULT 0
  );

  CREATE TABLE pose_contours (
    pose_id      TEXT    NOT NULL REFERENCES poses(id) ON DELETE CASCADE,
    idx          INTEGER NOT NULL,
    points_json  TEXT    NOT NULL,
    is_hole      INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (pose_id, idx)
  );

  CREATE TABLE overlay_placements (
    pose_id   TEXT PRIMARY KEY NOT NULL REFERENCES poses(id) ON DELETE CASCADE,
    x         REAL NOT NULL DEFAULT 0,
    y         REAL NOT NULL DEFAULT 0,
    scale     REAL NOT NULL DEFAULT 1,
    rotation  REAL NOT NULL DEFAULT 0,
    mirrored  INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX poses_created_at ON poses (created_at DESC);
  `,
];

export const SCHEMA_VERSION = steps.length;

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  while (version < steps.length) {
    const sql = steps[version] as string;
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
    version += 1;
  }
}
