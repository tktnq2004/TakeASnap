/**
 * Hướng dẫn liên tục (Phase 5b, business-flow §6.10). Không chụp đều mỗi giây nữa (phiếu Phase 5b
 * lần 3, mục 11.5): chụp lặng một ảnh (`useSnapshot`), đo tiêu chí (`measure`, `step`), đặt chấm
 * người và chấm đích; sau đó chấm người chạy theo máy xoay ngay trên UI thread (`track.ts`,
 * `MotionTracker` trong `GuideOverlay`) mà không chụp thêm. Chỉ chụp lại khi:
 * - chấm người tới đích và máy yên `guideVerifyMs`: chụp kiểm tra (đạt thì sang bước sau);
 * - máy đã di chuyển rồi yên lại `guideSettleMs` mà chưa tới đích (người chụp bước ngang, chấm
 *   trôi): đặt lại chấm;
 * - tiêu chí không theo được bằng máy xoay (lùi ra, tiến lại, chưa thấy người): như trên, thêm một
 *   ảnh mỗi `guideRefreshMs`.
 * Chỉ dừng khi đạt hết hoặc người dùng dừng.
 *
 * Camera chỉ chụp một ảnh mỗi lúc: lúc camera đang bận (người dùng đang bấm chụp) thì đợi; nút chụp
 * đợi lần chụp lặng đang chạy (`settled()`) rồi chụp ngay.
 */
import type { PhotoFeatures } from 'composition-critic';
import type { CameraView } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  SensorType,
  type SharedValue,
  useAnimatedSensor,
  useSharedValue,
} from 'react-native-reanimated';

import type { Rect } from '@/features/camera/frame';
import { deviceRoll, levelUsable } from '@/features/camera/level';
import { haptic } from '@/lib/haptics';
import { compositionUi } from '@/ui/tokens';

import {
  type Check,
  type ColumnLock,
  flipX,
  type GuidePlan,
  type GuideState,
  initialGuide,
  lockColumn,
  measure,
  type Measure,
  remindersOf,
  step,
  stepLive,
  trackAxis,
} from './guidance';
import { type Anchor, depthOf, type Lens, type Live, LIVE0, type Quat, type Vec, zoomed } from './track';
import { type Snapshot, useSnapshot } from './useSnapshot';

const IOS = Platform.OS === 'ios';

/** Những gì vòng hướng dẫn cần đọc ở mỗi lượt (khung, camera có thể đổi giữa chừng). */
export type GuideContext = {
  cam: CameraView | null;
  /** Camera sẵn sàng và không bận chụp ảnh thật. */
  free: boolean;
  frame: Rect;
  preview: { width: number; height: number };
  front: boolean;
  /** Ảnh không lật như khung ngắm (camera trước, tắt Lưu soi gương). */
  flip: boolean;
  /** Có gói trời. */
  sky: boolean;
  /** Góc nhìn của khung ngắm ở zoom 1 (`lensOf`), zoom lúc này. */
  lens: Lens;
  zoom: number;
};

export type GuideView = {
  plan: GuidePlan;
  state: GuideState;
  /** Kết quả lượt gần nhất, theo khung ngắm (đường tìm được của bố cục phụ). */
  snap: Extract<Snapshot, { kind: 'ok' }> | null;
  front: boolean;
  /** Chấm người đã tới đích theo máy xoay, đợi máy yên để chụp kiểm tra ("Đúng rồi, giữ yên máy"). */
  hold: boolean;
};

/** Theo máy xoay: bên JS đặt `anchor`, tăng `epoch` trước mỗi lần chụp; UI thread ghi `live`. */
export type GuideTrack = {
  live: SharedValue<Live>;
  anchor: SharedValue<Anchor | null>;
  epoch: SharedValue<number>;
};

