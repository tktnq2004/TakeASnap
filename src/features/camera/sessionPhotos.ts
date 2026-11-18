/**
 * Ảnh đã chụp và lưu trong lần mở app này (business-flow §4.5), cho ô ảnh vừa chụp và màn Xem
 * ảnh vừa chụp. Không lưu qua các lần mở app: ảnh vẫn nằm trong album SnapShot của máy.
 */
import { create } from 'zustand';

import type { TechniqueId } from '@/features/composition/techniques';

export type SessionPhoto = {
  /** Mã ảnh trong thư viện ảnh của máy, để xóa khỏi album. */
  assetId: string;
  /** File đã cắt đúng khung, để hiện và chia sẻ. */
  uri: string;
  width: number;
  height: number;
  /** Kỹ thuật bố cục lúc bấm chụp, cho nhận xét sau khi chụp (business-flow §6.5). */
  technique: TechniqueId;
  takenAt: number;
};

type State = {
  photos: SessionPhoto[];
  /** Ghi thêm ảnh vừa lưu; giờ chụp lấy lúc ghi. */
  add: (p: Omit<SessionPhoto, 'takenAt'>) => void;
  remove: (assetId: string) => void;
};

export const useSessionPhotos = create<State>()((set) => ({
  photos: [],
  add: (p) => set((s) => ({ photos: [...s.photos, { ...p, takenAt: Date.now() }] })),
  remove: (assetId) => set((s) => ({ photos: s.photos.filter((x) => x.assetId !== assetId) })),
}));
