# SnapShot

App camera chụp theo dáng mẫu. App tách dáng người từ một ảnh, đặt dáng đó lên khung ngắm làm lớp hướng dẫn, rồi chụp người thật theo đúng dáng. Ngoài ra app có công cụ ghép người vào nền mới với ánh sáng và bóng khớp cảnh.

> **Tên:** app đổi tên từ **TakeASnap** thành **SnapShot** ở Phase 4. Tên repo và thư mục vẫn là `TakeASnap`; file dữ liệu SQLite giữ tên `takeasnap.db` để không mất pose đã lưu.
> **Phạm vi v1:** iOS và Android từ một codebase, chạy trong Expo Go, giao diện tiếng Việt, xử lý ảnh hoàn toàn trên máy (không server), đồ án portfolio.

---

## Trạng thái

Bản làm lại (rebuild v1) trên nhánh `rebuild`. Bản cũ được tag `legacy-v0`.

| Phase | Nội dung | Trạng thái |
|---|---|---|
| 0 | Nền móng, spike tách người trong WebView | Xong |
| 1 | Pose engine, Chỉnh pose | Xong |
| 2 | Camera và overlay pose | Xong |
| 3 | Thư viện pose, chọn nhiều, cọ sửa viền | Xong (còn thử không có mạng) |
| 4 | Giao diện chụp ảnh và giao diện chung | Đã chốt giao diện, đang làm code |
| 5 | Thay nền | Chưa làm |
| 6 | Hoàn thiện portfolio | Chưa làm |

Phase 1–3 đạt trên iPhone 15 Pro Max và Android emulator Pixel_8a. Chi tiết và phiếu kiểm tra ở [docs/roadmap.md](docs/roadmap.md).

---

## Ba chức năng

| # | Chức năng | Làm gì |
|---|---|---|
| 1 | **Chụp theo pose** | Camera đủ điều khiển: flash, hẹn giờ, tỉ lệ khung, lưới, thước cân bằng, zoom, đổi camera. Pose nằm trên khung ngắm, kéo / phóng to / xoay cho khớp. Cột công cụ pose (chỉnh pose, độ hiện, lật ngang, giữ để ẩn) dời được bằng một ngón. Ảnh lưu vào album SnapShot, không kèm pose |
| 2 | **Tạo và chỉnh pose** | Chọn pose mẫu hoặc ảnh trong máy → chọn người → tách người → chỉnh 4 tab: **Viền** (viền và nét mặt), **Phủ**, **Nền** (độ hiện người và nền), **Cọ** (thêm / xóa vùng người, hoàn tác không giới hạn) → lưu vào thư viện |
| 3 | **Thay nền** | Chọn ảnh người và ảnh nền → đặt vị trí → tạo ảnh ghép có khớp màu, ánh sáng và bóng. Có cổng quyết định giữ hay bỏ ở Phase 5 |

---

## Tài liệu

| File | Nội dung |
|---|---|
| [docs/business-flow.md](docs/business-flow.md) | Người dùng, thuật ngữ, bản đồ màn hình, luồng của 3 chức năng, quy tắc nghiệp vụ, mô hình dữ liệu, trạng thái và lỗi |
| [docs/roadmap.md](docs/roadmap.md) | Phạm vi, vì sao Expo Go đủ, kiến trúc, tách người bằng WebView, phân phối model, pipeline Thay nền, 7 phase và tiêu chí xong |
| [docs/design.md](docs/design.md) | Giao diện xanh dương – trắng: token màu / chữ / kích thước / motion, icon Lucide, component, chữ trên giao diện, bố cục 13 màn |
| [docs/spikes.md](docs/spikes.md) | Kết quả đo của Phase 0 |
| `docs/phase*-test.md` | Phiếu kiểm tra trên máy thật của từng phase |

Đọc theo thứ tự: business-flow → roadmap → design.

---

## Stack

Mọi thư viện đều chạy được trong **Expo Go**, không cần build native, không cần Mac.

| Phần | Công nghệ |
|---|---|
| App | Expo SDK 58, React Native 0.88, TypeScript strict |
| Điều hướng | `expo-router` |
| Camera, cảm biến | `expo-camera`, `expo-sensors` (thước cân bằng) |
| Cử chỉ và animation | `react-native-gesture-handler` 3 (API hook) + `react-native-reanimated` 4 + `react-native-worklets` |
| Vẽ overlay, editor, ghép ảnh | `@shopify/react-native-skia` |
| Tách người | Model chạy trong `react-native-webview` ẩn: MediaPipe Multiclass + FaceLandmarker (pose), RMBG-1.4 trên `onnxruntime-web` (Thay nền) |
| Lưu trữ | `expo-sqlite`, `expo-file-system`, `expo-media-library`, `zustand` cho state phiên |
| Chữ, icon, rung | `@expo-google-fonts` (Nunito từ Phase 4, thay Urbanist), `lucide-react-native`, `expo-haptics` |

