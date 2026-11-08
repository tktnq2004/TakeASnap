/**
 * Chụp → cắt đúng vùng khung ngắm → lưu album "TakeASnap" (business-flow §4.1, BR-01, BR-02).
 * Overlay là view riêng nằm trên preview nên ảnh chụp không bao giờ kèm overlay.
 */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Album, Asset, requestPermissionsAsync } from 'expo-media-library';

import { frameToPhotoCrop, type Rect } from './frame';

export const ALBUM = 'TakeASnap';

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
): Promise<Shot> {
  const crop = frameToPhotoCrop(frame, preview.width, preview.height, shot.width, shot.height);
  const ref = await ImageManipulator.manipulate(shot.uri)
    .crop({ originX: crop.x, originY: crop.y, width: crop.width, height: crop.height })
    .renderAsync();
  const out = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.92 });
  return { uri: out.uri, width: out.width, height: out.height };
}

/**
 * Lưu vào album riêng. Chỉ xin quyền ảnh: mặc định SDK 58 xin cả âm thanh, Expo Go trên Android
 * không khai báo quyền đó nên bị từ chối (spike D).
 */
export async function saveToAlbum(uri: string): Promise<void> {
  const perm = await requestPermissionsAsync(false, ['photo']);
  if (perm.status !== 'granted') throw new PhotoPermissionError('photo permission');
  const album = await Album.get(ALBUM);
  if (album) {
    await Asset.create(uri, album);
  } else {
    const asset = await Asset.create(uri);
    await Album.create(ALBUM, [asset]);
  }
}
