/**
 * Kỹ thuật bố cục chọn được trên Camera (business-flow §6.2, design.md §6.15). Lưới 3×3 / 4×4 là
 * hai dòng của bảng Bố cục (gộp lại sau phiếu Phase 5 lần 2: lưới chồng lớp bố cục rối mắt).
 * Dữ liệu thuần, test được trong Jest.
 */

export type TechniqueId =
  'off' | 'grid' | 'grid4' | 'thirds' | 'center' | 'fill' | 'low' | 'selfie' | 'group';

/** Thứ tự các dòng trong bảng Bố cục. "Tự chọn" (Phase 5b) sẽ đứng đầu khi qua cổng. */
export const TECHNIQUES: readonly TechniqueId[] = [
  'off',
  'grid',
  'grid4',
  'thirds',
  'center',
  'fill',
  'low',
  'selfie',
  'group',
];

export const isTechnique = (v: unknown): v is TechniqueId =>
  typeof v === 'string' && (TECHNIQUES as readonly string[]).includes(v);

/** Kỹ thuật cần camera trước. */
export const needsFront = (t: TechniqueId) => t === 'selfie';

/**
 * Bố cục dùng được khung ngang (phiếu Phase 5b lần 18, bước 2): lưới, 1/3, nhóm. Lấp đầy, Góc
 * thấp, Selfie chỉ khung dọc; Ở giữa để sau. Chỉ camera sau (camera trước có soi gương, chưa thử).
 */
export const landscapeOk = (t: TechniqueId) =>
  t === 'grid' || t === 'grid4' || t === 'thirds' || t === 'group';
