/**
 * Đường của cảnh cho nhận xét bố cục (Phase 5a, business-flow §6.9): chân trời, đường dẫn. Bộ dò
 * ở package composition-critic (`analyzeScene`), chạy trên ảnh xám nhỏ trang WebView trả về.
 *
 * Cột mọc sau đầu chưa dùng: đo mới đúng 4/7 ảnh (composition-critic README), báo nhầm thì phiền
 * hơn là có ích. Có thêm ảnh đo thì bật lại.
 */
import { analyzeScene, type PhotoFeatures, type Scene } from 'composition-critic';

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
