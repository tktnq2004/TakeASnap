/**
 * Đổi màu qua lại giữa HEX và HSV cho Bảng màu (design.md §6.10). Hàm thuần, chạy được trên UI
 * thread (worklet), có unit test. h: 0..360, s, v: 0..1.
 */

export type Hsv = { h: number; s: number; v: number };

const hex2 = (n: number) => {
  'worklet';
  const s = Math.round(Math.min(255, Math.max(0, n)))
    .toString(16)
    .toUpperCase();
  return s.length === 1 ? `0${s}` : s;
};

export function rgbToHex(r: number, g: number, b: number): string {
  'worklet';
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
}

export function hsvToHex(h: number, s: number, v: number): string {
  'worklet';
  const hh = (((h % 360) + 360) % 360) / 60;
  const c = v * s;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hh < 1) [r, g, b] = [c, x, 0];
  else if (hh < 2) [r, g, b] = [x, c, 0];
  else if (hh < 3) [r, g, b] = [0, c, x];
  else if (hh < 4) [r, g, b] = [0, x, c];
  else if (hh < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

/** "#abc", "abc", "#AABBCC", "aabbcc" → "#AABBCC"; sai thì null. */
export function normalizeHex(input: string): string | null {
  const t = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(t)) {
    return `#${t
      .split('')
      .map((c) => c + c)
      .join('')
      .toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(t)) return `#${t.toUpperCase()}`;
  return null;
}

export function hexToHsv(hex: string): Hsv {
  const n = normalizeHex(hex) ?? '#FFFFFF';
  const r = parseInt(n.slice(1, 3), 16) / 255;
  const g = parseInt(n.slice(3, 5), 16) / 255;
  const b = parseInt(n.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  return { h: (h + 360) % 360, s: max === 0 ? 0 : d / max, v: max };
}
