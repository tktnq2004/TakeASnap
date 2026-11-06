import { contrastRatio } from '../contrast';
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

  it('màu nhấn trên nền đủ cho icon trạng thái (≥ 3:1)', () => {
    expect(contrastRatio(color.accent, color.bg)).toBeGreaterThanOrEqual(3);
  });
});

describe('luật không tím (design.md §2.6)', () => {
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

  const solid = [color.bg, color.surface, color.ink, color.muted, color.accent, color.danger];
  const all = [...solid, ...poseColors.map((c) => c.value)];

  it.each(all)('%s không nằm trong vùng hue tím 250–320°', (hex) => {
    const h = hue(hex);
    if (h !== null) {
      expect(h < 250 || h > 320).toBe(true);
    }
  });
});
