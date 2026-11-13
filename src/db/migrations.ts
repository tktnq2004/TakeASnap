import type { SQLiteDatabase } from 'expo-sqlite';

import { transaction } from './transaction';

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

  // v3 — 1 ảnh gốc → nhiều bản pose (góp ý sau Phase 1 lần 1). Ảnh gốc giữ viền + nét mặt/khung
  // xương; mỗi bản pose giữ style riêng. Chép dữ liệu v2 sang: mỗi pose cũ thành 1 ảnh + 1 bản
  // cùng id; nét mặt/khung xương của dữ liệu cũ để trống.
  `
  CREATE TABLE photos (
    id              TEXT PRIMARY KEY NOT NULL,
    origin          TEXT NOT NULL CHECK (origin IN ('sample', 'library', 'camera')),
    sample_id       TEXT,
    source_uri      TEXT NOT NULL,
    mask_uri        TEXT,
    width           INTEGER NOT NULL,
    height          INTEGER NOT NULL,
    bbox_json       TEXT NOT NULL,
    sample_group    TEXT,
    landmarks_json  TEXT,
    created_at      TEXT NOT NULL
  );
  INSERT INTO photos (id, origin, sample_id, source_uri, mask_uri, width, height, bbox_json, sample_group, landmarks_json, created_at)
    SELECT id, origin, NULL, source_uri, mask_uri, width, height, bbox_json, sample_group, NULL, created_at FROM poses;

  CREATE TABLE photo_contours (
    photo_id     TEXT    NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    idx          INTEGER NOT NULL,
    points_json  TEXT    NOT NULL,
    is_hole      INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (photo_id, idx)
  );
  INSERT INTO photo_contours (photo_id, idx, points_json, is_hole)
    SELECT pose_id, idx, points_json, is_hole FROM pose_contours;

  CREATE TABLE pose_variants (
    id                  TEXT PRIMARY KEY NOT NULL,
    photo_id            TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    outline_enabled     INTEGER NOT NULL DEFAULT 1,
    outline_width       REAL    NOT NULL DEFAULT 3,
    outline_color       TEXT    NOT NULL DEFAULT '#ffffff',
    fill_enabled        INTEGER NOT NULL DEFAULT 1,
    fill_color          TEXT    NOT NULL DEFAULT '#ff4a1f',
    fill_opacity        REAL    NOT NULL DEFAULT 0.4,
    subject_opacity     REAL    NOT NULL DEFAULT 0,
    background_opacity  REAL    NOT NULL DEFAULT 0,
    face_enabled        INTEGER NOT NULL DEFAULT 1,
    body_enabled        INTEGER NOT NULL DEFAULT 0,
    lines_color         TEXT    NOT NULL DEFAULT '#ffd60a',
    lines_width         REAL    NOT NULL DEFAULT 2,
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL
  );
  INSERT INTO pose_variants (id, photo_id, outline_enabled, outline_width, outline_color, fill_enabled,
      fill_color, fill_opacity, subject_opacity, created_at, updated_at)
    SELECT p.id, p.id, COALESCE(s.outline_enabled, 1), COALESCE(s.outline_width, 3),
      COALESCE(s.outline_color, '#ffffff'), COALESCE(s.fill_enabled, 1), COALESCE(s.fill_color, '#ff4a1f'),
      COALESCE(s.fill_opacity, 0.4), COALESCE(s.subject_opacity, 0), p.created_at, p.updated_at
    FROM poses p LEFT JOIN pose_styles s ON s.pose_id = p.id;

  CREATE TABLE variant_placements (
    variant_id  TEXT PRIMARY KEY NOT NULL REFERENCES pose_variants(id) ON DELETE CASCADE,
    x           REAL NOT NULL DEFAULT 0,
    y           REAL NOT NULL DEFAULT 0,
    scale       REAL NOT NULL DEFAULT 1,
    rotation    REAL NOT NULL DEFAULT 0,
    mirrored    INTEGER NOT NULL DEFAULT 0
  );
  INSERT INTO variant_placements (variant_id, x, y, scale, rotation, mirrored)
    SELECT pose_id, x, y, scale, rotation, mirrored FROM overlay_placements;

  DROP TABLE overlay_placements;
  DROP TABLE pose_contours;
  DROP TABLE pose_styles;
  DROP TABLE poses;

  CREATE INDEX variants_updated_at ON pose_variants (updated_at DESC);
  CREATE INDEX photos_sample_id ON photos (sample_id);
  `,
  // v4 — Sửa nét (Phase 3): ảnh đã sửa viền thì không lấy lại viền mới nhất của pose mẫu.
  `
  ALTER TABLE photos ADD COLUMN contours_edited INTEGER NOT NULL DEFAULT 0;
  `,
];

export const SCHEMA_VERSION = steps.length;

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  while (version < steps.length) {
    const sql = steps[version] as string;
    await transaction(db, async () => {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
    version += 1;
  }
}
