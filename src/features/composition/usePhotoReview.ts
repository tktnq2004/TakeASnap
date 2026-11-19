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
import { useEffect } from 'react';
import { create } from 'zustand';

import { isPackReady } from '@/engine/models/modelStore';
import { POSE_PACK } from '@/engine/models/packs';
import { type PoseProgress, useSegmenter } from '@/engine/segmentation/SegmenterProvider';
import type { SessionPhoto } from '@/features/camera/sessionPhotos';
import { analyzeImage, PoseCreateError } from '@/features/pose/createFromImage';

import { photoFeatures, type PhotoFeatures } from './features';
import { type Review, reviewPhoto } from './review';

export type ReviewEntry =
  | { status: 'running'; stage: PoseProgress['stage'] | 'queued' }
  | { status: 'done'; features: PhotoFeatures; review: Review }
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

/** Hàng đợi một ảnh một lần qua WebView. */
let chain: Promise<unknown> = Promise.resolve();

export function usePhotoReview(photo: SessionPhoto | undefined, allowDownload: boolean) {
  const { segmentForPose } = useSegmenter();
  const entry = useReviewNotes((s) => (photo ? s.byId[photo.assetId] : undefined));
  const packReady = isPackReady(POSE_PACK);
  const wanted = !!photo && photo.technique !== 'off';
  const canRun = wanted && !entry && (packReady || allowDownload);

  useEffect(() => {
    if (!canRun || !photo) return;
    const { set } = useReviewNotes.getState();
    const id = photo.assetId;
    set(id, { status: 'running', stage: 'queued' });
    chain = chain.then(async () => {
      try {
        const a = await analyzeImage(
          segmentForPose,
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
        });
        set(id, { status: 'done', features, review: reviewPhoto(photo.technique, features) });
      } catch (e) {
        set(id, e instanceof PoseCreateError ? { status: 'none' } : { status: 'error' });
      }
    });
  }, [canRun, photo, segmentForPose]);

  return { entry, wanted, packReady };
}
