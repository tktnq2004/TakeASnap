# TakeASnap

App camera chụp theo dáng mẫu. App tách dáng người từ một ảnh, đặt dáng đó lên khung ngắm làm lớp hướng dẫn, rồi chụp người thật theo đúng dáng. Ngoài ra app có công cụ ghép người vào nền mới với ánh sáng và bóng khớp cảnh.

> **Trạng thái:** đang chuẩn bị **làm lại toàn bộ** (rebuild v1). Code trong `src/` là bản cũ (`legacy-v0`), chỉ để tham khảo.
> **Phạm vi v1:** iOS và Android từ một codebase, chạy trong Expo Go, giao diện tiếng Việt, xử lý ảnh hoàn toàn trên máy (không server), đồ án portfolio.

---

## Ba chức năng

| # | Chức năng | Làm gì |
|---|---|---|
| 1 | **Chụp theo pose** | Camera đủ điều khiển (đổi camera, flash, lưới, thước cân bằng, zoom, hẹn giờ, tỉ lệ khung). Có một lớp pose trên khung ngắm để kéo, phóng to và xoay cho khớp. Ảnh lưu vào album không kèm pose |
| 2 | **Tạo và chỉnh pose** | Chọn ảnh mẫu hoặc ảnh trong máy → tách người → chỉnh 3 lớp: **viền** (bật/tắt, độ dày, màu), **phủ** (bật/tắt, màu, độ đậm), **người** (độ hiện) → lưu vào thư viện pose |
| 3 | **Thay nền** | Chọn ảnh người và ảnh nền → đặt vị trí, tỉ lệ → tạo ảnh ghép có khớp màu, relight giả lập, bóng tiếp xúc và bóng đổ. Xử lý trên máy; có cổng quyết định giữ hay bỏ ở Phase 5 |

## Tài liệu

| File | Nội dung |
|---|---|
| [docs/business-flow.md](docs/business-flow.md) | Người dùng, thuật ngữ, bản đồ màn hình, luồng của 3 chức năng, quy tắc nghiệp vụ, mô hình dữ liệu, trạng thái và lỗi |
| [docs/roadmap.md](docs/roadmap.md) | Phạm vi đã chốt, vì sao Expo Go đủ, 18 lỗi của bản cũ, kiến trúc mới, tách người bằng WebView, pipeline thay nền, 6 phase có tiêu chí hoàn thành, rủi ro |
| [docs/design.md](docs/design.md) | Design system theo tasteskill: deal, token màu/chữ/khoảng cách/motion, icon Lucide, component, copy tiếng Việt, wireframe từng màn |

Đọc theo thứ tự: business-flow → roadmap → design.

---

## Stack

Mọi thư viện đều chạy được trong **Expo Go**, không cần build native, không cần Mac.

| Phần | Công nghệ |
|---|---|
| App | Expo SDK 58, React Native 0.88, TypeScript 6 strict |
| Điều hướng | `expo-router` |
| Camera | `expo-camera` |
| Cử chỉ và animation | `react-native-gesture-handler` 3 (API hook) + `react-native-reanimated` 4 (UI thread) |
| Vẽ overlay, editor, ghép ảnh | `@shopify/react-native-skia` |
| Tách người | Model segmentation (MediaPipe / ONNX Runtime Web) chạy trong `react-native-webview` ẩn, file model đóng gói kèm app |
| Lưu trữ | `expo-sqlite`, `expo-file-system`, `expo-media-library` |
| Icon | `lucide-react-native` |

**Vì sao không cần server:** bản cũ gửi ảnh lên server Python để tách người. Bản mới chạy model ngay trên điện thoại, bên trong một WebView ẩn. Cùng một code chạy được trên cả iOS lẫn Android, offline, và ảnh không rời máy.

**Nâng cấp sau này:** phần tách người đi qua interface `Segmenter`. Khi chuyển sang dev build, có thể thay bằng Apple Vision / ML Kit mà không phải sửa phần còn lại ([roadmap.md §0](docs/roadmap.md#đường-nâng-cấp-sau-này)).

---

## Cấu trúc thư mục (dự kiến)

```
src/app/                # màn hình (expo-router; spike/ là màn đo của Phase 0)
src/features/           # camera, pose, compose
src/engine/             # segmentation (WebView), contour, xử lý ảnh
src/gestures/           # useTransformGesture dùng chung
src/ui/                 # tokens.ts, strings.ts, component dùng chung
src/db/  src/store/     # SQLite, zustand
assets/models/          # file model + wasm
assets/poses/           # pose mẫu tính sẵn
docs/                   # tài liệu dự án
```

Chi tiết ở [roadmap.md §3.7](docs/roadmap.md#37-cấu-trúc-thư-mục).

---

## Chạy app

Cần:
- **Node 24** (Expo SDK 58 cần Node ≥ 22.13). Máy dùng nvm-windows: `nvm install 24.22.2` rồi `nvm use 24.22.2`.
- VS Code trên Windows.
- **Expo Go** trên điện thoại (App Store / Play Store), bản hỗ trợ SDK 58.
- Máy tính và điện thoại dùng chung Wi-Fi.

```bash
npm install
npx expo start
npm run check        # typecheck + lint + test, chạy trước khi commit
```

Phase 0 chưa có màn Camera thật: app mở vào menu **Phase 0 · Spike**. Kết quả đo ghi vào [docs/spikes.md](docs/spikes.md).

- **iPhone:** mở app Camera, quét mã QR trong terminal.
- **Android:** mở Expo Go, quét mã QR. Có thể dùng emulator của Android Studio: nhấn `a` trong terminal.
- Wi-Fi chặn kết nối giữa các máy (mạng trường, công ty): chạy `npx expo start --tunnel`.

Lưu ý: Expo Go trên App Store chỉ chạy được SDK mới nhất. Khi Expo Go cập nhật, project phải nâng SDK theo.

Bản cũ (`legacy-v0`) cũng chạy bằng `npx expo start`, nhưng cần server tách người đã mất code, nên chỉ mở được camera và giao diện.

---

## Quy ước

- Nhánh: bản cũ được tag `legacy-v0`; rebuild làm trên nhánh `rebuild`, merge vào `main` khi xong Phase 3.
- Mọi màu, cỡ chữ, khoảng cách, thời gian animation lấy từ `src/ui/tokens.ts` ([design.md §3](docs/design.md#3-token)). Mọi chuỗi giao diện lấy từ `src/ui/strings.ts`.
- Trong UI chỉ gọi là **pose**. "Segment" chỉ xuất hiện trong code ([business-flow.md §2](docs/business-flow.md#2-thuật-ngữ-dùng-thống-nhất-trong-code-ui-và-tài-liệu)).
- Skill thiết kế: `.claude/skills/design-taste-frontend` (tasteskill 2.5).

## Nguồn và license

Đồ án portfolio, phi thương mại.
- 25 ảnh pose mẫu trong `src/assets/images/`: dùng cho mục đích portfolio.
- Model và thư viện bên thứ ba: ghi đầy đủ ở Phase 6.
