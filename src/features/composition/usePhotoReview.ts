/**
 * Chạy nhận xét bố cục cho một ảnh vừa chụp (business-flow §6.5): tách người + khung xương qua
 * WebView đang có (`useSegmenter`), rút đặc trưng, áp quy tắc. Kết quả giữ theo mã ảnh trong lần
 * mở app này, nên vuốt qua lại không chạy lại.
 *
 * - Chỉ chạy khi ảnh chụp lúc đang bật một kỹ thuật bố cục.
 * - Chưa có bộ tách người thì không tự tải (tốn dung lượng mạng): màn hiện nút tải, người dùng
 *   bấm mới tải (`allowDownload`).
 * - Mỗi lúc một ảnh qua WebView (chung với tạo pose), các yêu cầu xếp hàng.
 */
import {
  photoFeatures,
  type PhotoFeatures,
  type Review,
  reviewPhoto,
  RULE,
  type Scene,
} from 'composition-critic';
import { useEffect } from 'react';
import { create } from 'zustand';

import { isPackReady } from '@/engine/models/modelStore';
import { POSE_PACK } from '@/engine/models/packs';
import { type PoseProgress, useSegmenter } from '@/engine/segmentation/SegmenterProvider';
import type { SessionPhoto } from '@/features/camera/sessionPhotos';
import type { TechniqueId } from '@/features/composition/techniques';
import { analyzeImage, PoseCreateError } from '@/features/pose/createFromImage';

import { sceneFor } from './scene';

export type ReviewEntry =
  | { status: 'running'; stage: PoseProgress['stage'] | 'queued' }
  | { status: 'done'; features: PhotoFeatures; review: Review; scene: Scene | null }
  | { status: 'none' }
  | { status: 'error' };

type State = {
  byId: Record<string, ReviewEntry>;
  set: (id: string, e: ReviewEntry) => void;
  clear: (id: string) => void;
};

export const useReviewNotes = create<State>()((set) => ({
  byId: {},
  set: (id, e) => set((s) => ({ byId: { ...s.byId, [id]: e } })),
  clear: (id) =>
    set((s) => {
      const { [id]: _, ...rest } = s.byId;
      return { byId: rest };
    }),
}));

/** Kỹ thuật không có nhận xét sau khi chụp. */
const NO_REVIEW = new Set<TechniqueId>(['off', 'grid', 'grid4']);

/**
 * Nhận xét chung bố cục chính và bố cục phụ (Phase 5b): dòng chưa đạt trước (chính trước phụ),
 * tối đa `RULE.maxNotes` dòng; khung cắt gợi ý theo bố cục chính.
 */
export function combinedReview(
  main: TechniqueId,
  scene: TechniqueId | null,
  f: PhotoFeatures,
  s: Scene | null,
): Review {
  const a = NO_REVIEW.has(main) ? null : reviewPhoto(main, f, s ?? undefined);
  if (!scene) return a ?? { notes: [], crop: null };
  const b = reviewPhoto(scene, f, s ?? undefined);
  if (!a) return b;
  const seen = new Set<string>();
  const all = [...a.notes, ...b.notes].filter((n) =>
    seen.has(n.id) ? false : (seen.add(n.id), true),
  );
  return {
    notes: [...all.filter((n) => !n.ok), ...all.filter((n) => n.ok)].slice(0, RULE.maxNotes),
    crop: a.crop,
  };
}

/** Hàng đợi một ảnh một lần qua WebView. */
let chain: Promise<unknown> = Promise.resolve();

export function usePhotoReview(photo: SessionPhoto | undefined, allowDownload: boolean) {
  const { segmentForPose } = useSegmenter();
  const entry = useReviewNotes((s) => (photo ? s.byId[photo.assetId] : undefined));
  const packReady = isPackReady(POSE_PACK);
  // Lưới chỉ để căn khung, không phải kỹ thuật: không nhận xét (phiếu Phase 5 lần 9).
  const wanted = !!photo && (!NO_REVIEW.has(photo.technique) || !!photo.scene);
  const canRun = wanted && !entry && (packReady || allowDownload);

  useEffect(() => {
    if (!canRun || !photo) return;
    const { set } = useReviewNotes.getState();
    const id = photo.assetId;
    set(id, { status: 'running', stage: 'queued' });
    chain = chain.then(async () => {
      try {
        // Đường chân trời: chạy thêm model trời nếu gói trời đã có (không tự tải ở đây).
        const sky = photo.technique === 'horizon' || photo.scene === 'horizon';
        const a = await analyzeImage(
          (input, onProgress) => segmentForPose(input, onProgress, { sky }),
          { uri: photo.uri, width: photo.width, height: photo.height },
          (p) => {
            if (p.stage !== 'contour' && p.stage !== 'save')
              set(id, { status: 'running', stage: p.stage });
          },
        );
        const features = photoFeatures({
          width: photo.width,
          height: photo.height,
          gridW: a.grid.width,
          gridH: a.grid.height,
          people: a.people,
          body: a.seg.landmarks.bodyPoints,
          bodies: a.seg.bodies,
          faceEyes: a.seg.faceEyes,
        });
        const s = sceneFor(a.seg.gray, a.seg.grid, features, a.seg.sky)?.scene ?? null;
        set(id, {
          status: 'done',
          features,
          review: combinedReview(photo.technique, photo.scene ?? null, features, s),
          scene: s,
        });
      } catch (e) {
        set(id, e instanceof PoseCreateError ? { status: 'none' } : { status: 'error' });
      }
    });
  }, [canRun, photo, segmentForPose]);

  return { entry, wanted, packReady };
}
