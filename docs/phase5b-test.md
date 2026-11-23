# Phiếu thử Phase 5b — Bố cục chính / phụ và hướng dẫn liên tục

Cách điền như phiếu Phase 5a: mỗi ô máy ghi `d` (đạt), lỗi thì ghi ngắn điều thấy được, `—` khi không thử được. Xong thì nhắn "đã gửi". Ô nào để trống thì tôi thử trên máy tính (đọc code, chạy trang WebView thật) và ghi rõ là thử trên máy tính.

Chạy lại dev server có xóa cache (composition-critic lên v0.5.0): `npx expo start -c`.

Cần có **Bộ tách người** (Cài đặt → Dung lượng). Chưa có thì chọn bố cục chỉ bật lớp kẻ, không có hướng dẫn.

**Cách đọc hướng dẫn:** khi bạn chọn một bố cục, app tự chụp lặng khoảng 1 ảnh mỗi giây và hiện **một câu "hành động + kết quả"** ở chỗ dòng gợi ý, ví dụ "Xoay máy sang trái để đưa người vào cột 1/3". **Đích** (đường hoặc điểm cần đưa người, mắt, chân trời tới) được tô xanh đậm 3 px. Khung trắng quanh người, chấm trắng ở mắt là chỗ app thấy, cập nhật mỗi lượt. Điều quan trọng nhất cần thử: **làm theo câu thì người, mắt hoặc chân trời có tiến về đích sáng không**.

## 1. Bảng Bố cục và chip bố cục phụ

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 1.1 | Mở bảng Bố cục | Hai nhóm có tên: **BỐ CỤC CHÍNH** (Tắt, Lưới 3×3, Lưới 4×4, Quy tắc 1/3, Đặt ở giữa, Lấp đầy khung, Góc thấp, Selfie, Nhóm người) và **BỐ CỤC PHỤ, THEO CẢNH** (Đường chân trời, Đường dẫn) | | | |
| 1.2 | Chọn Quy tắc 1/3, mở lại bảng, chọn Đường chân trời | Bảng đóng; nút Bố cục vẫn vẽ 1/3; một **chip** "Chân trời" (hình nhỏ + chữ + dấu X) hiện ngay dưới thanh trên, căn trái; lớp kẻ vẽ cả lưới 1/3 lẫn hai đường ngang của chân trời | | | |
| 1.3 | Mở bảng lần nữa | Dòng Đường chân trời có dấu tích; chạm lại dòng đó thì bỏ bố cục phụ, chip biến mất | | | |
| 1.4 | Bật lại Chân trời, chạm vào chip | Rung nhẹ, chip biến mất, 1/3 vẫn bật | | | |
| 1.5 | Bố cục chính Tắt, chỉ bật Đường dẫn | Nút Bố cục hiện hình Đường dẫn; chip "Đường dẫn" hiện; lớp kẻ của Đường dẫn | | | |
| 1.6 | Đang bật 1/3 + Chân trời, chạm nút Bố cục trên thanh trên (tắt) | Tắt cả hai: hết lớp kẻ, hết chip | | | |
| 1.7 | Bố cục Tắt, rồi chỉ Lưới 3×3 / 4×4 | Không có nút Kiểm tra bố cục cạnh cụm zoom | | | |
| 1.8 | Thư viện → tab Bố cục → thẻ Đường chân trời → Chụp thử | Về Camera, Đường chân trời bật thành bố cục phụ (chip), bố cục chính giữ nguyên. Hướng dẫn **chưa** tự chạy (chỉ chạy khi chọn trong bảng Bố cục): ghi lại bạn muốn nó tự chạy hay không | | | |

## 2. Hướng dẫn liên tục: Quy tắc 1/3 (camera sau)

Nhờ một người đứng yên; bạn là người di chuyển máy. Người mẫu không cần làm gì.

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 2.1 | Người đứng giữa khung, chọn Quy tắc 1/3 | Không tiếng chụp, khung ngắm không nháy. Viên "Đang kiểm tra bố cục" rồi khoảng 1–2 s sau một câu như "Xoay máy sang trái để đưa người vào cột 1/3", có icon mũi tên; một đường dọc 1/3 sáng lên; rung nhẹ khi câu hiện | | | |
| 2.2 | Làm theo câu ở 2.1 (xoay máy chậm) | **Người dịch về phía đường dọc sáng**. Tới nơi thì câu đổi sang tiêu chí sau (mắt lên đường 1/3), đường ngang trên sáng lên. Ghi lại nếu mũi tên chỉ ngược | | | |
| 2.3 | Người nhìn hẳn sang một bên (quay mặt sang trái hoặc phải) | Cột đích là cột chừa chỗ **phía người đang nhìn** (nhìn sang phải thì người ở cột trái) | | | |
| 2.4 | Mắt nằm dưới đường 1/3 trên | "Chúc máy xuống để đưa mắt lên đường 1/3"; làm theo thì mắt đi lên | | | |
| 2.5 | Mắt nằm trên đường 1/3 trên (người sát mép trên) | "Ngửa máy lên để đưa mắt lên đường 1/3"; làm theo thì mắt đi xuống | | | |
| 2.6 | Khung cắt ngang đầu gối hoặc cổ chân | "Lùi ra để không cắt ngang tay chân" | | | |
| 2.7 | Đạt cả ba | Rung, viên xanh "Đạt Quy tắc 1/3" khoảng 3 s, hướng dẫn dừng, lớp kẻ giữ nguyên | | | |
| 2.8 | Đang làm tiêu chí mắt, cố ý xoay máy cho người lệch khỏi cột | Câu quay lại tiêu chí cột ("Xoay máy … để đưa người vào cột 1/3") | | | |
| 2.9 | Câu có dễ hiểu không, chữ có bị cắt không (tối đa 2 dòng) | Đọc một lần là biết làm gì | | | |

