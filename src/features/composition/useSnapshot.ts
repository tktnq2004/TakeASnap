/**
 * Một lần nhìn khung ngắm (Phase 5a, dùng lại ở Phase 5b): chụp lặng MỘT ảnh cỡ thật (không tiếng),
 * cắt đúng khung ngắm, thu nhỏ, phân tích qua WebView đang có (người, khung xương, mắt). Dùng cho Kiểm tra bố cục và mỗi lượt của hướng dẫn liên tục.
 *
 * Ảnh tạm không ghi ra file: ảnh camera giữ trong bộ nhớ (`pictureRef`), bản nhỏ chỉ ở dạng
 * base64 (BR-14). Camera chỉ chụp một ảnh mỗi lúc: `settled()` đợi lần chụp lặng đang chạy xong.
 */
import {
  facingOf,
  groupPeople,
  jointsFrom,
  labelRegions,
  photoFeatures,
  type PhotoFeatures,
} from 'composition-critic';
import type { CameraView, PictureRef } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useRef } from 'react';

import {
  type Snapshot as SegSnapshot,
  useSegmenter,
} from '@/engine/segmentation/SegmenterProvider';
import { frameToPhotoCrop, type Rect } from '@/features/camera/frame';
import { MIN_PERSON_RATIO } from '@/features/pose/createFromImage';
import { compositionUi } from '@/ui/tokens';

import { headYaw } from './guidance';
import { headRegion, yawNearCenter } from './headRegion';

export type Snapshot =
  | {
      kind: 'ok';
      features: PhotoFeatures;
      /** Độ quay đầu của người chính theo lưới mặt (`headYaw`), null khi không có mặt. */
      yaw: number | null;
    }
  | { kind: 'none' };

export function useSnapshot() {
  const { analyzeSnapshot, headLandmarks } = useSegmenter();
  const capture = useRef<Promise<void> | null>(null);

  /**
   * Chụp lặng + phân tích. `frame` theo hệ của màn xem trước (previewRect). `gaze`: cần hướng nhìn
   * (1/3): ảnh nhỏ không thấy mặt thì cắt vùng đầu từ ảnh cỡ thật và dò mặt lại. `moved`: máy đã
   * dời từ lúc chụp thì bỏ lượt, không chạy model (phiếu Phase 5b lần 9, mục 17.2: model chạy trong
   * lúc dời máy làm khung ngắm giật).
   */
  const take = async (
    cam: CameraView,
    frame: Rect,
    preview: { width: number; height: number },
    opts: { gaze?: boolean; moved?: () => boolean } = {},
  ): Promise<Snapshot | null> => {
    const shot = cam.takePictureAsync({ pictureRef: true, shutterSound: false });
    capture.current = shot.then(
      () => undefined,
      () => undefined,
    );
    let ref: PictureRef;
    try {
      ref = await shot;
    } finally {
      capture.current = null;
    }
    try {
      if (opts.moved?.()) return null;
      const c = frameToPhotoCrop(frame, preview.width, preview.height, ref.width, ref.height);
      const base64 = await cropBase64(ref, c, compositionUi.checkSide);
      const a = await analyzeSnapshot(base64, compositionUi.checkGrid);
      let features = featuresOf(a);
      if (!features) return { kind: 'none' };
      let yaw = headYaw(features, a.faceEyes);
      if (opts.gaze && yaw == null && !opts.moved?.()) {
        // Ảnh cỡ thật nét hơn: lưới mặt trước, không thấy mặt (mặt nghiêng hẳn) thì khung xương.
        const hi = await hiResGaze(ref, c, features);
        if (hi.yaw != null) yaw = hi.yaw;
        else if (hi.facing) features = { ...features, facing: hi.facing };
      }
      return { kind: 'ok', features, yaw };
    } finally {
      ref.release();
    }
  };

  /**
   * Hướng nhìn dò lại trên vùng đầu + vai cắt từ ảnh cỡ thật (phiếu Phase 5b lần 8, mục 16.2.2:
   * người đứng xa, đầu chỉ vài chục điểm ảnh trên ảnh 512; lần 11: mặt nghiêng hẳn, lưới mặt không
   * thấy, khung xương của vùng cắt vẫn thấy). Vùng cắt rộng `headGrow` lần vùng đầu, dời xuống để có
   * vai.
   */
  const hiResGaze = async (
    ref: PictureRef,
    c: Rect,
    f: PhotoFeatures,
  ): Promise<{ yaw: number | null; facing: 'left' | 'right' | null }> => {
    const none = { yaw: null, facing: null };
    const h = headRegion(f, c.width / c.height);
    if (!h) return none;
    const head = h.side * c.height;
    const side = Math.min(Math.round(head * compositionUi.headGrow), ref.width, ref.height);
    if (head < compositionUi.headMinPx) return none;
    const x = Math.round(c.x + h.x * c.width - side / 2);
    const y = Math.round(c.y + h.y * c.height + head * compositionUi.headDrop - side / 2);
    const box = {
      x: Math.max(0, Math.min(ref.width - side, x)),
      y: Math.max(0, Math.min(ref.height - side, y)),
      width: side,
      height: side,
    };
    try {
      const r = await headLandmarks(await cropBase64(ref, box, compositionUi.headSide));
      return { yaw: yawNearCenter(r.faceEyes), facing: facingOf(jointsFrom(r.body)) };
    } catch {
      return none;
    }
  };

  /** Đợi lần chụp lặng (nếu có) xong để camera rảnh. */
  const settled = () => capture.current ?? Promise.resolve();

  return { take, settled };
}

/** Đặc trưng ảnh chụp lặng; null khi không có người. */
function featuresOf(a: SegSnapshot): PhotoFeatures | null {
  const { width, height, data } = a.grid;
  const prob = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) prob[i] = data[i]! / 255;
  const people = groupPeople(labelRegions({ width, height, data: prob }), MIN_PERSON_RATIO);
  if (!people.length) return null;
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
  return features.main < 0 ? null : features;
}

/** Cắt `c` (px của ảnh) khỏi ảnh camera, thu cạnh dài về `side`, JPEG base64. */
async function cropBase64(ref: PictureRef, c: Rect, side: number): Promise<string> {
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
  return out.base64;
}
