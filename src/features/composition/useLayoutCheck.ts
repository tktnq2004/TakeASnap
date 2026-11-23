/**
 * Kiểm tra bố cục (Phase 5a, business-flow §6.4): người dùng chạm nút thì nhìn khung ngắm MỘT lần
 * (`useSnapshot`) rồi áp quy tắc nhận xét của bố cục đang bật. Từ Phase 5b (§6.10) bố cục chính và
 * bố cục phụ được nhận xét chung, và lần kiểm tra còn tìm bố cục phụ cảnh này áp được để gợi ý.
 *
 * Bấm chụp lúc đang kiểm tra: `cancel()` bỏ kết quả; nút chụp đợi lần chụp lặng xong (`settled()`)
 * rồi chụp ngay.
 */
import { type Note, type PhotoFeatures, reviewPhoto, type Scene } from 'composition-critic';
import type { CameraView } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';

import type { Rect } from '@/features/camera/frame';
import { haptic } from '@/lib/haptics';
import { compositionUi } from '@/ui/tokens';

import { type SceneTechnique, sceneSuggestions } from './guidance';
import { HORIZON_MIN_P } from './sceneModel';
import type { TechniqueId } from './techniques';
import { type Snapshot, useSnapshot } from './useSnapshot';

export type CheckResult =
  | {
      kind: 'review';
      /** Bố cục được nhận xét (chính trước, rồi phụ); rỗng khi chỉ tìm bố cục phụ để gợi ý. */
      techniques: TechniqueId[];
      features: PhotoFeatures;
      /** Dòng chưa đạt đầu tiên; null = mọi dòng đều đạt. */
      note: Note | null;
      /** Chân trời, đường dẫn tìm được (vẽ lên khung ngắm); null khi trang không trả ảnh xám. */
      scene: Scene | null;
      /** Bố cục phụ cảnh này áp được mà chưa bật (gợi ý, Phase 5b). */
      suggest: SceneTechnique[];
      /** Xác suất chân trời của model lọc (bản dev hiện), null khi chưa có bộ gợi ý. */
      pHorizon: number | null;
      sceneMs: number | null;
      sky: Extract<Snapshot, { kind: 'ok' }>['sky'];
    }
  | { kind: 'none' }
  | { kind: 'error'; /** Lý do, chỉ bản dev hiện. */ message: string };

/** Bố cục chính có nhận xét (giống nhận xét sau khi chụp: lưới chỉ để căn khung). */
export const CHECKABLE = (t: TechniqueId) => t !== 'off' && t !== 'grid' && t !== 'grid4';

/** Dòng chưa đạt đầu tiên của các bố cục (chính trước, phụ sau). */
export function firstFailing(techniques: TechniqueId[], f: PhotoFeatures, scene: Scene | null) {
  for (const t of techniques) {
    const n = reviewPhoto(t, f, scene ?? undefined).notes.find((x) => !x.ok);
    if (n) return n;
  }
  return null;
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
    const ms =
      r.kind === 'review' && r.suggest.length
        ? compositionUi.suggestShowMs
        : compositionUi.checkShowMs;
    hideTimer.current = setTimeout(() => setResult(null), ms);
  };

  const run = async (
    cam: CameraView,
    frame: Rect,
    preview: { width: number; height: number },
    main: TechniqueId,
    scene: SceneTechnique | null,
    sky: boolean,
    /** Gợi ý tự động (máy đứng yên): chỉ hiện khi có bố cục phụ để gợi ý, lỗi thì im lặng. */
    auto = false,
  ) => {
    if (busy) return;
    const my = ++token.current;
    setBusy(true);
    setResult(null);
    clearHide();
    try {
      const s = await snapshot.take(cam, frame, preview, { sky, embed: true });
      if (token.current !== my) return;
      if (s.kind === 'none') {
        if (!auto) show({ kind: 'none' });
        return;
      }
      const techniques = [...(CHECKABLE(main) ? [main] : []), ...(scene ? [scene] : [])];
      const note = techniques.length ? firstFailing(techniques, s.features, s.scene) : null;
      const suggest = sceneSuggestions(s.features, s.scene, scene, s.pHorizon, HORIZON_MIN_P);
      if (auto) {
        if (!suggest.length) return;
        haptic.select();
      } else if (techniques.length && !note) haptic.levelReached();
      show({
        kind: 'review',
        techniques,
        features: s.features,
        note,
        scene: s.scene,
        suggest,
        pHorizon: s.pHorizon,
        sceneMs: s.sceneMs,
        sky: s.sky,
      });
    } catch (e) {
      if (token.current === my && !auto)
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

  /** Ẩn kết quả đang hiện (giữ lần kiểm tra đang chạy). */
  const dismiss = () => {
    clearHide();
    setResult(null);
  };

  return { busy, result, run, cancel, dismiss, settled: snapshot.settled };
}
