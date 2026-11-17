# Phase 5 — Phiếu kiểm tra trên máy thật

Cách điền: mỗi ô máy ghi `đạt`, `lỗi` hoặc `—` (không áp dụng). Mục lỗi thì ghi ở cột Ghi chú đã làm gì và thấy gì.

Gợi ý từ cảm biến cần máy thật. Trên emulator Android chỉ thử được bảng Bố cục, lớp kẻ và pose dính đường (cảm biến giả thì ghi `—`).

| Máy | Phiên bản |
|---|---|
| iPhone | iPhone 15 Pro Max · Expo Go 58 · iOS |
| Android | Pixel_8a emulator · Expo Go 58 · Android |

Ngày thử: 

## 1. Nút Bố cục và bảng chọn

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 1.1 | Mở app (trước đó đang bật Lưới 3×3 hoặc 4×4) | Nút Lưới cũ thành nút Bố cục, đang chọn "Lưới 3×3"; trước đó tắt lưới thì Bố cục tắt | | | |
| 1.2 | Chạm nút Bố cục | Bảng tối trượt lên từ đáy, nền sau mờ; tiêu đề "Bố cục", nút đóng; 9 dòng: Tắt, Lưới 3×3, Quy tắc 1/3, Đặt ở giữa, Đường chân trời, Đường dẫn, Góc thấp, Selfie, Nhóm người | | | |
| 1.3 | Nhìn từng dòng | Mỗi dòng có hình nhỏ, tên và một dòng mô tả; dòng đang chọn nền xanh nhạt + dấu tích | | | |
| 1.4 | Chạm một dòng | Bảng trượt xuống, lớp kẻ đổi ngay theo kỹ thuật; nút Bố cục nền xanh, hiện hình nhỏ của kỹ thuật | | | |
| 1.5 | Mở bảng rồi chạm ra ngoài, hoặc chạm nút đóng | Bảng đóng, kỹ thuật không đổi | | | |
| 1.6 | Chạm Mở thêm (⌄) | Bảng thả xuống chỉ còn Đèn flash và Hẹn giờ, không còn hàng Lưới | | | |
| 1.7 | Thoát hẳn app rồi mở lại | Kỹ thuật vừa chọn vẫn còn | | | |

## 2. Lớp bố cục trên khung ngắm

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 2.1 | Chọn Lưới 3×3 | Chỉ có lưới 3×3 như cũ, không có chấm, không có dòng gợi ý | | | |
| 2.2 | Chọn Quy tắc 1/3 | Lưới 3×3 + vòng xanh có chấm giữa ở giao điểm trên trái | | | |
| 2.3 | Có pose, lật ngang pose (cột công cụ) khi đang ở 1/3 | Chấm đích sang giao điểm trên phải | | | |
| 2.4 | Chọn Đặt ở giữa | Một đường dọc giữa khung + chấm đích trên trục, ở 1/3 trên | | | |
| 2.5 | Chọn Đường chân trời | Hai đường ngang: đường trên trắng, đường dưới xanh đậm hơn; không có đường dọc | | | |
| 2.6 | Chọn Đường dẫn | Lưới 3×3 + hai nét đứt xanh từ hai góc dưới chụm về chấm đích | | | |
| 2.7 | Chọn Góc thấp, Selfie, Nhóm người | Lưới 3×3, không có chấm | | | |
| 2.8 | Đổi tỉ lệ khung 3:4 → 9:16 → 1:1 khi đang bật một kỹ thuật | Lớp kẻ luôn nằm đúng trong khung | | | |
| 2.9 | Chụp ảnh khi đang bật lớp kẻ | Ảnh lưu không có đường kẻ, chấm hay dòng gợi ý | | | |

