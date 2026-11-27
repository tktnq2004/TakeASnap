/**
 * Kiểm tra bố cục (Phase 5a, business-flow §6.4): người dùng chạm nút thì nhìn khung ngắm MỘT lần
 * (`useSnapshot`) rồi áp quy tắc nhận xét của bố cục đang bật.
 *
 * Bấm chụp lúc đang kiểm tra: `cancel()` bỏ kết quả; nút chụp đợi lần chụp lặng xong (`settled()`)
 * rồi chụp ngay.
 */
import { type Note, type PhotoFeatures, reviewPhoto } from 'composition-critic';
import type { CameraView } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';

import type { Rect } from '@/features/camera/frame';
import { haptic } from '@/lib/haptics';
import { compositionUi } from '@/ui/tokens';

import type { TechniqueId } from './techniques';
import { useSnapshot } from './useSnapshot';

export type CheckResult =
  | {
      kind: 'review';
      /** Bố cục được nhận xét. */
      technique: TechniqueId;
      features: PhotoFeatures;
      /** Dòng chưa đạt đầu tiên; null = mọi dòng đều đạt. */
      note: Note | null;
    }
  | { kind: 'none' }
  | { kind: 'error'; /** Lý do, chỉ bản dev hiện. */ message: string };

/** Bố cục chính có nhận xét (giống nhận xét sau khi chụp: lưới chỉ để căn khung). */
export const CHECKABLE = (t: TechniqueId) => t !== 'off' && t !== 'grid' && t !== 'grid4';

/** Dòng chưa đạt đầu tiên của bố cục. */
export function firstFailing(technique: TechniqueId, f: PhotoFeatures) {
  return reviewPhoto(technique, f).notes.find((x) => !x.ok) ?? null;
}

export function useLayoutCheck() {
  const snapshot = useSnapshot();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  /** Tăng mỗi lần bắt đầu / hủy: kết quả của lần cũ về muộn thì bỏ. */
  const token = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
  };
  useEffect(() => clearHide, []);

  const show = (r: CheckResult) => {
    setResult(r);
    clearHide();
    hideTimer.current = setTimeout(() => setResult(null), compositionUi.checkShowMs);
  };

  const run = async (
    cam: CameraView,
    frame: Rect,
    preview: { width: number; height: number },
    technique: TechniqueId,
  ) => {
    if (busy) return;
    const my = ++token.current;
    setBusy(true);
    setResult(null);
    clearHide();
    try {
      // Không truyền `moved` nên luôn có kết quả.
      const s = (await snapshot.take(cam, frame, preview))!;
      if (token.current !== my) return;
      if (s.kind === 'none') {
        show({ kind: 'none' });
        return;
      }
      const note = firstFailing(technique, s.features);
      if (!note) haptic.levelReached();
      show({ kind: 'review', technique, features: s.features, note });
    } catch (e) {
      if (token.current === my)
        show({ kind: 'error', message: e instanceof Error ? e.message : String(e) });
    } finally {
      if (token.current === my) setBusy(false);
    }
  };

  /** Bỏ lần kiểm tra đang chạy và kết quả đang hiện (bấm chụp, đổi kỹ thuật, đổi camera). */
  const cancel = () => {
    token.current++;
    clearHide();
    setBusy(false);
    setResult(null);
  };

  return { busy, result, run, cancel, settled: snapshot.settled };
}
