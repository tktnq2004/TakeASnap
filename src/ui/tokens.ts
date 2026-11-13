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
  // Nền ô caro của vùng trống trong Chỉnh pose (góp ý Phase 1): xám đậm để không chói trên giao
  // diện tối; viền trắng và nét vàng vẫn nổi.
  checkerA: '#2c2e32',
  checkerB: '#3a3d42',
  /** Lưới và mốc thước trên khung ngắm. */
  guide: 'rgba(239,240,241,0.7)',
  /** Viền tối hai bên nét lưới: nét vẫn thấy được trên nền sáng (góp ý Phase 2). */
  guideHalo: 'rgba(24,25,27,0.3)',
  /** Khung bao overlay ở chế độ chỉnh (design.md §6.2: 1 px ink 40%). */
  overlayBox: 'rgba(239,240,241,0.4)',
  /** Chớp tối khi bấm chụp. */
  shutterFlash: '#000000',
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
 * Zoom camera (src/features/camera/zoom.ts). Thanh kéo và pinch dùng chung một hệ số.
 * `iosMaxFactor` / `androidMaxRatio`: zoom tối đa của ống mà expo-camera quy đổi `zoom` = 1 về;
 * JS không đọc được nên là giá trị giả định. Số trên thanh kéo lệch so với app camera của máy thì
 * chỉnh hai số này.
 */
export const cameraZoom = {
  /** 0,5× chỉ có trên iPhone có ống góc rộng; còn lại bắt đầu từ 1×. */
  min: 0.5,
  max: 5,
  step: 0.1,
  iosMaxFactor: 123.75,
  androidMaxRatio: 8,
  precision: 0.0005,
  /**
   * Khoảng cách tối thiểu giữa hai lần đẩy zoom sang state. iOS mỗi khung hình (60 lần/giây)
   * cho mượt như zoom gốc; Android ~30 lần/giây (spike A: dày hơn làm JS tụt 15–25 fps).
   */
  minIntervalMsIos: 16,
  minIntervalMsAndroid: 33,
  /** Zoom camera trượt tới giá trị mới trong khoảng này: nấc 0,1 của thanh kéo không còn giật. */
  smoothMs: 90,
  sliderWidth: 200,
} as const;

/** Thước cân bằng (business-flow §4.3): đổi màu nhấn khi lệch dưới `levelDeg`. */
/** Sửa nét (business-flow §5.2): cỡ cọ 8–64 px màn hình; nét đang vẽ hiện mờ 50%. */
export const refineBrush = { min: 8, max: 64, step: 1, initial: 24, liveOpacity: 0.5 } as const;

/** Đang xử lý ảnh: ảnh vẫn hiện, mờ 60% (design.md §6.6). */
export const processing = { imageOpacity: 0.6 } as const;

/** Màn Chọn người: người đã chọn phủ màu nhấn và viền ink; chưa chọn chỉ có viền mờ. */
export const personPick = { fill: 0.35, strokeOn: 2, strokeOff: 1.5 } as const;

/** Nét lưới khung ngắm: nét sáng 1 px kẹp giữa hai viền tối 1 px. */
export const gridLine = { width: 1, halo: 1 } as const;

export const levelGuide = { levelDeg: 1, length: 96, ref: 16, thickness: 2 } as const;

/** Camera: vùng xóa (design.md §6.2), hẹn giờ, chớp chụp. */
export const cameraUi = {
  trash: 64,
  /** NGÓN TAY vào trong bán kính này quanh tâm vùng xóa thì tính là thả để gỡ. */
  trashRadius: 56,
  /** Vòng vùng xóa phóng nhẹ khi ngón tay vào. */
  trashActiveScale: 1.15,
  /** Vào / ra vùng xóa: overlay thu về thùng rác (đi một quãng nên dùng easeIO). */
  trashInMs: 320,
  /** Thả trong vùng xóa: mờ hẳn rồi mới gỡ. */
  trashVanishMs: 420,
  timerOptions: [0, 3, 10],
  shutterFlashMs: 120,
  countdownSize: 96,
} as const;

/** Giới hạn của overlay (roadmap §3.5). */
export const transformLimits = {
  minScale: 0.2,
  maxScale: 4,
  snapAngleDeg: 3,
} as const;
