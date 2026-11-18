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
| 7.1 | Quy tắc 1/3: thả pose sao cho mắt người mẫu sát một đường dọc nhưng xa mọi giao điểm (ví dụ giữa khung theo chiều cao) | Pose đứng yên chỗ thả, không bị kéo vào đường dọc |d |d |khi mắt người vào được vòng tròn rồi thì nên ẩn, khi mắt không còn khớp mới hiện lên |
| 7.2 | Quy tắc 1/3: thả pose với mắt gần vòng đích (cách khoảng một đốt ngón tay) | Mắt dính đúng vào giao điểm, rung nhẹ |d |d | |
| 7.3 | Đường dẫn: thả mắt gần điểm hội tụ | Dính vào điểm hội tụ; gần đường dọc mà xa điểm thì không dính |d |d |cũng như 1/3 ẩn khi mắt đã vào ô tròn |
| 7.4 | Đặt ở giữa: thả mắt gần trục giữa ở bất kỳ độ cao nào | Dính vào trục dọc; gần chấm đích thì dính cả vào chấm |d |d |cũng như 1/3 ẩn khi mắt đã vào ô tròn |

## 8. Thẻ học

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 8.1 | Mở Thư viện | Có tab thứ ba "Bố cục" sau Pose mẫu, Pose của bạn |d |d | |
| 8.2 | Chạm tab Bố cục | Lưới 2 cột, 16 ô: hình vẽ nhỏ, tên, nhãn "Có trên Camera" (xanh) hoặc "Chỉ đọc" (xám); không có nút Thêm ảnh từ máy |d |d | vẽ nhân vật từ các hình trụ tròn nhẫn và có tay đi người này hơi xấu |
| 8.3 | Chạm một ô | Mở màn thẻ: nút Quay lại, tiêu đề "Bố cục", tên kỹ thuật to; hai hình Chưa đạt (X đỏ) / Đạt (dấu tích xanh); thẻ ba đoạn Là gì · Khi nào dùng · Khi nào phá lệ; nút Chụp thử ở đáy |d |d |nên thêm vuốt từ mép trái qua phải để về cho tiện. Có thể trích dẫn thêm nguồn để tăng độ tin cậy |
| 8.4 | Xem lần lượt cả 16 thẻ | Hình vẽ đúng ý câu chữ (ví dụ Không cắt khớp: mép dưới cắt gối / cắt giữa đùi; Nhóm người: đầu thẳng hàng / tam giác); chữ không tràn, cuộn được tới hết |d |d | |
| 8.5 | Quay lại từ màn thẻ | Về tab Bố cục của Thư viện |d |d | |
| 8.6 | Thẻ Quy tắc 1/3 → Chụp thử | Đóng thẻ và Thư viện, về thẳng Camera; Bố cục đang chọn Quy tắc 1/3 |d |d | |
| 8.7 | Thẻ Máy thẳng, đường chân trời → Chụp thử; thẻ Tiền cảnh → Chụp thử | Lần lượt bật Đường chân trời; Lưới 3×3 |d |d | |
| 8.8 | Camera → nút Bố cục → "Học các kỹ thuật" | Bảng đóng, Thư viện mở thẳng tab Bố cục |d |d | |

## 9. Sửa theo phiếu lần 4

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 9.1 | Quy tắc 1/3: thả pose cho mắt dính vào giao điểm | Vòng đích ẩn đi; kéo pose lệch ra rồi thả thì vòng hiện lại |d |d | |
| 9.2 | Lặp 9.1 với Đường dẫn và Đặt ở giữa | Vòng đích ẩn khi mắt trong vòng (hai nét đứt của đường dẫn vẫn còn) |d |d | |
| 9.3 | Tỉ lệ 9:16 | Mép trên khung đi qua khoảng giữa thanh công cụ trên, mép dưới qua khoảng giữa nút chụp / ô ảnh / đổi camera |d |d | |
| 9.4 | Tỉ lệ 9:16 + một kỹ thuật bố cục có dòng gợi ý (ví dụ Góc thấp) | Dòng gợi ý nằm trên cụm zoom, không bị nút chụp che |d |d | |
| 9.5 | Tỉ lệ 3:4 và 1:1 | Khung như cũ; dòng gợi ý vẫn ở đáy khung |d |d | |
| 9.6 | Thẻ học: nhìn các hình | Người vẽ kiểu biểu tượng có tay, nét bo tròn; dễ nhìn hơn bản trước | d|d |sử dụng hình người tôi gửi |
| 9.7 | Màn thẻ: vuốt từ sát mép trái sang phải | Màn trượt theo tay; thả quá khoảng 1/4 màn hoặc vuốt nhanh thì về Thư viện, không thì trượt lại |d |d |thêm tính năng này cho editor luôn |
| 9.8 | Màn thẻ: vuốt dọc để cuộn, vuốt ngang ở giữa màn | Cuộn bình thường; vuốt ngang ở giữa màn không quay lại |d |d | |
| 9.9 | Màn thẻ: mục Nguồn | Có 1–2 nguồn dưới thẻ chữ; chạm mở trang trong trình duyệt |l |l |trích từ tiêu đề, tác giả, hoặc cuốn sách, .... nếu là link thì sẽ bị vi phạm tính offline của app |

