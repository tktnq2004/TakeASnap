# Phase 3 — Phiếu kiểm tra trên máy thật

Cách điền: mỗi ô máy ghi `đạt`, `lỗi` hoặc `—` (không áp dụng). Mục lỗi thì ghi ở cột Ghi chú đã làm gì và thấy gì.

| Máy | Phiên bản |
|---|---|
| iPhone | iPhone 15 Pro Max · Expo Go 58 · iOS |
| Android | Pixel_8a emulator · Expo Go 58 · Android |

Ngày thử: 
 
## 1. Thêm ảnh và chọn người

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 1.1 | Thêm ảnh có **một** người | Danh sách được thay bằng ảnh mờ, đáy có dòng trạng thái; xong thì mở Chỉnh pose, không hỏi chọn người | đạt | - | |
| 1.2 | Thêm ảnh có **hai, ba người đứng tách nhau** | Hiện màn "Chọn người", mỗi người có viền riêng | đạt | - | |
| 1.3 | Chạm vào từng người | Chạm lần 1 phủ cam, chạm lần 2 bỏ chọn; có rung nhẹ | đạt | - | |
| 1.4 | Chọn một người → "Dùng người đã chọn" | Pose chỉ có người đó; nét mặt là mặt của người đó | đạt | - | |
| 1.5 | "Chọn tất cả" | Pose có mọi người | đạt | - | |
| 1.6 | Bấm X ở màn Chọn người | Về Thư viện, không có pose mới trong "Pose của bạn" |đạt | - | |
| 1.7 | Ảnh có hai người **đứng sát, chạm nhau** | Hai người thành một vùng (giới hạn đã biết). Ghi lại để biết có hay gặp không | có và 1 vùng đó sẽ không xác định được mặt của từng người chỉ xác định được dáng pose | - | |

## 2. Lỗi

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 2.1 | Thêm ảnh không có người (phong cảnh, đồ vật) | Báo "Không tìm thấy người…", có nút "Chọn ảnh khác" mở lại thư viện ảnh |đạt | đạt | |
| 2.2 | Thêm ảnh người rất nhỏ, ở xa | Báo "Người trong ảnh quá nhỏ…", có "Chọn ảnh khác" | đạt | đạt | |
| 2.3 | (Chỉ khi máy chưa tải bộ tách người) tắt mạng rồi thêm ảnh | Báo "Chưa tải được bộ tách người…", có "Thử tải lại" | - | - | |

## 3. Sửa nét

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 3.1 | Mở Chỉnh pose, chọn tab "Sửa nét" | Có [Thêm \| Xóa], nút hoàn tác và làm lại (đang mờ), thanh Cỡ cọ, dòng hướng dẫn | đạt | đạt | |
| 3.2 | Chọn Thêm, tô ra ngoài người | Nét cam mờ hiện ngay theo ngón tay; nhấc tay thì viền và lớp phủ nở ra theo vùng vừa tô |đạt|đạt | |
| 3.3 | Chọn Xóa, tô lên người | Nét đỏ mờ; nhấc tay thì vùng đó bị bỏ khỏi người | lỗi | lỗi | khi xóa mặt người bằng cọ hoặc xóa cả người bằng cọ thì viền xung quanh người mất - đúng nhưng viền mặt vẫn còn và không biến mất |
| 3.4 | Kéo Cỡ cọ từ 8 đến 64 px | Nét vẽ to nhỏ đúng theo số | đạt | đạt | |
| 3.5 | Hoàn tác vài lần rồi làm lại | Viền quay về đúng từng bước; hết bước thì nút mờ đi | đạt | | |
| 3.6 | Vẽ liên tục, nhấc tay | Vẽ không giật; viền vẽ lại gần như ngay khi nhấc tay |đạt |đạt | |
| 3.7 | Sửa nét rồi "Lưu pose", mở lại pose đó | Viền đã sửa vẫn còn; ô trong Thư viện và overlay trên Camera cũng theo viền mới | đạt | đạt | |
| 3.8 | Sửa nét một **pose mẫu** rồi lưu | Thêm một bản vào "Pose của bạn" với viền đã sửa; pose mẫu gốc không đổi | tốt| tốt| |
| 3.9 | Xóa gần hết người rồi lưu | Báo "Vùng người còn quá nhỏ", không lưu | tốt | tốt | |

