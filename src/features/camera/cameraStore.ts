/**
 * Trạng thái của Camera, nhớ qua các lần mở app (expo-sqlite/kv-store, ghi đồng bộ nên đọc lại
 * được ngay khi khởi động, không nháy giá trị mặc định).
 *
 * - Cài đặt camera: flash, lưới, thước, hẹn giờ, tỉ lệ khung.
 * - Pose đang dùng + điều khiển nhanh: độ hiện, lật ngang (business-flow §4.4).
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
/** Độ hiện overlay: 3 mức chạm nhanh. */
export const OVERLAY_OPACITY = [1, 0.6, 0.3] as const;

type State = {
  flash: FlashMode;
  grid: GridMode;
  level: boolean;
  timer: TimerSec;
  aspect: AspectId;
  poseId: string | null;
  opacityLevel: 0 | 1 | 2;
  mirrored: boolean;
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
  toggleMirror: () => void;
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
      opacityLevel: 0,
      mirrored: false,
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
      cycleOpacity: () => set((s) => ({ opacityLevel: ((s.opacityLevel + 1) % 3) as 0 | 1 | 2 })),
      toggleMirror: () => set((s) => ({ mirrored: !s.mirrored })),
    }),
    {
      name: 'camera',
      version: 1,
      storage: syncStorage,
      partialize: (s) => ({
        flash: s.flash,
        grid: s.grid,
        level: s.level,
        timer: s.timer,
        aspect: s.aspect,
        poseId: s.poseId,
        opacityLevel: s.opacityLevel,
        mirrored: s.mirrored,
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
