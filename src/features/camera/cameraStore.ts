/**
 * Trạng thái của Camera, nhớ qua các lần mở app (expo-sqlite/kv-store, ghi đồng bộ nên đọc lại
 * được ngay khi khởi động, không nháy giá trị mặc định).
 *
 * - Cài đặt camera: flash, lưới, thước, hẹn giờ, tỉ lệ khung.
 * - Pose đang dùng + điều khiển nhanh: độ hiện, lật ngang (business-flow §4.4).
 * - Vị trí cột công cụ pose (design.md §6.1): mép trái / phải và độ cao trong khung ngắm.
 * - Placement theo từng pose (BR-10): lưu riêng một khóa mỗi pose, chỉ ghi khi nhấc tay.
 */
import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Placement } from '@/gestures/useTransformGesture';

import type { AspectId } from './frame';

export type FlashMode = 'off' | 'on' | 'auto';
export type GridMode = 'off' | '3' | '4';
export type TimerSec = 0 | 3 | 10;
/** Độ hiện overlay: chạm để đổi nhanh qua 3 mức này; giữ nút để kéo liên tục 0–100%. */
export const OVERLAY_OPACITY = [1, 0.6, 0.3] as const;

/** Mức kế tiếp khi chạm nút độ hiện: 100% → 60% → 30% → 100%. */
export function nextOpacity(v: number): number {
  if (v > 0.8) return OVERLAY_OPACITY[1];
  if (v > 0.45) return OVERLAY_OPACITY[2];
  return OVERLAY_OPACITY[0];
}

export type RailSide = 'left' | 'right';

type State = {
  flash: FlashMode;
  grid: GridMode;
  level: boolean;
  timer: TimerSec;
  aspect: AspectId;
  poseId: string | null;
  /** 0..1. */
  opacity: number;
  mirrored: boolean;
  railSide: RailSide;
  /** Tâm cột theo chiều cao khung ngắm, 0 = mép trên, 1 = mép dưới. */
  railY: number;
};

type Actions = {
  cycleFlash: () => void;
  cycleGrid: () => void;
  toggleLevel: () => void;
  cycleTimer: () => void;
  cycleAspect: () => void;
  selectPose: (id: string) => void;
  /** Pose đang dùng vừa được sửa thành bản mới: dùng bản mới, giữ vị trí và lật ngang. */
  replacePose: (id: string) => void;
  clearPose: () => void;
  cycleOpacity: () => void;
  setOpacity: (v: number) => void;
  toggleMirror: () => void;
  setGrid: (g: GridMode) => void;
  setRail: (side: RailSide, y: number) => void;
};

const next = <T>(list: readonly T[], v: T): T => list[(list.indexOf(v) + 1) % list.length]!;

const syncStorage = createJSONStorage<State>(() => ({
  getItem: (k) => Storage.getItemSync(k),
  setItem: (k, v) => Storage.setItemSync(k, v),
  removeItem: (k) => {
    Storage.removeItemSync(k);
  },
}));

export const useCameraStore = create<State & Actions>()(
  persist(
    (set) => ({
      flash: 'off',
      grid: 'off',
      level: false,
      timer: 0,
      aspect: '3:4',
      poseId: null,
      opacity: 1,
      mirrored: false,
      railSide: 'right',
      railY: 0.5,
      cycleFlash: () => set((s) => ({ flash: next(['off', 'auto', 'on'] as const, s.flash) })),
      cycleGrid: () => set((s) => ({ grid: next(['off', '3', '4'] as const, s.grid) })),
      toggleLevel: () => set((s) => ({ level: !s.level })),
      cycleTimer: () => set((s) => ({ timer: next([0, 3, 10] as const, s.timer) })),
      cycleAspect: () => set((s) => ({ aspect: next(['3:4', '9:16', '1:1'] as const, s.aspect) })),
      selectPose: (id) => set({ poseId: id, mirrored: false }),
      replacePose: (id) =>
        set((s) => {
          if (s.poseId) {
            const raw = Storage.getItemSync(placementKey(s.poseId));
            if (raw) Storage.setItemSync(placementKey(id), raw);
          }
          return { poseId: id };
        }),
      clearPose: () => set({ poseId: null }),
      cycleOpacity: () => set((s) => ({ opacity: nextOpacity(s.opacity) })),
      setOpacity: (v) => set({ opacity: Math.min(1, Math.max(0, v)) }),
      toggleMirror: () => set((s) => ({ mirrored: !s.mirrored })),
      setGrid: (grid) => set({ grid }),
      setRail: (railSide, railY) => set({ railSide, railY: Math.min(1, Math.max(0, railY)) }),
    }),
    {
      name: 'camera',
      version: 2,
      storage: syncStorage,
      // v1 lưu độ hiện là mức 0/1/2; v2 lưu giá trị 0..1 và vị trí cột công cụ.
      migrate: (old, version) => {
        const o = (old ?? {}) as Partial<State> & { opacityLevel?: 0 | 1 | 2 };
        if (version < 2) {
          const { opacityLevel, ...rest } = o;
          return {
            ...rest,
            opacity: OVERLAY_OPACITY[opacityLevel ?? 0],
            railSide: 'right',
            railY: 0.5,
          } as State;
        }
        return o as State;
      },
      partialize: (s) => ({
        flash: s.flash,
        grid: s.grid,
        level: s.level,
        timer: s.timer,
        aspect: s.aspect,
        poseId: s.poseId,
        opacity: s.opacity,
        mirrored: s.mirrored,
        railSide: s.railSide,
        railY: s.railY,
      }),
    },
  ),
);

/**
 * Placement lưu theo đơn vị CHIỀU CAO KHUNG (x, y chia cho chiều cao khung) để đổi tỉ lệ khung
 * hay đổi máy vẫn đặt đúng chỗ tương đối.
 */
const placementKey = (poseId: string) => `placement:${poseId}`;

export function loadPlacement(poseId: string, frameH: number): Placement | null {
  try {
    const raw = Storage.getItemSync(placementKey(poseId));
    if (!raw) return null;
    const p = JSON.parse(raw) as Placement;
    return { x: p.x * frameH, y: p.y * frameH, scale: p.scale, rotation: p.rotation };
  } catch {
    return null;
  }
}

export function savePlacement(poseId: string, p: Placement, frameH: number) {
  if (frameH <= 0) return;
  const n = { x: p.x / frameH, y: p.y / frameH, scale: p.scale, rotation: p.rotation };
  Storage.setItemSync(placementKey(poseId), JSON.stringify(n));
}

export function clearPlacement(poseId: string) {
  Storage.removeItemSync(placementKey(poseId));
}
