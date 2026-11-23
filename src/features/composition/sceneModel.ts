/**
 * Model lọc gợi ý bố cục phụ (Phase 5b, business-flow §6.10): phần đầu model vòng 3 (7 lớp) chạy
 * trên vector ảnh + đặc trưng người. Chỉ dùng xác suất Đường chân trời: bộ dò Phase 5a một mình
 * báo chân trời ở nhiều đường phố, mái nhà, hàng cây (phase5b-data.md, "Đổi hướng").
 */
import {
  type PhotoFeatures,
  predictTechnique,
  type TechniqueModel,
  techniqueInput,
} from 'composition-critic';

import { isPackReady, readPackFileText } from '@/engine/models/modelStore';
import { TECHNIQUE_HEAD, TECHNIQUE_PACK } from '@/engine/models/packs';

/**
 * Gợi ý Đường chân trời khi bộ dò thấy chân trời VÀ model cho xác suất từ chừng này. Đo trên bộ
 * đo cổng vòng 3: 60% đúng theo nhãn người dùng (bộ dò một mình 25%), bắt được 72%.
 */
export const HORIZON_MIN_P = 0.1;

let cached: TechniqueModel | null = null;

/** Phần đầu model, null khi bộ gợi ý chưa tải. */
export async function loadSceneModel(): Promise<TechniqueModel | null> {
  if (!isPackReady(TECHNIQUE_PACK)) return null;
  cached ??= JSON.parse(await readPackFileText(TECHNIQUE_PACK, TECHNIQUE_HEAD)) as TechniqueModel;
  return cached;
}

/** Xác suất Đường chân trời. */
export function horizonProb(m: TechniqueModel, f: PhotoFeatures, embedding: number[]): number {
  const g = predictTechnique(m, techniqueInput(f, embedding));
  return g.find((x) => (x.technique as string) === 'horizon')?.p ?? 0;
}
