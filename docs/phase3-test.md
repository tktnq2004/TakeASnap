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
| 5.1 | Sửa nét, cọ Xóa tô lên **mặt** rồi nhấc tay | Viền và nét mặt ở vùng đó cùng mất | đạt | đạt | |
| 5.2 | Hoàn tác bước vừa xóa | Viền và nét mặt hiện lại |đạt | đạt | |
| 5.3 | Xóa mặt, "Lưu pose", mở lại pose đó; xem cả ô Thư viện và overlay Camera | Không còn nét mặt ở vùng đã xóa |đạt | đạt | |
| 5.4 | Mở lại pose ở 5.3, cọ Thêm tô lại vùng mặt | Nét mặt hiện lại |đạt |đạt | nhưng lúc này nó sẽ vẽ viền theo nét cọ vẽ thêm, không tự nhận ra dáng người và vẽ viền theo dáng người nữa|
| 5.5 | **Thêm lại** ảnh hai người đứng sát (ảnh cũ đã lưu không tự cập nhật) | Vẫn một vùng, nhưng có nét mặt của từng người |đạt | đạt| nhưng trên 2 người thì chỉ có thể vẽ 2 người |
| 5.6 | Ảnh hai, ba người đứng tách, mặt nhỏ (toàn thân) → chọn một người | Có nét mặt của người được chọn | | | |

## 6. Nút Chỉnh pose trên Camera

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 6.1 | Chọn một pose cho Camera | Rail bên phải có 4 nút, nút trên cùng là cây bút | đạt| đạt| |
| 6.2 | Bấm cây bút | Mở Chỉnh pose của đúng pose đang dùng |đạt |đạt | |
| 6.3 | Đổi màu viền → "Lưu pose" | Về Camera, overlay đổi theo, vị trí và lật ngang giữ nguyên | đạt | đạt | |
| 6.4 | Bấm cây bút → "Lưu thành bản mới" | Về Camera, overlay là bản mới, vị trí giữ nguyên |đạt | đạt | |
| 6.5 | Dùng một **pose mẫu**, bấm cây bút, sửa rồi lưu | Về Camera với bản mới trong "Pose của bạn", vị trí giữ nguyên |đạt | đạt| |
| 6.6 | Bấm cây bút rồi bấm quay lại (không lưu) | Về Camera, pose không đổi |đạt |đạt | thay vì chỉ có < hãy thêm chữ quay lại và mũi tên quay đầu để dễ nhìn |

## 7. Không có internet (thay cho chế độ máy bay)

Expo Go chỉ cần mạng nội bộ tới máy tính chạy Metro, không cần internet. Cách thử: điện thoại và máy tính cùng Wi-Fi, **rút dây internet của modem** (hoặc tắt WAN trên router) để Wi-Fi vẫn chạy nhưng không ra internet; trên máy tính chạy `npx expo start --offline`. Nếu không làm được thì ghi `—`, Phase 3 vẫn đóng với ghi chú.

Trước khi rút mạng: đã tạo ít nhất một pose từ ảnh trong máy (bộ tách người đã tải về).

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 7.1 | Tắt hẳn Expo Go, mở lại app | App mở, Camera chạy | | | |
| 7.2 | Chụp theo pose, lưu ảnh | Như khi có mạng | | | |
| 7.3 | Thêm ảnh từ máy, chọn người, sửa nét, lưu | Như khi có mạng | | | |

Giữ lại mục 7 test sau 

- Thêm multi detele trong pose của bạn để dọn nhanh, có khả năng chọn trượt theo ngón tay giống album của iphone

---

# Lần 3 — thử lại sau góp ý lần 2

Đã sửa: cọ **Khôi phục** tô lại đúng dáng người (5.4); dò thêm người khi ảnh có trên 2 người (5.5); nút "Quay lại" có chữ (6.6); chọn nhiều pose để xóa (góp ý).

Ngày thử: 

## 8. Cọ Khôi phục

