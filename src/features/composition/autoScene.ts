/**
 * Bộ đoán lúc người dùng chuẩn bị chụp (Phase 5b, gợi ý bố cục phụ tự động, `useAutoScene`).
 * Hàm thuần, test được trong Jest.
 */
import { compositionUi } from '@/ui/tokens';

export type Q = { x: number; y: number; z: number; w: number };

/** Góc (độ) giữa hai hướng máy (quaternion). */
export function angleDeg(a: Q, b: Q): number {
  const d = Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w);
  return (2 * Math.acos(Math.min(1, d)) * 180) / Math.PI;
}

export type AutoState = { anchor: Q | null; anchorAt: number; last: Q | null; lastAt: number };

/**
 * Một bước của bộ đoán (hàm thuần): trả trạng thái mới và có nên nhìn cảnh không.
 * `allowed`: đang được phép (bật, không bận, không đang hướng dẫn).
 */
export function autoStep(
  s: AutoState,
  q: Q,
  pitchDeg: number,
  now: number,
  allowed: boolean,
): { state: AutoState; fire: boolean } {
  let { anchor, anchorAt } = s;
  if (!anchor || angleDeg(anchor, q) > compositionUi.autoStillDeg) {
    anchor = q;
    anchorAt = now;
  }
  const state = { ...s, anchor, anchorAt };
  const still = now - anchorAt >= compositionUi.autoStillMs;
  const upright = Math.abs(pitchDeg) <= compositionUi.autoMaxPitch;
  const turned = !s.last || angleDeg(s.last, q) > compositionUi.autoTurnDeg;
  const rested = now - s.lastAt >= compositionUi.autoCooldownMs;
  if (allowed && still && upright && turned && rested) {
    return { state: { ...state, last: q, lastAt: now }, fire: true };
  }
  return { state, fire: false };
}