## 10. Sửa theo phiếu lần 5

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 10.1 | Thẻ học: nhìn hình ở tab Bố cục và trong từng thẻ | Người vẽ giống biểu tượng đã gửi: viền một nét, đầu tròn tách thân, tay có khe ở nách, vạch giữa hai chân |d |d | |
| 10.2 | Thẻ Ánh sáng, thẻ Không cắt khớp | Ánh sáng: người tối đặc trên nền sáng / người viền sáng; Không cắt khớp: vạch mép dưới qua gối / qua giữa đùi |d |d | |
| 10.3 | Màn thẻ: mục Nguồn | Mỗi nguồn là tên bài + nơi đăng, không có link, chạm vào không mở gì |d |d | |
| 10.4 | Chỉnh pose: vuốt từ sát mép trái sang phải | Màn trượt theo tay; thả xa hoặc vuốt nhanh thì về màn trước (như nút Quay lại, không lưu) |d |d | |
| 10.5 | Chỉnh pose: tô cọ / kéo ảnh bắt đầu sát mép trái vùng ảnh | Cọ vẫn vẽ, không bị hiểu là vuốt quay lại |l |l | tô từ mép trái kéo vào thì vẫn bị nhưng chấp nhận được  |

## 11. Nhận xét sau khi chụp (Bước 3)

Cần bộ tách người (gói tải ở lần tạo pose đầu tiên). Nếu chưa tải, mục 11.2 sẽ hiện nút tải.

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 11.1 | Bố cục Tắt, chụp rồi mở Xem ảnh vừa chụp | Như cũ: "Ảnh n trên m · giờ", không có thẻ nhận xét | | | |
| 11.2 | Chưa có bộ tách người (xóa ở Cài đặt): chụp với Quy tắc 1/3, mở Xem ảnh | Thẻ: câu "Nhận xét bố cục cần bộ tách người…" + nút "Tải bộ tách người (x MB)"; bấm thì tải rồi nhận xét | | | |
| 11.3 | Quy tắc 1/3: chụp một người đứng giữa khung | Dòng trên: "Ảnh n trên m · Quy tắc 1/3"; ảnh có lưới 3×3; thẻ có "Người đứng giữa khung, chưa theo đường 1/3" (X đỏ) | | | |
| 11.4 | Quy tắc 1/3: chụp người có mắt gần giao điểm 1/3 | Thẻ có "Mắt gần đường 1/3 trên" và "Người đứng trên đường dọc 1/3" (dấu tích) | | | |
| 11.5 | Từ 11.3: bấm "Xem khung cắt gợi ý" | Khung nét đứt xanh trên ảnh, ngoài khung tối đi; nút đáy "Ảnh gốc" · "Lưu bản cắt"; không vuốt sang ảnh khác được | | | |
| 11.6 | Bấm "Lưu bản cắt" | Rung nhẹ; nhảy sang ảnh mới (bản cắt) ở cuối; ảnh mới có nhận xét đạt hơn; album có cả ảnh gốc và bản cắt | | | |
| 11.7 | Bấm "Ảnh gốc" trong chế độ cắt | Thoát chế độ cắt, ảnh và thẻ như trước | | | |
| 11.8 | Chạm vào ảnh | Lớp bố cục trên ảnh tắt / bật | | | |
| 11.9 | Đặt ở giữa: chụp người lệch trục | "Người lệch khỏi trục giữa"; có khung cắt gợi ý đưa người vào giữa | | | |
| 11.10 | Góc thấp: chụp mất bàn chân / lấy cả chân | "Mất bàn chân…" / "Thấy cả bàn chân" | | | |
| 11.11 | Nhóm người: 3 người đầu ngang nhau / so le | "Các đầu gần như cùng một độ cao" / "Các đầu cao thấp so le" | | | |
| 11.12 | Chụp mà mép dưới cắt ngang gối; chụp người sát mép trái | "Mép ảnh cắt ngang gối"; "Người sát mép trái" | | | |
| 11.13 | Chụp ảnh không có người (bố cục đang bật) | "Không thấy người trong ảnh nên chưa nhận xét được." | | | |
| 11.14 | Chụp liên tục 5 ảnh với 1/3, mở Xem ảnh, vuốt qua lại | Mỗi ảnh nhận xét một lần (vuốt lại không chạy lại); ảnh nhảy cỡ ít khi đổi ảnh | | | |
| 11.15 | Thời gian: từ lúc mở ảnh tới khi thẻ hiện nhận xét | Ghi số giây ở cột Ghi chú (lần đầu có nạp bộ tách, các lần sau) | | | |

## Góp ý thêm

