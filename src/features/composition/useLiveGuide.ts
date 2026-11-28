/**
 * Hướng dẫn liên tục (Phase 5b, business-flow §6.10): chụp lặng một ảnh (`useSnapshot`), đo tiêu
 * chí của bố cục đang bật (`measure`) rồi áp luật nhắc / dừng (`step`). Dừng khi đạt, cảnh không áp
 * được, 3 lần nhắc không tiến bộ + 10 s, hoặc người dùng dừng.
 *
 * Cách 7 (góp ý phiếu Phase 5b lần 7, mục 15.7: chấm, mũi tên nhảy vì chỉ biết người ở đâu sau mỗi
 * lần chụp): con quay cho biết máy đang dời hay đứng yên (realtime). Chỉ chụp kiểm tra khi máy yên
 * `stillMs` (lần sau cách `guideIntervalMs`); dời mãi không yên thì vẫn kiểm tra sau
 * `guideMaxWaitMs`. Ảnh chụp lúc máy yên thì đúng với khung ngắm người dùng đang thấy; ít lần chụp
 * hơn cũng đỡ nóng máy. Không vẽ gì theo vị trí người (cách C, mục 16).
 *
 * Camera chỉ chụp một ảnh mỗi lúc: lượt nào camera đang bận (người dùng đang bấm chụp) thì bỏ
 * lượt đó; nút chụp đợi lần chụp lặng đang chạy (`settled()`) rồi chụp ngay.
 */
import type { CameraView } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  SensorType,
  useAnimatedReaction,
  useAnimatedSensor,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { Rect, Turn } from '@/features/camera/frame';
import { deviceRoll, levelUsable } from '@/features/camera/level';
import { haptic } from '@/lib/haptics';
import { compositionUi } from '@/ui/tokens';

import {
  type ColumnLock,
  columnUnsure,
  flipX,
  type GuidePlan,
  type GuideState,
  initialGuide,
  lockColumn,
  measure,
  type Measure,
  resumeGuide,
  step,
} from './guidance';
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
  /** Tạm dừng (máy cầm ngang): không chụp kiểm tra, không đếm giờ nhắc / hết hạn. */
  paused: boolean;
  /** Cầm ngang với bố cục dùng được khung ngang: đo trên khung ngang (phiếu Phase 5b lần 18). */
  turn: Turn;
};

export type GuideView = {
  plan: GuidePlan;
  state: GuideState;
  /** Kết quả lượt gần nhất, theo khung ngắm (để vẽ khung người, chấm mắt, đường tìm được). */
  snap: Extract<Snapshot, { kind: 'ok' }> | null;
  /** Camera trước (viên chỉ nói xoay máy). */
  front: boolean;
};

/** Viên kết thúc. */
export type GuideEnd = { state: GuideState; plan: GuidePlan } | { stopped: true };

