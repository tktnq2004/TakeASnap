import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export type PreparedImage = {
  /** File JPEG tạm (cache) đã thu nhỏ; chỉ để xử lý, không lưu lâu dài. */
  uri: string;
  base64: string;
  width: number;
  height: number;
};

/**
 * Thu nhỏ ảnh để cạnh dài ≤ maxSide rồi trả về JPEG base64 để gửi vào WebView (roadmap §3.3:
 * pose dùng 1024 px). Ảnh nhỏ hơn maxSide giữ nguyên kích thước.
 */
export async function prepareImage(
  uri: string,
  srcWidth: number,
  srcHeight: number,
  maxSide = 1024,
): Promise<PreparedImage> {
  const ctx = ImageManipulator.manipulate(uri);
  const longest = Math.max(srcWidth, srcHeight);
  if (longest > maxSide) {
    if (srcWidth >= srcHeight) ctx.resize({ width: maxSide });
    else ctx.resize({ height: maxSide });
  }
  const ref = await ctx.renderAsync();
  const out = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.9, base64: true });
  if (!out.base64) throw new Error('Không đọc được dữ liệu ảnh');
  return { uri: out.uri, base64: out.base64, width: out.width, height: out.height };
}