## 3. Bố cục chính khác

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 3.1 | Đặt ở giữa, máy nghiêng | Câu đầu là cân máy: "Xoay máy theo chiều kim đồng hồ cho máy thẳng" (hoặc ngược chiều), icon xoay; làm theo thì máy thẳng | | | |
| 3.2 | Đặt ở giữa, máy thẳng, người lệch | "Xoay máy sang … để đưa người vào giữa", đường dọc giữa sáng; rồi "… để đưa mắt lên chấm xanh", chấm 1/3 trên sáng | | | |
| 3.3 | Lấp đầy khung, người nhỏ trong khung | "Tiến lại gần để người lấp đầy khung", icon bước chân; tiến lại tới khi người gần kín khung thì đổi câu hoặc đạt | | | |
| 3.4 | Lấp đầy khung, đỉnh đầu chạm mép trên | "Ngửa máy lên để không cắt đỉnh đầu" | | | |
| 3.5 | Nhóm người, 2–3 người, có người sát mép | "Lùi ra để cả nhóm vào khung"; rồi "Xoay máy … để nhóm vào giữa" | | | |
| 3.6 | Nhóm người khi chỉ có 1 người | Viên "Cảnh này chưa thấy nhóm người" 3 s rồi dừng; lớp kẻ giữ nguyên | | | |
| 3.7 | Góc thấp, Selfie | Không có hướng dẫn liên tục, chạy dòng gợi ý cảm biến như Phase 5 | | | |

## 4. Bố cục phụ: Đường chân trời, Đường dẫn

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 4.1 | Chỉ bật Đường chân trời, ra biển / hồ / cánh đồng có người | Cân máy trước (nếu nghiêng), rồi "Ngửa máy lên / Chúc máy xuống để chân trời nằm trên đường xanh"; đường trắng ở chân trời app thấy, **một** đường 1/3 ngang sáng; làm theo thì đường trắng tiến về đường sáng | | | |
| 4.2 | Như 4.1, chân trời đi ngang cổ người | "Hạ máy xuống để chân trời không cắt cổ"; làm theo thì chân trời rời khỏi cổ | | | |
| 4.3 | Quy tắc 1/3 + Đường chân trời | Làm hết tiêu chí 1/3 trước, rồi tới chân trời; mắt đã ở đường 1/3 trên thì chân trời đích là đường 1/3 **dưới**. Đạt: "Đạt Quy tắc 1/3 + Đường chân trời" | | | |
| 4.4 | Đường chân trời trong nhà (không có chân trời) | Viên "Cảnh này không thấy đường chân trời" 3 s rồi dừng ngay; lớp kẻ giữ nguyên | | | |
| 4.5 | Đường dẫn, người trên đường đi / hành lang hội tụ, người lệch khỏi chỗ các đường gặp nhau | Đường trắng trên mép đường, vòng trắng ở điểm hội tụ, điểm đích sáng; "Bước sang trái / phải để đường dẫn tới người"; bước theo thì người tới gần điểm hội tụ | | | |
| 4.6 | Đường dẫn ở cảnh không có đường hội tụ | "Cảnh này không thấy đường dẫn" rồi dừng (bộ dò đường dẫn còn yếu, báo câu này ở cảnh có đường dẫn thì ghi lại cảnh đó) | | | |
| 4.7 | Đang hướng dẫn 1/3 + Chân trời, chạm chip Chân trời | Hướng dẫn chạy tiếp chỉ với 1/3 | | | |

## 5. Camera trước (hay ngược hướng nhất)

Thử cả hai lựa chọn Cài đặt → Ảnh camera trước (Lưu như thật / Lưu soi gương).

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 5.1 | Camera trước, Quy tắc 1/3, bạn đứng giữa khung | Câu "Xoay máy sang …"; **làm theo thì bạn dịch về đường dọc sáng** trên khung ngắm (khung ngắm soi gương) | | | |
| 5.2 | Như 5.1, tiêu chí mắt | Ngửa / chúc theo câu thì mắt tiến về đường ngang sáng | | | |
| 5.3 | Khung trắng quanh người, chấm mắt | Nằm đúng chỗ bạn trên khung ngắm, không bị lật | | | |
| 5.4 | Đặt ở giữa, máy nghiêng | Xoay theo chiều câu nói thì máy thẳng lại | | | |