Ảnh đã Sửa nét **trước** bản này không có viền gốc, nên Khôi phục chỉ tô lại tới viền lúc mở màn. Thử với pose mới tạo hoặc pose mẫu.

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 8.1 | Tab Sửa nét | Có [Thêm \| Xóa \| Khôi phục], nút hoàn tác và làm lại vẫn nằm cùng hàng, không bị chật |đạt| đạt | nhưng bạn đã hiểu sai ý tôi. Khi sử dụng xóa -> xong tô khôi phục mới trả lại như cũ mà tính năng đó được gộp vô chung với thêm -> cụ thể hơn là vùng vẽ thêm tô chiếm trọn 1 người -> thì vẽ thêm nét người như khôi phục hiện giờ làm, nó là 1 chức năng lớn hơn, mở rộng ra thêm ví dụ ảnh có 4 người -> segment lần đầu chọn 3 người -> khi sử dụng vẽ thêm phủ đủ người còn lại -> lúc này hiện thêm người thứ 4 |
| 8.2 | Xóa mặt, rồi chọn Khôi phục, tô cọ to phủ cả vùng mặt và nền quanh đó | Viền và nét mặt quay lại đúng dáng người, phần nền bị tô không thành người | test sau khi sửa 8.1 | test sau khi sửa 8.1| |
| 8.3 | Xóa mặt, "Lưu pose", mở lại, Khôi phục vùng mặt | Như 8.2 (viền gốc vẫn còn sau khi lưu) | test sau khi sửa 8.1 | test sau khi sửa 8.1 | |
| 8.4 | Pose mẫu: Xóa một tay rồi Khôi phục | Tay quay lại đúng dáng | test sau khi sửa 8.1 |test sau khi sửa 8.1 | |
| 8.5 | Khôi phục rồi hoàn tác | Quay về lúc trước khi khôi phục |test sau khi sửa 8.1 |test sau khi sửa 8.1 | |

## 9. Nhiều người

**Thêm lại** ảnh (ảnh đã lưu không tự cập nhật).

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 9.1 | Ảnh 3 người trở lên đứng sát nhau | Có nét mặt của từng người (ghi lại mấy người, mấy mặt) | đôi lúc làm tốt hiện tất cả, những ảnh có thể khó sẽ chỉ còn 3, trong đám đông có người mặt nhỏ hơn những người còn lại sẽ không được vẽ | | chấp nhận được với kết quả hiện tại  |
| 9.2 | Ảnh 2, 3 người đứng tách, mặt nhỏ (toàn thân) → chọn một người | Có nét mặt của người được chọn (mục 5.6 lần trước) |đạt| đạt | |
| 9.3 | Ảnh một người | Thời gian xử lý không chậm đi rõ so với trước | đạt| đạt | |

## 10. Nút Quay lại

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 10.1 | Mở Chỉnh pose | Góc trái có mũi tên quay đầu + chữ "Quay lại"; tiêu đề "Chỉnh pose" vẫn ở giữa | đạt|đạt | |
| 10.2 | Bấm "Quay lại" | Về màn trước, không lưu |đạt |đạt |

## 11. Chọn nhiều để xóa

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 11.1 | Thư viện → "Pose của bạn" | Đầu màn có chữ "Chọn pose" cạnh nút X. Tab Pose mẫu thì không có |đạt |đạt | |
| 11.2 | Bấm "Chọn pose" | Tiêu đề thành "Chọn pose để xóa", mỗi ô có vòng tròn ở góc, đáy là nút đỏ "Xóa 0 pose" (mờ) |đạt |đạt | |
| 11.3 | Chạm vài ô | Ô có dấu tích cam và viền cam, rung nhẹ; tiêu đề "Đã chọn n pose" |đạt |đạt | |
| 11.4 | Đặt ngón tay lên một ô, vuốt **ngang** rồi kéo xuống các hàng dưới | Cả dải từ ô đầu tới ô dưới ngón tay được chọn ngay trong lúc kéo |đạt |đạt | |
| 11.5 | Bắt đầu vuốt từ một ô **đã chọn** | Cả dải bị bỏ chọn |đạt |đạt | |
| 11.6 | Vuốt **dọc** trên lưới | Danh sách cuộn, không chọn ô nào |đạt |đạt | |
| 11.7 | "Xóa n pose" → Hủy, rồi lại → Xóa | Hủy thì không mất gì; Xóa thì các ô biến mất, thoát chế độ chọn |đạt |đạt | |
| 11.8 | Xóa pose đang dùng trên Camera | Về Camera không còn overlay |đạt |đạt | |
| 11.9 | Đang chọn thì bấm "Hủy" hoặc đổi sang tab Pose mẫu | Thoát chế độ chọn, bỏ hết dấu chọn |đạt |đạt | |
| 11.10 | Ngoài chế độ chọn: chạm ô, giữ lâu ô | Như cũ: chạm = dùng để chụp, giữ = menu |đạt |đạt | |

---

# Lần 4 — cọ Thêm nhận ra người

Đã sửa theo ghi chú 8.1: bỏ cọ Khôi phục, gộp vào cọ **Thêm**. App giữ dáng của **mọi người** trong ảnh lúc tạo pose (kể cả người không chọn ở màn Chọn người).
- Nét tô chủ yếu nằm trên người → chỉ phần thuộc dáng người được thêm, phần nền trong nét bỏ qua.
- Người đang thiếu (chưa chọn, hoặc đã xóa gần hết) mà nét tô lộ ra từ khoảng 1/4 người → hiện cả người đó, kèm nét mặt.
- Nét tô chủ yếu nằm trên nền → nới viền theo nét cọ như trước.

**Thêm lại ảnh để thử**: ảnh tạo trước bản này chỉ biết dáng của người đã chọn.