export function useLiveGuide(getContext: () => GuideContext) {
  const snapshot = useSnapshot();
  const gravity = useAnimatedSensor(SensorType.GRAVITY, { interval: 'auto' });
  const gyro = useAnimatedSensor(SensorType.GYROSCOPE, { interval: 'auto' });
  // Máy đang dời (có độ trễ giữa hai ngưỡng để không nhấp nháy theo rung tay).
  const movingSV = useSharedValue(false);
  /** Lúc máy bắt đầu đứng yên (0: yên từ trước khi mở), null khi đang dời. */
  const stillAt = useRef<number | null>(0);
  const onMotion = (m: boolean) => {
    stillAt.current = m ? null : Date.now();
  };
  useAnimatedReaction(
    () => {
      const g = gyro.sensor.get();
      const rate = Math.hypot(g.x, g.y, g.z);
      return movingSV.get() ? rate > compositionUi.stillGyro : rate > compositionUi.moveGyro;
    },
    (m, prev) => {
      if (m === prev) return;
      movingSV.set(m);
      scheduleOnRN(onMotion, m);
    },
  );
  /** Máy đã yên đủ lâu để chụp kiểm tra. */
  const steady = () =>
    stillAt.current != null && Date.now() - stillAt.current >= compositionUi.stillMs;
  const [view, setView] = useState<GuideView | null>(null);
  const [end, setEnd] = useState<GuideEnd | null>(null);
  const token = useRef(0);
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

  const loop = async (my: number, plan: GuidePlan) => {
    let state = initialGuide();
    // Cột 1/3 chốt trong cả lần hướng dẫn (không nhảy theo rung tay).
    let lock: ColumnLock | null = null;
    let last = Date.now();
    let turn = ctxRef.current().turn;
    while (token.current === my) {
      // Đổi cách cầm (dọc ↔ ngang): khung đo khác hẳn, làm lại từ bước đầu.
      if (ctxRef.current().turn !== turn) {
        turn = ctxRef.current().turn;
        const fresh = initialGuide();
        state = fresh;
        lock = null;
        setView((v) => (v ? { ...v, state: fresh, snap: null } : v));
      }
      // Máy cầm ngang: đợi cầm dọc lại rồi làm tiếp, giờ nhắc / hết hạn dời theo lúc tạm dừng.
      if (ctxRef.current().paused) {
        const p0 = Date.now();
        while (token.current === my && ctxRef.current().paused) {
          await new Promise((res) => setTimeout(res, 100));
        }
        if (token.current !== my) return;
        const resumed = resumeGuide(state, Date.now() - p0);
        state = resumed;
        last = Date.now();
        setView((v) => (v ? { ...v, state: resumed } : v));
        continue;
      }
      // Đợi máy yên (hoặc quá lâu chưa kiểm tra).
      while (
        token.current === my &&
        !steady() &&
        Date.now() - last < compositionUi.guideMaxWaitMs
      ) {
        await new Promise((res) => setTimeout(res, 50));
      }
      if (token.current !== my) return;
      const t0 = Date.now();
      last = t0;
      const c = ctxRef.current();
      if (c.cam && c.free) {
        let s: Snapshot | null = null;
        try {
          s = await snapshot.take(c.cam, c.frame, c.preview, {
            gaze: plan.main === 'thirds',
            turn,
            // Máy dời từ lúc bắt đầu chụp: bỏ lượt (mục 17.2).
            moved: () => stillAt.current == null || stillAt.current > t0,
          });
        } catch {
          // Camera bận (vừa bấm chụp) hoặc trang lỗi: bỏ lượt này.
        }
        if (token.current !== my) return;
        // Vừa xoay máy trong lúc chụp: ảnh không khớp khung đang thấy, bỏ lượt.
        if (ctxRef.current().paused || ctxRef.current().turn !== turn) continue;
        if (s) {
          let snap = s.kind === 'ok' ? s : null;
          if (snap && c.flip) {
            snap = {
              ...snap,
              features: flipX(snap.features),
              yaw: snap.yaw == null ? null : -snap.yaw,
            };
          }
          if (snap) lock = lockColumn(lock, snap.features, snap.yaw);
          const m: Measure = measure(
            plan,
            snap?.features ?? null,
            rollDeg(),
            c.front,
            lock?.col,
            lock != null && columnUnsure(lock),
          );
          const r = step(state, m, Date.now());
          state = r.state;
          if (r.event === 'passed') haptic.levelReached();
          else if (r.event === 'instruct' && state.memo[state.current!.id]?.reminders === 0) {
            haptic.select();
          } else if (r.event === 'remind') haptic.remind();
          else if (r.event === 'reached') haptic.levelReached();
          setView({ plan, state, snap, front: c.front });
          if (state.status !== 'running') {
            token.current++;
            setView(null);
            showEnd({ state, plan });
            return;
          }
        }
      }
      const wait = compositionUi.guideIntervalMs - (Date.now() - t0);
      if (wait > 0) await new Promise((res) => setTimeout(res, wait));
    }
  };

  /** Bắt đầu (hoặc bắt đầu lại với bố cục mới). */
  const start = (plan: GuidePlan) => {
    const my = ++token.current;
    if (endTimer.current) clearTimeout(endTimer.current);
    setEnd(null);
    setView({ plan, state: initialGuide(), snap: null, front: ctxRef.current().front });
    loop(my, plan);
  };

  /** Dừng. `notice`: hiện viên "Đã dừng hướng dẫn" (người dùng chạm nút dừng). */
  const stop = (notice = false) => {
    if (token.current === 0 && !view) return;
    token.current++;
    setView(null);
    if (notice) showEnd({ stopped: true });
  };

  return { view, end, active: view != null, start, stop, settled: snapshot.settled };
}
