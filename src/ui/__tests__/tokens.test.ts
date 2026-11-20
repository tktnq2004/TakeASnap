import { contrastRatio, needsEdge } from '../contrast';
import { color, poseColors } from '../tokens';

// Kiểm chứng bảng tương phản ở docs/design.md §3.1.
describe('tương phản của token màu', () => {
  it('chữ chính trên nền đạt AAA (≥ 7:1)', () => {
    expect(contrastRatio(color.ink, color.bg)).toBeGreaterThanOrEqual(7);
  });

  it('chữ phụ trên nền đạt AA (≥ 4.5:1)', () => {
    expect(contrastRatio(color.muted, color.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('chữ trên nút chính đạt AA (≥ 4.5:1)', () => {
    expect(contrastRatio(color.accentInk, color.accent)).toBeGreaterThanOrEqual(4.5);
  });

  it('màu nhấn trên nền đủ cho chữ nút phụ (≥ 4.5:1)', () => {
    expect(contrastRatio(color.accent, color.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(color.accent, color.accentSoft)).toBeGreaterThanOrEqual(4.5);
  });

  it('nút xóa: chữ trên nút đỏ và chữ đỏ trên thẻ đạt AA', () => {
    expect(contrastRatio(color.dangerInk, color.danger)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(color.danger, color.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it('camera: chữ và màu nhấn trên nền tối', () => {
    expect(contrastRatio(color.camInk, color.camBg)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(color.camAccent, color.camBg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('luật không tím (design.md §2.7)', () => {
  // Hue HSL xấp xỉ hue OKLCH đủ để bắt tím/lavender.
  const hue = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [
      number,
      number,
      number,
    ];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === min) return null; // xám, trắng, đen
    const d = max - min;
    const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  };

  const solid = [
    color.bg,
    color.surface,
    color.surfaceAlt,
    color.accentSoft,
    color.ink,
    color.muted,
    color.faint,
    color.accent,
    color.danger,
    color.camBg,
    color.camAccent,
    color.camWarn,
  ];
  const all = [...solid, ...poseColors.map((c) => c.value)];

  it.each(all)('%s không nằm trong vùng hue tím 250–320°', (hex) => {
    const h = hue(hex);
    if (h !== null) {
      expect(h < 250 || h > 320).toBe(true);
    }
  });
});

describe('viền ô màu trên nền tối', () => {
  it('màu Đen của pose cần viền, màu Trắng và Cam thì không', () => {
    expect(needsEdge('#10213F')).toBe(true);
    expect(needsEdge('#FFFFFF')).toBe(false);
    expect(needsEdge('#FF8A3D')).toBe(false);
  });
});