## 6. Nhắc và dừng

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 6.1 | Đang hướng dẫn, nút Kiểm tra bố cục | Nút nền xanh (trạng thái đang chạy) | | | |
| 6.2 | Làm theo chậm mà đều | Không bị nhắc, không có chấm dưới viên | | | |
| 6.3 | Đứng yên, không làm theo | Khoảng mỗi 2 s: rung cảnh báo, thêm một chấm dưới viên (5 chấm, chấm đã dùng sáng). Sau chấm thứ 5: vòng mảnh quanh nút giảm dần trong 10 s | | | |
| 6.4 | Hết 10 s vẫn chưa đạt | Dừng; viên 3 s "Đạt: …" (nếu có tiêu chí đã đạt) và "Chưa đạt: …"; nút về bình thường, lớp kẻ giữ nguyên | | | |
| 6.5 | Trong 10 s cuối, làm theo cho đạt | Đạt và dừng như 2.7 | | | |
| 6.6 | Đang hướng dẫn, chạm nút xanh | Dừng ngay, rung, viên "Đã dừng hướng dẫn" khoảng 1,5 s | | | |
| 6.7 | Đang hướng dẫn, hướng máy đi chỗ khác (mất người) | "Hướng máy về phía người để thấy lại người"; không quay lại thì bị nhắc rồi dừng như 6.3–6.4 | | | |
| 6.8 | Đã dừng, chạm nút Kiểm tra bố cục | Kiểm tra một ảnh như Phase 5a (viên nhận xét 5 s), không chạy hướng dẫn | | | |
| 6.9 | Nhịp nhắc có hợp lý không: quá dày, quá thưa, dừng quá sớm hay quá muộn | Ghi cảm nhận | | | |

## 7. Chụp, đổi camera, rời Camera

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 7.1 | Đang hướng dẫn, bấm chụp | Chụp ngay (chậm hơn bình thường tối đa khoảng 0,6 s), không lỗi; hướng dẫn chạy tiếp sau khi chụp | | | |
| 7.2 | Đang hướng dẫn, chụp liên tiếp 5 ảnh | Ảnh nào cũng lưu, không treo | | | |
| 7.3 | Đang hướng dẫn, đổi camera trước / sau | Hướng dẫn dừng, không viên kết thúc | | | |
| 7.4 | Đang hướng dẫn, mở Thư viện hoặc Cài đặt rồi quay lại | Hướng dẫn đã dừng | | | |
| 7.5 | Đang hướng dẫn, chọn bố cục khác trong bảng | Bắt đầu lại với bố cục mới | | | |
| 7.6 | Chụp với 1/3 + Chân trời rồi mở Xem ảnh | Dòng dưới đầu màn ghi "Quy tắc 1/3 + Đường chân trời" (hoặc tương tự); thẻ nhận xét có cả dòng 1/3 lẫn dòng chân trời; lớp kẻ trên ảnh vẽ cả hai | | | |
| 7.7 | Chụp khi chỉ bật Đường dẫn rồi mở Xem ảnh | Thẻ nhận xét về đường dẫn như Phase 5a | | | |
| 7.8 | Cài đặt → Xóa bộ tách người, quay lại chọn 1/3 | Chỉ bật lớp kẻ, không hướng dẫn, không lỗi. Chạm Kiểm tra bố cục: hỏi tải như Phase 5a | | | |

## 8. Thời gian, độ nóng, pin

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 8.1 | Thời gian từ lúc chọn bố cục tới lúc câu đầu tiên hiện | Khoảng 1–2 s; ghi số ước lượng | | | |
| 8.2 | Khung trắng quanh người cập nhật bao lâu một lần khi bạn di chuyển máy | Khoảng 1 s; ghi nếu chậm hơn nhiều | | | |
| 8.3 | Cho hướng dẫn chạy liên tục khoảng 3 phút (dừng thì chọn lại bố cục) | Máy ấm nhẹ là chấp nhận được; ghi nếu nóng rõ, khung ngắm giật hoặc app chậm | | | |
| 8.4 | Pin trước và sau 8.3 | Ghi số % tụt | | | |
| 8.5 | Khung ngắm, zoom, kéo pose trong lúc hướng dẫn | Vẫn mượt như khi không hướng dẫn | | | |

## 9. Góp ý

Ghi ở đây những gì không nằm trong các dòng trên: câu nào khó hiểu, đích sáng có dễ thấy không, chip bố cục phụ có vướng không, có muốn bỏ chấm nhắc / vòng 10 s không.

-
