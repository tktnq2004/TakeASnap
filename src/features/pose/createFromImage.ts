/**
 * Ảnh trong máy → pose mới trong "Pose của bạn" (business-flow §5.1).
 * Tách người (WebView, offline sau lần tải gói đầu) → dò viền → kiểm tra BR-06 → lưu file vào
 * Paths.document/poses/<photoId>/ (BR-08) → lưu ảnh gốc + một bản pose style mặc định.
 */
import { File } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import { buildContours, personAreaRatio } from '@/engine/contour';
import type { PoseProgress, PoseSegmentation } from '@/engine/segmentation/SegmenterProvider';

import { newId, photoDir, savePhotoAndVariant } from './repository';
import { DEFAULT_STYLE, type Pose } from './types';

/** BR-06: người phải chiếm ít nhất 2% ảnh. */
export const MIN_PERSON_RATIO = 0.02;

export type CreateErrorCode = 'noPerson' | 'personTooSmall';

export class PoseCreateError extends Error {
  constructor(public code: CreateErrorCode) {
    super(code);
  }
}

export type CreateProgress = PoseProgress | { stage: 'contour' | 'save' };

export async function createPoseFromImage(
  db: SQLiteDatabase,
  segmentForPose: (
    input: { uri: string; width: number; height: number },
    onProgress?: (p: PoseProgress) => void,
  ) => Promise<PoseSegmentation>,
  input: { uri: string; width: number; height: number },
  onProgress?: (p: CreateProgress) => void,
): Promise<Pose> {
  const seg = await segmentForPose(input, onProgress);

  onProgress?.({ stage: 'contour' });
  const { width, height, data } = seg.grid;
  const prob = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) prob[i] = data[i]! / 255;
  const contours = buildContours({ width, height, data: prob }, { maxSide: 512 });
  if (!contours.length) throw new PoseCreateError('noPerson');
  if (personAreaRatio(contours) < MIN_PERSON_RATIO) throw new PoseCreateError('personTooSmall');

  onProgress?.({ stage: 'save' });
  const photoId = newId('ph');
  const dir = photoDir(photoId);
  dir.create({ intermediates: true, idempotent: true });
  const source = new File(dir, 'source.jpg');
  await new File(seg.prepared.uri).copy(source);
  const mask = new File(dir, 'mask.png');
  mask.create();
  await mask.write(seg.maskBase64, { encoding: 'base64' });

  const now = new Date().toISOString();
  const pose: Pose & { source: string } = {
    id: newId('v'),
    photoId,
    origin: 'library',
    sampleId: null,
    source: source.uri,
    width: seg.prepared.width,
    height: seg.prepared.height,
    contours,
    landmarks: seg.landmarks,
    sampleGroup: null,
    maskUri: mask.uri,
    style: DEFAULT_STYLE,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await savePhotoAndVariant(db, pose);
  } catch (e) {
    // Lưu DB lỗi thì dọn file vừa ghi, không để rác (BR-08).
    if (dir.exists) dir.delete();
    throw e;
  }
  return pose;
}
