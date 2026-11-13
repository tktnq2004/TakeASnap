/**
 * Ảnh trong máy → pose mới trong "Pose của bạn" (business-flow §5.1), hai bước:
 * 1. `analyzeImage`: tách người (WebView, offline sau lần tải gói đầu) → chia mask thành từng
 *    người → kiểm tra BR-06.
 * 2. `savePose`: (sau khi chọn người nếu ảnh có nhiều người) dò viền → lưu file vào
 *    Paths.document/poses/<photoId>/ (BR-08) → lưu ảnh gốc + một bản pose style mặc định.
 */
import { File } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import { buildContours, type Contour, type Grid, personAreaRatio } from '@/engine/contour';
import {
  groupPeople,
  keepBodyOnPeople,
  keepSegmentsOnPeople,
  type Labeling,
  labelRegions,
  maskForPeople,
  type Person,
} from '@/engine/regions';
import type { PoseProgress, PoseSegmentation } from '@/engine/segmentation/SegmenterProvider';

import { newId, photoDir, savePhotoAndVariant } from './repository';
import { DEFAULT_STYLE, type Pose } from './types';

/** BR-06: người phải chiếm ít nhất 2% ảnh. Cũng là ngưỡng để coi một vùng là một người. */
export const MIN_PERSON_RATIO = 0.02;

/** Chạm hụt hoặc nét mặt lệch mép người trong khoảng này (ô lưới 512) vẫn tính là trên người. */
export const PERSON_SLOP = 6;

const CONTOUR_SIDE = 512;

export type CreateErrorCode = 'noPerson' | 'personTooSmall';

export class PoseCreateError extends Error {
  constructor(public code: CreateErrorCode) {
    super(code);
  }
}

export type CreateProgress = PoseProgress | { stage: 'contour' | 'save' };

export type ImageAnalysis = {
  seg: PoseSegmentation;
  grid: Grid;
  labeling: Labeling;
  /** Xếp trái sang phải. Từ 2 người trở lên thì hỏi chọn người (business-flow §5.1). */
  people: Person[];
};

export async function analyzeImage(
  segmentForPose: (
    input: { uri: string; width: number; height: number },
    onProgress?: (p: PoseProgress) => void,
  ) => Promise<PoseSegmentation>,
  input: { uri: string; width: number; height: number },
  onProgress?: (p: CreateProgress) => void,
): Promise<ImageAnalysis> {
  const seg = await segmentForPose(input, onProgress);
  const { width, height, data } = seg.grid;
  const prob = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) prob[i] = data[i]! / 255;
  const grid = { width, height, data: prob };
  const labeling = labelRegions(grid);
  const people = groupPeople(labeling, MIN_PERSON_RATIO);
  if (!people.length) {
    throw new PoseCreateError(labeling.regions.length ? 'personTooSmall' : 'noPerson');
  }
  return { seg, grid, labeling, people };
}

/** Viền của từng người, để vẽ lên màn chọn người. */
export function peopleContours(a: ImageAnalysis): Contour[][] {
  return a.people.map((p) =>
    buildContours(maskForPeople(a.grid, a.labeling, [p]), { maxSide: CONTOUR_SIDE }),
  );
}

/** Lưu pose với những người đã chọn (mặc định: tất cả). */
export async function savePose(
  db: SQLiteDatabase,
  a: ImageAnalysis,
  chosen: Person[] = a.people,
  onProgress?: (p: CreateProgress) => void,
): Promise<Pose> {
  const { seg } = a;
  onProgress?.({ stage: 'contour' });
  const all = chosen.length === a.people.length;
  const grid = all ? a.grid : maskForPeople(a.grid, a.labeling, chosen);
  const contours = buildContours(grid, { maxSide: CONTOUR_SIDE });
  if (!contours.length) throw new PoseCreateError('noPerson');
  if (personAreaRatio(contours) < MIN_PERSON_RATIO) throw new PoseCreateError('personTooSmall');
  const landmarks = all
    ? seg.landmarks
    : {
        face: keepSegmentsOnPeople(seg.landmarks.face, a.labeling, chosen, PERSON_SLOP),
        bodyPoints: keepBodyOnPeople(seg.landmarks.bodyPoints, a.labeling, chosen, PERSON_SLOP),
      };
  // Dáng và nét mặt của MỌI người trong ảnh: cọ Thêm ở Sửa nét hiện lại được người chưa chọn,
  // kèm nét mặt của họ (góp ý Phase 3).
  const everyone = all ? contours : buildContours(a.grid, { maxSide: CONTOUR_SIDE });

  onProgress?.({ stage: 'save' });
  const photoId = newId('ph');
  const dir = photoDir(photoId);
  dir.create({ intermediates: true, idempotent: true });
  const source = new File(dir, 'source.jpg');
  await new File(seg.prepared.uri).copy(source);
  // Mask gốc của model (mọi người trong ảnh). Hình dáng đã chọn / đã sửa nằm trong viền.
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
    landmarks,
    rawLandmarks: seg.landmarks,
    originalContours: everyone,
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
