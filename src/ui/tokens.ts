/**
 * Design tokens — nguồn duy nhất cho màu, chữ, khoảng cách, radius, motion.
 * Giá trị theo docs/design.md §3 (Phase 4: tối cả app — than chì + xanh trời, bản B2; Nunito).
 * Component không được viết mã màu hay số rời; luôn đọc từ đây.
 * File này là dữ liệu thuần (không import thư viện native) để test được trong Jest.
 * Hàm easing dựng từ các hệ số bezier ở đây nằm trong `easing.ts`.
 */

export const color = {
  // Các màn ngoài Camera: Thư viện, Chỉnh sửa, Cài đặt, Xem ảnh vừa chụp (góp ý Phase 4: nền tối
  // cho đỡ mỏi mắt, cả app một tông với Camera và icon). Nền xám than trung tính, không ngả màu,
  // để màu ảnh và màu pose hiện đúng như thật; màu nhấn duy nhất là xanh trời dịu.
  bg: '#131416',
  surface: '#1D1F23',
  surfaceAlt: '#27292E',
  accentSoft: '#242C3A',
  /** Chữ trắng ngà, không trắng tuyền (đỡ chói trên nền tối). */
  ink: '#E8EAED',
  muted: '#9AA0A6',
  /** Icon tắt, mũi tên phải. Chỉ trang trí, không dùng cho chữ (3:1). */
  faint: '#5F6368',
  line: '#2C2F34',
  accent: '#8AB4F8',
  /** Chữ trên nút màu nhấn: tối (8.8:1). */
  accentInk: '#121417',
  danger: '#F28B82',
  dangerInk: '#121417',
  /** Rãnh công tắc lúc tắt. */
  switchOff: '#3C4043',
  /** Viền ô màu gần trùng nền (màu tối trên nền tối) để vẫn thấy được ô. */
  swatchEdge: '#5F6368',
  /** Núm thanh kéo và công tắc: sáng trên nền tối. */
  knob: '#F1F3F4',
  /** Nét vẽ đè lên ảnh (viền người khi chọn người): luôn trắng, không theo nền. */
  onImage: '#FFFFFF',
  /** Bóng của lớp nổi (nút nổi, thanh nổi, menu). */
  shadow: '#000000',
  /** Nền sau menu pose: trên lớp làm mờ (iOS) hoặc thay cho lớp làm mờ (Android). */
  menuScrim: 'rgba(19,20,22,0.62)',
  menuScrimSolid: 'rgba(19,20,22,0.9)',
  /** Nền mờ sau bảng màu nổi. */
  popoverScrim: 'rgba(0,0,0,0.35)',

  // Camera (nền tối).
  camBg: '#05070D',
  camInk: '#FFFFFF',
  camMuted: 'rgba(255,255,255,0.7)',
  camLine: 'rgba(255,255,255,0.25)',
  camGlass: 'rgba(255,255,255,0.12)',
  camScrim: 'rgba(5,7,13,0.55)',
  camPanel: 'rgba(16,22,36,0.94)',
  /** Cùng màu nhấn với các màn khác (B2). */
  camAccent: '#8AB4F8',
  camWarn: '#FACC15',
  /** Nền viên gợi ý bố cục dưới khung ngắm (design.md §6.15). */
  camHint: 'rgba(5,7,13,0.72)',
  /** Lưới và mốc thước trên khung ngắm. */
  guide: 'rgba(255,255,255,0.7)',
  /** Viền tối hai bên nét lưới: nét vẫn thấy được trên nền sáng (góp ý Phase 2). */
  guideHalo: 'rgba(5,7,13,0.3)',
  /** Khung bao overlay khi đang kéo (design.md §6.3: 1 px trắng 40%). */
  overlayBox: 'rgba(255,255,255,0.4)',
  /** Chớp tối khi bấm chụp. */
  shutterFlash: '#000000',

  // Nền ô caro sau preview pose (design.md §6.9).
  checkerA: '#17181B',
  checkerB: '#1D1F23',
} as const;

