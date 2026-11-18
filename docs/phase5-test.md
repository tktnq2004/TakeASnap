# Phase 5 — Phiếu kiểm tra trên máy thật

Cách điền: mỗi ô máy ghi `đạt`, `lỗi` hoặc `—` (không áp dụng). Mục lỗi thì ghi ở cột Ghi chú đã làm gì và thấy gì.

Gợi ý từ cảm biến cần máy thật. Trên emulator Android chỉ thử được bảng Bố cục, lớp kẻ và pose dính đường (cảm biến giả thì ghi `—`).

| Máy | Phiên bản |
|---|---|
| iPhone | iPhone 15 Pro Max · Expo Go 58 · iOS |
| Android | Pixel_8a emulator · Expo Go 58 · Android |

Ngày thử: d là đạt , l là lỗi

## 1. Nút Bố cục và bảng chọn

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 1.1 | Mở app (trước đó đang bật Lưới 3×3 hoặc 4×4) | Nút Lưới cũ thành nút Bố cục, đang chọn "Lưới 3×3"; trước đó tắt lưới thì Bố cục tắt |đạt |đạt |nhưng như v thì bị mất option lưới 4x4 và mất bật lưới nhanh, phải đem chức năng này ra riêng 1 nút nào đó |
| 1.2 | Chạm nút Bố cục | Bảng tối trượt lên từ đáy, nền sau mờ; tiêu đề "Bố cục", nút đóng; 9 dòng: Tắt, Lưới 3×3, Quy tắc 1/3, Đặt ở giữa, Đường chân trời, Đường dẫn, Góc thấp, Selfie, Nhóm người |đ|đ | |
| 1.3 | Nhìn từng dòng | Mỗi dòng có hình nhỏ, tên và một dòng mô tả; dòng đang chọn nền xanh nhạt + dấu tích |d |d | |
| 1.4 | Chạm một dòng | Bảng trượt xuống, lớp kẻ đổi ngay theo kỹ thuật; nút Bố cục nền xanh, hiện hình nhỏ của kỹ thuật |d |d | |
| 1.5 | Mở bảng rồi chạm ra ngoài, hoặc chạm nút đóng | Bảng đóng, kỹ thuật không đổi |d |d | |
| 1.6 | Chạm Mở thêm (⌄) | Bảng thả xuống chỉ còn Đèn flash và Hẹn giờ, không còn hàng Lưới |d |d | |
| 1.7 | Thoát hẳn app rồi mở lại | Kỹ thuật vừa chọn vẫn còn | d|d | |

## 2. Lớp bố cục trên khung ngắm

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 2.1 | Chọn Lưới 3×3 | Chỉ có lưới 3×3 như cũ, không có chấm, không có dòng gợi ý |d |d | |
| 2.2 | Chọn Quy tắc 1/3 | Lưới 3×3 + vòng xanh có chấm giữa ở giao điểm trên trái | d|d | nhưng chỉ có chấm ở góc 1/3 bên trái, còn bên phải thì sao ? |
| 2.3 | Có pose, lật ngang pose (cột công cụ) khi đang ở 1/3 | Chấm đích sang giao điểm trên phải |d |d | vậy là chức năng này đang hoạt động dựa trên pose chứ không phải ảnh của camera? |
| 2.4 | Chọn Đặt ở giữa | Một đường dọc giữa khung + chấm đích trên trục, ở 1/3 trên |d |d | |
| 2.5 | Chọn Đường chân trời | Hai đường ngang: đường trên trắng, đường dưới xanh đậm hơn; không có đường dọc |d |d | |
| 2.6 | Chọn Đường dẫn | Lưới 3×3 + hai nét đứt xanh từ hai góc dưới chụm về chấm đích |d |d | |
| 2.7 | Chọn Góc thấp, Selfie, Nhóm người | Lưới 3×3, không có chấm |d |d | |
| 2.8 | Đổi tỉ lệ khung 3:4 → 9:16 → 1:1 khi đang bật một kỹ thuật | Lớp kẻ luôn nằm đúng trong khung |d |d | |
| 2.9 | Chụp ảnh khi đang bật lớp kẻ | Ảnh lưu không có đường kẻ, chấm hay dòng gợi ý |d |d | |

