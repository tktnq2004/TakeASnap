/**
 * Kho gói model trong máy: Paths.document/models/<pack>/ (BR-13). Tải một lần từ CDN gốc, kiểm
 * tra đủ dung lượng, sau đó dùng offline.
 */
import { Directory, DownloadTask, File, Paths } from 'expo-file-system';

import type { ModelPack } from './packs';

export type DownloadProgress = { bytes: number; total: number };

function packDir(pack: ModelPack): Directory {
  return new Directory(Paths.document, 'models', pack.id);
}

function packFile(pack: ModelPack, name: string): File {
  return new File(packDir(pack), name);
}

/** Đủ mọi file, đúng dung lượng, đúng phiên bản. */
export function isPackReady(pack: ModelPack): boolean {
  const manifest = packFile(pack, 'manifest.json');
  if (!manifest.exists) return false;
  try {
    const m = JSON.parse(manifest.textSync()) as { version?: string };
    if (m.version !== pack.version) return false;
  } catch {
    return false;
  }
  return pack.files.every((f) => {
    const file = packFile(pack, f.name);
    return file.exists && file.size === f.bytes;
  });
}

/**
 * Tải các file còn thiếu. Mỗi file tải vào `<tên>.part` rồi mới đổi tên khi đủ dung lượng, nên
 * mất mạng giữa chừng không để lại file hỏng. Ghi manifest cuối cùng.
 */
export async function downloadPack(
  pack: ModelPack,
  onProgress?: (p: DownloadProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  const dir = packDir(pack);
  dir.create({ intermediates: true, idempotent: true });
  const total = pack.files.reduce((s, f) => s + f.bytes, 0);
  let done = 0;

  for (const f of pack.files) {
    const target = packFile(pack, f.name);
    if (target.exists && target.size === f.bytes) {
      done += f.bytes;
      onProgress?.({ bytes: done, total });
      continue;
    }
    if (target.exists) target.delete();
    const part = packFile(pack, `${f.name}.part`);
    if (part.exists) part.delete();

    const base = done;
    const task = new DownloadTask(f.url, part, {
      signal,
      onProgress: (p) => onProgress?.({ bytes: base + p.bytesWritten, total }),
    });
    const file = await task.downloadAsync();
    if (!file) throw new Error('Đã hủy tải bộ tách người');
    if (part.size !== f.bytes) {
      part.delete();
      throw new Error(`Tải thiếu dữ liệu: ${f.name}`);
    }
    await part.move(target);
    done += f.bytes;
    onProgress?.({ bytes: done, total });
  }

  const manifest = packFile(pack, 'manifest.json');
  if (manifest.exists) manifest.delete();
  manifest.create();
  await manifest.write(
    JSON.stringify({
      version: pack.version,
      files: pack.files.map(({ name, bytes }) => ({ name, bytes })),
    }),
  );
}

/** Đọc một file của gói thành base64 (để gửi vào WebView). */
export function readPackFileBase64(pack: ModelPack, name: string): Promise<string> {
  return packFile(pack, name).base64();
}