## 4. Chế độ máy bay

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 4.1 | Bật chế độ máy bay, tắt hẳn app rồi mở lại | App mở bình thường, Camera chạy | - |- | chưa test được vì luôn phải có mạng để chạy expo |
| 4.2 | Chụp theo pose, lưu ảnh | Như khi có mạng | -  | -  | chưa test được vì luôn phải có mạng để chạy expo |
| 4.3 | Thêm ảnh từ máy, chọn người, sửa nét, lưu | Như khi có mạng (bộ tách người đã tải từ trước) | -  | -  | chưa test được vì luôn phải có mạng để chạy expo |

## Góp ý khác

- Ở ngoài khung camera, thêm 1 nút để để editor sửa nhanh cho pose thay vì phải vào pose của tôi -> nhấn giữ -> sửa pose 

---

# Lần 2 — thử lại sau khi sửa

Đã sửa: nét mặt mất theo vùng bị cọ Xóa (3.3); dò mặt cho từng người khi người đứng sát nhau (1.7); nút Chỉnh pose trên rail Camera (góp ý).

Ngày thử: 

## 5. Thử lại

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 5.1 | Sửa nét, cọ Xóa tô lên **mặt** rồi nhấc tay | Viền và nét mặt ở vùng đó cùng mất | | | |
| 5.2 | Hoàn tác bước vừa xóa | Viền và nét mặt hiện lại | | | |
| 5.3 | Xóa mặt, "Lưu pose", mở lại pose đó; xem cả ô Thư viện và overlay Camera | Không còn nét mặt ở vùng đã xóa | | | |
| 5.4 | Mở lại pose ở 5.3, cọ Thêm tô lại vùng mặt | Nét mặt hiện lại | | | |
| 5.5 | **Thêm lại** ảnh hai người đứng sát (ảnh cũ đã lưu không tự cập nhật) | Vẫn một vùng, nhưng có nét mặt của từng người | | | |
| 5.6 | Ảnh hai, ba người đứng tách, mặt nhỏ (toàn thân) → chọn một người | Có nét mặt của người được chọn | | | |

## 6. Nút Chỉnh pose trên Camera

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 6.1 | Chọn một pose cho Camera | Rail bên phải có 4 nút, nút trên cùng là cây bút | | | |
| 6.2 | Bấm cây bút | Mở Chỉnh pose của đúng pose đang dùng | | | |
| 6.3 | Đổi màu viền → "Lưu pose" | Về Camera, overlay đổi theo, vị trí và lật ngang giữ nguyên | | | |
| 6.4 | Bấm cây bút → "Lưu thành bản mới" | Về Camera, overlay là bản mới, vị trí giữ nguyên | | | |
| 6.5 | Dùng một **pose mẫu**, bấm cây bút, sửa rồi lưu | Về Camera với bản mới trong "Pose của bạn", vị trí giữ nguyên | | | |
| 6.6 | Bấm cây bút rồi bấm quay lại (không lưu) | Về Camera, pose không đổi | | | |

## 7. Không có internet (thay cho chế độ máy bay)

Expo Go chỉ cần mạng nội bộ tới máy tính chạy Metro, không cần internet. Cách thử: điện thoại và máy tính cùng Wi-Fi, **rút dây internet của modem** (hoặc tắt WAN trên router) để Wi-Fi vẫn chạy nhưng không ra internet; trên máy tính chạy `npx expo start --offline`. Nếu không làm được thì ghi `—`, Phase 3 vẫn đóng với ghi chú.

Trước khi rút mạng: đã tạo ít nhất một pose từ ảnh trong máy (bộ tách người đã tải về).

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 7.1 | Tắt hẳn Expo Go, mở lại app | App mở, Camera chạy | | | |
| 7.2 | Chụp theo pose, lưu ảnh | Như khi có mạng | | | |
| 7.3 | Thêm ảnh từ máy, chọn người, sửa nét, lưu | Như khi có mạng | | | |