/** Màu chức năng cho viền và lớp phủ của pose (design.md §3.2). Không có tím. */
export const poseColors = [
  { name: 'Trắng', value: '#FFFFFF' },
  { name: 'Cam', value: '#FF8A3D' },
  { name: 'Vàng', value: '#FACC15' },
  { name: 'Xanh lá', value: '#22C55E' },
  { name: 'Đỏ', value: '#F87171' },
  { name: 'Xanh dương', value: '#2563EB' },
  { name: 'Đen', value: '#10213F' },
] as const;

export const font = {
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  heavy: 'Nunito_800ExtraBold',
} as const;

const tabular = ['tabular-nums'] as const;

export const type = {
  /** Tiêu đề màn mở đè lên Camera. */
  title: { fontFamily: font.heavy, fontSize: 30, lineHeight: 35 },
  /** Tiêu đề giữa đầu màn trong luồng; tên nhóm pose. */
  head: { fontFamily: font.heavy, fontSize: 18, lineHeight: 22 },
  body: { fontFamily: font.semibold, fontSize: 16, lineHeight: 23 },
  button: { fontFamily: font.heavy, fontSize: 16, lineHeight: 20 },
  /** Nhãn slider, công tắc, chip. */
  label: { fontFamily: font.heavy, fontSize: 15, lineHeight: 19 },
  /** Gợi ý, chữ phụ. */
  hint: { fontFamily: font.semibold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: font.heavy, fontSize: 13, lineHeight: 16 },
  num: { fontFamily: font.bold, fontSize: 13, lineHeight: 16, fontVariant: tabular },
  /** Huy hiệu trên nút, 1–3 ký tự. */
  badge: { fontFamily: font.heavy, fontSize: 11, lineHeight: 18 },
} as const;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 48 } as const;

export const radius = { sm: 12, md: 16, lg: 20, xl: 24, xxl: 28, full: 999 } as const;

export const size = {
  tap: 44,
  /** Nút chữ ở đáy màn. */
  button: 54,
  /** Nút chữ trong card hoặc đầu màn (Hủy, Chọn pose). */
  buttonSm: 40,
  chip: 42,
  iconButton: 44,
  icon: 20,
  iconSmall: 18,
  shutter: 82,
  thumb: 54,
  /** 7 màu sẵn + ô màu tự chọn vừa một hàng trong panel 330. */
  swatch: 32,
  segmented: 54,
  switchW: 52,
  switchH: 32,
  /** Lề trái của tiêu đề và chữ. */
  gutter: 20,
  /** Lề màn tới khối (card, panel) và tới điều khiển camera. */
  edge: 12,
} as const;

