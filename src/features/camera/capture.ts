/**
 * Chụp → cắt đúng vùng khung ngắm → lưu album "SnapShot" (business-flow §4.1, BR-01, BR-02).
 * Overlay là view riêng nằm trên preview nên ảnh chụp không bao giờ kèm overlay.
 */
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Album, Asset, requestPermissionsAsync } from 'expo-media-library';

import { frameCrop, frameToPhotoCrop, isWholeImage, type Rect, type Turn } from './frame';

/** Album lưu ảnh. App đổi tên từ TakeASnap ở Phase 4; ảnh chụp trước đó vẫn ở album cũ. */
export const ALBUM = 'SnapShot';

export class PhotoPermissionError extends Error {}

export type Shot = { uri: string; width: number; height: number };

/**
 * Cắt ảnh chụp về đúng khung. `preview` là kích thước view của CameraView (phủ kín màn hình,
 * preview kiểu cover). Ảnh từ `takePictureAsync` (không bật skipProcessing) đã xoay đúng chiều,
 * nên width/height là của ảnh dựng thẳng.
 */
export async function cropToFrame(
  shot: Shot,
  frame: Rect,
  preview: { width: number; height: number },
  /** Máy cầm ngang lúc bấm (phiếu Phase 5b lần 18). */
  turn: Turn = 0,
): Promise<Shot> {
  if (turn !== 0) return cropSideways(shot, frame, preview, turn);
  const crop = frameToPhotoCrop(frame, preview.width, preview.height, shot.width, shot.height);
  // Khung 3:4 trùng cả ảnh: không giải mã / mã hóa lại (nhanh hơn nhiều khi chụp liên tục).
  if (isWholeImage(crop, shot)) return shot;
  const ref = await ImageManipulator.manipulate(shot.uri)
    .crop({ originX: crop.x, originY: crop.y, width: crop.width, height: crop.height })
    .renderAsync();
  const out = await ref.saveAsync({ format: SaveFormat.JPEG, compress: PHOTO_QUALITY });
  return { uri: out.uri, width: out.width, height: out.height };
}

/**
 * Cầm ngang: khung 3:4 trùng cả ảnh thì giữ nguyên ảnh (phiếu lần 17, mục 25.8: ảnh lưu đã ngang
 * đúng chiều trên cả hai máy). Khung khác (1:1, 9:16): giải mã để biết ảnh đã xoay ngang hay còn
 * dọc rồi mới cắt (`frameCrop`), xoay cho đứng nếu cần.
 */
async function cropSideways(
  shot: Shot,
  frame: Rect,
  preview: { width: number; height: number },
  turn: Turn,
): Promise<Shot> {
  const w = Math.min(shot.width, shot.height);
  const h = Math.max(shot.width, shot.height);
  const whole = frameToPhotoCrop(frame, preview.width, preview.height, w, h);
  if (isWholeImage(whole, { width: w, height: h })) return shot;
  const src = await ImageManipulator.manipulate(shot.uri).renderAsync();
  const cut = frameCrop(frame, preview.width, preview.height, src.width, src.height, turn);
  const ctx = ImageManipulator.manipulate(src).crop({
    originX: cut.rect.x,
    originY: cut.rect.y,
    width: cut.rect.width,
    height: cut.rect.height,
  });
  if (cut.rotate) ctx.rotate(cut.rotate);
  const ref = await ctx.renderAsync();
  const out = await ref.saveAsync({ format: SaveFormat.JPEG, compress: PHOTO_QUALITY });
  ctx.release();
  src.release();
  ref.release();
  return { uri: out.uri, width: out.width, height: out.height };
}

/**
 * Cắt ảnh theo khung chuẩn hóa 0..1 (khung cắt gợi ý của nhận xét bố cục, business-flow §6.5).
 * Lưu thành file mới; ảnh gốc giữ nguyên (BR-15).
 */
export async function cropNormalized(
  shot: Shot,
  c: { x: number; y: number; w: number; h: number },
): Promise<Shot> {
  const originX = Math.round(c.x * shot.width);
  const originY = Math.round(c.y * shot.height);
  const width = Math.min(shot.width - originX, Math.round(c.w * shot.width));
  const height = Math.min(shot.height - originY, Math.round(c.h * shot.height));
  const ref = await ImageManipulator.manipulate(shot.uri)
    .crop({ originX, originY, width, height })
    .renderAsync();
  const out = await ref.saveAsync({ format: SaveFormat.JPEG, compress: PHOTO_QUALITY });
  return { uri: out.uri, width: out.width, height: out.height };
}

/** Chất lượng JPEG khi chụp và khi cắt (cùng một mức để ảnh không cắt và ảnh cắt như nhau). */
export const PHOTO_QUALITY = 0.92;

/** Xóa file tạm (ảnh gốc của camera sau khi đã cắt). Lỗi thì bỏ qua: cache sẽ được dọn sau. */
export function deleteTemp(uri: string) {
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // bỏ qua
  }
}

/**
 * Lưu vào album riêng, trả về mã ảnh trong thư viện (để Xem ảnh vừa chụp xóa được). Chỉ xin quyền
 * ảnh: mặc định SDK 58 xin cả âm thanh, Expo Go trên Android không khai báo quyền đó nên bị từ
 * chối (spike D).
 */
export async function saveToAlbum(uri: string): Promise<string> {
  // Chụp liên tục: quyền và album chỉ hỏi một lần, các ảnh sau chỉ còn bước ghi ảnh.
  if (!photoGranted) {
    const perm = await requestPermissionsAsync(false, ['photo']);
    if (perm.status !== 'granted') throw new PhotoPermissionError('photo permission');
    photoGranted = true;
  }
  if (cachedAlbum) {
    try {
      return (await Asset.create(uri, cachedAlbum)).id;
    } catch {
      // Album có thể đã bị xóa ngoài app: tìm lại bên dưới.
      cachedAlbum = null;
    }
  }
  const album = await Album.get(ALBUM);
  if (album) {
    cachedAlbum = album;
    return (await Asset.create(uri, album)).id;
  }
  const asset = await Asset.create(uri);
  cachedAlbum = await Album.create(ALBUM, [asset]);
  return asset.id;
}

let photoGranted = false;
let cachedAlbum: Album | null = null;

/** Xóa một ảnh khỏi thư viện ảnh của máy (iOS hỏi xác nhận thêm một lần). */
export async function deleteFromLibrary(assetId: string): Promise<void> {
  await new Asset(assetId).delete();
}
