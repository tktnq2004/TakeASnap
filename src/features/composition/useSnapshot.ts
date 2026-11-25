/**
 * Một lần nhìn khung ngắm (Phase 5a, dùng lại ở Phase 5b): chụp lặng MỘT ảnh cỡ thật (không tiếng),
 * cắt đúng khung ngắm, thu nhỏ, phân tích qua WebView đang có (người, khung xương, mắt). Dùng cho Kiểm tra bố cục và mỗi lượt của hướng dẫn liên tục.
 *
 * Ảnh tạm không ghi ra file: ảnh camera giữ trong bộ nhớ (`pictureRef`), bản nhỏ chỉ ở dạng
 * base64 (BR-14). Camera chỉ chụp một ảnh mỗi lúc: `settled()` đợi lần chụp lặng đang chạy xong.
 */
import { groupPeople, labelRegions, photoFeatures, type PhotoFeatures } from 'composition-critic';
import type { CameraView } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useRef } from 'react';

import { useSegmenter } from '@/engine/segmentation/SegmenterProvider';
import { frameToPhotoCrop, type Rect } from '@/features/camera/frame';
import { MIN_PERSON_RATIO } from '@/features/pose/createFromImage';
import { compositionUi } from '@/ui/tokens';

import { headYaw } from './guidance';

export type Snapshot =
  | {
      kind: 'ok';
      features: PhotoFeatures;
      /** Độ quay đầu của người chính theo lưới mặt (`headYaw`), null khi không có mặt. */
      yaw: number | null;
    }
  | { kind: 'none' };

export function useSnapshot() {
  const { analyzeSnapshot } = useSegmenter();
  const capture = useRef<Promise<void> | null>(null);

  /** Chụp lặng + phân tích. `frame` theo hệ của màn xem trước (previewRect). */
  const take = async (
    cam: CameraView,
    frame: Rect,
    preview: { width: number; height: number },
  ): Promise<Snapshot> => {
    const shot = cam.takePictureAsync({ pictureRef: true, shutterSound: false });
    capture.current = shot.then(
      () => undefined,
      () => undefined,
    );
    let base64: string;
    try {
      const ref = await shot;
      capture.current = null;
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
    } finally {
      capture.current = null;
    }

    const a = await analyzeSnapshot(base64, compositionUi.checkGrid);
    const { width, height, data } = a.grid;
    const prob = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) prob[i] = data[i]! / 255;
    const people = groupPeople(labelRegions({ width, height, data: prob }), MIN_PERSON_RATIO);
    if (!people.length) return { kind: 'none' };
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
    if (features.main < 0) return { kind: 'none' };
    return { kind: 'ok', features, yaw: headYaw(features, a.faceEyes) };
  };

  /** Đợi lần chụp lặng (nếu có) xong để camera rảnh. */
  const settled = () => capture.current ?? Promise.resolve();

  return { take, settled };
}