/** Bóng mềm cho lớp nổi (design.md §2.8). Card nằm yên không có bóng. */
export const elevation = {
  float: {
    shadowOpacity: 0.16,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  /** Nút primary: bóng màu nhấn. */
  primary: {
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

export const motion = {
  in: 140,
  out: 200,
  press: 90,
  panel: 200,
  slide: 240,
  image: 600,
  /** Giữ bao lâu thì thành thao tác giữ rồi kéo (độ hiện, zoom). */
  holdDelay: 300,
  /** Mọi bước UI. */
  ease: [0.2, 0.8, 0.2, 1],
  /** Chỉ khi vật di chuyển một quãng (sheet, tab, đặt lại overlay). */
  easeIO: [0.65, 0, 0.35, 1],
  pressScale: 0.97,
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
  /** Camera ảo (Triple / Dual Wide): zoom tối đa tính từ ống góc rộng, giả định như ống chính. */
  iosVirtualMaxFactor: 123.75,
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

/** Sửa nét (business-flow §5.2): cỡ cọ 8–64 px màn hình; nét đang vẽ hiện mờ 50%. */
export const refineBrush = { min: 8, max: 64, step: 1, initial: 24, liveOpacity: 0.5 } as const;

/** Đang xử lý ảnh: ảnh vẫn hiện, mờ 60% (design.md §6.8). */
export const processing = { imageOpacity: 0.6 } as const;

/** Chọn người trên màn đang xử lý: người được chọn phủ màu nhấn 35% + viền trắng 3 px; chưa chọn viền trắng nét đứt 2 px. */
export const personPick = {
  fill: 0.35,
  strokeOn: 3,
  strokeOff: 2,
  dash: [8, 6] as number[],
} as const;

/** Chọn nhiều pose (design.md §4 PoseTile): dấu chọn tròn góc trên phải, ô đã chọn viền 3 px. */
export const tileSelect = {
  /** Nút bút chì ở góc dưới phải ô pose (sửa nhanh, phiếu Phase 5 lần 7). */
  edit: 28,
  editIcon: 14,
  mark: 24,
  markInset: 6,
  ring: 2,
  border: 3,
  check: 13,
  fill: 0.15,
} as const;

/** Thư viện pose (design.md §6.5–6.6). */
export const library = {
  sampleW: 110,
  sampleH: 146,
  sampleRadius: 18,
  mineCols: 4,
  mineGap: 6,
  /** Chừa đáy danh sách để ô cuối không nằm dưới nút nổi. */
  listBottom: 110,
} as const;

/** Menu pose (design.md §6.7): ô nổi lên phóng to, menu ngay dưới ô. */
export const poseMenu = {
  liftW: 150,
  liftH: 200,
  liftRadius: 22,
  width: 200,
  row: 52,
  band: 8,
  gap: 12,
  blur: 30,
} as const;

/** Bảng màu (design.md §6.10): bảng nổi 306 rộng, mũi tên chỉ vào ô màu tự chọn. */
export const colorPopover = {
  width: 306,
  pad: 14,
  svHeight: 112,
  hueHeight: 12,
  thumb: 24,
  arrow: 8,
} as const;

/** Chỉnh pose (design.md §6.9): panel trắng cao cố định, preview bo góc. */
export const editor = { panelHeight: 232, panelPad: 18, panelGap: 14, chipGap: 8 } as const;

/**
 * Cột công cụ pose trên Camera (design.md §6.1): rộng 52, đệm 4, nút 44; vạch nắm ở đầu cột để
 * kéo. Giữ nút độ hiện thì cột thành thanh kéo gọn trong cột.
 */
export const cameraRail = {
  width: 52,
  pad: 4,
  gap: 4,
  item: 44,
  /** Nút thu gọn / mở cột ở đầu cột. */
  toggle: 28,
  /** Cách mép khung ngắm. */
  inset: 6,
  thumb: 28,
  /** Thanh độ hiện trong cột: chừa trên cho số %, dưới cho nửa núm. */
  sliderTop: 40,
  sliderBottom: 18,
  /** Khi đang kéo pose: cột và hàng chụp mờ còn chừng này. */
  dimOpacity: 0.25,
} as const;

/** Nét lưới khung ngắm: nét sáng 1 px kẹp giữa hai viền tối 1 px. */
export const gridLine = { width: 1, halo: 1 } as const;

export const levelGuide = { levelDeg: 1, length: 96, ref: 16, thickness: 2 } as const;

/** Camera: vùng xóa (design.md §6.3), hẹn giờ, chớp chụp. */
export const cameraUi = {
  trash: 74,
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
  /** Ảnh vừa chụp bay từ khung ngắm vào ô ảnh vừa chụp. */
  flyMs: 420,
  /** Chụp liên tục: ngừng bấm chừng này (và đã lưu xong) thì ảnh mới nhất bay vào ô. */
  burstSettleMs: 350,
  /** Chụp liên tục: tối đa số ảnh chờ lưu; bấm thêm thì bỏ qua. */
  burstMaxPending: 8,
  /**
   * Chụp liên tục: bấm lúc camera đang chụp thì nhớ một lần bấm; camera xong muộn hơn chừng này
   * thì bỏ lần bấm đó (không chớp muộn khi người dùng đã ngừng bấm).
   */
  burstTapTtlMs: 250,
  /** Đổi camera: chờ tối đa chừng này để camera báo sẵn sàng rồi mới cho chụp lại. */
  switchReadyMs: 1500,
  countdownSize: 96,
} as const;

/** Trợ lý bố cục trên Camera (design.md §6.15). */
export const compositionUi = {
  /** Các dòng nhận xét hiện lần lượt, mỗi dòng sau dòng trước chừng này (ms). */
  noteStagger: 60,
  /** Vòng chấm đích và chấm giữa. */
  target: 34,
  targetDot: 8,
  /** Các giao điểm 1/3 khi chưa có pose: vòng nhỏ. */
  point: 14,
  targetStroke: 2,
  /** Viên gợi ý. */
  hintH: 38,
  /** Tình trạng giữ yên chừng này mới hiện gợi ý (business-flow §6.4). */
  stableMs: 500,
  /** Viên "đạt" tự ẩn sau chừng này. */
  okHideMs: 1500,
  /** Dòng hướng dẫn khi vừa chọn kỹ thuật. */
  introMs: 4000,
  /** Thả pose: mắt cách giao điểm / điểm đích trong chừng này (px) thì dính vào điểm đó. */
  snapPointRadius: 28,
  /** Thả pose: mắt cách trục giữa trong chừng này (px) thì dính vào trục. */
  snapRadius: 18,
  /** Bảng Bố cục: dòng, ô hình nhỏ. */
  sheetRow: 52,
  sheetIcon: 40,
  /** Kiểm tra bố cục (Phase 5a): kết quả hiện chừng này rồi tự ẩn. */
  checkShowMs: 5000,
  /** Ảnh chụp lặng thu về cạnh dài này trước khi gửi vào WebView; lưới người cạnh dài này. */
  checkSide: 512,
  checkGrid: 256,
  /** Chấm mắt trên khung ngắm (design.md §6.15: chấm trắng 12, viền tối). */
  checkEye: 12,
  /** Nút Kiểm tra bố cục cách mép phải cụm zoom chừng này. */
  checkGap: 8,
  /** Hướng dẫn liên tục (Phase 5b): nét đích sáng, chấm nhắc. */
  focusStroke: 3,
  remindDot: 6,
  /** Sau lần nhắc thứ 5 còn chừng này (ms) rồi dừng (vòng quanh nút; khớp `GUIDE.graceMs`). */
  guideGraceMs: 10000,
  /** Mỗi lượt chụp lặng + phân tích cách nhau ít nhất chừng này (ms). */
  guideIntervalMs: 1000,
  /** Viên kết thúc (dừng giữa chừng, cảnh không áp được) hiện chừng này. */
  guideEndMs: 3000,
  /** Viên "Đạt: …" sau mỗi bước hiện chừng này rồi mới tới câu sau. */
  stepOkMs: 1200,
  /** Mũi tên kết quả trên khung ngắm: nét, cỡ đầu mũi tên. */
  arrowStroke: 3,
  arrowHead: 14,
  /** Ô "Bước 2/3" (cùng chấm nhắc) trên viên hướng dẫn. */
  stepChipH: 24,
} as const;

/** Vuốt từ mép trái để quay lại (màn mở kiểu fullScreenModal). */
export const edgeSwipe = {
  edge: 28,
  /** Chỉnh pose: vùng ảnh bắt đầu ở 12 px, dải hẹp để vuốt mép không cướp nét cọ. */
  editorEdge: 16,
  distance: 90,
  velocity: 600,
} as const;

/** Giới hạn của overlay (roadmap §3.5). */
export const transformLimits = {
  minScale: 0.2,
  maxScale: 4,
  snapAngleDeg: 3,
} as const;
