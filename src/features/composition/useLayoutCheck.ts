/**
 * Kiểm tra bố cục (Phase 5a, business-flow §6.4): người dùng chạm nút thì chụp lặng MỘT ảnh cỡ
 * thật (không tiếng), cắt đúng khung ngắm, thu nhỏ, phân tích một lần qua WebView đang có rồi áp
 * quy tắc nhận xét của kỹ thuật đang chọn. Không chạy nền, không theo dõi liên tục (cổng Phase 5
 * Bước 3: Expo Go chỉ lấy được ảnh bằng cách chụp thật).
 *
 * - Bấm chụp lúc đang kiểm tra: `cancel()` bỏ kết quả; nút chụp đợi lần chụp lặng xong
 *   (`settled()`, camera chỉ chụp một ảnh mỗi lúc) rồi chụp ngay.
 * - Ảnh tạm không ghi ra file: ảnh camera giữ trong bộ nhớ (`pictureRef`), bản nhỏ chỉ ở dạng
 *   base64 (BR-14).
 */
import {
  groupPeople,
  labelRegions,
  type Note,
  photoFeatures,
  type PhotoFeatures,
  reviewPhoto,
} from 'composition-critic';
import type { CameraView } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useEffect, useRef, useState } from 'react';

import { useSegmenter } from '@/engine/segmentation/SegmenterProvider';
import { frameToPhotoCrop, type Rect } from '@/features/camera/frame';
import { MIN_PERSON_RATIO } from '@/features/pose/createFromImage';
import { haptic } from '@/lib/haptics';
import { compositionUi } from '@/ui/tokens';

import type { TechniqueId } from './techniques';

export type CheckResult =
  | {
      kind: 'review';
      technique: TechniqueId;
      features: PhotoFeatures;
      /** Dòng chưa đạt đầu tiên (kỹ thuật trước dòng chung); null = mọi dòng đều đạt. */
      note: Note | null;
    }
  | { kind: 'none' }
  | { kind: 'error' };

/** Kỹ thuật có nút Kiểm tra bố cục (giống nhận xét sau khi chụp: lưới chỉ để căn khung). */
export const CHECKABLE = (t: TechniqueId) => t !== 'off' && t !== 'grid' && t !== 'grid4';

export function useLayoutCheck() {
  const { analyzeSnapshot } = useSegmenter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  /** Tăng mỗi lần bắt đầu / hủy: kết quả của lần cũ về muộn thì bỏ. */
  const token = useRef(0);
  const capture = useRef<Promise<void> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
  };
  useEffect(() => clearHide, []);

  const show = (r: CheckResult) => {
    setResult(r);
    clearHide();
    hideTimer.current = setTimeout(() => setResult(null), compositionUi.checkShowMs);
  };

  const run = async (
    cam: CameraView,
    frame: Rect,
    preview: { width: number; height: number },
    technique: TechniqueId,
  ) => {
    if (busy) return;
    const my = ++token.current;
    setBusy(true);
    setResult(null);
    clearHide();
    try {
      const shot = cam.takePictureAsync({ pictureRef: true, shutterSound: false });
      capture.current = shot.then(
        () => undefined,
        () => undefined,
      );
      const ref = await shot;
      capture.current = null;
      let base64: string;
      try {
        const c = frameToPhotoCrop(frame, preview.width, preview.height, ref.width, ref.height);
        const side = compositionUi.checkSide;
        const ctx = ImageManipulator.manipulate(ref).crop({
          originX: c.x,
          originY: c.y,
          width: c.width,
          height: c.height,
        });
        if (c.width >= c.height) ctx.resize({ width: Math.min(side, c.width) });
        else ctx.resize({ height: Math.min(side, c.height) });
        const img = await ctx.renderAsync();
        const out = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.85, base64: true });
        ctx.release();
        img.release();
        if (!out.base64) throw new Error('Không đọc được ảnh nhỏ');
        base64 = out.base64;
      } finally {
        ref.release();
      }
      if (token.current !== my) return;

      const a = await analyzeSnapshot(base64, compositionUi.checkGrid);
      if (token.current !== my) return;
      const { width, height, data } = a.grid;
      const prob = new Float32Array(data.length);
      for (let i = 0; i < data.length; i++) prob[i] = data[i]! / 255;
      const people = groupPeople(labelRegions({ width, height, data: prob }), MIN_PERSON_RATIO);
      if (!people.length) {
        show({ kind: 'none' });
        return;
      }
      const features = photoFeatures({
        width: a.width,
        height: a.height,
        gridW: width,
        gridH: height,
        people,
        body: a.bodyPoints,
        bodies: a.bodies,
        faceEyes: a.faceEyes,
      });
      if (features.main < 0) {
        show({ kind: 'none' });
        return;
      }
      const review = reviewPhoto(technique, features);
      const failing = review.notes.find((n) => !n.ok) ?? null;
      if (!failing) haptic.levelReached();
      show({
        kind: 'review',
        technique,
        features,
        note: failing,
      });
    } catch {
      if (token.current === my) show({ kind: 'error' });
    } finally {
      capture.current = null;
      if (token.current === my) setBusy(false);
    }
  };

  /** Bỏ lần kiểm tra đang chạy và kết quả đang hiện (bấm chụp, đổi kỹ thuật, đổi camera). */
  const cancel = () => {
    token.current++;
    clearHide();
    setBusy(false);
    setResult(null);
  };

  /** Đợi lần chụp lặng (nếu có) xong để camera rảnh. */
  const settled = () => capture.current ?? Promise.resolve();

  return { busy, result, run, cancel, settled };
}