**Không cần server:** bản cũ gửi ảnh lên server Python để tách người. Bản mới chạy model ngay trên điện thoại, trong một WebView ẩn: cùng một code cho iOS và Android, ảnh không rời máy.

**Model tải một lần:** model không nằm trong repo. Lần đầu dùng mỗi chức năng, app tải model từ CDN gốc (phiên bản cố định), lưu vào `Paths.document/models/<gói>/` kèm manifest, từ đó chạy không cần mạng. Gói tách người khoảng 42 MB; pose mẫu đã tách sẵn nên không cần tải.

**Nâng cấp sau này:** phần tách người đi qua interface `Segmenter`. Khi chuyển sang dev build, có thể thay bằng Apple Vision / ML Kit mà không phải sửa phần còn lại ([roadmap.md §0](docs/roadmap.md#đường-nâng-cấp-sau-này)).

---

## Cấu trúc thư mục

```
src/app/                # màn hình (expo-router): Camera, Thư viện, Chỉnh pose; spike/ là màn thử nghiệm
src/features/camera/    # khung ngắm, overlay pose, zoom, chụp và lưu ảnh
src/features/pose/      # tạo pose từ ảnh, thư viện, chọn nhiều, cọ sửa viền
src/engine/             # tách người (WebView), contour, cọ, quản lý model tải về
src/gestures/           # useTransformGesture dùng chung
src/ui/                 # tokens.ts, strings.ts, easing.ts, component dùng chung
src/db/                 # SQLite migration
src/lib/                # haptics, điều hướng
assets/poses/           # 25 ảnh pose mẫu và samples.json tính sẵn
scripts/                # build-sample-poses.mts (tính sẵn pose mẫu)
docs/                   # tài liệu dự án
```

---

## Chạy app

Cần:
- **Node 24** (Expo SDK 58 cần Node ≥ 22.13). Máy dùng nvm-windows: `nvm install 24.22.2` rồi `nvm use 24.22.2`.
- **Expo Go** trên điện thoại (App Store / Play Store), bản hỗ trợ SDK 58.
- Máy tính và điện thoại dùng chung Wi-Fi.

```bash
npm install
npx expo start
npm run check        # typecheck + lint + test, chạy trước khi commit
```

- **iPhone:** mở app Camera, quét mã QR trong terminal.
- **Android:** mở Expo Go, quét mã QR. Emulator của Android Studio: nhấn `a` trong terminal.
- Wi-Fi chặn kết nối giữa các máy (mạng trường, công ty): chạy `npx expo start --tunnel`.

App mở thẳng vào Camera. Lần đầu tạo pose từ ảnh trong máy cần có mạng để tải bộ tách người.

Lưu ý: Expo Go trên App Store chỉ chạy được SDK mới nhất. Khi Expo Go cập nhật, project phải nâng SDK theo.

---

## Quy ước

- Nhánh: rebuild làm trên `rebuild`, chưa merge vào `main`. Bản cũ ở tag `legacy-v0`.
- Mọi màu, cỡ chữ, khoảng cách, thời gian animation lấy từ `src/ui/tokens.ts` ([design.md §3](docs/design.md#3-token)). Mọi chuỗi giao diện lấy từ `src/ui/strings.ts`, chỉ tiếng Việt.
- Trong giao diện chỉ gọi là **pose**. "Segment" chỉ xuất hiện trong code ([business-flow.md §2](docs/business-flow.md#2-thuật-ngữ-dùng-thống-nhất-trong-code-ui-và-tài-liệu)).
- Chỉ dùng thư viện có sẵn trong Expo Go hoặc JS thuần. Quy tắc đầy đủ cho người và agent ở [AGENTS.md](AGENTS.md).

## Nguồn và license

Đồ án portfolio, phi thương mại.
- 25 ảnh pose mẫu trong `assets/poses/source/`: dùng cho mục đích portfolio.
- RMBG-1.4 của BRIA dùng giấy phép phi thương mại: app tải từ nguồn gốc, không lưu lại hay phát hành lại model.
- Model và thư viện bên thứ ba khác: ghi đầy đủ ở Phase 6.
