import { create } from 'zustand';

/**
 * Màn spike gợi ý lúc ngắm mở camera riêng. Hai CameraView cùng chạy thì iOS / Android chỉ cho
 * một phiên camera, nên Camera chính tháo CameraView khi cờ này bật. Xóa cùng màn spike.
 */
export const useLiveSpikeCamera = create<{ busy: boolean; setBusy: (b: boolean) => void }>()(
  (set) => ({
    busy: false,
    setBusy: (busy) => set({ busy }),
  }),
);
