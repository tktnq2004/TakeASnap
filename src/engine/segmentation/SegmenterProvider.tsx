import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef } from 'react';

import { base64ToBytes } from '@/engine/base64';
import { prepareImage, type PreparedImage } from '@/engine/image';
import { downloadPack, isPackReady, readPackFileBase64 } from '@/engine/models/modelStore';
import { POSE_PACK, packBytes, SKY_PACK } from '@/engine/models/packs';

import type { Landmarks } from './types';
import { type SkyResult, useWebSegmenter } from './WebSegmenterBridge';

export type PoseProgress =
  { stage: 'download'; bytes: number; total: number } | { stage: 'load' | 'segment' | 'landmarks' };

export type PoseSegmentation = {
  prepared: PreparedImage;
  /** Mask PNG (alpha = xác suất là người) cùng kích thước ảnh đã chuẩn hóa. */
  maskBase64: string;
  /** Lưới alpha 0..255 cạnh dài ≤ 512, để dò viền. */
  grid: { width: number; height: number; data: Uint8Array };
  /** Ảnh xám cạnh dài ≤ `GRAY_SIDE` cho bộ dò đường thẳng (Phase 5a); null khi trang cũ không trả. */
  gray: { width: number; height: number; data: Uint8Array } | null;
  landmarks: Landmarks;
  /** Khung xương mọi người trong ảnh (tới 6, mỗi cái 33 khớp phẳng); không lưu vào pose. */
  bodies: number[][];
  /** Giữa hai mắt của từng mặt bộ dò mặt tìm được [x, y]. */
  faceEyes: number[][];
} & SkyPart;

/** Mặt nạ trời (1 = trời) khi gọi với `{ sky: true }` và gói trời đã có (Phase 5a). */
export type SkyPart = {
  sky: { width: number; height: number; data: Uint8Array } | null;
  /** Thời gian chạy model trời (ms), null khi không chạy. */
  skyMs: number | null;
  /** Thời gian nạp TF.js + model lần đầu trong trang (ms), 0 khi đã nạp. */
  skyLoadMs: number | null;
  /** 'off': không xin; 'noPack': xin nhưng gói trời chưa tải; 'ran': đã chạy (có thể lỗi). */
  skyState: 'off' | 'noPack' | 'ran';
  skyError: string | null;
};

/** `sky`: chạy thêm model trời nếu gói trời đã tải (không tự tải). */
export type SkyOpt = { sky?: boolean };

type Ctx = {
  /** Ảnh trong máy → mask + lưới + nét mặt. Tự tải gói pose lần đầu (BR-13). */
  segmentForPose: (
    input: { uri: string; width: number; height: number },
    onProgress?: (p: PoseProgress) => void,
    opts?: SkyOpt,
  ) => Promise<PoseSegmentation>;
  /**
   * Ảnh chụp lặng của nút Kiểm tra bố cục (Phase 5a): JPEG base64 đã cắt theo khung và thu nhỏ →
   * lưới người + mọi khung xương + mắt từ bộ dò mặt. Không tự tải gói: gọi khi gói đã có.
   */
  analyzeSnapshot: (base64: string, gridSide: number, opts?: SkyOpt) => Promise<Snapshot>;
};

export type Snapshot = {
  width: number;
  height: number;
  /** Alpha 0..255 (xác suất là người), cạnh dài ≤ gridSide. */
  grid: { width: number; height: number; data: Uint8Array };
  gray: { width: number; height: number; data: Uint8Array } | null;
  bodyPoints: number[] | null;
  bodies: number[][];
  faceEyes: number[][];
} & SkyPart;

const SegmenterContext = createContext<Ctx | null>(null);

/** Cạnh dài của ảnh gửi vào model (roadmap §3.3) và của lưới dò viền. */
const IMAGE_SIDE = 1024;
const GRID_SIDE = 512;
/** Ảnh xám cho bộ dò đường thẳng (composition-critic `lines.ts` đo ở cỡ này). */
export const GRAY_SIDE = 256;
/** Cạnh dài ảnh vào model trời (composition-critic `SKY_SIDE`, đo ở scripts/sky-eval.ts). */
export const SKY_SIDE = 513;

