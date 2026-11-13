/**
 * Rung phản hồi theo bảng ở docs/design.md §3.6.
 * Docs SDK 58 không ghi expo-haptics có trong Expo Go. Thư viện ném UnavailabilityError khi
 * thiếu native module, nên mọi lệnh ở đây nuốt lỗi: thiếu rung thì app vẫn chạy bình thường.
 * Spike D ghi lại `hapticsAvailable` trên iOS và Android.
 */
import { requireOptionalNativeModule } from 'expo';
import * as Haptics from 'expo-haptics';

export const hapticsAvailable = requireOptionalNativeModule('ExpoHaptics') != null;

function safe(run: () => Promise<void>) {
  if (!hapticsAvailable) return;
  run().catch(() => {});
}

export const haptic = {
  capture: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  snap: () => safe(() => Haptics.selectionAsync()),
  levelReached: () => safe(() => Haptics.selectionAsync()),
  /** Chọn / bỏ chọn một người trên màn Chọn người. */
  select: () => safe(() => Haptics.selectionAsync()),
  enterTrash: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  saved: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};
