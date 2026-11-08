import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef } from 'react';

import { base64ToBytes } from '@/engine/base64';
import { prepareImage, type PreparedImage } from '@/engine/image';
import { downloadPack, isPackReady, readPackFileBase64 } from '@/engine/models/modelStore';
import { POSE_PACK, packBytes } from '@/engine/models/packs';

import type { Landmarks } from './types';
import { useWebSegmenter } from './WebSegmenterBridge';

export type PoseProgress =
  { stage: 'download'; bytes: number; total: number } | { stage: 'load' | 'segment' | 'landmarks' };

export type PoseSegmentation = {
  prepared: PreparedImage;
  /** Mask PNG (alpha = xác suất là người) cùng kích thước ảnh đã chuẩn hóa. */
  maskBase64: string;
  /** Lưới alpha 0..255 cạnh dài ≤ 512, để dò viền. */
  grid: { width: number; height: number; data: Uint8Array };
  landmarks: Landmarks;
};

type Ctx = {
  /** Ảnh trong máy → mask + lưới + nét mặt. Tự tải gói pose lần đầu (BR-13). */
  segmentForPose: (
    input: { uri: string; width: number; height: number },
    onProgress?: (p: PoseProgress) => void,
  ) => Promise<PoseSegmentation>;
};

const SegmenterContext = createContext<Ctx | null>(null);

/** Cạnh dài của ảnh gửi vào model (roadmap §3.3) và của lưới dò viền. */
const IMAGE_SIDE = 1024;
const GRID_SIDE = 512;

/**
 * Gắn một WebView ẩn chế độ 'local' ở gốc app (roadmap §3.7). Gói model chỉ được gửi vào trang
 * khi cần lần đầu trong phiên, và gửi lại nếu trang bị hệ điều hành nạp lại.
 */
export function SegmenterProvider({ children }: { children: ReactNode }) {
  const seg = useWebSegmenter('local');
  // Hàm của bridge dùng ref bên trong nên gọi bản cũ vẫn đúng; giữ bản mới nhất cho chắc.
  const segRef = useRef(seg);
  useEffect(() => {
    segRef.current = seg;
  });
  const loadedGeneration = useRef(-1);

  const value = useMemo<Ctx>(() => {
    const waitReady = async () => {
      for (let i = 0; i < 150 && segRef.current.generation() === 0; i++) {
        await new Promise((r) => setTimeout(r, 100));
      }
      if (segRef.current.generation() === 0) throw new Error('WebView tách người chưa sẵn sàng');
    };

    const ensurePoseLoaded = async (onProgress?: (p: PoseProgress) => void) => {
      if (!isPackReady(POSE_PACK)) {
        const total = packBytes(POSE_PACK);
        onProgress?.({ stage: 'download', bytes: 0, total });
        await downloadPack(POSE_PACK, (p) => onProgress?.({ stage: 'download', ...p }));
      }
      await waitReady();
      const s = segRef.current;
      if (loadedGeneration.current === s.generation()) return;
      onProgress?.({ stage: 'load' });
      for (const f of POSE_PACK.files) {
        await s.sendAsset(f.name, f.mime, await readPackFileBase64(POSE_PACK, f.name));
      }
      loadedGeneration.current = s.generation();
    };

    return {
      segmentForPose: async (input, onProgress) => {
        await ensurePoseLoaded(onProgress);
        const prepared = await prepareImage(input.uri, input.width, input.height, IMAGE_SIDE);
        onProgress?.({ stage: 'segment' });
        const s = segRef.current;
        const r = await s.run('multiclass', prepared.base64, GRID_SIDE);
        if (!r.grid) throw new Error('WebView không trả lưới mask');
        onProgress?.({ stage: 'landmarks' });
        const lm = await s.landmarks(prepared.base64);
        return {
          prepared,
          maskBase64: r.maskBase64,
          grid: { width: r.grid.width, height: r.grid.height, data: base64ToBytes(r.grid.base64) },
          landmarks: { face: lm.face ?? null, bodyPoints: lm.bodyPoints ?? null },
        };
      },
    };
  }, []);

  return (
    <SegmenterContext.Provider value={value}>
      {children}
      {seg.element}
    </SegmenterContext.Provider>
  );
}

export function useSegmenter(): Ctx {
  const ctx = useContext(SegmenterContext);
  if (!ctx) throw new Error('useSegmenter phải nằm trong SegmenterProvider');
  return ctx;
}
