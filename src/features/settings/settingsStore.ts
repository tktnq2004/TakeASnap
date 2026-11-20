/**
 * Cài đặt của app (business-flow §7.4), nhớ qua các lần mở app (expo-sqlite/kv-store, ghi đồng
 * bộ nên đọc lại được ngay khi khởi động).
 */
import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type State = {
  /** Ảnh camera trước: false = lưu như thật (mặc định), true = lưu soi gương như lúc xem. */
  frontMirror: boolean;
  /** Rung phản hồi. */
  haptics: boolean;
};

type Actions = {
  setFrontMirror: (v: boolean) => void;
  setHaptics: (v: boolean) => void;
};

const syncStorage = createJSONStorage<State>(() => ({
  getItem: (k) => Storage.getItemSync(k),
  setItem: (k, v) => Storage.setItemSync(k, v),
  removeItem: (k) => {
    Storage.removeItemSync(k);
  },
}));

export const useSettings = create<State & Actions>()(
  persist(
    (set) => ({
      frontMirror: false,
      haptics: true,
      setFrontMirror: (frontMirror) => set({ frontMirror }),
      setHaptics: (haptics) => set({ haptics }),
    }),
    {
      name: 'settings',
      version: 1,
      storage: syncStorage,
      partialize: (s) => ({ frontMirror: s.frontMirror, haptics: s.haptics }),
    },
  ),
);
