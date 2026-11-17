/**
 * Kỹ thuật bố cục chọn được trên Camera (business-flow §6.2, design.md §6.15). Dữ liệu thuần,
 * không import native, để test được trong Jest.
 */

export type TechniqueId =
  | 'off'
  | 'grid'
  | 'thirds'
  | 'center'
  | 'horizon'
  | 'lead'
  | 'low'
  | 'selfie'
  | 'group';

/** Thứ tự các dòng trong bảng Bố cục. "Tự chọn" (Phase 5b) sẽ đứng đầu khi qua cổng. */
export const TECHNIQUES: readonly TechniqueId[] = [
  'off',
  'grid',
  'thirds',
  'center',
  'horizon',
  'lead',
  'low',
  'selfie',
  'group',
];

export const isTechnique = (v: unknown): v is TechniqueId =>
  typeof v === 'string' && (TECHNIQUES as readonly string[]).includes(v);

/** Kỹ thuật cần camera trước. */
export const needsFront = (t: TechniqueId) => t === 'selfie';

/**
 * Kỹ thuật gắn với một pose mẫu (business-flow §6.7): chọn pose khi đang tắt bố cục thì bật
 * kỹ thuật này. Nhóm Selfie → Selfie; còn lại → 1/3.
 */
export function techniqueForSample(group: string | null): TechniqueId | null {
  if (group == null) return null;
  return group === 'selfie' ? 'selfie' : 'thirds';
}
