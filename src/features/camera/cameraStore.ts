/**
 * Trạng thái của Camera, nhớ qua các lần mở app (expo-sqlite/kv-store, ghi đồng bộ nên đọc lại
 * được ngay khi khởi động, không nháy giá trị mặc định).
 *
 * - Cài đặt camera: flash, bố cục chính (gồm cả lưới, design.md §6.15) và bố cục phụ theo cảnh
 *   (Phase 5b, business-flow §6.10), thước, hẹn giờ, tỉ lệ khung.
 * - Pose đang dùng + điều khiển nhanh: độ hiện, lật ngang (business-flow §4.4).
 * - Vị trí cột công cụ pose (design.md §6.1): mép trái / phải và độ cao trong khung ngắm.
 * - Placement theo từng pose (BR-10): lưu riêng một khóa mỗi pose, chỉ ghi khi nhấc tay.
 */
import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { isSceneTechnique, type SceneTechnique } from '@/features/composition/guidance';
import { isTechnique, type TechniqueId } from '@/features/composition/techniques';
import type { Placement } from '@/gestures/useTransformGesture';

import type { AspectId } from './frame';

export type FlashMode = 'off' | 'on' | 'auto';
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
  /** Bố cục chính (không bao giờ là Đường chân trời / Đường dẫn: đó là bố cục phụ, `scene`). */
  technique: TechniqueId;
  /** Bố cục phụ theo cảnh, bật cùng bố cục chính hoặc một mình. */
  scene: SceneTechnique | null;
  level: boolean;
  timer: TimerSec;
  aspect: AspectId;
  poseId: string | null;
  /** 0..1. */
  opacity: number;
  mirrored: boolean;
  railSide: RailSide;
  /** Mép trên của cột theo chiều cao khung ngắm, 0 = mép trên khung, 1 = mép dưới. */
  railY: number;
  /** Cột công cụ thu gọn: chỉ còn nút chọn pose. */
  railCollapsed: boolean;
};

type Actions = {
  cycleFlash: () => void;
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
  /** Chọn một dòng của bảng Bố cục: Đường chân trời / Đường dẫn đặt bố cục phụ, còn lại bố cục chính. */
  setTechnique: (t: TechniqueId) => void;
  setScene: (s: SceneTechnique | null) => void;
  /** Tắt cả bố cục chính và bố cục phụ. */
  clearComposition: () => void;
  setFlash: (f: FlashMode) => void;
  setTimer: (s: TimerSec) => void;
  toggleRailCollapsed: () => void;
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
      technique: 'off',
      scene: null,
      level: true,
      timer: 0,
      aspect: '3:4',
      poseId: null,
      opacity: 1,
      mirrored: false,
      railSide: 'right',
      railY: 0.25,
      railCollapsed: false,
      cycleFlash: () => set((s) => ({ flash: next(['off', 'auto', 'on'] as const, s.flash) })),
      toggleLevel: () => set((s) => ({ level: !s.level })),
      cycleTimer: () => set((s) => ({ timer: next([0, 3, 10] as const, s.timer) })),
      cycleAspect: () => set((s) => ({ aspect: next(['3:4', '9:16', '1:1'] as const, s.aspect) })),
      // Chọn pose thì mở cột công cụ ra (góp ý Phase 4, mục 3.2).
      selectPose: (id) => set({ poseId: id, mirrored: false, railCollapsed: false }),
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
      setTechnique: (technique) =>
        set(isSceneTechnique(technique) ? { scene: technique } : { technique }),
      setScene: (scene) => set({ scene }),
      clearComposition: () => set({ technique: 'off', scene: null }),
      setFlash: (flash) => set({ flash }),
      setTimer: (timer) => set({ timer }),
      toggleRailCollapsed: () => set((s) => ({ railCollapsed: !s.railCollapsed })),
      setRail: (railSide, railY) => set({ railSide, railY: Math.min(1, Math.max(0, railY)) }),
    }),
    {
      name: 'camera',
      version: 7,
      storage: syncStorage,
      // v1 lưu độ hiện là mức 0/1/2; v2 lưu giá trị 0..1 và vị trí cột công cụ.
      migrate: (old, version) => {
        const o = (old ?? {}) as Partial<State> & { opacityLevel?: 0 | 1 | 2; grid?: string };
        // Lưới cũ ('3' / '4': trước v4 và ở v5) thành dòng Lưới của bảng Bố cục khi chưa chọn
        // kỹ thuật nào khác.
        const grid = o.grid;
        delete o.grid;
        if (!isTechnique(o.technique)) o.technique = 'off';
        if (o.technique === 'off' && grid === '3') o.technique = 'grid';
        if (o.technique === 'off' && grid === '4') o.technique = 'grid4';
        // v7: Đường chân trời / Đường dẫn thành bố cục phụ (Phase 5b).
        if (isSceneTechnique(o.technique)) {
          o.scene = o.technique;
          o.technique = 'off';
        }
        if (!isSceneTechnique(o.scene ?? null)) o.scene = null;
        if (version < 2) {
          const { opacityLevel, ...rest } = o;
          return {
            ...rest,
            opacity: OVERLAY_OPACITY[opacityLevel ?? 0],
            railSide: 'right',
            railY: 0.25,
          } as State;
        }
        // v2 lưu tâm cột; v3 lưu mép trên (cột cao ~ nửa khung).
        if (version < 3 && typeof o.railY === 'number') {
          return { ...o, railY: Math.max(0, o.railY - 0.25) } as State;
        }
        return o as State;
      },
      partialize: (s) => ({
        flash: s.flash,
        technique: s.technique,
        scene: s.scene,
        level: s.level,
        timer: s.timer,
        aspect: s.aspect,
        poseId: s.poseId,
        opacity: s.opacity,
        mirrored: s.mirrored,
        railSide: s.railSide,
        railY: s.railY,
        railCollapsed: s.railCollapsed,
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