Ngày thử: 

## 12. Cọ Thêm

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 12.1 | Tab Sửa nét | Chỉ còn [Thêm \| Xóa], dòng hướng dẫn mới |đạt | đạt |  |
| 12.2 | Ảnh 4 người, chọn 3 → Sửa nét, Thêm tô lên người thứ 4 (tô khoảng 1/4 người trở lên) | Nhấc tay thì hiện cả người thứ 4 đúng dáng, có nét mặt | đạt | đạt | |
| 12.3 | Như 12.2 nhưng chỉ chạm một nét nhỏ lên người thứ 4 | Chỉ phần vừa tô hiện ra (theo dáng); tô thêm cho đủ thì hiện cả người | đạt |đạt | |
| 12.4 | Xóa mặt một người, rồi Thêm tô cọ to phủ vùng mặt và cả nền quanh đó | Viền và nét mặt quay lại đúng dáng, nền không thành người |đạt |đạt | |
| 12.5 | Xóa một tay và xóa mặt; Thêm chỉ tô lại mặt | Mặt quay lại, tay vẫn bị xóa | đạt | đạt| |
| 12.6 | Thêm tô ra nền xa người | Viền nở theo nét cọ như trước (mục 3.2) |đạt |đạt | |
| 12.7 | Sửa như 12.2, "Lưu pose", mở lại; xem ô Thư viện và overlay Camera | Người thứ 4 và nét mặt vẫn còn | đạt | đạt | |
| 12.8 | Pose mẫu: Xóa một tay rồi Thêm tô lại | Tay quay lại đúng dáng |đạt |đạt | |
| 12.9 | Thêm rồi hoàn tác, làm lại | Viền về đúng từng bước | đạt| đạt| phát sinh 1 vấn đề: khi thêm/xóa quá nhiều, tôi không biết lí do vì đâu, nhưng có vẻ stack undo quá lớn, sau khoảng 20-30 lần stack undo thì undo sẽ bị delay khoảng 0.5 - 1s mới quay trở lại |
| 12.10 | Ảnh 4 người, chọn 3, lưu **không** sửa nét | Pose chỉ có 3 người và 3 nét mặt (người thứ 4 không lộ ra) |không hiểu  | | |

---

# Lần 5 — hoàn tác nhanh

Đã sửa 12.9: trước đây mỗi lần hoàn tác, app dựng lại lưới từ đầu và chạy lại mọi nét còn lại (tới 30 nét), nên càng nhiều nét càng chậm. Nay mỗi nét chỉ ghi lại các ô nó đã đổi; hoàn tác / làm lại chỉ ghi trả các ô đó, nhanh như nhau dù đã vẽ bao nhiêu nét.

Ngày thử: 

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 13.1 | Vẽ khoảng 30 nét Thêm / Xóa xen kẽ, rồi bấm hoàn tác liên tục | Mỗi lần bấm, viền đổi gần như ngay (nhanh như lúc nhấc tay sau một nét), không chậm dần | đạt| đạt | |
| 13.2 | Làm lại liên tục tới hết | Như 13.1; viền về đúng như trước khi hoàn tác | | | |
| 13.3 | Vẽ hơn 30 nét rồi hoàn tác tới hết | Dừng ở bước thứ 30 (nút hoàn tác mờ đi); các nét cũ hơn vẫn còn trên viền | | | có vẻ như bạn còn dùng thêm cách xóa bớt các stack dưới, vì khi undo hết thì nó là pose đã bị chỉnh sửa khác chứ không phải pose gốc trước khi sửa |
| 13.4 | (Viết lại mục 12.10) Thư viện → Thêm ảnh từ máy → ảnh có 4 người → ở màn Chọn người chỉ chạm chọn 3 người → "Dùng người đã chọn" → ở Chỉnh pose **không** mở tab Sửa nét, bấm "Lưu pose" luôn → xem ô pose đó trong Thư viện và overlay trên Camera | Chỉ có viền và nét mặt của 3 người đã chọn; người thứ 4 không có viền, không có nét mặt |đạt |dạt | |

---

# Lần 6 — hoàn tác không giới hạn

Đã sửa 13.3 theo lựa chọn của bạn: bỏ giới hạn 30 bước. Hoàn tác hết là về đúng viền lúc mở màn Chỉnh pose.

Ngày thử: 

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 14.1 | Mở một pose, vẽ hơn 40 nét Thêm / Xóa, rồi hoàn tác tới hết | Nút hoàn tác chỉ mờ đi khi đã về đúng viền lúc mở màn; mỗi lần bấm vẫn nhanh | | | |
| 14.2 | Làm lại tới hết | Về đúng viền sau nét cuối cùng | | | |
| 14.3 | Hoàn tác hết rồi bấm "Lưu pose" | Viền không đổi so với trước khi mở màn | | | |