const grayOf = (g: { width: number; height: number; base64: string } | undefined) =>
  g ? { width: g.width, height: g.height, data: base64ToBytes(g.base64) } : null;

/**
 * Model trời lỗi thì bỏ qua (dò chân trời như không có trời); lý do giữ lại để bản dev hiện
 * (phiếu phase5a 6.3).
 */
const skyOf = (r: SkyResult, opts: SkyOpt | undefined, ran: boolean): SkyPart => {
  if (r.skyError && __DEV__) console.warn('Model trời lỗi:', r.skyError);
  return {
    sky: grayOf(r.sky),
    skyMs: r.sky ? (r.skyMs ?? null) : null,
    skyLoadMs: r.sky ? (r.skyLoadMs ?? null) : null,
    skyState: !opts?.sky ? 'off' : ran ? 'ran' : 'noPack',
    skyError: r.skyError ?? (ran && !r.sky ? 'trang không trả mặt nạ trời' : null),
  };
};

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
  const skyGeneration = useRef(-1);

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

    /** Gửi gói trời vào trang (một lần mỗi lần trang nạp). False khi gói chưa tải. */
    const ensureSky = async (opts?: SkyOpt) => {
      if (!opts?.sky || !isPackReady(SKY_PACK)) return false;
      const s = segRef.current;
      if (skyGeneration.current === s.generation()) return true;
      for (const f of SKY_PACK.files) {
        await s.sendAsset(f.name, f.mime, await readPackFileBase64(SKY_PACK, f.name));
      }
      skyGeneration.current = s.generation();
      return true;
    };

    return {
      segmentForPose: async (input, onProgress, opts) => {
        await ensurePoseLoaded(onProgress);
        const sky = await ensureSky(opts);
        const prepared = await prepareImage(input.uri, input.width, input.height, IMAGE_SIDE);
        onProgress?.({ stage: 'segment' });
        const s = segRef.current;
        const r = await s.run(
          'multiclass',
          prepared.base64,
          GRID_SIDE,
          GRAY_SIDE,
          sky ? SKY_SIDE : undefined,
        );
        if (!r.grid) throw new Error('WebView không trả lưới mask');
        onProgress?.({ stage: 'landmarks' });
        const lm = await s.landmarks(prepared.base64);
        return {
          prepared,
          maskBase64: r.maskBase64,
          grid: { width: r.grid.width, height: r.grid.height, data: base64ToBytes(r.grid.base64) },
          gray: grayOf(r.gray),
          landmarks: { face: lm.face ?? null, bodyPoints: lm.bodyPoints ?? null },
          bodies: lm.bodies ?? (lm.bodyPoints ? [lm.bodyPoints] : []),
          faceEyes: lm.faceEyes ?? [],
          ...skyOf(r, opts, sky),
        };
      },
      analyzeSnapshot: async (base64, gridSide, opts) => {
        if (!isPackReady(POSE_PACK)) throw new Error('Chưa có bộ tách người');
        await ensurePoseLoaded();
        const sky = await ensureSky(opts);
        const s = segRef.current;
        const r = await s.run(
          'multiclass',
          base64,
          gridSide,
          GRAY_SIDE,
          sky ? SKY_SIDE : undefined,
        );
        if (!r.grid) throw new Error('WebView không trả lưới mask');
        const lm = await s.landmarks(base64);
        return {
          width: r.width,
          height: r.height,
          grid: { width: r.grid.width, height: r.grid.height, data: base64ToBytes(r.grid.base64) },
          gray: grayOf(r.gray),
          bodyPoints: lm.bodyPoints ?? null,
          bodies: lm.bodies ?? (lm.bodyPoints ? [lm.bodyPoints] : []),
          faceEyes: lm.faceEyes ?? [],
          ...skyOf(r, opts, sky),
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