## 3. Dòng gợi ý

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 3.1 | Chọn Quy tắc 1/3, cầm máy thẳng | Viên tối ở đáy khung ngắm "Đặt mắt người lên chấm xanh", tự ẩn sau khoảng 4 giây |d |d | |
| 3.2 | Lặp 3.1 với Đặt ở giữa, Đường chân trời, Đường dẫn, Nhóm người | Mỗi kỹ thuật một câu hướng dẫn riêng, tự ẩn sau khoảng 4 giây |d |d | |
| 3.3 | Bật một kỹ thuật (không phải Tắt / Lưới), nghiêng máy rõ sang một bên rồi giữ yên | Sau khoảng nửa giây: "Máy nghiêng n°, xoay cho thẳng" kèm mũi tên xoay đúng chiều cần xoay; số độ đổi theo tay |d |d | |
| 3.4 | Từ 3.3 xoay máy về thẳng | Dòng gợi ý biến mất; tay run quanh 1–2° thì dòng không nhấp nháy |d |d | |
| 3.5 | Đường chân trời: cầm máy thẳng sau khi nghiêng | Viên xanh "Máy đã thẳng" có dấu tích, tự ẩn sau khoảng 1,5 giây |d |d | |
| 3.6 | Góc thấp, camera sau, cầm máy thẳng đứng | "Hạ máy ngang hông, ngửa lên nhẹ" + mũi tên xuống |d |d | |
| 3.7 | Từ 3.6 ngửa ống kính lên khoảng 10–30° | Viên xanh "Đạt góc thấp", rung nhẹ một lần, tự ẩn sau 1,5 giây; giữ yên thì không hiện lại |d | d| |
| 3.8 | Góc thấp, ngửa máy quá nhiều (gần như chụp lên trời) | "Ngửa máy ít lại một chút" |d |d | |
| 3.9 | Chọn Selfie khi đang ở camera sau | "Đổi sang camera trước để selfie" + icon đổi camera | d|d | |
| 3.10 | Selfie, đổi sang camera trước, cầm máy ngang mặt | "Giơ máy cao hơn mắt một chút" + mũi tên lên |d |d | |
| 3.11 | Từ 3.10 giơ máy cao hơn mắt, nghiêng màn hình xuống mặt | Viên xanh "Đạt góc selfie", rung nhẹ một lần, tự ẩn |d |d | |
| 3.12 | Selfie, giơ máy rất cao, chĩa thẳng xuống | "Hạ máy xuống một chút" |d |d | |
| 3.13 | Đặt máy nằm ngửa trên bàn | Không có gợi ý cảm biến nào (thước cũng ẩn) |d |d | |
| 3.14 | Dòng gợi ý khi có pose và cột công cụ | Dòng nằm trong khung, không che nút chụp, không chặn kéo pose |d |d | |

## 4. Pose dính đường bố cục

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 4.1 | Bố cục đang Tắt, chọn một pose mẫu (không phải nhóm Selfie) | Bố cục tự bật Quy tắc 1/3 |d |d | nhưng không cần thiết |
| 4.2 | Bố cục đang Tắt, chọn một pose nhóm Selfie | Bố cục tự bật Selfie |d |d | nhưng không cần thiết |
| 4.3 | Bố cục đang bật một kỹ thuật, chọn pose khác | Kỹ thuật giữ nguyên, không bị đổi |d |d | |
| 4.4 | Quy tắc 1/3: kéo pose sao cho mắt người mẫu gần chấm đích rồi thả | Pose trượt nhẹ để mắt nằm đúng đường 1/3 (dọc và ngang), rung nhẹ một lần |d |d | |
| 4.5 | Thả pose xa mọi đường | Pose đứng yên chỗ thả, không rung |d |d | |
| 4.6 | Đặt ở giữa: thả pose gần trục giữa | Mắt dính vào trục giữa |d |d | |
| 4.7 | Góc thấp / Selfie / Lưới: thả pose bất kỳ chỗ nào | Không dính |d |d | |
| 4.8 | Sau khi dính, rời Camera rồi quay lại | Pose ở đúng chỗ đã dính | d|d | |
| 4.9 | Kéo pose vào vùng xóa khi đang bật 1/3 | Vẫn gỡ pose như cũ, không bị dính ngược lại |d |d | |

