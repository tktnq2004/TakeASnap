# Phase 2 — Phiếu kiểm tra trên máy thật

Cách điền: mỗi ô máy ghi `đạt`, `lỗi` hoặc `—` (không áp dụng). Mục lỗi thì ghi ở cột Ghi chú đã làm gì và thấy gì.

| Máy | Phiên bản |
|---|---|
| iPhone | iPhone 15 Pro Max · Expo Go 58 · iOS |
| Android | Pixel_8a emulator · Expo Go 58 · Android |

Ngày thử: 

## 1. Kéo, pinch, xoay pose

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 1.1 | Kéo pose, thả, kéo tiếp | Đi tiếp từ chỗ vừa thả | tốt |tốt | |
| 1.2 | Pinch pose hai lần liên tiếp | Lần hai bắt đầu từ cỡ của lần một | tốt | tốt | |
| 1.3 | Xoay pose hai lần liên tiếp | Lần hai bắt đầu từ góc của lần một | tốt | tốt | |
| 1.4 | Pinch và xoay cùng lúc | Cả hai cùng chạy, không giật | tốt |tốt | |
| 1.5 | Pinch bắt đầu ngoài pose | Chỉ zoom camera, pose đứng yên | tốt | tốt | nhưng khá giật lag, không được mượt như zoom gốc của ip, phiên bản trước bạn làm rất tốt nhưng ở đây lại lag. Ở android simulator thì không kiểm chứng được |
| 1.6 | Pinch bắt đầu trên pose | Chỉ đổi pose, zoom đứng yên | tốt | tốt | |
| 1.7 | Kéo pose ra ngoài khung, xuống vùng xám | Vẫn kéo tiếp được | tốt | tốt | |

## 2. Gỡ pose bằng thùng rác

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 2.1 | Kéo pose, ngón tay vào thùng rác | Rung một lần, thùng rác đỏ, pose mờ và thu về thùng rác | tốt | tốt | |
| 2.2 | Cảm giác hiệu ứng | Mượt, không quá nhanh hay mạnh | tốt | tốt | |
| 2.3 | Kéo ngón tay ra khỏi thùng rác | Pose trở lại như cũ | tốt | tốt| |
| 2.4 | Thả tay trong thùng rác | Pose mờ hẳn rồi biến mất |tốt |tốt | |

## 3. Zoom

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 3.1 | Kéo thanh zoom | 0,5×–5×, bước 0,1. Camera trước và Android bắt đầu từ 1× | lag, không mượt, khi thả tay thì thanh tiến độ mới cập nhật | tương tự iphone | |
| 3.2 | Pinch ngoài pose | Thanh kéo chạy theo | phần số chạy theo nhưng thanh kéo nằm yên | giống iphone  | |
| 3.3 | Kéo tới 2,0×, so với nút 2× của app Camera | Khung hình giống nhau | Không thấy nút chọn 2x| — | |
| 3.4 | Kéo qua mốc 1× | Chỉ chớp nhẹ, không đơ |đúng, có chớp giật | — | |

## 4. Chụp và lưu

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 4.1 | Flash tắt / tự động / bật | Đúng từng chế độ | tốt cả 3 | | |
| 4.2 | Chụp với tỉ lệ 3:4 | Lưu vào album TakeASnap, mép ảnh trùng mép khung | | tốt | không test được |
| 4.3 | Chụp với tỉ lệ 9:16 | Như trên |tốt |không test được | |
| 4.4 | Chụp với tỉ lệ 1:1 | Như trên |tốt | không test được | |
| 4.5 | Hẹn giờ 3 giây, 10 giây | Đếm đúng, hủy giữa chừng được | tốt |tốt | |
| 4.6 | Lưới 3×3, 4×4 | Hiện đúng trong khung | tốt | như iphone | nhưng nét hơi mảnh chụp trên nền sáng gần như biến mất không thấy |
| 4.7 | Thước cân bằng | Máy thẳng thì thước đổi màu và rung | Tốt | không test được | |

## 5. Điều khiển nhanh và ghi nhớ

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 5.1 | Đổi độ hiện pose | 100% → 60% → 30% | tốt | tốt | |
| 5.2 | Lật ngang pose | Pose lật |tốt | tốt | |
| 5.3 | Giữ nút ẩn, rồi buông | Giữ thì ẩn, buông thì hiện | tốt | tốt | |
| 5.4 | Đặt pose, đổi pose khác, chọn lại pose cũ | Về đúng vị trí cũ | tốt | tốt | |
| 5.5 | Tắt hẳn app rồi mở lại | Flash, lưới, tỉ lệ khung, pose đang dùng vẫn còn |tốt | tốt | |

## 6. Hai lỗi vừa sửa

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 6.1 | Chỉnh pose: bấm Lưu pose nhanh hai lần (thử cả pose mẫu) | Không lỗi "transaction", chỉ lưu một bản |tốt  | | |
| 6.2 | Chạm nhanh hai lần: nút X Thư viện, một ảnh pose, nút quay lại Chỉnh pose | Không cảnh báo "GO_BACK", không lùi quá Camera | tốt | tốt | |

## Góp ý khác

- 
