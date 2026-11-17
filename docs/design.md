# SnapShot — Design system

> Bản Phase 4: giao diện xanh dương – trắng, chốt qua 3 vòng chọn trên canvas thiết kế (5 phong cách → 5 bố cục mỗi màn → bản ghép).
> Hệ thống, copy và motion vẫn theo **tasteskill 2.5** (`.claude/skills/design-taste-frontend`); quy tắc màn hình di động lấy từ skill `imagegen-frontend-mobile` (vùng an toàn, chữ đủ to, ít khung lồng khung).
> Nghiệp vụ ở [business-flow.md](business-flow.md), kỹ thuật ở [roadmap.md](roadmap.md).

---

## 1. Hướng đã chốt

| Mục | Giá trị | Nguồn |
|---|---|---|
| Nền tảng | iOS và Android (Expo Go), chỉ tiếng Việt | [roadmap §0](roadmap.md#0-phạm-vi-đã-chốt) |
| Màu | **Xanh dương – trắng.** Camera nền tối; mọi màn khác nền trắng xanh | người dùng chọn, vòng 1 |
| Phong cách | **Bo tròn thân thiện**: khối to, bo lớn, dễ bấm (phong cách 2) | vòng 1 |
| Chữ | **Nunito** 600 / 700 / 800 | phong cách 2 |
| Bố cục | Camera C + cột công cụ dọc của D · Thư viện A · Pose của bạn D + thanh nổi của A · Menu B · Chỉnh pose A · Bảng màu B | vòng 2 |
| Camera | Zoom nút nhanh (kéo ra thước) · giữ nút độ hiện để kéo · cột công cụ kéo được | vòng 3 |

Vì sao camera vẫn tối: nền sáng quanh khung ngắm làm mắt đánh giá sai độ sáng và màu của cảnh. Các màn khác là màn đọc và chọn, nền sáng dễ nhìn hơn ngoài trời.

**So với các app lấy camera làm màn chính** (vòng 3): hàng ảnh vừa chụp · nút chụp · đổi camera giống Camera iPhone, Pixel, Samsung. Thanh trên ít nút rồi mở thêm cùng hướng với Camera iOS 26. Cột công cụ dọc giống Snapchat, Instagram. Zoom nút nhanh giống Camera iPhone, Pixel.

---

## 2. Nguyên tắc

1. **Ảnh là nhân vật chính.** Khung ngắm, pose và ảnh chiếm phần lớn màn hình. Điều khiển gọn ở mép, nền kính mờ trên camera.
2. **Một tay, một ngón.** Mọi thao tác hay dùng trên Camera nằm trong tầm ngón cái: nút chụp, zoom, cột công cụ. Thao tác có giá trị liên tục (zoom, độ hiện) làm bằng **giữ rồi kéo** ngay tại nút, thả tay là xong.
3. **Một màu nhấn, dùng có lý do.** Xanh `accent` chỉ cho: nút chính, trạng thái đang chọn/bật, thanh trượt, vòng chọn. Trên camera dùng xanh nhạt `camAccent` cho cùng các việc.
4. **Một hệ thống.** Một kiểu nút chính, một kiểu nút phụ, một kiểu nút icon, một họ radius, một thang khoảng cách. Không có màn nào tự đặt kiểu riêng.
5. **Đi theo ngón tay.** Trong lúc kéo, vật đi đúng 1:1 với ngón tay, không trễ, không easing. Chuyển động chỉ có ở lúc thả.
6. **Nói thẳng.** Mỗi nhãn đọc lên cho người lạ cũng hiểu ngay. Không ẩn dụ, không khen sản phẩm, không dấu chấm than.
7. **Không tím.** Mọi màu có hue OKLCH trong khoảng 270–330° đều bị loại khỏi UI, kể cả bảng màu pose có sẵn.
8. **Bóng chỉ cho lớp nổi.** Nút nổi, thanh nổi, menu, bảng màu, ô đang được nhấc lên có bóng mềm. Card và panel nằm yên thì không có bóng.

---

## 3. Token

Tất cả nằm trong `src/ui/tokens.ts`. Component chỉ đọc token, không viết mã màu hay số trực tiếp.

### 3.1 Màu

```ts
export const color = {
  // màn sáng (Thư viện, Chỉnh pose, Cài đặt, Xem ảnh vừa chụp)
  bg:          '#EEF3FF', // nền màn
  surface:     '#FFFFFF', // card, panel, menu, nút phụ
  surfaceAlt:  '#F1F4FA', // ô nhập, rãnh segmented trong card
  accentSoft:  '#E8F0FF', // nút nhẹ, rãnh slider, nhãn giá trị
  ink:         '#10213F', // chữ chính, icon
  muted:       '#5A6B8C', // nhãn, chữ phụ, gợi ý
  faint:       '#A3AEC2', // icon tắt, mũi tên phải (chỉ trang trí, không cho chữ)
  line:        '#E3E8EF', // hairline trong nhóm
  accent:      '#2563EB', // nút chính, đang chọn
  accentInk:   '#FFFFFF', // chữ trên accent
  danger:      '#DC2626', // xóa: nền nút đặc, hoặc chữ trên trắng
  dangerInk:   '#FFFFFF',

  // camera (nền tối)
  camBg:       '#05070D', // nền quanh khung ngắm
  camInk:      '#FFFFFF',
  camMuted:    'rgba(255,255,255,0.7)',
  camGlass:    'rgba(255,255,255,0.12)', // cụm nút trên thanh trên, cụm zoom, nút đổi camera
  camScrim:    'rgba(5,7,13,0.55)',      // cột công cụ, nút zoom
  camPanel:    'rgba(16,22,36,0.94)',    // bảng mở thêm công cụ
  camAccent:   '#60A5FA', // viền nút pose, zoom đang dùng, thanh độ hiện, thước đã thẳng
  camWarn:     '#FACC15', // vạch thước cân bằng khi máy còn lệch
  grid:        'rgba(255,255,255,0.35)',
  checkerA:    '#FFFFFF', // nền ô caro sau preview pose
  checkerB:    '#EEF2F8',
} as const;
```

Tương phản (WCAG, đã tính):

| Cặp | Tỉ lệ | Dùng cho |
|---|---|---|
| `ink` trên `bg` | 14.4:1 | mọi chữ đọc |
| `muted` trên `bg` / `surface` | 4.8 / 5.4:1 | nhãn, gợi ý |
| `accentInk` trên `accent` | 5.2:1 | chữ trên nút chính |
| `accent` trên `bg` / `accentSoft` | 4.7 / 4.5:1 | chữ nút phụ, giá trị slider |
| `dangerInk` trên `danger` / `danger` trên `surface` | 4.8:1 | nút xóa đặc / chữ xóa |
| `camAccent` trên `camBg` | 7.9:1 | trạng thái trên camera |

- Đỏ `#EF4444` (bản vẽ vòng 2) bị thay bằng `#DC2626` vì chữ trắng trên `#EF4444` chỉ đạt 3.8:1.
- Màu không bao giờ đứng một mình để báo trạng thái: xóa luôn có icon thùng rác và chữ "Xóa", flash tự động có chữ "A".
- Không gradient trong UI. Ngoại lệ là ô chọn màu và thanh hue trong Bảng màu (nội dung, không phải trang trí).

### 3.2 Màu cho pose (màu chức năng)

Màu người dùng chọn cho viền, nét mặt và lớp phủ, phải nổi trên mọi cảnh chụp. Không thuộc màu UI, nhưng vẫn không có tím.

| Tên | Mã | Mặc định cho |
|---|---|---|
| Trắng | `#FFFFFF` | viền, nét mặt |
| Cam | `#FF8A3D` | phủ |
| Vàng | `#FACC15` | |
| Xanh lá | `#22C55E` | |
| Đỏ | `#F87171` | |
| Xanh dương | `#2563EB` | |
| Đen | `#10213F` | |

Ô dấu cộng cuối hàng mở **Bảng màu** (§6.11). Màu người dùng tự chọn là nội dung của họ, không bị luật cấm tím. Bảng màu nhớ 6 màu dùng gần đây.

### 3.3 Chữ

Nunito qua `@expo-google-fonts/nunito` (JS thuần + `expo-font`, chạy trong Expo Go). Phase 4 bỏ Urbanist và DM Mono.

```ts
export const font = {
  semibold: 'Nunito_600SemiBold',
  bold:     'Nunito_700Bold',
  heavy:    'Nunito_800ExtraBold',
};

export const type = {
  title:   { fontFamily: font.heavy,    fontSize: 30, lineHeight: 35 }, // tiêu đề màn mở đè lên Camera
  titleSm: { fontFamily: font.heavy,    fontSize: 18, lineHeight: 22 }, // tiêu đề giữa đầu màn trong luồng
  head:    { fontFamily: font.heavy,    fontSize: 18, lineHeight: 22 }, // tên nhóm pose
  body:    { fontFamily: font.semibold, fontSize: 16, lineHeight: 23 },
  button:  { fontFamily: font.heavy,    fontSize: 16, lineHeight: 20 },
  label:   { fontFamily: font.heavy,    fontSize: 15, lineHeight: 19 }, // nhãn slider, công tắc, chip
  hint:    { fontFamily: font.semibold, fontSize: 14, lineHeight: 20 }, // gợi ý, chữ phụ
  caption: { fontFamily: font.heavy,    fontSize: 13, lineHeight: 16 }, // tên nhóm trong Cài đặt, giá trị trong nhãn
  num:     { fontFamily: font.bold,     fontSize: 13, lineHeight: 16, fontVariant: ['tabular-nums'] },
  badge:   { fontFamily: font.heavy,    fontSize: 11, lineHeight: 18 }, // huy hiệu trên nút, 1–3 ký tự
};
```

- Viết hoa chữ đầu câu. Không viết hoa toàn bộ, trừ tên nhóm trong Cài đặt (`caption`, giãn chữ 0.02em).
- Không chữ nào dưới 13 px, trừ huy hiệu 11 px trên nút (A, 60) và số 12 px trên thước zoom.
- Số dùng `tabular-nums` để không nhảy độ rộng khi kéo: `1,0×`, `40%`, `4,0 px`. Dấu thập phân là dấu phẩy.
- Theo cỡ chữ hệ thống qua `allowFontScaling`, tối đa 1.3× cho điều khiển camera (`maxFontSizeMultiplier`).

### 3.4 Khoảng cách, kích thước, radius

```ts
export const space  = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 48 } as const;
export const radius = { sm: 12, md: 16, lg: 20, xl: 24, xxl: 28, full: 999 } as const;
export const size = {
  tap:        44, // vùng chạm nhỏ nhất
  button:     54, // nút chữ ở đáy màn
  buttonSm:   36, // nút chữ trong card (Hủy, Xong)
  chip:       42, // chip tab Chỉnh pose
  iconButton: 44,
  shutter:    82, // vòng ngoài 5 px trắng, đĩa trong accent
  thumb:      54, // ảnh vừa chụp, đổi camera
  swatch:     36,
  edge:       12, // lề màn: mép tới khối và mép tới điều khiển camera
  railW:      52,
};
```

| Radius | Dùng cho |
|---|---|
| `sm` 12 | ô nhập, ô chọn màu trong Bảng màu, nút icon vuông trong card |
| `md` 16 | ô pose trong lưới 4 cột, ảnh vừa chụp |
| `lg` 20 | nhóm Cài đặt, Bảng màu, menu |
| `xl` 24 | card nhóm Thư viện, ảnh trong Xem ảnh vừa chụp, bảng mở thêm trên camera |
| `xxl` 28 | khung ngắm, preview Chỉnh pose, panel điều khiển, thanh nổi |
| `full` | nút chữ, nút icon, chip, segmented, nút chụp, cột công cụ |

Khung ngắm bo `xxl` (đổi so với Phase 2): khung đặt trên nền tối nên góc bo không làm hiểu sai vùng ảnh, ảnh lưu vẫn là hình chữ nhật đủ góc.

### 3.5 Motion

```ts
export const motion = {
  in: 140, out: 200, press: 90, panel: 200, slide: 240, image: 600, holdDelay: 300,
  ease:   Easing.bezier(0.2, 0.8, 0.2, 1),    // mọi bước UI
  easeIO: Easing.bezier(0.65, 0, 0.35, 1),    // khi vật di chuyển một quãng
};
```

| Thành phần | Chuyển động | Thời gian |
|---|---|---|
| Nút (mọi loại) | nhấn: scale .97, thả: về lại | 90 ms vào, 200 ms ra |
| Nút chụp | nhấn: đĩa trong thu 4 px; chụp xong: khung ngắm tối 40% rồi sáng lại | 90 ms; 140 ms |
| Zoom nút ↔ thước | cross-fade tại chỗ, thước hiện ngay khi ngón bắt đầu kéo ngang | 140 ms |
| Cột công cụ ↔ thanh độ hiện | cột co lại, thanh giãn ra quanh ngón tay; thả tay thì ngược lại | 140 ms `ease` |
| Cột công cụ khi quăng | trôi theo vận tốc rồi dính mép trái/phải, không nảy | 240 ms `easeIO` |
| Bảng mở thêm trên camera | mờ + trượt 8 px từ thanh trên | 200 ms |
| Sheet / màn mở đè | trượt lên từ đáy, không nảy | 240 ms `easeIO` |
| Menu pose | ô pose phóng lên, nền mờ, menu hiện dưới ô | 140 ms `ease` |
| Bảng màu | phóng từ ô màu tự chọn (gốc là mũi tên) | 140 ms `ease` |
| Overlay khi kéo | đi đúng 1:1 theo ngón tay | 0 |
| Overlay thả vào điểm hít / chạm đúp | về 0°/90° · về vị trí gốc | 140 ms `ease` · 240 ms `easeIO` |
| Ảnh vừa chụp | ảnh mới thay ảnh cũ bằng cross-fade | 200 ms |

Cấm:
- `spring` có nảy hoặc vượt đích.
- Chuyển động tự chạy khi người dùng không chạm.
- Loader che màn hình. Khi đang xử lý: giữ nguyên màn, hiện các bước cụ thể (§6.8).
- Khi bật Reduce Motion: sheet, bảng, menu đổi ngay; mọi chuyển động thả về đích thành tức thì. Cử chỉ vẫn đi theo ngón tay.

### 3.6 Haptics

> `expo-haptics` có trong Expo Go. Mọi lệnh rung đi qua `src/lib/haptics.ts`, file này tự bỏ qua nếu máy thiếu module. Mọi phản hồi quan trọng vẫn có tín hiệu nhìn thấy được.

| Sự kiện | Kiểu |
|---|---|
| Chụp ảnh | `impactLight` |
| Overlay hít vào 0°/90° | `selection` |
| Overlay vào vùng xóa | `notificationWarning` (một lần mỗi lần vào) |
| Thước cân bằng chuyển sang thẳng | `selection` |
| Zoom đi qua mốc 0,5 · 1 · 2 · 3 khi kéo thước | `selection` |
| Thanh độ hiện chạm 0% hoặc 100% | `selection` |
| Cột công cụ dính vào mép | `selection` |
| Mở menu pose (giữ ô) | `impactMedium` |
| Chọn / bỏ chọn người, chọn ô khi vuốt chọn nhiều | `selection` |
| Lưu pose / lưu ảnh xong | `notificationSuccess` |

### 3.7 Icon

- **Một bộ: Lucide** (`lucide-react-native`). Nét 2 (2.25 cho mũi tên và X), cỡ 20 trong nút 44, 18 trong chip và nút nhỏ.
- Không emoji làm icon. Mọi nút chỉ có icon phải có `accessibilityLabel` tiếng Việt, cùng chữ với nhãn ở §5.

| Việc | Icon Lucide |
|---|---|
| Đổi camera | `switch-camera` |
| Flash tắt / bật / tự động | `zap-off` / `zap` / `zap` + huy hiệu "A" |
| Hẹn giờ | `timer` (+ huy hiệu số giây khi bật) |
| Mở thêm công cụ | `chevron-down` (xoay 180° khi đang mở) |
| Lưới · Thước cân bằng | `grid-3x3` · `ruler` |
| Cài đặt | `settings` |
| Nút pose | thumbnail pose đang dùng; chưa có pose thì `plus` |
| Chỉnh pose · Độ hiện · Lật ngang · Ẩn / hiện pose | `pencil` · `contrast` · `flip-horizontal-2` · `eye-off` (đang ẩn: `eye`, nền `accent`) |
| Gỡ pose, xóa | `trash-2` |
| Tab Viền · Phủ · Nền · Cọ | `pen-tool` · `droplet` · `image` · `brush` |
| Cọ Thêm · Xóa | `plus` · `eraser` |
| Hoàn tác / làm lại | `undo-2` / `redo-2` |
| Mở Bảng màu · Lấy màu từ ảnh | `plus` · `pipette` |
| Thêm ảnh từ máy | `image-plus` |
| Dùng để chụp (menu) | `camera` |
| Chia sẻ ảnh | `share` |
| Chọn (dấu tích) | `check` |
| Đóng · Quay lại · Mở mục | `x` · `corner-up-left` + chữ "Quay lại" · `chevron-right` |

---

## 4. Component

Mỗi loại chỉ có một kiểu. Không màn nào được tự tạo nút riêng.

| Component | Mô tả |
|---|---|
| `Button` `primary` | cao 54, `full`, nền `accent`, chữ `accentInk` `button`, bóng `accent` 35%. **Mỗi màn một nút primary** |
| `Button` `secondary` | cao 54, `full`, nền `surface`, chữ `accent` (trên nền `bg`) |
| `Button` `soft` | cao 52, `full`, nền `accentSoft`, chữ `accent` ("Chọn tất cả") |
| `Button` `danger` | cao 52, `full`, nền `danger`, chữ `dangerInk` + icon `trash-2`; chỉ cho xóa hàng loạt không hoàn tác được |
| `Button` `dangerText` | nền trong suốt hoặc `surface`, chữ `danger` + icon ("Xóa ảnh", "Xóa bộ tách") |
| `Button` `text` | chữ `accent`, không nền |
| `BackButton` | cao 44, `full`, nền `surface`, icon `corner-up-left` `accent` + chữ "Quay lại" |
| `CloseButton` | 44×44, `full`, nền `surface`, icon `x` `ink` |
| `IconButton` | 44×44, `full`. Trên camera: nền trong suốt bên trong cụm kính; đang bật: nền `accent`. Có thể mang `Badge` |
| `Badge` | 18 cao, nền trắng, chữ `accent` `badge`, góc trên phải nút |
| `GlassGroup` | cụm nút camera: nền `camGlass`, `full`, đệm 4, khe 2 |
| `ToolRail` | cột công cụ pose: rộng 52, nền `camScrim`, `full`, đệm 4, khe 4, nút thu gọn / mở cao 28 ở đầu cột (khi có pose). Kéo ở bất kỳ đâu trên cột để dời, quăng ngang dính mép trái/phải, luôn kẹp trong khung ngắm, nhớ vị trí và trạng thái thu gọn (§6.1) |
| `ZoomControl` | 4 nút 0,5 · 1× · 2 · 3 trong `GlassGroup`; kéo ngang thì thành **thước cuộn kim giữa** 330×56 (§6.1) |
| `Shutter` | 82, vòng 5 px trắng, đĩa `accent` |
| `Chip` | cao 42, `full`, nền `surface`, icon 18 `accent` + chữ `label`; đang chọn: nền `accent`, chữ và icon trắng. Tab của Chỉnh pose |
| `Segmented` | rãnh `surface` (trên `bg`) hoặc `surfaceAlt` (trong card), đệm 3–4, ô `full`; đang chọn: nền `accent` chữ trắng. Pose mẫu / Pose của bạn, Viền / Mặt, Thêm / Xóa, Lưới |
| `Slider` | rãnh 10 `accentSoft`, phần đã chọn `accent`, núm 28 trắng viền 4 `accent`. Nhãn `label` trái, giá trị `num` trong nhãn tròn `accentSoft` bên phải |
| `Switch` | 52×32, bật `accent`, tắt `#D5DDEA`, núm trắng 26 |
| `Swatch` | 32 tròn (7 màu sẵn + ô màu tự chọn vừa một hàng 330); màu trắng có viền 2 px `#DCE6F7`; đang chọn: vòng 2 px `accent` cách 2 px |
| `PoseTile` | ảnh gốc đầy đủ màu. Thư viện: 110×146 bo 18. Lưới 4 cột: bo 16. Pose mẫu thêm viền trắng 1.5 px; pose của bạn vẽ style của chính bản đó (độ dày ≤ 2 px). Chạm = dùng để chụp; giữ = menu. Chế độ chọn: vòng 24 góc trên phải; đã chọn = viền 3 px `accent` + phủ `accent` 15% + đĩa `accent` có dấu tích |
| `GroupCard` | nền `surface`, `xl`, đệm 16 (phải 0 để hàng ảnh tràn mép) |
| `SettingsGroup` | nền `surface`, `lg`, hàng cao ≥ 56, hairline `line` thụt 16 |
| `FloatingBar` | nền `surface`, `xxl` + 4, đệm 8, bóng; ghim đáy cách 30 |
| `ContextMenu` | menu pose: nền mờ (blur 12 + `bg` 62%), ô phóng to 150×200, menu 250 rộng nền `surface` `lg` + 2, hàng 52, mục nguy hiểm tách bằng dải 8 px `bg` |
| `ColorPopover` | Bảng màu: 306 rộng, `lg`, bóng, mũi tên chỉ vào ô màu tự chọn (§6.11) |
| `StatusSteps` | danh sách bước đang xử lý: xong = đĩa `accent` có dấu tích, đang chạy = vòng quay, chưa tới = vòng xám; chữ `label` |
| `EmptyState` | một câu `body` nói chuyện gì đã xảy ra + một nút làm tiếp; dùng chung cho trống, lỗi, thiếu quyền. Không icon minh họa, không câu hướng dẫn thêm |

Panel điều khiển của Chỉnh pose có **chiều cao cố định** (222): đổi tab không làm preview co giãn.

---

## 5. Copy

Theo `references/copy.md`, viết bằng tiếng Việt.

### 5.1 Luật

1. **Tiêu đề có danh từ:** "Thư viện pose", "Chỉnh pose", "Cài đặt". Không câu hỏi, không câu cảm thán.
2. **Nút = động từ + đối tượng,** 1–4 từ: "Chụp ảnh", "Lưu pose", "Xóa 5 pose", "Chia sẻ ảnh". Không dùng "OK", "Xác nhận", "Tiếp tục".
3. **Một việc, một cách gọi.** "Lưu pose" ở mọi nơi.
4. **Không quảng cáo, không cảm thán.**
5. **Lỗi = chuyện gì xảy ra + làm gì tiếp** ([business-flow §10.3](business-flow.md#103-thông-báo-lỗi)).
6. **Không placeholder, không chữ mẫu** trong bản build.
7. **Không chữ trên ảnh** ngoài nhãn điều khiển cần thiết. Thumbnail pose không có caption.

### 5.2 Bảng nhãn chuẩn

| Chỗ | Nhãn |
|---|---|
| Nút chụp (a11y) | Chụp ảnh |
| Nút pose (a11y) | Mở thư viện pose |
| Mở / đóng bảng công cụ (a11y) | Mở thêm công cụ / Thu gọn công cụ |
| Cột công cụ (a11y) | Cột công cụ pose, kéo để dời chỗ |
| Vùng xóa | Thả để gỡ pose |
| Thêm pose | Thêm ảnh từ máy |
| Menu pose của bạn | Chụp · Sửa · Xóa |
| Menu pose mẫu | Chụp · Tạo bản sao |
| Menu, cách hủy | Chạm ra ngoài để hủy |
| Chọn nhiều | Đã chọn n · Hủy · Chọn tất cả · Xóa n pose |
| Màn Chỉnh pose (tiêu đề) | Chỉnh sửa |
| Chọn người (bước trên màn đang xử lý) | Chọn người · n/m · Hủy · Dùng n người |
| Chỉnh pose, tab | Viền · Phủ · Nền · Cọ |
| Chỉnh pose, nút | Lưu thành bản mới · Lưu pose |
| Bảng màu | Mã màu · Lấy màu từ ảnh · Gần đây |
| Xem ảnh vừa chụp | Ảnh n trên m · Xóa ảnh · Chia sẻ ảnh |
| Cài đặt | Chụp · Dung lượng · Giới thiệu; Lưu như thật / Lưu soi gương; Rung phản hồi; Xóa bộ tách |
| Thiếu quyền camera (trong khung ngắm) | SnapShot cần camera để chụp theo pose. · Mở Cài đặt |

---

## 6. Màn hình

Khung vẽ cho máy 390×844. Bản vẽ đầy đủ trên canvas thiết kế (trang "Bản ghép — vòng 3"). Số đo dưới đây là cho 390×844; máy khác giữ lề và cỡ nút, khung ngắm và preview co theo chiều rộng.

**Hai kiểu đầu màn** (business-flow §7.3):
- **Màn mở đè lên Camera** (Thư viện pose, Cài đặt, Xem ảnh vừa chụp): tiêu đề `title` bên trái, `CloseButton` bên phải. Đóng là về Camera.
- **Màn là một bước trong luồng** (Chỉnh pose): `BackButton` bên trái, tên màn `titleSm` căn giữa.

### 6.1 Camera

```
┌──────────────────────────────────┐
│ ( 📏  3:4  ⌄• )          ( ⚙ ) │  top 52: GlassGroup trái · Cài đặt 52 phải
│╭────────────────────────────────╮│  khung ngắm: top 112, rộng hết màn, bo 28
││··························· ╭──╮ ││
││·········╭──╮·············│ ═ │││  cột công cụ (ToolRail), mặc định mép phải,
││·········│  │  pose ·······│[▣]│││  giữa khung ngắm:
││········╭┴──┴╮············│ ✎ │││    nút thu gọn · nút pose · Chỉnh pose
││──── ╱╱╱╱╱╱ ────··········│ ◐ │││    · Độ hiện (huy hiệu %) · Lật ngang
││·········│  │·············│ ⇋ │││    · Ẩn / hiện pose
││·········╰──╯·············│ ⊘ │││
││··························· ╰──╯ ││  thước cân bằng: 2 vạch trắng cố định,
│╰────────────────────────────────╯│  vạch giữa vàng nghiêng theo máy
│       ( 0,5  [1×]  2   3 )       │  ZoomControl, top 660
│                                  │
│   [ảnh]      (( ● ))      ( ⟲ )  │  top 720: ảnh vừa chụp 54 · nút chụp 82 · đổi camera 54
└──────────────────────────────────┘
```

- **Không còn hàng chọn chế độ** dưới nút chụp (vòng 3).
- **Thanh trên** (góp ý Phase 4): Đèn flash (huy hiệu "A" khi tự động), Hẹn giờ (huy hiệu số giây), Lưới (huy hiệu 3 / 4), Thước cân bằng (mặc định bật), Tỉ lệ (chữ `3:4`), nút Mở thêm. Chạm nút trên thanh để đổi nhanh. Cài đặt tách riêng bên phải.
- **Bảng mở thêm** (chạm nút ⌄): bảng `camPanel` rộng hết màn trừ lề (tối đa 360), bo 24, ngay dưới thanh trên. Ba hàng cao 48 để chọn thẳng giá trị: Đèn flash `[Tắt | Tự động | Bật]`, Hẹn giờ `[Tắt | 3 s | 10 s]`, Lưới `[Tắt | 3×3 | 4×4]`. **Thả xuống** cao dần từ 0 trong 200 ms `easeIO`, các hàng trượt xuống 12 px và hiện dần; **kéo lên** ngược lại; mũi tên xoay 180° theo. Chạm ra ngoài hoặc nút ⌃ thì thu lên.
- **Thước cân bằng:** vạch giữa 80×2 màu `camWarn` xoay theo độ nghiêng; lệch dưới 1° thì ba vạch nối thẳng, đổi `camAccent`, rung `selection`.
- **Cột công cụ (`ToolRail`):**
  - Chạm nhanh một nút = bấm nút. Kéo ở **bất kỳ đâu trên cột** (ngón đi quá 10 px) = dời cột; khi đó lượt chạm của nút bị hủy nên thả tay không bấm nhầm.
  - **Thu gọn** (góp ý Phase 4): nút ⌃ ở đầu cột thu cột lại, chỉ còn nút chọn pose; nút ⌄ mở lại. **Mép trên cột đứng yên**: thu gọn thì cột cuộn lên, mở thì xổ xuống (200 ms `easeIO`, các nút phụ mờ dần và trượt 12 px; mũi tên xoay theo). Vị trí lưu là mép trên cột; mở ra mà chạm mép dưới khung thì cột dịch lên vừa đủ. Trạng thái thu gọn được nhớ.
  - Kéo dọc tự do; thả với vận tốc ngang thì cột trôi rồi dính mép trái hoặc phải; thả chậm thì dính mép gần hơn.
  - Luôn kẹp trong khung ngắm (cách mép khung 6). Đổi tỉ lệ khung thì kẹp lại.
  - Vị trí lưu vào cài đặt máy, lần mở sau giữ nguyên.
  - Cột sang trái thì nhãn và thanh độ hiện mở về phía phải.
- **Độ hiện:** chạm = đổi nhanh 100% → 60% → 30%. **Giữ 300 ms** = các nút trong cột nhường chỗ cho thanh kéo dọc **gọn trong khung cột** (không lấn ra ngoài); số % ở đầu cột. Kéo lên tăng, kéo xuống giảm (0–100%, bước 5), tính theo quãng ngón tay đi, không cần ngón tay nằm đúng chỗ núm (góp ý Phase 4). Thả tay: giữ giá trị, cột trở lại. Cả thao tác một ngón.
- **Zoom (`ZoomControl`)** — thước cuộn kim giữa (chọn ở vòng 4, kiểu B):
  - Lúc nghỉ: 4 nút `0,5 · 1× · 2 · 3` trong cụm kính; nút đang dùng to 44, chữ `camAccent`, mang giá trị thật (vd `1,4×`).
  - Chạm nút = nhảy tới mức đó.
  - Đặt ngón lên cụm rồi kéo ngang = 4 nút đổi thành **thước cuộn** 330×56 tại chỗ (nền `camScrim`, bo `full`). **Kim đứng yên ở giữa** (3×30, `camAccent`); thước chạy dưới kim theo ngón tay, kéo sang trái là tăng zoom. Thước theo thang log (mỗi lần gấp đôi cách nhau 70 px), vạch nhỏ mỗi 0,1, vạch lớn kèm số ở 0,5 · 1 · 2 · 3 · 5; vạch và số mờ dần về hai mép.
  - Giá trị hiện trong nhãn `accent` ngay trên kim (`1,4×`), luôn ở giữa nên mắt không phải đuổi theo.
  - 0,5×–5×, bước 0,1; đi qua mốc 0,5 · 1 · 2 · 3 thì rung `selection`. Thả tay: giữ mức zoom, thước thu về 4 nút.
  - Camera trước và Android không có ống góc rộng: bỏ nút `0,5`.
  - iPhone có camera ảo (Triple / Dual Wide): app luôn dùng camera ảo, máy tự chuyển ống khi zoom nên không chớp khi qua 1×. Máy chỉ có ống rời vẫn phải đổi ống, còn chớp.
  - Pinch ngoài pose vẫn zoom như cũ.
- **Hàng chụp:** Ảnh vừa chụp 54 bo 17 viền 2 trắng 80% · nút chụp 82 · Đổi camera 54 nền `camGlass`. Lề hai bên 40.
- **Ở tỉ lệ 9:16** khung ngắm tràn ra sau thanh trên và cụm zoom: mọi nút đã có nền kính nên vẫn đọc được.

### 6.2 Camera — chưa có pose

- Lần đầu mở app, hoặc khi đã gỡ pose: cột chỉ còn nút pose là **ô tròn 44 có dấu cộng** (icon `plus` trắng, viền 2 px `camAccent`, nền trong). Chạm mở Thư viện pose.
- Không có gợi ý, bóng chữ hay hiệu ứng chỉ chỗ.
- Chưa chụp ảnh nào: ô ảnh vừa chụp chỉ có viền trắng 25%, không bấm được.

### 6.3 Camera — đang kéo pose

- Chạm vào pose là kéo được ngay; overlay mờ 60% và có khung bao 1 px trắng 40% trong lúc kéo.
- Cột công cụ và hàng chụp mờ còn 25%; cụm zoom được thay bằng **vùng xóa** 74 (vòng `danger` 3 px, nền `danger` 25%, icon `trash-2` 28) + chữ "Thả để gỡ pose".
- Ngón tay vào vùng xóa: overlay nhuộm đỏ, thu nhỏ về phía thùng rác, rung cảnh báo. Thả lúc đó thì gỡ pose; kéo ra thì trở lại như cũ.

### 6.4 Quyền camera

Không có màn riêng: mở app lần đầu thì gọi thẳng hộp thoại xin quyền của máy (`useCameraPermissions` của `expo-camera`). Camera vẫn vẽ đủ thanh trên, cột công cụ và hàng chụp trong lúc chờ.

Đã bị từ chối (hộp thoại không hiện lại được): trong khung ngắm tối chỉ có `EmptyState`: "SnapShot cần camera để chụp theo pose." và nút "Mở Cài đặt" (`Linking.openSettings()`). Thư viện pose vẫn mở được bằng nút pose.

### 6.5 Thư viện pose (mở đè lên Camera)

```
┌──────────────────────────────────┐
│ Thư viện pose                (x) │  title 30, CloseButton
│ ( [ Pose mẫu ] Pose của bạn  )   │  Segmented trên rãnh trắng, ô 46
│ ╭──────────────────────────────╮ │
│ │ Quán cà phê                  │ │  GroupCard: tên nhóm head, không đếm số pose
│ │ ┌───┐ ┌───┐ ┌───┐ ┌──        │ │  PoseTile 110×146 cuộn ngang, tràn mép phải card
│ │ └───┘ └───┘ └───┘ └──        │ │
│ ╰──────────────────────────────╯ │
│ ╭ Đường phố  7 pose ───────────╮ │
│ ╰──────────────────────────────╯ │
│        ( ▣  Thêm ảnh từ máy )    │  nút primary nổi, giữa, cách đáy 34
└──────────────────────────────────┘
```

- Mọi ô hiện ảnh gốc đầy đủ màu. Pose mẫu thêm viền trắng 1.5 px.
- Danh sách cuộn dưới nút nổi; chừa đáy 110 để ô cuối không bị che.

### 6.6 Pose của bạn (tab trong Thư viện)

- Lưới phẳng **4 cột**, khe 6, mỗi bản pose một ô (vẽ style của chính bản đó).
- Trống: một dòng `body` "Chưa có pose nào. Thêm một ảnh có người để lấy dáng." và nút primary "Thêm ảnh từ máy".
- **Chọn nhiều:** vào bằng "Chọn pose" (hoặc vuốt ngang qua các ô, như Ảnh của iPhone). Tiêu đề đổi thành "Đã chọn n pose" + nút "Hủy" (`secondary` nhỏ, chữ `accent`); không có dòng hướng dẫn. `FloatingBar` ở đáy: "Chọn tất cả" (`soft`) và "Xóa n pose" (`danger`, rộng 1.3 phần). Xóa có hộp thoại xác nhận.

### 6.7 Menu pose (giữ một ô)

- Nền mờ toàn màn, ô pose được nhấc lên và phóng to 150×200 (bo 22, bóng), menu ngay dưới ô.
- Pose của bạn: **Dùng để chụp** (chữ `accent`, icon `camera`) · Sửa pose (`pencil`) · dải 8 px · **Xóa pose** (chữ `danger`, `trash-2`).
- Pose mẫu: Dùng để chụp · Tạo bản sao để sửa. Không có Xóa.
- Dòng `hint` "Chạm ra ngoài để hủy" ở đáy. Ô gần đáy màn thì menu mở lên phía trên ô.
- Lớp phủ ngay trong màn Thư viện (không mở màn mới). iOS làm mờ bằng `BlurView` của `expo-blur` (có trong Expo Go) cộng lớp `menuScrim`; Android dùng lớp `menuScrimSolid` sáng 90%, vì làm mờ thật trên Android phải bọc cả nội dung trong `BlurTargetView`. Không dùng menu ngữ cảnh native.
- Ô nổi phóng từ đúng chỗ ô trong lưới (140 ms), menu hiện mờ dần ngay dưới; chọn một mục hoặc chạm ra ngoài thì thu về rồi mới làm việc đó. Rung `impactMedium` khi mở.

### 6.8 Đang xử lý (trong luồng Thêm ảnh từ máy)

- **Chọn người:** không có màn riêng; là một bước trên màn Đang xử lý (§6.13b, vòng 6).
- **Đang xử lý:** giữ đầu màn Thư viện; ảnh vừa chọn 288×384 mờ 60% với một vạch quét `accent`; dưới là `StatusSteps` trong card trắng:

| Bước | Chữ |
|---|---|
| Tải bộ tách người (chỉ lần đầu) | Tải bộ tách người, 12 trên 42 MB |
| Tách người | Tách người khỏi nền |
| Nét mặt | Tìm nét mặt |
| Contour | Vẽ dáng |

  Không có dòng chú thích nào khác. Lỗi: hộp thoại theo business-flow §10.3 ("Chọn ảnh khác", "Thử tải lại", "Thử lại").

### 6.9 Chỉnh pose

```
┌──────────────────────────────────┐
│ ( ↶ Quay lại )   Chỉnh pose      │  BackButton · titleSm giữa
│╭────────────────────────────────╮│  preview trên ô caro (checkerA/B, ô 10),
││▒░▒░▒░▒░▒░▒░ ╭──╮ ▒░▒░▒░▒░▒░▒░▒░││  top 106, cao 340, bo 28; ảnh contain,
││░▒░▒░▒░▒░▒░▒╭┴⊙⊙┴╮░▒░▒░▒░▒░▒░▒░▒││  không kéo / pinch
││▒░▒░▒░▒░▒░▒░╰┬──┬╯▒░▒░▒░▒░▒░▒░▒░││
│╰────────────────────────────────╯│
│ [Viền] (Phủ) (Nền) (Cọ)          │  Chip, top 458
│╭────────────────────────────────╮│  panel trắng, cao cố định 222, bo 28
││ [Viền|Mặt]        Hiện viền [●]││
││ ● ○ ● ● ● ● (+)                ││  Swatch; (+) mở Bảng màu
││ Độ dày                  (4,0 px)││
││ ━━━━━●────────────────────     ││
│╰────────────────────────────────╯│
│ ( Lưu thành bản mới ) ( Lưu pose )│  secondary 1 phần · primary 1.4 phần
└──────────────────────────────────┘
```

| Tab | Nội dung panel |
|---|---|
| Viền | `[Viền \| Mặt]` + công tắc cùng hàng · màu · Độ dày (viền 1–12 px, mặt 0.5–5 px), riêng cho từng cái. Ảnh không có mặt: ô "Mặt" tắt (chữ `faint`, không bấm được), không có dòng chú thích |
| Phủ | Hiện lớp phủ (công tắc) · màu (mặc định cam) · Độ đậm 0–100% |
| Nền | Độ hiện người · Độ hiện nền (0–100%) |
| Cọ | `[+ Thêm \| ⌫ Xóa]` + Hoàn tác, Làm lại (nút tròn 40 nền `surfaceAlt`, tắt = icon `faint`) · Cỡ cọ 8–64 px. Nét đang vẽ `accent` (thêm) hoặc `danger` (xóa) mờ 50%, con trỏ cọ là vòng trắng viền tối |

- **Không có chú thích hay hướng dẫn** nào trong màn Chỉnh pose.
- **Hoàn tác / Làm lại chỉ có ở tab Cọ**, vì chỉ nét cọ mới có lịch sử. Đầu màn không có nút hoàn tác.
- Pose mẫu: chỉ một nút "Lưu pose" rộng hết hàng.
- Nhãn nút phụ trên máy hẹp có thể rút còn "Lưu bản mới" (chuỗi riêng trong `strings.ts`).

### 6.10 Bảng màu

- Mở khi chạm ô dấu cộng hoặc ô màu tự chọn trong hàng màu. Bảng `ColorPopover` 306 rộng nổi trên panel, mũi tên chỉ đúng ô màu; nền sau phủ `ink` 12%.
- Nội dung: ô chọn độ sáng / độ đậm 112 cao · thanh hue 12 · hàng "Mã màu" (ô nhập HEX) + nút `pipette` "Lấy màu từ ảnh" · "Gần đây" 6 ô 30.
- Kéo trên ô sáng / đậm hoặc thanh màu thì preview đổi màu ngay (màu đi qua shared value, không re-render); thả tay mới ghi vào pose. Bảng không che hết pose. Chạm ra ngoài là xong, không có nút "Áp dụng". Màu khác lúc mở thì được đưa vào "Gần đây" (nhớ qua các lần mở app).
- Ô cuối hàng màu: dấu cộng; màu đang dùng không thuộc 7 màu sẵn thì ô cuối hiện chính màu đó (đang chọn), chạm vào mở lại Bảng màu.
- **Lấy màu từ ảnh:** chạm nút `pipette` thì bảng tạm ẩn, preview có viền `accent` 2 px; chạm vào ảnh để lấy màu đúng điểm ảnh gốc đó, rồi bảng mở lại với màu mới.

### 6.11 Cài đặt (mở đè lên Camera)

Tiêu đề "Cài đặt" + `CloseButton`. Ba `SettingsGroup`, mỗi nhóm có tên `caption` viết hoa phía trên:

| Nhóm | Hàng |
|---|---|
| CHỤP | Ảnh camera trước: `Segmented` [Lưu như thật \| Lưu soi gương] · Rung phản hồi: `Switch` |
| DUNG LƯỢNG | Bộ tách người, dung lượng `hint` + nút `dangerText` "Xóa bộ tách" |
| GIỚI THIỆU | Phiên bản · Nguồn ảnh mẫu › · Giấy phép model › |

Nhóm "Nhà phát triển" (Màn thử nghiệm) chỉ hiện trong bản dev (`__DEV__`).

- "Ảnh camera trước" đổi prop `mirror` của camera; "Rung phản hồi" tắt mọi lệnh rung trong `src/lib/haptics.ts`. Cả hai nhớ qua các lần mở app (`settingsStore`).
- "Xóa bộ tách" xóa thư mục `Paths.document/models/pose`, có xác nhận; dung lượng đọc từ file thật trong máy.
- "Nguồn ảnh mẫu", "Giấy phép model" mở hộp thoại ngắn; trang ghi nguồn đầy đủ làm ở Phase 6.

### 6.12 Xem ảnh vừa chụp (mở đè lên Camera)

- Đầu màn: "Ảnh vừa chụp" + dòng `hint` "Ảnh 3 trên 5 · 14:32", `CloseButton`.
- Ảnh 366 rộng đúng tỉ lệ chụp, bo 24, bóng nhẹ; vuốt ngang để xem ảnh trước. Chấm trang dưới ảnh (đang xem = vạch 18 `accent`).
- Đáy: "Xóa ảnh" (`dangerText` trên nền `surface`, có xác nhận, xóa khỏi album; iOS hỏi thêm một lần bằng hộp thoại của máy) và "Chia sẻ ảnh" (primary, bảng chia sẻ của máy qua `expo-sharing`).
- Danh sách ảnh chỉ giữ trong lần mở app (`sessionPhotos`); ô ảnh vừa chụp trên Camera tắt khi chưa có ảnh. Xóa hết ảnh thì màn tự đóng.

### 6.13b Sửa theo phiếu Phase 4 lần 1

- **Màn xem trước của camera** đặt theo `previewRect` (frame.ts): hình 3:4 đúng tỉ lệ cảm biến, nhỏ nhất phủ kín khung ngắm, cùng tâm. Trước đây nó phủ cả màn hình dài nên ảnh bị phóng thêm ~1,6 lần và 1× của app hẹp như 1,6× của app Camera gốc. Ảnh chụp cắt theo khung trong hệ của màn xem trước.
- **Zoom:** giữ yên 250 ms trên cụm nút cũng hiện thước cuộn (giữ rồi kéo thì kéo luôn); chạm nhanh vẫn nhảy mức.
- **Cột công cụ:** chọn pose thì cột tự mở ra; nút Độ hiện luôn có số, kể cả 100.
- **Chụp:** chớp màn, rồi ảnh vừa cắt hiện đúng chỗ khung ngắm, thu nhỏ và trượt vào ô ảnh vừa chụp (`cameraUi.flyMs` 420 ms, `easeIO`). Ô ảnh hiện ảnh mới ngay, không đợi lưu vào album xong.
- **Xem ảnh vừa chụp:** chấm trang đổi ngay trong lúc vuốt; hàng chấm mỗi ảnh một ô (rộng tối đa 300), chạm hoặc kéo trên hàng để tua nhanh. Nhiều ảnh thì chấm nhỏ lại.
- **Menu pose** rộng 200, chữ ngắn: Chụp · Sửa · Xóa; pose mẫu: Chụp · Tạo bản sao.
- **Chọn người:** ảnh nằm trong thẻ trắng nền `surfaceAlt`; người chưa chọn viền trắng nét đứt (dáng mẫu), đã chọn phủ `accent` 35% + viền trắng 3 px; mỗi người có huy hiệu số trên đầu (đã chọn thành dấu tích); dưới ảnh là hàng chip "Người 1, Người 2…" để chọn bằng tên.
- **Chọn người (vòng 6) — bước trên màn Đang xử lý:** vòng 3–5 thử đưa chọn người vào Chỉnh sửa (tab Người, rồi Cọ → Người) nhưng mỗi lần chạm phải dò lại dáng, chậm 0,5–1 giây, nên bỏ. Giờ tách xong thì ảnh trên màn Đang xử lý (không còn mờ) thành chỗ chạm: người được chọn phủ `accent` 35% + viền trắng 3 px, chưa chọn viền trắng nét đứt 2 px (`personPick.dash` 8/6); mặc định chọn hết. Card các bước có thêm bước **Chọn người** giữa "Tìm nét mặt" và "Vẽ dáng": đang ở bước này thì chấm vòng `accent` thay vòng quay, số `n/m` màu `accent` bên phải; dưới các bước là hai nút **Hủy** (`secondary`) · **Dùng n người** (primary, rộng 1.4 phần, tắt khi n = 0). Không có huy hiệu, không có dòng hướng dẫn.
- **Lấy màu từ ảnh:** viền xanh vẽ chồng lên preview (không đổi kích thước, hết giật); nút X ở góc preview để hủy và quay lại Bảng màu.

- **Số trên thanh kéo và cụm zoom** (`AnimatedText`): giá trị đầu lấy trên UI thread, gửi về JS một lần làm `defaultValue`, nên hiện ngay khi mở màn mà không đọc shared value lúc render.
- **Pose mẫu nhóm Selfie:** 7 ảnh chụp bằng camera trước, nhóm cuối của Pose mẫu (`assets/poses/source/selfie/selfie1–7.jpg`).

### 6.14 Logo, icon app và màn mở app

Chốt qua `logo-design-skill` (canvas thiết kế, trang "Icon chốt + màn mở app").

- **Dấu:** chữ S tròn nét (người đang tạo dáng, chấm là đầu) đứng trong hai góc khung ngắm; phía sau là **bóng chữ S** lệch lên trái — dáng mẫu mà người thật đang khớp vào. Nói đúng việc app làm: camera + chụp theo dáng mẫu, và là chữ S của SnapShot.
- **Màu:** nền `camBg` `#05070D`, chữ S và khung trắng, bóng xanh nhạt `#60A5FA` (`camAccent`). Icon và màn mở app cùng một kiểu nên mở app vào Camera tối không bị chớp.
- **Bản gốc:** `assets/brand/` (`mark-on-dark.svg`, `mark-on-light.svg` — chữ S đen cho nền sáng, `icon.svg`). Dấu dựng trên lưới 256, nét đều, góc tay và chân không lệch góc chuẩn.
- **File trong app:** `assets/icon.png` (1024, kín nền, không bo góc); Android `android-icon-foreground.png` (dấu chiếm 62% để nằm trong vùng an toàn), nền là màu `#05070D`, `android-icon-monochrome.png` (một màu, bỏ bóng để không dính khối); `splash-icon.png` (dấu + chữ SnapShot Nunito ExtraBold, nền trong suốt); `favicon.png`.
- **Màn mở app:** plugin `expo-splash-screen` trong `app.json`, ảnh rộng 220, nền `#05070D`. Expo Go không hiện màn này (hiện icon thay); xem đúng khi build bản preview / production.
- Chữ S và bóng là nét tròn (stroke); khi cần bản cắt in, chuyển nét thành hình.

## 7. Accessibility

- Vùng chạm nhỏ nhất 44×44, kể cả ô màu (36 + hitSlop 4) và nút zoom (38 + hitSlop 3).
- Mọi `IconButton` có `accessibilityLabel` và `accessibilityState` (`selected` khi đang bật).
- Slider và thanh độ hiện có `accessibilityValue` bằng chữ ("Độ hiện pose, 60 phần trăm") và `accessibilityActions` tăng/giảm, vì thao tác giữ rồi kéo khó dùng với VoiceOver/TalkBack.
- Cột công cụ dời được bằng kéo; với trình đọc màn hình nó đứng yên, các nút đọc theo thứ tự trên xuống.
- Thước cân bằng đọc "Máy đã thẳng" một lần khi chuyển trạng thái.
- Không truyền đạt trạng thái chỉ bằng màu (§3.1).
- Tôn trọng Reduce Motion (§3.5) và cỡ chữ động (§3.3).

---

## 8. Checklist cho mỗi màn trước khi merge

- [ ] Chỉ dùng token trong `src/ui/tokens.ts`, không mã màu hay số rời
- [ ] Đúng một nút primary
- [ ] Không có màu tím; không gradient (trừ Bảng màu); bóng chỉ ở lớp nổi
- [ ] Đúng kiểu đầu màn (§6): mở đè = tiêu đề trái + Đóng; bước trong luồng = Quay lại + tên giữa
- [ ] Mọi chuỗi lấy từ `src/ui/strings.ts`, nhãn theo §5.2, không chữ tiếng Anh sót lại, không dấu chấm than
- [ ] Mọi số có `tabular-nums` và có đơn vị
- [ ] Chạm vào mọi điều khiển đều thấy phản hồi nhấn trong 90 ms
- [ ] Không có chuyển động tự chạy, không spring nảy
- [ ] Không setState trong lúc cử chỉ đang chạy (cột công cụ, thanh độ hiện, zoom đều là worklet)
- [ ] Bật Reduce Motion và cỡ chữ lớn nhất: không vỡ bố cục
- [ ] Mọi nút icon có `accessibilityLabel`