## 5. Sửa theo phiếu lần 1

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 5.1 | Nhìn thanh trên | Nút Lưới về chỗ cũ: chạm đổi Tắt → 3×3 → 4×4 (huy hiệu số); Mở thêm có lại hàng Lưới |d |d | nhưng bật cùng lúc lưới 4x4 và bố cục sẽ bị lưới chồng lưới tạo nhiều đường kẻ rối mắt. Gộp lại về như ban đầu và thêm bố cục lưới 4x4 là được  |
| 5.2 | Mở app lần đầu sau bản này (vòng trước đang chọn "Lưới 3×3" trong Bố cục) | Lưới bật 3×3, Bố cục tắt | | | |
| 5.3 | Nhìn hàng zoom | Nút tròn Bố cục bên trái cụm zoom, thẳng cột ô ảnh vừa chụp; không còn nút Bố cục trên thanh trên | | | |
| 5.4 | Chạm nút Bố cục | Mở bảng Bố cục, 8 dòng (không còn dòng Lưới); chọn kỹ thuật thì nút thành nền xanh với hình nhỏ của kỹ thuật | | | |
| 5.5 | Giữ rồi kéo ngang cụm zoom | Nút Bố cục mờ đi khi thước cuộn hiện, hiện lại khi thả tay | | | |
| 5.6 | Bật Lưới 4×4 + Quy tắc 1/3 cùng lúc | Thấy cả lưới 4×4 và đường 1/3 + chấm; tắt Lưới thì lớp 1/3 vẫn còn | | | |
| 5.7 | Quy tắc 1/3, chưa có pose | Cả 4 giao điểm có vòng nhỏ xanh |d |d | |
| 5.8 | Quy tắc 1/3, có pose: kéo pose sang nửa phải hoặc nửa dưới rồi thả | Vòng đích lớn chuyển tới giao điểm gần mắt người mẫu nhất (kể cả hai giao điểm dưới); thả gần thì mắt dính vào giao điểm đó | d|d | không chỉ dính mắt, cột dọc tự kéo mặt của pose vào cột dù mặt người không phải ngay giao điểm 2 đường kẻ (vòng đích) |
| 5.9 | Đường dẫn, kéo pose sang phải rồi thả | Hai nét đứt chụm về giao điểm trên bên phải |d |d | |
| 5.10 | Bố cục đang Tắt, chọn một pose mẫu bất kỳ | Bố cục vẫn Tắt (không tự bật nữa) |d | d| |

## 6. Sửa theo phiếu lần 2

Lưới gộp lại vào Bố cục: nút Bố cục về chỗ nút Lưới trên thanh trên, bảng có thêm Lưới 3×3 và Lưới 4×4. Nút Bố cục cạnh zoom bỏ. Mục 5.2–5.6 không còn áp dụng.

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 6.1 | Mở app sau bản này (vòng trước Lưới 4×4 đang bật, Bố cục tắt) | Bố cục đang chọn Lưới 4×4; nút trên thanh trên có icon lưới + huy hiệu 4 d| d| | |
| 6.2 | Nhìn thanh trên và hàng zoom | Nút Bố cục ở chỗ nút Lưới cũ; cạnh cụm zoom không còn nút; Mở thêm chỉ còn Đèn flash, Hẹn giờ |d | d| |
| 6.3 | Chạm nút Bố cục | 10 dòng: Tắt, Lưới 3×3, Lưới 4×4, Quy tắc 1/3, Đặt ở giữa, Đường chân trời, Đường dẫn, Góc thấp, Selfie, Nhóm người; bảng không tràn màn |d |d | |
| 6.4 | Chọn Lưới 4×4, rồi Quy tắc 1/3 | Mỗi lúc chỉ một lớp kẻ, không còn lưới chồng lưới |d |d | |
| 6.5 | Chọn Lưới 3×3 / 4×4 | Nút có huy hiệu 3 / 4 như nút Lưới cũ; không có dòng gợi ý |d |d | |
| 6.6 | Lặp 5.7–5.10 (chấm 1/3, đường dẫn theo pose, không tự bật kỹ thuật) | Như kỳ vọng ở mục 5 | | | |

## 7. Sửa theo phiếu lần 3

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 7.1 | Quy tắc 1/3: thả pose sao cho mắt người mẫu sát một đường dọc nhưng xa mọi giao điểm (ví dụ giữa khung theo chiều cao) | Pose đứng yên chỗ thả, không bị kéo vào đường dọc | | | |
| 7.2 | Quy tắc 1/3: thả pose với mắt gần vòng đích (cách khoảng một đốt ngón tay) | Mắt dính đúng vào giao điểm, rung nhẹ | | | |
| 7.3 | Đường dẫn: thả mắt gần điểm hội tụ | Dính vào điểm hội tụ; gần đường dọc mà xa điểm thì không dính | | | |
| 7.4 | Đặt ở giữa: thả mắt gần trục giữa ở bất kỳ độ cao nào | Dính vào trục dọc; gần chấm đích thì dính cả vào chấm | | | |

## Góp ý thêm

