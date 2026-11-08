# TakeASnap — Design system

> Hệ thiết kế cho bản rebuild, dựng theo **tasteskill 2.5** (`.claude/skills/design-taste-frontend`).
> Skill viết cho website, nên tài liệu này giữ phần áp được cho app (hệ thống, màu, chữ, copy, motion) và ghi rõ phần không áp.
> Nghiệp vụ ở [business-flow.md](business-flow.md), kỹ thuật ở [roadmap.md](roadmap.md).

---

## 1. Kind và deal

Theo skill: **xác định kind trước, rồi deal, không chọn theo cảm tính.**

| Mục | Giá trị | Nguồn |
|---|---|---|
| Nền tảng | iOS và Android (Expo Go), chỉ tiếng Việt | đã chốt ở [roadmap §0](roadmap.md#0-phạm-vi-đã-chốt) |
| Kind | `software` (app tiêu dùng) | skill §1: "App, SaaS, AI…" |
| Palette | **`graphite-safety-orange`**: nền graphite, nhấn cam | `start.mjs deal --page software` |
| Font | **`urbanist`**: Urbanist + DM Mono | cùng lượt deal, skill gợi ý cho "apps, consumer software" |
| Radius | **`round`**: 10 / 16 / 24 | skill: "`round` for consumer apps" |

Lượt deal trả về 3 palette: `white-navy-tab`, `graphite-safety-orange`, `card-pastels`. Chọn graphite vì **camera cần nền tối**: nền sáng quanh khung ngắm làm mắt đánh giá sai độ sáng và màu của cảnh. Cam là màu nhấn quen thuộc của máy ảnh, và nổi được trên đa số cảnh chụp.

### Phần áp được và phần không áp

| Áp | Không áp (luật của website) |
|---|---|
| Một hệ thống: một kiểu nút, một họ radius, một kiểu card, một đường kẻ | Một section mỗi màn hình, hero, tỉ lệ 1440/1024/768/390 |
| UI 90–95% trung tính, một màu nhấn, **cấm tím** | Nav, footer, credits, hình nền shader, moment, scene |
| Copy thẳng: tiêu đề có danh từ, nút = động từ + đối tượng, không câu quảng cáo | Các script kiểm tra (`consistency.mjs`, `check.mjs`) chỉ chạy trên HTML |
| Motion token, không nảy, mọi chuyển động đều do người dùng gây ra | Hover (app không có hover; thay bằng trạng thái nhấn) |
| Chữ nhỏ nhất 13 px, chữ đọc 16 px, tương phản ≥ 4.5:1 | Ảnh thật của khách hàng, icon thương hiệu đủ màu |
| Không caption trên ảnh, không placeholder, không số liệu bịa | |

---

## 2. Nguyên tắc

1. **Ảnh là nhân vật chính.** Khung ngắm, pose và ảnh ghép chiếm phần lớn màn hình. UI lùi về sau: trung tính, ít, gọn ở mép.
2. **Một màu nhấn, dùng có lý do.** Cam chỉ dùng cho: nút chính, trạng thái đang bật, thước cân bằng khi đã thẳng, vòng focus. Dưới 3% diện tích ở những chỗ khác.
3. **Một hệ thống.** Một kiểu nút chính, một kiểu nút phụ, một kiểu nút icon, một họ radius, một thang khoảng cách. Không có màn nào tự đặt kiểu riêng.
4. **Đi theo ngón tay.** Trong lúc kéo, vật đi đúng 1:1 với ngón tay, không trễ, không easing. Chuyển động chỉ có ở lúc thả.
5. **Nói thẳng.** Mỗi nhãn đọc lên cho người lạ cũng hiểu ngay. Không ẩn dụ, không khen sản phẩm, không dấu chấm than.
6. **Không tím.** Bản cũ dùng `#C259FF`. Mọi màu có hue OKLCH trong khoảng 270–330° đều bị loại khỏi UI, kể cả trong bảng màu pose có sẵn.

---

## 3. Token

Tất cả nằm trong `src/ui/tokens.ts`. Component chỉ đọc token, không viết mã màu hay số trực tiếp.

### 3.1 Màu

Giá trị lấy từ `start.mjs css --palette graphite-safety-orange`.

```ts
export const color = {
  bg:         '#18191b', // nền màn hình, nền quanh khung ngắm
  surface:    '#222427', // sheet, panel, thẻ
  ink:        '#eff0f1', // chữ chính, icon, đường kẻ (ở 14%)
  muted:      '#9c9ea3', // nhãn, meta, chữ phụ
  line:       'rgba(239,240,241,0.14)', // hairline duy nhất
  accent:     '#ff4a1f', // nút chính, trạng thái bật, focus
  accentInk:  '#18191b', // chữ trên nền accent
  inverseBg:  '#eff0f1', // nút phụ dạng đặc (hiếm)
  inverseInk: '#18191b',
  scrim:      'rgba(24,25,27,0.56)', // đĩa sau nút icon khi nằm trên khung ngắm
  danger:     '#ff6b6b', // chỉ cho vùng xóa và thao tác xóa, luôn đi kèm icon + chữ
} as const;
```

Tương phản (đã tính theo WCAG):

| Cặp | Tỉ lệ | Dùng cho |
|---|---|---|
| `ink` trên `bg` | ≈ 15:1 | mọi chữ đọc |
| `muted` trên `bg` | ≈ 6.5:1 | nhãn, meta |
| `accentInk` trên `accent` | ≈ 5.2:1 | chữ trên nút chính |
| `accent` trên `bg` | ≈ 5.2:1 | icon/viền trạng thái bật |

Quy tắc:
- Không dùng `#000` thuần cho UI. Đen thuần chỉ xuất hiện trong ảnh và trong bảng màu pose.
- Không gradient, không đổ bóng (shadow). Phân tầng bằng `surface` + `line`.
- `danger` gần tông với `accent`, nên **không bao giờ dùng màu một mình** để báo xóa: luôn có icon thùng rác và chữ "Xóa".

### 3.2 Màu cho pose (màu chức năng)

Đây là màu người dùng chọn cho viền và lớp phủ, phải nổi trên mọi cảnh chụp. Không thuộc màu UI, nhưng vẫn không có tím.

| Tên | Mã | Mặc định cho |
|---|---|---|
| Trắng | `#ffffff` | viền |
| Cam | `#ff4a1f` | phủ |
| Vàng | `#ffd60a` | |
| Xanh lá | `#30d158` | |
| Xanh ngọc | `#00c7be` | |
| Xanh dương | `#0a84ff` | |
| Hồng | `#ff375f` | |
| Đen | `#000000` | |

Ô thứ 9 mở bảng chọn màu tự do. Màu người dùng tự chọn là nội dung của họ, không bị luật cấm tím.

### 3.3 Chữ

```ts
export const font = {
  display: 'Urbanist_500Medium',
  text:    'Urbanist_400Regular',
  textMed: 'Urbanist_500Medium',
  mono:    'DMMono_500Medium', // số: zoom, %, px, đồng hồ hẹn giờ
};

export const type = {
  title:  { fontFamily: font.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.84 }, // -0.03em
  head:   { fontFamily: font.display, fontSize: 20, lineHeight: 26, letterSpacing: -0.4 },
  body:   { fontFamily: font.text,    fontSize: 16, lineHeight: 24 },
  button: { fontFamily: font.textMed, fontSize: 16, lineHeight: 20 },
  label:  { fontFamily: font.textMed, fontSize: 13, lineHeight: 18 },
  num:    { fontFamily: font.mono,    fontSize: 13, lineHeight: 16 },
};
```

- Viết hoa chữ đầu câu ở mọi nơi. **Không viết hoa toàn bộ** (bản cũ: tiêu đề nhóm "COFFEE", "SCHOOL").
- Không chữ nào dưới 13 px. Chữ người dùng phải đọc (mô tả, thông báo) từ 16 px.
- Số luôn dùng `mono`, để giá trị không nhảy độ rộng khi kéo slider: `1.0×`, `40%`, `3 px`.
- Số không tách khỏi đơn vị khi xuống dòng.
- Theo cỡ chữ hệ thống (Dynamic Type trên iOS, Font size trên Android) qua `allowFontScaling`, tối đa 1.3× cho thanh điều khiển camera (`maxFontSizeMultiplier`).

### 3.4 Khoảng cách, kích thước, radius

```ts
export const space  = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48, 8: 64 } as const;
export const radius = { sm: 10, md: 16, lg: 24, full: 999 } as const; // data-radius="round"
export const size = {
  tap:        44, // vùng chạm nhỏ nhất
  button:     48, // nút chữ
  iconButton: 44, // nút icon, glyph 24
  shutter:    76, // nút chụp, vòng ngoài 4 px
  thumb:      44, // ảnh vừa chụp, nút pose
  swatch:     36,
  gutter:     24, // lề trái/phải của màn nội dung
  edge:       16, // khoảng từ mép màn tới điều khiển trên camera
};
```

| Radius | Dùng cho |
|---|---|
| `sm` 10 | chip, ô màu, ô trong thanh segmented |
| `md` 16 | panel, ảnh thumbnail trong lưới |
| `lg` 24 | góc trên của sheet, khung ảnh ghép |
| `full` | nút chữ, nút icon, nút chụp |

Khung ngắm **không bo góc** và không có 4 góc vẽ thêm (bản cũ có `cornerTL…`). Ảnh lưu là hình chữ nhật, nên khung ngắm cũng là hình chữ nhật.

### 3.5 Motion

Số liệu lấy từ `references/motion.md` của skill.

```ts
export const motion = {
  in: 140, out: 200, press: 90, panel: 200, slide: 240, image: 600,
  ease:   Easing.bezier(0.2, 0.8, 0.2, 1),    // mọi bước UI
  easeIO: Easing.bezier(0.65, 0, 0.35, 1),    // chỉ khi vật di chuyển một quãng
};
```

| Thành phần | Chuyển động | Thời gian |
|---|---|---|
| Nút (mọi loại) | nhấn: scale .985, nền đậm thêm 14% về phía `ink`/`bg`; thả: về lại | 90 ms vào, 200 ms ra |
| Nút chụp | nhấn: đĩa trong thu 4 px; chụp xong: khung ngắm tối 40% rồi sáng lại | 90 ms; 140 ms |
| Sheet | trượt lên từ đáy, không nảy | 240 ms `easeIO` |
| Tab / segmented | vạch chỉ báo trượt sang tab được chọn; nội dung đổi ngay | 240 ms |
| Overlay khi kéo | đi đúng 1:1 theo ngón tay | 0 |
| Overlay khi thả vào điểm hít | về đúng góc 0°/90° | 140 ms `ease` |
| Overlay khi chạm đúp đặt lại | về vị trí gốc | 240 ms `easeIO` |
| Thumbnail ảnh vừa chụp | ảnh mới thay ảnh cũ bằng cross-fade | 200 ms |

Cấm:
- `spring` có nảy hoặc vượt đích (bản cũ: `SlideUp.tsx` dùng `bounciness: 10`).
- Hiệu ứng tự chạy: nhấp nháy, xoay vòng, chạy chữ, thứ gì đó chuyển động khi người dùng không chạm vào. Ngoại lệ duy nhất là gợi ý nút pose **một lần** khi mở app lần đầu.
- Loader che màn hình. Khi đang xử lý: giữ nguyên màn, hiện dòng trạng thái có bước cụ thể (xem §6).
- Khi bật Reduce Motion: sheet và tab đổi ngay, mọi chuyển động thả về đích thành tức thì. Cử chỉ vẫn đi theo ngón tay.

### 3.6 Haptics

> **Spike D (iPhone 15 Pro Max, Expo Go 58):** `expo-haptics` có trong Expo Go và rung được. Mọi lệnh rung vẫn đi qua `src/lib/haptics.ts`, file này tự bỏ qua nếu máy thiếu module. Người dùng có thể tắt rung hệ thống, nên mọi phản hồi quan trọng vẫn phải có tín hiệu nhìn thấy được: góc hít có vạch chỉ báo, vùng xóa đổi viền `danger`, thước cân bằng đổi màu.

| Sự kiện | Kiểu |
|---|---|
| Chụp ảnh | `impactLight` |
| Overlay hít vào 0°/90° | `selection` |
| Overlay vào vùng xóa | `notificationWarning` (một lần mỗi lần vào) |
| Thước cân bằng chuyển sang thẳng | `selection` |
| Lưu pose / lưu ảnh xong | `notificationSuccess` |

### 3.7 Icon

- **Một bộ duy nhất: Lucide** (`lucide-react-native`, vẽ bằng `react-native-svg`, có sẵn trong Expo Go). Một bộ cho cả iOS và Android, nên hai nền tảng trông giống nhau.
- Nét 1.75, cỡ 24 (trong nút 44) hoặc 20 (trong chip). Màu theo token.
- Không emoji làm icon. Không trộn Ionicons hay bộ icon khác.
- Mọi nút chỉ có icon phải có `accessibilityLabel` bằng tiếng Việt, cùng chữ với nhãn tương ứng ở §5.

| Việc | Icon Lucide |
|---|---|
| Đổi camera | `switch-camera` |
| Flash tắt / bật / tự động | `zap-off` / `zap` / `zap` + chữ "A" |
| Lưới | `grid-3x3` |
| Thước cân bằng | `ruler` |
| Hẹn giờ | `timer` |
| Pose | thumbnail pose hiện tại, chưa có thì `person-standing` |
| Lật ngang | `flip-horizontal-2` |
| Ẩn tạm | `eye-off` |
| Xóa | `trash-2` |
| Hoàn tác / làm lại | `undo-2` / `redo-2` |
| Đóng / quay lại | `x` / `chevron-left` |
| Cài đặt | `settings` |

---

## 4. Component

Mỗi loại chỉ có một kiểu. Không màn nào được tự tạo nút riêng.

| Component | Mô tả |
|---|---|
| `Button` `variant="primary"` | cao 48, `radius.full`, nền `accent`, chữ `accentInk`. **Mỗi màn chỉ một nút primary** |
| `Button` `variant="secondary"` | cao 48, `radius.full`, nền trong suốt, viền 1 px `line`, chữ `ink` |
| `Button` `variant="text"` | chữ `ink`, gạch chân 1 px, cho thao tác phụ ("Chọn ảnh khác") |
| `IconButton` | 44×44, `radius.full`; trên camera có đĩa `scrim`; trạng thái bật: glyph `accent` |
| `Chip` | cao 32, `radius.sm`, chữ `num`; dùng cho zoom (`0.5×` `1×` `2×`) và độ hiện overlay |
| `Segmented` | thanh 40, ô `radius.sm`, vạch chỉ báo trượt; dùng cho tab Viền / Phủ / Người / Sửa nét |
| `Slider` | rãnh 4 px, núm 24, phần đã chọn `accent`; nhãn trái, giá trị `num` phải |
| `Switch` | switch hệ thống, màu bật = `accent` |
| `Swatch` | ô màu 36, `radius.sm`; đang chọn: vòng 2 px `ink` cách 2 px |
| `Sheet` | `expo-router` `presentation: 'formSheet'` (detent 0.88), dự phòng `@gorhom/bottom-sheet` nếu Android không ổn; nền `surface`, có tay kéo, không nảy; không tự làm sheet bằng Animated |
| `PoseTile` | ô `radius.md`, **ảnh gốc đầy đủ màu** (người + nền). Pose mẫu: thêm viền trắng 1.5 px. Pose của bạn: thêm style của chính bản đó (độ dày thu về ≤ 2 px). Chạm = sửa (Phase 2: dùng để chụp); nhấn giữ = xóa |
| `StatusLine` | một dòng `label` `muted` + spinner 16 px khi đang chạy; không bao giờ che nội dung |

Một panel điều khiển có **chiều cao cố định**: đổi tab trong Chỉnh pose không làm khung preview co giãn.

---

## 5. Copy

Theo `references/copy.md`, viết bằng tiếng Việt.

### 5.1 Luật

1. **Tiêu đề có danh từ chỉ đồ vật:** "Thư viện pose", "Chỉnh pose", "Ảnh nền". Không câu hỏi, không câu cảm thán.
2. **Nút = động từ + đối tượng,** 1–4 từ: "Chụp ảnh", "Lưu pose", "Chọn ảnh nền", "Tạo ảnh". Không dùng "OK", "Xác nhận", "Tiếp tục" chung chung, "Xem thêm".
3. **Một việc, một cách gọi.** "Lưu pose" ở mọi nơi, không chỗ này "Lưu" chỗ kia "Hoàn tất".
4. **Không quảng cáo, không cảm thán:** bỏ "Ảnh đẹp lung linh", "Tách nền thành công! Chọn nền nào", "Done", "ĐẸP NHẤT, CHUẨN NHẤT".
5. **Lỗi = chuyện gì xảy ra + làm gì tiếp** (bảng ở [business-flow §10.3](business-flow.md#103-thông-báo-lỗi)).
6. **Không placeholder, không chữ mẫu** trong bản build.
7. **Không chữ trên ảnh** ngoài nhãn điều khiển cần thiết. Thumbnail pose không có caption.

### 5.2 Đổi từ bản cũ

| Bản cũ | Bản mới |
|---|---|
| Danh sách Form | Thư viện pose |
| Mẫu / Đã lưu | Pose mẫu / Pose của bạn |
| COFFEE, SCHOOL, STREET, TRAVEL | Quán cà phê, Trường học, Đường phố, Du lịch |
| Đóng | (nút `x` có nhãn "Đóng thư viện") |
| Done | Lưu pose |
| Foreground / Background / Fill / Outline | Người / — (bỏ) / Phủ / Viền |
| Enable Fill | Bật lớp phủ |
| Change Background | Thay nền |
| 1. Chọn ảnh người / 2. Chọn ảnh nền | Chọn ảnh người / Chọn ảnh nền (số bước nằm ở stepper) |
| Xác nhận | Tạo ảnh |
| Đang tạo bóng đổ & ánh sáng... | Đang khớp ánh sáng, bước 2 trên 3 |
| Hoàn thành! Ảnh đẹp lung linh | (không có câu nào, ảnh kết quả tự hiện) |
| Lưu vào máy | Lưu vào Ảnh |
| Thành công — Đã lưu vào Thư viện ảnh! | Đã lưu vào album TakeASnap |
| Ứng dụng cần quyền Camera / Cấp quyền | TakeASnap cần camera để chụp theo pose. / Cho phép dùng camera |

### 5.3 Bảng nhãn chuẩn

| Chỗ | Nhãn |
|---|---|
| Nút chụp (a11y) | Chụp ảnh |
| Nút pose (a11y) | Mở thư viện pose |
| Chế độ dưới nút chụp | Chụp theo pose · Thay nền |
| Thoát chế độ chỉnh overlay | Xong |
| Vùng xóa | Thả để gỡ pose |
| Thêm pose | Thêm ảnh từ máy |
| Thao tác trên pose | Dùng để chụp · Sửa · Xóa |
| Pose mẫu | Tạo bản sao để sửa |
| Chỉnh pose, nút chính | Lưu pose |
| Thay nền, bước 1–4 | Ảnh người · Ảnh nền · Vị trí · Kết quả |
| Thay nền, nút chính bước 3 | Tạo ảnh |
| Thay nền, kết quả | Lưu vào Ảnh · Chỉnh lại |
| Giữ để so sánh | Giữ để xem ảnh gốc |

---

## 6. Màn hình

Khung vẽ cho máy 390×844. `·` là vùng ảnh / khung ngắm. Ký hiệu trong khung chỉ để phác thảo; icon thật dùng bảng ở §3.7.

### 6.1 Camera — chế độ chụp

```
┌──────────────────────────────────┐
│ [⚡] [#] [📏] [⏱] [3:4]     [⚙] │  thanh trên: IconButton, cách mép 16
├──────────────────────────────────┤
│··································│
│··········   ╭──╮   ·············│
│··········   │  │  pose overlay  │  khung ngắm 3:4, không bo góc
│··········  ╭┴──┴╮ ··············│  lưới / thước cân bằng nằm trong khung
│··········  │    │ ··············│
│··········  ╰┬──┬╯ ··············│
│··········   │  │   ·············│
│······────────────────────·······│  thước cân bằng: ink → accent khi thẳng
│··································│
│                         [◐][⇋][👁]│  rail overlay (chỉ khi có pose):
├──────────────────────────────────┤  độ hiện · lật ngang · giữ để ẩn
│        (0.5×) ( 1× ) (2×)        │  Chip zoom
│                                  │
│  [ảnh]        ( ◯ )       [pose] │  thumbnail 44 · nút chụp 76 · nút pose 44
│                                  │
│    Chụp theo pose  ·  Thay nền   │  chọn chế độ, chữ label; đang chọn = ink, còn lại = muted
└──────────────────────────────────┘
```

- Thanh trên và vùng dưới nằm trên nền `bg` đặc (ngoài vùng ảnh sẽ lưu). Ở tỉ lệ 9:16, khi khung ngắm tràn ra sau thanh điều khiển, nút icon có đĩa `scrim`.
- Nút pose hiện **thumbnail của pose đang dùng**, viền 2 px `accent` khi pose đang bật.

### 6.2 Camera — chế độ chỉnh overlay

```
┌──────────────────────────────────┐
│                          ( Xong )│  chỉ còn nút Xong (secondary)
├──────────────────────────────────┤
│··································│
│········  ╭──╮   ·················│  overlay có khung bao 1 px ink 40%
│········  │  │   ·················│  cử chỉ nhận trên TOÀN khung ngắm
│········ ╭┴──┴╮  ·················│
│········ ╰┬──┬╯  ·················│
│··································│
├──────────────────────────────────┤
│                                  │
│             ( 🗑 )               │  vùng xóa 64, đĩa line;
│         Thả để gỡ pose           │  khi overlay vào: viền danger + rung
└──────────────────────────────────┘
```

### 6.3 Thư viện pose (sheet, cao 88%)

```
┌──────────────────────────────────┐
│ ───                              │  tay kéo
│ Thư viện pose                [x] │  title 28
│ [ Pose mẫu | Pose của bạn ]      │  Segmented
│                                  │
│ Quán cà phê                      │  head 20
│ ┌────┐ ┌────┐ ┌────┐ ┌──         │  PoseTile cuộn ngang, ô 104
│ └────┘ └────┘ └────┘ └──         │
│ Trường học                       │
│ ┌────┐ ┌────┐ ┌────┐ ┌──         │
│ └────┘ └────┘ └────┘ └──         │
│                                  │
│ ┌──────────────────────────────┐ │
│ │      Thêm ảnh từ máy         │ │  primary, ghim ở đáy
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

Mọi ô hiện **ảnh gốc đầy đủ màu**: người dùng chọn pose nhờ nhìn cả người mẫu lẫn bối cảnh (góp ý sau Phase 1). Pose mẫu chỉ thêm viền trắng mảnh.

Tab "Pose của bạn" là lưới phẳng **4 cột**, gap 8, **mỗi bản pose một ô**; ô vẽ style của chính bản đó lên ảnh gốc để các bản từ cùng một ảnh phân biệt được. Khi trống: một dòng `body` "Chưa có pose nào. Thêm một ảnh có người để lấy dáng." và nút primary "Thêm ảnh từ máy".

### 6.4 Chỉnh pose

```
┌──────────────────────────────────┐
│ [‹]     Chỉnh pose               │
├──────────────────────────────────┤
│▒░▒░▒░▒░▒░▒░▒░▒░▒░▒░▒░▒░▒░▒░▒░▒░▒░│
│░▒░▒░▒░▒░▒░▒  ╭──╮  ▒░▒░▒░▒░▒░▒░▒│  preview Skia trên nền ô caro
│▒░▒░▒░▒░▒░▒░ ╭┴⊙⊙┴╮ ░▒░▒░▒░▒░▒░▒░│  viền + nét mặt, màu và độ
│░▒░▒░▒░▒░▒░▒ │    │ ▒░▒░▒░▒░▒░▒░▒│  dày riêng
│▒░▒░▒░▒░▒░▒░ ╰┬──┬╯ ░▒░▒░▒░▒░▒░▒░│
├──────────────────────────────────┤  panel cao cố định 410 (height, không phải minHeight)
│ [ Viền | Phủ | Ảnh ]             │
│                                  │
│ [ Viền | Mặt ]            [on]   │  đang chỉnh cái nào + công tắc của nó
│ Độ dày ─────●──────────── 3 px  │
│ Màu  ○ ○ ○ ○ ○ ○ ○ ○            │
│                                  │
│ ( Lưu thành bản mới ) (Lưu pose) │  pose mẫu: chỉ có Lưu pose
└──────────────────────────────────┘
```

| Tab | Nội dung |
|---|---|
| Viền | Bộ chọn **[Viền | Mặt]** + công tắc cùng hàng · Độ dày (viền 1–12 px, mặt 0.5–6 px) · Màu, **riêng cho từng cái**. Đang chỉnh Mặt mà ảnh không có mặt → dòng `label` muted "Không thấy mặt…" |
| Phủ | Hiện lớp phủ · Độ đậm 0–100% · Màu |
| Ảnh | Độ hiện người 0–100% · Độ hiện nền 0–100% |
| Sửa nét (Phase 3) | Thêm / Xóa (segmented) · Cỡ cọ 8–64 px · vẽ trực tiếp lên preview |

**Viền và Mặt chung tab, chỉnh riêng** (góp ý lần 3): một thanh kéo chỉ đổi một thứ. Ống tay chân (góp ý lần 2) đã bỏ vì nét ước lượng chưa đủ tốt.

**Nền ô caro** cho vùng trống (góp ý sau Phase 1, thay cho nền đen): ô 12 px, hai màu `checkerA` `#2c2e32` / `checkerB` `#3a3d42`. Chọn caro xám đậm thay cho caro trắng–xám kinh điển để không chói trên giao diện tối, và để viền trắng vẫn nổi. Chip "Xem trên ảnh gốc" của bản đầu được thay bằng tab **Ảnh** (độ hiện người và nền riêng).

### 6.5 Thay nền

```
Stepper:  ● Ảnh người ── ● Ảnh nền ── ◉ Vị trí ── ○ Kết quả

┌──────────────────────────────────┐
│ [‹]          Vị trí              │
│ ●───●───◉───○                    │
├──────────────────────────────────┤
│··································│
│·········· ╭──╮ ··················│  ảnh nền + người, preview tức thì
│·········· │  │ ··················│  kéo / pinch / xoay như overlay camera
│·········· ╰──╯ ··················│
│··········▒▒▒▒▒···················│  bóng
├──────────────────────────────────┤
│ Hướng sáng            ( ◴ )  auto│  vòng xoay, chạm "auto" để về giá trị ước lượng
│ Bóng      ─────●──────── 60%    │
│ Khớp màu  ───────●────── 70%    │
│ ┌──────────────────────────────┐ │
│ │          Tạo ảnh             │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

Kết quả: ảnh ghép chiếm hết vùng trên; giữ ngón tay lên ảnh để xem ảnh trước khi xử lý; dưới là nút primary "Lưu vào Ảnh" và nút secondary "Chỉnh lại" (quay về bước Vị trí, giữ nguyên mọi giá trị).

### 6.6 Trạng thái đang xử lý

Không có spinner che màn hình. Màn vẫn hiện ảnh đang xử lý (mờ 60%), dưới ảnh là `StatusLine`:

| Việc | Dòng trạng thái |
|---|---|
| Tải bộ tách người (lần đầu) | Đang tải bộ tách người, 12 trên 42 MB |
| Tách người | Đang tách người khỏi nền |
| Tạo contour | Đang vẽ dáng |
| Phân tích nền | Đang đo ánh sáng của nền |
| Ghép ảnh | Đang ghép ảnh, bước 2 trên 3 |

---

## 7. Accessibility

- Vùng chạm nhỏ nhất 44×44, kể cả ô màu (36 + hitSlop 4).
- Mọi `IconButton` có `accessibilityLabel` và `accessibilityState` (`selected` khi đang bật).
- Slider có `accessibilityValue` bằng chữ: "Độ dày viền, 3 pixel".
- Thước cân bằng đọc "Máy đã thẳng" một lần khi chuyển trạng thái (VoiceOver, TalkBack).
- Không truyền đạt trạng thái chỉ bằng màu: flash auto có chữ "A", vùng xóa có icon và chữ.
- Tôn trọng Reduce Motion (§3.5) và cỡ chữ động (§3.3).

---

## 8. Checklist cho mỗi màn trước khi merge

- [ ] Chỉ dùng token trong `src/ui/tokens.ts`, không mã màu hay số rời
- [ ] Đúng một nút primary
- [ ] Không có màu tím, không gradient, không shadow
- [ ] Mọi chuỗi lấy từ `src/ui/strings.ts`, nhãn theo §5.3, không chữ tiếng Anh sót lại, không dấu chấm than
- [ ] Mọi số dùng font `mono` và có đơn vị
- [ ] Chạm vào mọi điều khiển đều thấy phản hồi nhấn trong 90 ms
- [ ] Không có chuyển động tự chạy, không spring nảy
- [ ] Không setState trong lúc cử chỉ đang chạy (kiểm tra bằng React DevTools Profiler)
- [ ] Bật Reduce Motion và cỡ chữ lớn nhất: không vỡ bố cục
- [ ] Mọi nút icon có `accessibilityLabel`
