/**
 * Hướng dẫn liên tục (Phase 5b, business-flow §6.10): khoảng 1 lần / giây chụp lặng một ảnh
 * (`useSnapshot`), đo tiêu chí của bố cục đang bật (`measure`) rồi áp luật nhắc / dừng (`step`).
 * Dừng khi đạt, cảnh không áp được, 5 lần nhắc không tiến bộ + 10 s, hoặc người dùng dừng.
 *
 * Camera chỉ chụp một ảnh mỗi lúc: lượt nào camera đang bận (người dùng đang bấm chụp) thì bỏ
 * lượt đó; nút chụp đợi lần chụp lặng đang chạy (`settled()`) rồi chụp ngay.
 */
import type { CameraView } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { SensorType, useAnimatedSensor } from 'react-native-reanimated';

import type { Rect } from '@/features/camera/frame';
import { deviceRoll, levelUsable } from '@/features/camera/level';
import { haptic } from '@/lib/haptics';
import { compositionUi } from '@/ui/tokens';

import {
  type ColumnLock,
  flipX,
  type GuidePlan,
  type GuideState,
  initialGuide,
  lockColumn,
  measure,
  type Measure,
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
  /** Có gói trời. */
  sky: boolean;
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
    while (token.current === my) {
      const t0 = Date.now();
      const c = ctxRef.current();
      if (c.cam && c.free) {
        let s: Snapshot | null = null;
        try {
          s = await snapshot.take(c.cam, c.frame, c.preview, {
            sky: plan.scene === 'horizon' && c.sky,
          });
        } catch {
          // Camera bận (vừa bấm chụp) hoặc trang lỗi: bỏ lượt này.
        }
        if (token.current !== my) return;
        if (s) {
          let snap = s.kind === 'ok' ? s : null;
          if (snap && c.flip) {
            const r = flipX(snap.features, snap.scene);
            snap = {
              ...snap,
              features: r.f,
              scene: r.scene,
              yaw: snap.yaw == null ? null : -snap.yaw,
            };
          }
          if (snap) lock = lockColumn(lock, snap.features, snap.yaw);
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