/** Viên kết thúc. */
export type GuideEnd = { state: GuideState; plan: GuidePlan } | { stopped: true };

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export function useLiveGuide(getContext: () => GuideContext) {
  const snapshot = useSnapshot();
  const gravity = useAnimatedSensor(SensorType.GRAVITY, { interval: 'auto' });
  const live = useSharedValue<Live>(LIVE0);
  const anchor = useSharedValue<Anchor | null>(null);
  const epoch = useSharedValue(0);
  const [view, setView] = useState<GuideView | null>(null);
  const [end, setEnd] = useState<GuideEnd | null>(null);
  const token = useRef(0);
  const anchorId = useRef(0);
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctxRef = useRef(getContext);
  useEffect(() => {
    ctxRef.current = getContext;
  });

  const showEnd = (e: GuideEnd) => {
    if (endTimer.current) clearTimeout(endTimer.current);
    setEnd(e);
    const ms = 'stopped' in e ? compositionUi.okHideMs : compositionUi.guideEndMs;
    endTimer.current = setTimeout(() => setEnd(null), ms);
  };
  useEffect(
    () => () => {
      token.current++;
      if (endTimer.current) clearTimeout(endTimer.current);
    },
    [],
  );

  const rollDeg = () => {
    const g = gravity.sensor.get();
    if (!levelUsable(g.x, g.y, g.z)) return 0;
    return (deviceRoll(g.x, g.y, IOS) * 180) / Math.PI;
  };

  /**
   * Chấm người / đích của tiêu chí đang làm, theo góc và chỗ máy lúc chụp, khoảng cách tới người
   * ước lượng từ ảnh; null khi không theo được.
   */
  const anchorFor = (
    c: Check | null,
    q: Quat,
    s: Vec,
    f: PhotoFeatures | null,
    ctx: GuideContext,
  ): Anchor | null => {
    const axis = trackAxis(c);
    if (!c || !axis || !c.at || !c.target || c.target.kind === 'frame') return null;
    return {
      id: ++anchorId.current,
      q,
      s,
      depth: depthOf(f, zoomed(ctx.lens, ctx.zoom)),
      lens: ctx.lens,
      zoom: ctx.zoom,
      at: c.at,
      target: c.target,
      axis,
      band: c.band,
    };
  };

  const loop = async (my: number, plan: GuidePlan) => {
    let state = initialGuide();
    // Cột 1/3 chốt trong cả lần hướng dẫn (không nhảy theo rung tay).
    let lock: ColumnLock | null = null;
    let snap: GuideView['snap'] = null;
    let front = ctxRef.current().front;
    let hold = false;
    let want = true;
    let lastShot = 0;
    anchor.set(null);
    const show = () => setView({ plan, state, snap, front, hold });

    while (token.current === my) {
      const c = ctxRef.current();
      if (want && c.cam && c.free) {
        // Góc, chỗ máy lúc chụp; từ đây tính lại "đã di chuyển", "yên bao lâu".
        const { q, s: at } = live.get();
        epoch.set(epoch.get() + 1);
        lastShot = Date.now();
        let s: Snapshot | null = null;
        try {
          s = await snapshot.take(c.cam, c.frame, c.preview, {
            sky: plan.scene === 'horizon' && c.sky,
          });
        } catch {
          // Camera bận (vừa bấm chụp) hoặc trang lỗi: thử lại sau.
        }
        if (token.current !== my) return;
        if (!s) {
          await sleep(compositionUi.guidePollMs);
          continue;
        }
        want = false;
        snap = s.kind === 'ok' ? s : null;
        if (snap && c.flip) {
          const r = flipX(snap.features, snap.scene);
          snap = { ...snap, features: r.f, scene: r.scene };
        }
        if (snap) lock = lockColumn(lock, snap.features);
        const m: Measure = measure(
          plan,
          snap?.features ?? null,
          snap?.scene ?? null,
          rollDeg(),
          c.front,
          lock?.col,
        );
        const r = step(state, m, Date.now());
        state = r.state;
        front = c.front;
        hold = false;
        if (r.event === 'passed' || r.event === 'reached') haptic.levelReached();
        else if (r.event === 'instruct' && state.memo[state.current!.id]?.reminders === 0) {
          haptic.select();
        } else if (r.event === 'remind') haptic.remind();
        anchor.set(anchorFor(state.current, q, at, snap?.features ?? null, c));
        show();
        if (state.status !== 'running') {
          token.current++;
          anchor.set(null);
          setView(null);
          showEnd({ state, plan });
          return;
        }
        continue;
      }

      // Giữa hai ảnh: theo máy xoay.
      const now = Date.now();
      const k = live.get();
      const a = anchor.get();
      const before = remindersOf(state);
      const wasHold: boolean = hold;
      if (a && k.for === a.id) {
        hold = k.reached;
        const r = stepLive(state, k.err, hold, now);
        state = r.state;
        if (r.event === 'remind') haptic.remind();
        if (hold && !wasHold) haptic.select();
        if (
          hold
            ? k.stillMs >= compositionUi.guideVerifyMs
            : k.moved && k.stillMs >= compositionUi.guideSettleMs
        ) {
          want = true;
        }
      } else if (
        (k.moved && k.stillMs >= compositionUi.guideSettleMs) ||
        now - lastShot >= compositionUi.guideRefreshMs
      ) {
        want = true;
      }
      if (hold !== wasHold || remindersOf(state) !== before) show();
      await sleep(compositionUi.guidePollMs);
    }
  };

  /** Bắt đầu (hoặc bắt đầu lại với bố cục mới). */
  const start = (plan: GuidePlan) => {
    const my = ++token.current;
    if (endTimer.current) clearTimeout(endTimer.current);
    setEnd(null);
    anchor.set(null);
    setView({
      plan,
      state: initialGuide(),
      snap: null,
      front: ctxRef.current().front,
      hold: false,
    });
    loop(my, plan);
  };

  /** Dừng. `notice`: hiện viên "Đã dừng hướng dẫn" (người dùng chạm nút dừng). */
  const stop = (notice = false) => {
    if (token.current === 0 && !view) return;
    token.current++;
    anchor.set(null);
    setView(null);
    if (notice) showEnd({ stopped: true });
  };

  const track: GuideTrack = { live, anchor, epoch };
  return { view, end, track, active: view != null, start, stop, settled: snapshot.settled };
}