## 3. Dòng gợi ý

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 3.1 | Chọn Quy tắc 1/3, cầm máy thẳng | Viên tối ở đáy khung ngắm "Đặt mắt người lên chấm xanh", tự ẩn sau khoảng 4 giây | | | |
| 3.2 | Lặp 3.1 với Đặt ở giữa, Đường chân trời, Đường dẫn, Nhóm người | Mỗi kỹ thuật một câu hướng dẫn riêng, tự ẩn sau khoảng 4 giây | | | |
| 3.3 | Bật một kỹ thuật (không phải Tắt / Lưới), nghiêng máy rõ sang một bên rồi giữ yên | Sau khoảng nửa giây: "Máy nghiêng n°, xoay cho thẳng" kèm mũi tên xoay đúng chiều cần xoay; số độ đổi theo tay | | | |
| 3.4 | Từ 3.3 xoay máy về thẳng | Dòng gợi ý biến mất; tay run quanh 1–2° thì dòng không nhấp nháy | | | |
| 3.5 | Đường chân trời: cầm máy thẳng sau khi nghiêng | Viên xanh "Máy đã thẳng" có dấu tích, tự ẩn sau khoảng 1,5 giây | | | |
| 3.6 | Góc thấp, camera sau, cầm máy thẳng đứng | "Hạ máy ngang hông, ngửa lên nhẹ" + mũi tên xuống | | | |
| 3.7 | Từ 3.6 ngửa ống kính lên khoảng 10–30° | Viên xanh "Đạt góc thấp", rung nhẹ một lần, tự ẩn sau 1,5 giây; giữ yên thì không hiện lại | | | |
| 3.8 | Góc thấp, ngửa máy quá nhiều (gần như chụp lên trời) | "Ngửa máy ít lại một chút" | | | |
| 3.9 | Chọn Selfie khi đang ở camera sau | "Đổi sang camera trước để selfie" + icon đổi camera | | | |
| 3.10 | Selfie, đổi sang camera trước, cầm máy ngang mặt | "Giơ máy cao hơn mắt một chút" + mũi tên lên | | | |
| 3.11 | Từ 3.10 giơ máy cao hơn mắt, nghiêng màn hình xuống mặt | Viên xanh "Đạt góc selfie", rung nhẹ một lần, tự ẩn | | | |
| 3.12 | Selfie, giơ máy rất cao, chĩa thẳng xuống | "Hạ máy xuống một chút" | | | |
| 3.13 | Đặt máy nằm ngửa trên bàn | Không có gợi ý cảm biến nào (thước cũng ẩn) | | | |
| 3.14 | Dòng gợi ý khi có pose và cột công cụ | Dòng nằm trong khung, không che nút chụp, không chặn kéo pose | | | |

## 4. Pose dính đường bố cục

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 4.1 | Bố cục đang Tắt, chọn một pose mẫu (không phải nhóm Selfie) | Bố cục tự bật Quy tắc 1/3 | | | |
| 4.2 | Bố cục đang Tắt, chọn một pose nhóm Selfie | Bố cục tự bật Selfie | | | |
| 4.3 | Bố cục đang bật một kỹ thuật, chọn pose khác | Kỹ thuật giữ nguyên, không bị đổi | | | |
| 4.4 | Quy tắc 1/3: kéo pose sao cho mắt người mẫu gần chấm đích rồi thả | Pose trượt nhẹ để mắt nằm đúng đường 1/3 (dọc và ngang), rung nhẹ một lần | | | |
| 4.5 | Thả pose xa mọi đường | Pose đứng yên chỗ thả, không rung | | | |
| 4.6 | Đặt ở giữa: thả pose gần trục giữa | Mắt dính vào trục giữa | | | |
| 4.7 | Góc thấp / Selfie / Lưới: thả pose bất kỳ chỗ nào | Không dính | | | |
| 4.8 | Sau khi dính, rời Camera rồi quay lại | Pose ở đúng chỗ đã dính | | | |
| 4.9 | Kéo pose vào vùng xóa khi đang bật 1/3 | Vẫn gỡ pose như cũ, không bị dính ngược lại | | | |

## Góp ý thêm

