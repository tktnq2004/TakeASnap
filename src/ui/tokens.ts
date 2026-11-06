/**
 * Design tokens — nguồn duy nhất cho màu, chữ, khoảng cách, radius, motion.
 * Giá trị theo docs/design.md §3 (deal tasteskill: graphite-safety-orange, urbanist, round).
 * Component không được viết mã màu hay số rời; luôn đọc từ đây.
 * File này là dữ liệu thuần (không import thư viện native) để test được trong Jest.
 * Hàm easing dựng từ các hệ số bezier ở đây nằm trong `easing.ts`.
 */

export const color = {
  bg: '#18191b',
  surface: '#222427',
  ink: '#eff0f1',
  muted: '#9c9ea3',
  line: 'rgba(239,240,241,0.14)',
  accent: '#ff4a1f',
  accentInk: '#18191b',
  inverseBg: '#eff0f1',
  inverseInk: '#18191b',
  scrim: 'rgba(24,25,27,0.56)',
  danger: '#ff6b6b',
} as const;

/** Màu chức năng cho viền và lớp phủ của pose (design.md §3.2). Không có tím. */
export const poseColors = [
  { name: 'Trắng', value: '#ffffff' },
  { name: 'Cam', value: '#ff4a1f' },
  { name: 'Vàng', value: '#ffd60a' },
  { name: 'Xanh lá', value: '#30d158' },
  { name: 'Xanh ngọc', value: '#00c7be' },
  { name: 'Xanh dương', value: '#0a84ff' },
  { name: 'Hồng', value: '#ff375f' },
  { name: 'Đen', value: '#000000' },
] as const;

export const font = {
  display: 'Urbanist_500Medium',
  text: 'Urbanist_400Regular',
  textMed: 'Urbanist_500Medium',
  mono: 'DMMono_500Medium',
} as const;

export const type = {
  title: { fontFamily: font.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.84 },
  head: { fontFamily: font.display, fontSize: 20, lineHeight: 26, letterSpacing: -0.4 },
  body: { fontFamily: font.text, fontSize: 16, lineHeight: 24 },
  button: { fontFamily: font.textMed, fontSize: 16, lineHeight: 20 },
  label: { fontFamily: font.textMed, fontSize: 13, lineHeight: 18 },
  num: { fontFamily: font.mono, fontSize: 13, lineHeight: 16 },
} as const;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48, 8: 64 } as const;

export const radius = { sm: 10, md: 16, lg: 24, full: 999 } as const;

export const size = {
  tap: 44,
  button: 48,
  iconButton: 44,
  icon: 24,
  iconSmall: 20,
  shutter: 76,
  thumb: 44,
  swatch: 36,
  chip: 32,
  segmented: 40,
  gutter: 24,
  edge: 16,
} as const;

export const motion = {
  in: 140,
  out: 200,
  press: 90,
  panel: 200,
  slide: 240,
  image: 600,
  /** Mọi bước UI. */
  ease: [0.2, 0.8, 0.2, 1],
  /** Chỉ khi vật di chuyển một quãng (sheet, tab, đặt lại overlay). */
  easeIO: [0.65, 0, 0.35, 1],
  pressScale: 0.985,
} as const;

/**
 * Zoom camera (src/features/camera/zoom.ts). Pinch ×2 khoảng cách → hệ số zoom ×2.
 * `maxFactor`: hệ số ứng với zoom = 1 của expo-camera; giá trị giả định vì expo-camera không cho
 * đọc. Pinch thấy quá nhanh thì tăng, quá chậm thì giảm. `precision`: bước làm tròn prop 0..1.
 */
export const cameraZoom = {
  maxFactor: 15,
  precision: 0.001,
} as const;

/** Giới hạn của overlay (roadmap §3.5). */
export const transformLimits = {
  minScale: 0.2,
  maxScale: 4,
  snapAngleDeg: 3,
} as const;
