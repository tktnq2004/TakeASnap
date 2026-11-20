/**
 * Đường của cảnh cho nhận xét bố cục (Phase 5a, business-flow §6.9): chân trời, đường dẫn. Bộ dò
 * ở package composition-critic (`analyzeScene`), chạy trên ảnh xám nhỏ trang WebView trả về.
 *
 * Cột mọc sau đầu chưa dùng: đo mới đúng 4/7 ảnh (composition-critic README), báo nhầm thì phiền
 * hơn là có ích. Có thêm ảnh đo thì bật lại.
 */
import { analyzeScene, type PhotoFeatures, type Scene, type Segment } from 'composition-critic';

import type { TechniqueId } from './techniques';

type Bytes = { width: number; height: number; data: Uint8Array };

export function sceneFor(
  gray: Bytes | null,
  personGrid: Bytes,
  features: PhotoFeatures,
): { scene: Scene; ms: number } | null {
  if (!gray) return null;
  const t0 = performance.now();
  const scene = analyzeScene(gray, { ...personGrid, scale: 255 }, features);
  return { scene: { ...scene, pole: null }, ms: performance.now() - t0 };
}

type P = { x: number; y: number };

/** Đoạn cần vẽ (tọa độ chuẩn hóa 0..1) và điểm hội tụ; rỗng khi kỹ thuật không có đường. */
export function sceneLines(
  technique: TechniqueId,
  scene: Scene | null | undefined,
  flip = false,
): { lines: { a: P; b: P }[]; vp: P | null } {
  const fx = (x: number) => (flip ? 1 - x : x);
  const flipSeg = (q: { a: P; b: P }) => ({
    a: { x: fx(q.a.x), y: q.a.y },
    b: { x: fx(q.b.x), y: q.b.y },
  });
  if (scene && technique === 'horizon' && scene.horizon) {
    // Vẽ cả đường (kể cả phần bị che), kéo dài hết bề ngang khung.
    const e: Segment['extent'] = scene.horizon.seg.extent;
    const k = (e.b.y - e.a.y) / (e.b.x - e.a.x || 1);
    return {
      lines: [
        flipSeg({ a: { x: 0, y: e.a.y - k * e.a.x }, b: { x: 1, y: e.a.y + k * (1 - e.a.x) } }),
      ],
      vp: null,
    };
  }
  if (scene && technique === 'lead' && scene.vanishing) {
    const p = scene.vanishing.point;
    return { lines: scene.vanishing.lines.map(flipSeg), vp: { x: fx(p.x), y: p.y } };
  }
  return { lines: [], vp: null };
}
