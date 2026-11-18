/**
 * Kỹ thuật bố cục chọn được trên Camera (business-flow §6.2, design.md §6.15). Lưới 3×3 / 4×4 là
 * nút riêng trên thanh trên, vẽ chồng được với kỹ thuật. Dữ liệu thuần, test được trong Jest.
 */

export type TechniqueId =
  | 'off'
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
