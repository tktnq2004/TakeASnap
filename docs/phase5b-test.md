# Phiếu thử Phase 5b — Bố cục chính / phụ và hướng dẫn liên tục

Cách điền như phiếu Phase 5a: mỗi ô máy ghi `d` (đạt), lỗi thì ghi ngắn điều thấy được, `—` khi không thử được. Xong thì nhắn "đã gửi". Ô nào để trống thì tôi thử trên máy tính (đọc code, chạy trang WebView thật) và ghi rõ là thử trên máy tính.

Lần 1 (2026-11-23): mục 1–9. **Lần 2: mục 10, chỉ Quy tắc 1/3.**

Chạy lại dev server có xóa cache: `npx expo start -c`.

Cần có **Bộ tách người** (Cài đặt → Dung lượng). Chưa có thì chọn bố cục chỉ bật lớp kẻ, không có hướng dẫn.

**Cách đọc hướng dẫn:** khi bạn chọn một bố cục, app tự chụp lặng khoảng 1 ảnh mỗi giây và hiện **một câu "hành động + kết quả"** ở chỗ dòng gợi ý, ví dụ "Xoay máy sang trái để đưa người vào cột 1/3". **Đích** (đường hoặc điểm cần đưa người, mắt, chân trời tới) được tô xanh đậm 3 px. Khung trắng quanh người, chấm trắng ở mắt là chỗ app thấy, cập nhật mỗi lượt. Điều quan trọng nhất cần thử: **làm theo câu thì người, mắt hoặc chân trời có tiến về đích sáng không**.

## 1. Bảng Bố cục và chip bố cục phụ

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 1.1 | Mở bảng Bố cục | Hai nhóm có tên: **BỐ CỤC CHÍNH** (Tắt, Lưới 3×3, Lưới 4×4, Quy tắc 1/3, Đặt ở giữa, Lấp đầy khung, Góc thấp, Selfie, Nhóm người) và **BỐ CỤC PHỤ, THEO CẢNH** (Đường chân trời, Đường dẫn) |d |d | |
| 1.2 | Chọn Quy tắc 1/3, mở lại bảng, chọn Đường chân trời | Bảng đóng; nút Bố cục vẫn vẽ 1/3; một **chip** "Chân trời" (hình nhỏ + chữ + dấu X) hiện ngay dưới thanh trên, căn trái; lớp kẻ vẽ cả lưới 1/3 lẫn hai đường ngang của chân trời |l |l |sau khi chọn 1/3 , ấn lại bố cục sẽ tắt, không bật được 2 bố cục cùng lúc |
| 1.3 | Mở bảng lần nữa | Dòng Đường chân trời có dấu tích; chạm lại dòng đó thì bỏ bố cục phụ, chip biến mất |l |l |như trên |
| 1.4 | Bật lại Chân trời, chạm vào chip | Rung nhẹ, chip biến mất, 1/3 vẫn bật |l |l |lỗi như trên |
| 1.5 | Bố cục chính Tắt, chỉ bật Đường dẫn | Nút Bố cục hiện hình Đường dẫn; chip "Đường dẫn" hiện; lớp kẻ của Đường dẫn | | | |
| 1.6 | Đang bật 1/3 + Chân trời, chạm nút Bố cục trên thanh trên (tắt) | Tắt cả hai: hết lớp kẻ, hết chip | | | |
| 1.7 | Bố cục Tắt, rồi chỉ Lưới 3×3 / 4×4 | Không có nút Kiểm tra bố cục cạnh cụm zoom | | | |
| 1.8 | Thư viện → tab Bố cục → thẻ Đường chân trời → Chụp thử | Về Camera, Đường chân trời bật thành bố cục phụ (chip), bố cục chính giữ nguyên. Hướng dẫn **chưa** tự chạy (chỉ chạy khi chọn trong bảng Bố cục): ghi lại bạn muốn nó tự chạy hay không |d |d | |

## 2. Hướng dẫn liên tục: Quy tắc 1/3 (camera sau)

Nhờ một người đứng yên; bạn là người di chuyển máy. Người mẫu không cần làm gì.

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 2.1 | Người đứng giữa khung, chọn Quy tắc 1/3 | Không tiếng chụp, khung ngắm không nháy. Viên "Đang kiểm tra bố cục" rồi khoảng 1–2 s sau một câu như "Xoay máy sang trái để đưa người vào cột 1/3", có icon mũi tên; một đường dọc 1/3 sáng lên; rung nhẹ khi câu hiện |d |d | |
| 2.2 | Làm theo câu ở 2.1 (xoay máy chậm) | **Người dịch về phía đường dọc sáng**. Tới nơi thì câu đổi sang tiêu chí sau (mắt lên đường 1/3), đường ngang trên sáng lên. Ghi lại nếu mũi tên chỉ ngược |d |d | |
| 2.3 | Người nhìn hẳn sang một bên (quay mặt sang trái hoặc phải) | Cột đích là cột chừa chỗ **phía người đang nhìn** (nhìn sang phải thì người ở cột trái) |l |l | vẫn chưa phân biệt được hướng người nhìn |
| 2.4 | Mắt nằm dưới đường 1/3 trên | "Chúc máy xuống để đưa mắt lên đường 1/3"; làm theo thì mắt đi lên |d |d | |
| 2.5 | Mắt nằm trên đường 1/3 trên (người sát mép trên) | "Ngửa máy lên để đưa mắt lên đường 1/3"; làm theo thì mắt đi xuống |d |d | |
| 2.6 | Khung cắt ngang đầu gối hoặc cổ chân | "Lùi ra để không cắt ngang tay chân" |d |d | |
| 2.7 | Đạt cả ba | Rung, viên xanh "Đạt Quy tắc 1/3" khoảng 3 s, hướng dẫn dừng, lớp kẻ giữ nguyên |d |d | |
| 2.8 | Đang làm tiêu chí mắt, cố ý xoay máy cho người lệch khỏi cột | Câu quay lại tiêu chí cột ("Xoay máy … để đưa người vào cột 1/3") |d |d | |
| 2.9 | Câu có dễ hiểu không, chữ có bị cắt không (tối đa 2 dòng) | Đọc một lần là biết làm gì | câu đang bị sai, muốn hình mẫu nằm bên phải thì phải là đưa máy/ xoay máy qua trái mới đúng | | |


-> gợi ý nhảy quá nhanh, chưa kịp làm 1 tiêu chí đã tắt và nhảy tiêu chí khác. gợi ý còn sai và chưa rõ, hướng dẫn chưa nổi bật chưa đủ rõ để nhận biết là đúng 
## 3. Bố cục chính khác

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 3.1 | Đặt ở giữa, máy nghiêng | Câu đầu là cân máy: "Xoay máy theo chiều kim đồng hồ cho máy thẳng" (hoặc ngược chiều), icon xoay; làm theo thì máy thẳng |d |d | sử dụng câu: xoay máy xang phải/ trái để máy thẳng |
| 3.2 | Đặt ở giữa, máy thẳng, người lệch | "Xoay máy sang … để đưa người vào giữa", đường dọc giữa sáng; rồi "… để đưa mắt lên chấm xanh", chấm 1/3 trên sáng | d| d|  |
| 3.3 | Lấp đầy khung, người nhỏ trong khung | "Tiến lại gần để người lấp đầy khung", icon bước chân; tiến lại tới khi người gần kín khung thì đổi câu hoặc đạt |d | d| zoom/ hoặc tiến lại gần |
| 3.4 | Lấp đầy khung, đỉnh đầu chạm mép trên | "Ngửa máy lên để không cắt đỉnh đầu" |d |d | ngửa máy lên/ đưa máy lên  |
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

## 10. Lần 2 — chỉ Quy tắc 1/3

Từ lần này thử **từng bố cục chính một**, mỗi bố cục một lần riêng, chia theo từng bước của bố cục đó. Lần 2 chỉ thử Quy tắc 1/3 (và nút Bố cục). Mục 3.5–8 của lần 1 bỏ qua; Ở giữa, Lấp đầy, Nhóm, bố cục phụ sẽ có lần thử riêng.

Chạy lại `npx expo start -c` (composition-critic lên v0.5.1).

**Đã sửa theo lần 1:**

- **1.2–1.4** (đang bật 1/3 thì chạm nút Bố cục là tắt, không thêm được bố cục phụ): nút Bố cục vẫn chạm là tắt nhanh như phiếu Phase 5 lần 7. Đang bật bố cục chính mà chưa có bố cục phụ thì dưới thanh trên có chip **"+ Bố cục phụ"**, chạm để mở bảng mà không tắt 1/3.
- **2.3** (chưa phân biệt hướng nhìn): app đoán hướng nhìn bằng mũi so với **giữa hai vai**, và mũi phải lệch quá 30% bề rộng vai mới tính. Người chỉ quay đầu, vai vẫn thẳng, thì không bao giờ tới mức đó. Giờ đoán theo **đầu**: mũi so với **giữa hai tai**; không thấy tai thì mới dùng vai. Tôi đã soi trên ảnh thật của bộ ảnh đo: các ca quay đầu được nhận đúng.
- **2.9** (câu sai): câu cũ "Xoay máy sang trái để đưa người vào cột 1/3" không nói cột nào, mà có hai cột 1/3. Người đứng gần giữa khung thì cột gần nhất đổi qua lại theo rung tay, nên câu nhảy "xoay trái" / "xoay phải". Giờ:
  - câu nói rõ bên: **"Xoay máy sang trái để đưa người sang đường 1/3 bên phải"**;
  - cột đích **chốt ở lượt đầu**, chỉ đổi khi thấy rõ người nhìn về phía kia 2 lượt liền.
- **"Nhảy quá nhanh, chưa kịp làm đã nhảy tiêu chí khác":**
  - một bước chỉ tính đạt khi đúng **2 lượt liền** (khoảng 2 s);
  - bước đã đạt chỉ tính là vỡ khi lệch quá 1,5 lần ngưỡng, nên rung tay không làm câu nhảy qua lại;
  - mất người 1 lượt (dò hụt) thì bỏ qua lượt đó;
  - đạt cả bố cục cũng phải giữ 2 lượt.
- **"Chưa nổi bật, chưa đủ rõ để biết là đúng":**
  - có **mũi tên trắng trên khung ngắm**, từ chỗ người (hoặc mắt) đang đứng tới đích xanh: người sẽ đi về đâu;
  - tới đích thì viên đổi **xanh**, "Đúng rồi, giữ yên máy";
  - qua bước thì viên xanh **"Đạt: người trên đường 1/3"** khoảng 1 s rồi mới tới câu sau.
  - Icon trong viên giờ không có chiều (mũi tên hai đầu), vì chiều đã nằm ở câu và ở mũi tên trên khung ngắm: "xoay máy sang trái" thì người dịch sang phải, hai mũi tên ngược chiều nhau dễ gây rối.
- **Nút Kiểm tra bố cục** giờ là phím tắt **hướng dẫn lại**: đạt rồi (hoặc đã dừng) muốn hướng dẫn lại thì chạm nút, không phải tắt bố cục rồi bật lại. Đang hướng dẫn thì nút vẫn là nút dừng.

**Ghi lại cho lần thử riêng của từng bố cục** (chưa sửa lần này):

- 3.1 cân máy: dùng câu "Xoay máy sang phải / trái để máy thẳng".
- 3.3 Lấp đầy: "Tiến lại gần hoặc zoom vào".
- 3.4 Lấp đầy: "Ngửa máy lên / đưa máy lên".

### 10.1 Nút Bố cục, chip bố cục phụ

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 10.1.1 | Bật Quy tắc 1/3 | Dưới thanh trên, căn trái: chip "+ Bố cục phụ" |d | d| nhưng sẽ bị chiếm 1 góc màn ảnh chụp, tìm cách khác |
| 10.1.2 | Chạm chip "+ Bố cục phụ", chọn Đường chân trời | Bảng mở, 1/3 vẫn bật; chọn xong chip đổi thành "Chân trời ×"; lớp kẻ vẽ cả hai | d|d |mở cả bảng thì không cần, mở ra chỉ nên có phụ |
| 10.1.3 | Chạm chip "Chân trời ×" | Bỏ chân trời, chip về "+ Bố cục phụ", 1/3 vẫn bật |d |d | |
| 10.1.4 | Chạm nút Bố cục trên thanh trên | Tắt hết như trước, chip biến mất |d |d | |

### 10.2 Bước 1: người vào đường 1/3 (camera sau, người nhìn thẳng vào máy)

Người mẫu đứng yên nhìn thẳng vào máy; bạn di chuyển máy.

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 10.2.1 | Người hơi lệch trái khỏi giữa khung, chọn 1/3 | Đường dọc 1/3 **bên trái** sáng; câu "Xoay máy sang phải để đưa người sang đường 1/3 bên trái"; mũi tên trắng từ người sang trái tới đường sáng | — | — | Claude thử trên máy tính (Jest, `guidance.test.ts`): người lệch trái, nhìn thẳng → cột trái, "Xoay máy sang phải", đích x = 1/3; đối xứng với 10.2.2 đã đạt trên máy |
| 10.2.2 | Người hơi lệch phải | Như trên nhưng **bên phải**, "Xoay máy sang trái …", mũi tên sang phải |d |d | mũi tên chỉ đúng, tốt. Tối ưu thêm ở thanh gợi ý hướng -> hoặc <- thay vì <->, gợi ý nên kèm luôn cả 2 hành động di chuyển máy hoặc di chuyển người, vì không biết người dùng chọn cái nào |
| 10.2.3 | Người đứng đúng giữa khung, máy rung nhẹ trong tay khoảng 10 s | Cột đích **không đổi** qua lại; câu không nhảy "xoay trái" / "xoay phải" | — | — | Claude thử trên máy tính (Jest): người lắc qua lại giữa khung (mắt 0,49 → 0,51) không đổi cột đã chốt. Chưa thử rung tay thật |
| 10.2.4 | Làm theo câu, xoay máy chậm | Người và mũi tên tiến dần về đường sáng, mũi tên ngắn dần |d |d | |
| 10.2.5 | Tới đường sáng | Viên xanh "Đúng rồi, giữ yên máy", mũi tên ẩn |d |d | |
| 10.2.6 | Giữ yên thêm khoảng 1–2 s | Rung nhẹ, viên xanh "Đạt: người trên đường 1/3" khoảng 1 s, rồi mới tới câu của bước mắt | d| d| |
| 10.2.7 | Tới đường sáng rồi lệch ra ngay (chưa kịp giữ yên) | Không qua bước; câu quay lại "Xoay máy …" của bước này |d |d | |
| 10.2.8 | Câu, mũi tên, đường sáng có đủ rõ không; có biết lúc nào là đúng không | Ghi cảm nhận |d |d |chưa đủ rõ, nhưng lại chưa đủ ngắn gọn xúc tích, cạnh bên phải bên trái là được không cần cạnh 1/3 |

### 10.3 Bước 1: hướng người nhìn

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 10.3.1 | Người đứng giữa khung, **chỉ quay đầu** sang phải của khung (vai vẫn thẳng), rồi chọn 1/3 | Cột đích là đường 1/3 **bên trái** (chừa chỗ phía người nhìn) |l |l | vẫn còn phân tích sai và chỉ về cột bên phải |
| 10.3.2 | Như trên, quay đầu sang trái của khung | Cột đích là đường 1/3 **bên phải** |giống trên | | |
| 10.3.3 | Đang hướng dẫn, người quay đầu sang phía kia và giữ | Khoảng 2 s sau cột đích đổi sang bên kia, câu đổi theo |d |d | với trường hợp đầu quay vai ngang ở trên thì đôi lúc sẽ lỗi, nhưng có vẻ lỗi đó ở chức năng kia|
| 10.3.4 | Đang hướng dẫn, người quay đầu sang phía kia rồi quay lại ngay | Cột đích không đổi | d| d| như 10.3.3 |
| 10.3.5 | Quay cả người sang ngang (vai nghiêng) | Cột đích chừa chỗ phía người nhìn |d |d |giống như chỉ quay đầu vai thẳng, đôi lúc sẽ bị xác định sai khi người quay đầu liên tục |

### 10.4 Bước 2: mắt lên đường 1/3 trên

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 10.4.1 | Qua bước 1, mắt nằm dưới đường 1/3 trên | Đường ngang 1/3 trên sáng; "Chúc máy xuống để đưa mắt lên đường 1/3"; mũi tên từ chấm mắt **lên** tới đường |d | d| |
| 10.4.2 | Mắt nằm trên đường (người sát mép trên) | "Ngửa máy lên …"; mũi tên **xuống** |d |d | |
| 10.4.3 | Làm theo tới đích rồi giữ yên | "Đúng rồi, giữ yên máy" → "Đạt: mắt trên đường 1/3" → bước sau |d |d | |
| 10.4.4 | Đang làm bước mắt, chúc / ngửa máy làm người lệch nhẹ khỏi cột | Vẫn ở bước mắt (lệch nhẹ không làm vỡ bước cột) |d |d | |
| 10.4.5 | Đang làm bước mắt, xoay máy cho người lệch hẳn khỏi cột | Quay lại bước cột |d |d | |

### 10.5 Bước 3: không cắt ngang tay chân

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 10.5.1 | Qua bước mắt, mép dưới khung cắt ngang đầu gối | "Lùi ra để không cắt ngang tay chân", không có mũi tên |d |d | |
| 10.5.2 | Lùi ra cho thấy hết chân, giữ yên | Đạt: rung, viên xanh "Đạt Quy tắc 1/3" khoảng 3 s, hướng dẫn dừng |d |d | |
| 10.5.3 | Mép dưới khung ở thắt lưng (nửa người), không qua khớp | Không bị bắt lùi |d |d | |

### 10.6 Đạt, hướng dẫn lại, dừng

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 10.6.1 | Sau khi đạt, chạm nút Kiểm tra bố cục | Rung nhẹ, hướng dẫn chạy lại từ bước 1, nút đổi nền xanh |d |d |Đổi lại thành chia lại các bước, mỗi bước nhắc lại 3 lần. Thêm phần hiển thị để thấy Bước, mỗi bước nhắc lại 3 lần |
| 10.6.2 | Đang hướng dẫn, chạm nút xanh | Dừng, "Đã dừng hướng dẫn"; chạm lại thì hướng dẫn lại |d |d | |
| 10.6.3 | Đang hướng dẫn, đứng yên không làm theo | Mỗi khoảng 2 s thêm một chấm và rung; sau chấm thứ 5, vòng quanh nút chạy 10 s rồi dừng với "Đạt: … / Chưa đạt: …" d| d| | |
| 10.6.4 | Đang hướng dẫn, che người khoảng 1 s rồi bỏ ra | Câu không đổi (một lượt hụt bị bỏ qua) |d |d | |
| 10.6.5 | Đang hướng dẫn, hướng máy đi chỗ khác hẳn | "Hướng máy về phía người để thấy lại người" |d |d | |
| 10.6.6 | Đang hướng dẫn, bấm chụp | Chụp ngay, hướng dẫn chạy tiếp |d |d | |

### 10.7 Camera trước

Thử cả hai lựa chọn Cài đặt → Ảnh camera trước.

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 10.7.1 | Camera trước, 1/3, bạn đứng lệch khỏi giữa | Làm theo câu "Xoay máy sang …" thì bạn dịch về đường sáng; mũi tên chỉ đúng chiều bạn sẽ đi trên khung ngắm |d |d | |
| 10.7.2 | Quay đầu sang một bên | Cột đích chừa chỗ phía bạn nhìn, đúng như trên khung ngắm |d | d| trường hợp này của cam trước có vẻ tốt hơn cam sau |
| 10.7.3 | Bước mắt | Ngửa / chúc theo câu thì mắt tiến về đường | d| d| |

### 10.8 Góp ý cho 1/3

-

## 11. Lần 3 — Quy tắc 1/3 sau khi sửa lần 2

Vẫn chỉ thử Quy tắc 1/3. Chạy lại `npx expo start -c` (composition-critic lên v0.7.0).

**Đã sửa theo lần 2:**

- **10.1.1, 10.1.2** (chip "+ Bố cục phụ" che một góc ảnh; mở cả bảng Bố cục là thừa): bỏ chip trên khung ngắm. Bố cục phụ chọn ở **bảng Mở thêm** (nút ⌄ trên thanh trên), hàng mới **Bố cục phụ `[Tắt | Chân trời | Đường dẫn]`**, cạnh Đèn flash và Hẹn giờ: chỉ có bố cục phụ, bố cục chính vẫn bật. Đang bật cả chính và phụ thì nút Bố cục có huy hiệu **"+"**. Nút Bố cục vẫn chạm là tắt cả hai.
- **10.2.2, 10.2.8** (icon nên có chiều; nêu cả hai cách vì không biết người dùng xoay máy hay bảo người bước; câu chưa gọn, nói trái / phải là được):
  - viên đưa người sang ngang giờ có **hai dòng ngắn**, mỗi dòng **một mũi tên theo chiều của chính dòng đó**: "**← Xoay máy sang trái**" / "**→ Hoặc người bước sang phải**". Bên đích nằm ở dòng thứ hai và ở đường sáng, bỏ chữ "đường 1/3". "Phải / trái" của người bước là theo khung ngắm;
  - bước mắt cũng hai dòng: mắt cần lên thì "**↓ Chúc máy xuống**" / "**↓ Hoặc hạ máy xuống**"; mắt cần xuống thì "Ngửa máy lên" / "Hoặc đưa máy lên" (máy thấp xuống thì người trên khung dịch lên).
- **10.3.1, 10.3.2** (camera sau, người chỉ quay đầu mà cột vẫn sai; camera trước thì tốt hơn): có hai nguyên nhân.
  - **Người đứng xa, đầu trên ảnh nhỏ**, điểm tai / mũi của khung xương nhiễu. Giờ hướng nhìn đo bằng **lưới điểm mặt** (chóp mũi so với hai mép mặt); app vẫn dò lưới mặt trên vùng đầu phóng to nên dùng được cả khi người đứng xa. Không có mặt thì mới theo tai, rồi theo vai. Claude đo trên máy tính, 157 ảnh người đứng xa thu nhỏ còn 512 px như app: lưới mặt không lần nào ngược chiều với tai, và bắt thêm các ca quay đầu vừa mà tai bỏ sót. Mặt chỉ dò được ở chừng một nửa số ảnh xa, nên người rất xa vẫn có thể sai.
  - **Luật chốt cột:** lượt nào không đoán được hướng nhìn thì xóa số lượt đang đếm, nên hướng nhìn lúc có lúc không thì cột không bao giờ đổi. Giờ lượt đó không tính và không xóa. Lượt đầu không thấy hướng (chốt theo cột gần nhất) thì lượt đầu tiên thấy hướng là đổi theo ngay.
- **10.6.1** (chia bước, mỗi bước nhắc 3 lần, cho thấy đang ở bước nào): trên viên có ô nhỏ **"Bước 1/3"** kèm **3 chấm nhắc**. Mỗi bước nhắc tối đa 3 lần, sang bước sau thì đếm lại từ 0; sau lần nhắc thứ 3 còn 10 s rồi dừng. Bước của 1/3: ① người trên cột → ② mắt trên đường 1/3 trên → ③ không cắt tay chân (không thấy mắt thì chỉ 2 bước).

### 11.1 Bố cục phụ trong bảng Mở thêm

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 11.1.1 | Bật Quy tắc 1/3 | Khung ngắm không còn chip nào ở góc | | | |
| 11.1.2 | Chạm ⌄ trên thanh trên | Bảng thả xuống có 3 hàng: Đèn flash, Hẹn giờ, Bố cục phụ `[Tắt \| Chân trời \| Đường dẫn]`; chữ không bị cắt trên máy của bạn| d| d| |
| 11.1.3 | Chọn Chân trời | Rung nhẹ, bảng thu lên, 1/3 vẫn bật, lớp kẻ vẽ cả hai; nút Bố cục có huy hiệu "+"; hướng dẫn chạy lại |d | d| |
| 11.1.4 | Mở lại bảng, chọn Tắt ở hàng Bố cục phụ | Bỏ chân trời, 1/3 vẫn bật, huy hiệu "+" mất | d| d| |
| 11.1.5 | Chạm nút Bố cục khi đang bật 1/3 + chân trời | Tắt cả hai như trước |d |d | |
| 11.1.6 | Cách này có dễ tìm không, có cần lối khác không | Ghi cảm nhận |d |d | tạm ổn |

### 11.2 Viên hướng dẫn hai dòng (camera sau, người nhìn thẳng)

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 11.2.1 | Người hơi lệch phải, chọn 1/3 | Viên hai dòng: "← Xoay máy sang trái" / "→ Hoặc người bước sang phải"; mũi tên trắng trên khung chỉ sang phải tới đường sáng |d |d | |
| 11.2.2 | Người hơi lệch trái | "→ Xoay máy sang phải" / "← Hoặc người bước sang trái" |d |d | |
| 11.2.3 | Không xoay máy, bảo người mẫu bước theo dòng thứ hai | Người tiến về đường sáng; tới nơi thì "Đúng rồi, giữ yên máy" như khi xoay máy |d |d | |
| 11.2.4 | Bước mắt, mắt dưới đường 1/3 trên | "↓ Chúc máy xuống" / "↓ Hoặc hạ máy xuống"; mũi tên trên khung chỉ lên |d |d | |
| 11.2.5 | Hạ máy thấp xuống (không chúc) theo dòng thứ hai | Mắt tiến lên đường 1/3 | d| d| |
| 11.2.6 | Bước mắt, mắt trên đường (người sát mép trên) | "↑ Ngửa máy lên" / "↑ Hoặc đưa máy lên" |d |d | |
| 11.2.7 | Camera trước, bạn lệch khỏi đường sáng | Hai dòng đúng chiều với khung ngắm soi gương: làm theo dòng nào bạn cũng tiến về đường sáng |d |d | |
| 11.2.8 | Hai dòng, mũi tên có đủ rõ và đủ gọn không | Ghi cảm nhận | d| d| |

### 11.3 Hướng nhìn, camera sau

Thử ở hai khoảng cách: **nửa người** (khoảng 1,5–2 m) và **cả người** (khoảng 3–4 m).

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 11.3.1 | Nửa người, đứng giữa khung, **chỉ quay đầu** sang phải của khung (vai thẳng), rồi chọn 1/3 | Đường 1/3 **bên trái** sáng (chừa chỗ phía người nhìn), chậm nhất sau khoảng 1–2 s |l | l| vẫn còn lỗi, vẫn bị gợi ý cột mà người đang nhìn khi đưa cột đó gần hoặc đúng vào mặt người |
| 11.3.2 | Như trên, quay đầu sang trái của khung | Đường 1/3 **bên phải** sáng |l |l | như trên |
| 11.3.3 | Cả người, lặp lại 11.3.1 | Như 11.3.1. Ghi lại nếu sai: người rất xa có thể không dò được mặt |l |l | gần vẫn lỗi, xa chắc khó hơn |
| 11.3.4 | Cả người, lặp lại 11.3.2 | Như 11.3.2 |l |l | nhưu trên |
| 11.3.5 | Đang hướng dẫn, người quay đầu sang phía kia và giữ | Khoảng 2 s sau cột đích đổi sang bên kia |d |d | |
| 11.3.6 | Đang hướng dẫn, người quay đầu qua lại liên tục | Cột đích không đổi theo từng lần quay (lần 2, 10.3.5: đôi lúc bị xác định sai) |d |d | |

### 11.4 Bước và nhắc

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 11.4.1 | Bật 1/3, người thấy rõ mắt và chân | Trên viên có ô "Bước 1/3" và 3 chấm mờ |d |d |  |
| 11.4.2 | Đứng yên không làm theo | Mỗi khoảng 2 s sáng thêm một chấm và rung; sau chấm thứ 3, vòng quanh nút Kiểm tra bố cục chạy 10 s rồi dừng với "Chưa đạt: …" | d| d| |
| 11.4.3 | Làm xong bước 1 sau 1–2 lần nhắc | "Đạt: người trên đường 1/3", rồi ô thành "Bước 2/3", 3 chấm về mờ (đếm lại) |d |d | |
| 11.4.4 | Làm hết 3 bước | Viên xanh "Đạt Quy tắc 1/3", dừng | d|d | |
| 11.4.5 | Sau khi đạt, chạm nút Kiểm tra bố cục | Hướng dẫn chạy lại từ "Bước 1/3". Tôi hiểu mục 10.6.1 là "hiện bước + mỗi bước nhắc 3 lần"; nếu ý bạn là khác (ví dụ chạy lại từ bước đang dở), ghi ở đây |d |d | |

### 11.5 Góp ý cho 1/3

- Bỏ chấm xanh tất cả các bố cục.

- thay vì nói cột 1/3 thì nói rõ cột trái cột phải, cột trên cột dưới
- hướng dẫn chỉ 1 cột và gọn ví dụ : <- đi/xoay máy qua trái để người dứng cột phải, ngửa/nâng máy lên để mắt người trên cột trên 

## 12. Lần 4 — Quy tắc 1/3 (2026-11-25)

Vẫn chỉ thử Quy tắc 1/3. Chạy lại `npx expo start -c`. Cách chấm chạy theo con quay đã bỏ theo ý bạn; app vẫn chụp kiểm tra khoảng 1 lần / giây như lần 3.

**Đã sửa theo lần 3:**

- **11.5, bỏ chấm xanh ở mọi bố cục:** lớp kẻ không còn vòng / chấm xanh nào (1/3 có hay chưa có pose, Ở giữa, Đường dẫn, và đích sáng khi hướng dẫn). Đích của hướng dẫn chỉ còn là **đường sáng**; bước mắt của Ở giữa làm sáng đường ngang trên. Thả pose vẫn dính vào giao điểm như trước, chỉ không vẽ chấm.
- **11.5, một dòng, nói rõ cột:** viên còn **một dòng**, một mũi tên, chỉ bảo người chụp: "**← Đi/xoay máy qua trái để người đứng cột phải**", "**↓ Chúc/hạ máy xuống để mắt người trên cột trên**", "**↑ Ngửa/nâng máy lên để mắt người trên cột trên**". Camera trước chỉ nói "Xoay máy qua …" (bạn bước thì người trong khung đi theo máy). "Đạt: người đứng đúng cột", "Đạt: mắt người trên cột trên". Dòng gợi ý khi vừa chọn 1/3: "Đặt người lên cột trái hoặc cột phải".
- **11.3.1–11.3.4, cột theo hướng nhìn:** Claude chưa tái hiện được trên máy tính. Nghi nhất: người chỉ quay đầu vừa phải thì độ quay chưa tới ngưỡng "đang quay đầu" (0,15) nên app coi là nhìn thẳng và chọn **cột gần người nhất**; người đứng gần cột phía mình nhìn thì app chọn đúng cột đó. Giờ riêng việc chọn cột dùng ngưỡng thấp hơn (0,07). Nếu vẫn sai, mục 12.3.5 và 12.3.6 cho biết sai lúc nào.

### 12.1 Viên một dòng (camera sau)

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 12.1.1 | Người nhìn thẳng, đứng hơi lệch phải giữa khung, chọn 1/3 | Một dòng: "→ Đi/xoay máy qua phải để người đứng cột trái" hoặc "← Đi/xoay máy qua trái để người đứng cột phải" (theo cột sáng); mũi tên trắng trên khung chỉ tới đường sáng |d |d | |
| 12.1.2 | Làm theo bằng cách **bước** (không xoay máy) | Người tiến về đường sáng; tới nơi thì "Đúng rồi, giữ yên máy", rồi "Đạt: người đứng đúng cột" |d |d | |
| 12.1.3 | Bước mắt, mắt dưới đường ngang trên | "↓ Chúc/hạ máy xuống để mắt người trên cột trên" | d|d | |
| 12.1.4 | Bước mắt, mắt trên đường (người sát mép trên) | "↑ Ngửa/nâng máy lên để mắt người trên cột trên" |d | d| |
| 12.1.5 | Camera trước, bạn lệch khỏi đường sáng | "Xoay máy qua …" (không có "Đi/"); xoay theo thì bạn tiến về đường sáng | l| l| camera trước phải ngược lại với camera sau có nghĩa là muốn cột phải thì phải đưa máy qua trái. Vẫn có thể Đưa/Xoay máy qua trái thay cho Xoay/Đi|
| 12.1.6 | Câu có vừa một dòng trên máy bạn, có rõ không | Ghi cảm nhận |d |d | tốt |

### 12.2 Không còn chấm xanh

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 12.2.1 | Bật 1/3, chưa đặt pose | Chỉ có lưới, không có vòng xanh ở giao điểm |d |d | |
| 12.2.2 | Bật 1/3, đặt pose | Không có vòng xanh ở giao điểm gần mắt; thả pose gần giao điểm vẫn dính (rung nhẹ) |d |d | |
| 12.2.3 | Bật Ở giữa | Chỉ có trục dọc giữa, không có chấm |d |d | |
| 12.2.4 | Bật Đường dẫn | Hai nét đứt vẫn hội tụ ở giao điểm trên, không có vòng xanh ở đó |d |d | |
| 12.2.5 | Đang hướng dẫn 1/3 | Đích chỉ là đường sáng (cột, rồi đường ngang trên), không có vòng |d  |d | |

### 12.3 Hướng nhìn (camera sau)

Như lần 3: nửa người (khoảng 1,5–2 m) và cả người. "Phải / trái" theo khung ngắm.

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 12.3.1 | Nửa người, đứng giữa khung, **chỉ quay đầu** sang phải của khung, rồi chọn 1/3 | Đường **bên trái** sáng (chừa chỗ phía người nhìn) |d |d | đã tốt hơn |
| 12.3.2 | Như trên, quay đầu sang trái | Đường **bên phải** sáng |d | d| |
| 12.3.3 | Nửa người, đứng **gần cột phải**, quay đầu sang phải, rồi chọn 1/3 (ca lần 3 bị sai) | Vẫn là đường **bên trái** sáng, viên bảo đưa người sang cột trái |d |d | |
| 12.3.4 | Cả người, lặp lại 12.3.1 và 12.3.3 | Như trên; người xa có thể không dò được mặt, ghi lại nếu sai |d |d | |
| 12.3.5 | Nếu sai: **ngay khi chọn 1/3** (chưa xoay máy) đường nào sáng | Ghi "trái" / "phải" và người đang quay đầu về phía nào |d |d | |
| 12.3.6 | Nếu sai: lúc đầu đúng, rồi **trong lúc đưa người tới cột** thì cột sáng có đổi sang bên kia không | Ghi có / không, đổi lúc người còn cách cột bao xa |d |d | |

### 12.4 Góp ý cho 1/3

-

### 12.5 Claude thử thêm trên máy tính (2026-11-25)

Bạn nhờ thử thêm các ca của 1/3 trước khi qua bố cục khác. Claude không có điện thoại, nên chạy thử **logic hướng dẫn** trên ảnh thật: 2.202 ảnh một người trong bộ ảnh mẫu (đặc trưng đã phân tích sẵn, không chạy lại model). Khung ngắm là một ô cắt dọc 3:4 trên ảnh; người đặt ở 5 chỗ ngang khung (0,2 … 0,8); mỗi giây app "chụp", đo, ra câu; một người chụp ảo làm theo câu bằng cách dời ô cắt (xoay / đi ngang, ngửa / chúc) hoặc phóng ô cắt (lùi ra). Chạy cả camera sau và camera trước (khung soi gương). Mỗi kiểu người chụp khoảng 18.500 lần chạy. Các lần ô cắt chạm mép ảnh gốc (ảnh không đủ rộng để đi tiếp) không tính.

| Người chụp ảo | Kết quả |
|---|---|
| Làm theo, tay yên (mỗi giây dời 3% khung) | Mọi lần chạy đều tới "Đạt 1/3" (trừ 2 lần trên một ảnh lạ: người nằm chéo chiếm cả bề ngang, không có mặt). Trung vị 5 s, 90% dưới 15 s. Không lần nào câu đổi chiều giữa chừng, không lần nào đổi cột. Camera trước và sau như nhau. |
| Làm theo, rung tay (±1,2% khung mỗi giây) | Như trên; không đổi chiều, không đổi cột, không qua bước sai |
| Làm theo nhanh, dễ quá tay (9% khung mỗi giây) | Tới Đạt nhanh hơn (trung vị 4 s); không lần nào câu đảo qua lại |
| Đứng yên | Ca đã đúng sẵn thì Đạt ngay; còn lại tự dừng sau 17 s (3 lần nhắc + 10 s), báo phần đã đạt |
| Làm ngược | Nhắc, rồi tự dừng sau chừng 17 s. **Thấy lỗi:** khi người ra tới mép khung, mắt ra ngoài, app lấy giữa khung người (đã bị mép cắt, nằm lệch vào trong) làm chỗ đứng, nên câu đổi sang chiều ngược lại. **Đã sửa:** không thấy mắt thì lấy mũi, rồi giữa hai vai; khung người chạm một mép mà không thấy đầu thì coi như người ở mép đó. Còn chừng 1,6% lần chạy đảo chiều, ở ảnh người to hơn cả khung (chạm cả hai mép) khi đã bị đẩy ra sát mép; chỉ gặp khi làm ngược, nên để lại. |

**Chưa thử được trên máy tính:** hướng nhìn thật trên điện thoại (bộ ảnh mẫu không có câu trả lời đúng về hướng nhìn; lần 4 bạn đã thử đạt), ảnh nhiều người (người chính có thể đổi giữa hai lần chụp), độ trễ và nóng máy.

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 12.5.1 | Camera trước, bạn lệch khỏi đường sáng (thử lại 12.1.5) | "Đưa/xoay máy qua trái để người đứng cột phải" khi cần sang cột phải (và ngược lại); đưa máy theo câu thì bạn tiến về đường sáng |d |d | sửa là xoay máy thôi, đưa máy thì bị đổi background |
| 12.5.2 | Camera sau, xoay quá tay cho người ra sát mép khung (mặt ra ngoài một nửa) | Câu vẫn bảo đưa người về phía trong, không đổi sang chiều ngược lại |d |d | |

## 13. Lần 5 — Ở giữa (2026-11-25)

Chỉ thử **Ở giữa**. Bố cục phụ (Đường chân trời, Đường dẫn) đã bỏ hẳn (2026-11-26): bảng Bố cục còn một danh sách, bảng Mở thêm còn Đèn flash và Hẹn giờ. Chạy lại `npx expo start -c`. Bước: ① máy thẳng → ② người trên trục giữa → ③ mắt trên đường ngang trên. Chỗ ngang của người là trung bình giữa hai mắt và giữa thân, giống nhận xét sau khi chụp.

**Kết quả 1/3 lần 4 (12.5):** đạt cả hai dòng. Theo ghi chú 12.5.1, camera trước giờ chỉ nói "**Xoay máy qua …**" (đưa máy thì nền sau lưng đổi).

**Claude chạy thử Ở giữa trên máy tính trước** (cùng cách mục 12.5, thêm máy nghiêng ngẫu nhiên tới ±8°; mỗi kiểu người chụp khoảng 18.500 lần, camera sau và trước):

| Người chụp ảo | Kết quả |
|---|---|
| Làm theo, tay yên | Mọi lần chạy tới "Đạt" (trung vị 7 s, 90% dưới 12 s); không lần nào câu đổi chiều |
| Làm theo, rung tay | Như trên (trung vị 7–8 s) |
| Làm theo nhanh, quá tay | Trung vị 5 s. Ở bước máy thẳng, xoay quá tay thì câu bảo xoay lại chiều kia, đúng |
| Đứng yên | Tự dừng sau chừng 18 s |
| Làm ngược | Nhắc rồi tự dừng; sau khi sửa không còn lần nào báo Đạt khi mặt đã ra khỏi khung (trước khi sửa: khoảng 500 lần) |

**Đã sửa sau khi chạy thử** (dùng chung cho 1/3):

- **Người ra sát mép trái / phải:** giữa khung người lúc đó bị mép cắt nên lệch vào trong; trung bình với mắt làm app tưởng người đã ở giữa. Giờ khung người bị mép cắt thì app theo mắt. Kể cả người làm theo đúng: số lần báo Đạt khi mặt còn lệch giữa hơn 0,15 khung giảm từ 230 xuống 67 (67 lần còn lại xem 13.2.4).
- **Mắt ra khỏi mép trên** (ngửa / chúc quá tay): bước mắt biến mất nên app báo Đạt. Giờ bước mắt vẫn còn và bảo "Ngửa/nâng máy lên …". Người quay lưng (không thấy mắt nhưng đầu còn trong khung) thì vẫn bỏ bước mắt như trước.
- **Người to hơn khung, đầu đã ra ngoài:** app không biết người ở đâu, trước báo Đạt; giờ bảo "**Lùi ra …**".

### 13.1 Các bước (camera sau)

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 13.1.1 | Chọn Ở giữa, cầm máy nghiêng chừng 10° | "Bước 1/3"; "Xoay máy theo chiều kim đồng hồ cho máy thẳng" (hoặc ngược chiều); xoay thẳng thì "Đạt: máy thẳng" rồi sang bước sau |d |d | nghiêng trái hoặc nghiêng phải cho dễ hiểu |
| 13.1.2 | Người đứng lệch trái khung | Đường dọc giữa sáng; "← Đi/xoay máy qua trái để người đứng giữa"; làm theo thì người tiến về đường sáng |d |d | |
| 13.1.3 | Người đứng lệch phải khung | "→ Đi/xoay máy qua phải để người đứng giữa" | d| d| |
| 13.1.4 | Mắt người thấp hơn đường ngang trên | Đường ngang trên sáng; "↓ Chúc/hạ máy xuống để mắt người trên cột trên" |l |l | chưa nhạy, vừa thông báo chưa kịp di chuyển thì tự báo đạt |
| 13.1.5 | Mắt người cao hơn đường ngang trên | "↑ Ngửa/nâng máy lên để mắt người trên cột trên" |l |l | như trên |
| 13.1.6 | Làm theo hết các bước | Viên "Đạt"; chụp, nhận xét sau khi chụp nói người ở đúng trục giữa |d |d | |

### 13.2 Ca khó (sau khi chạy thử)

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 13.2.1 | Đang ở bước mắt, chúc máy quá tay cho mặt ra khỏi mép trên | Câu vẫn "↑ Ngửa/nâng máy lên …", **không** báo Đạt | | | |
| 13.2.2 | Người đứng sát mép, nửa thân ra ngoài khung, mặt vẫn thấy | Câu đưa người vào giữa theo mặt; không báo Đạt khi mặt còn lệch rõ | | | |
| 13.2.3 | Đứng rất gần, người to hơn khung, quay cho mặt ra ngoài | "Lùi ra để đưa người vào giữa" | | | |
| 13.2.4 | Người dang một tay sang bên (hoặc cầm vật to một bên), thân ở giữa | App lấy trung bình mặt và thân nên có thể Đạt khi mặt lệch giữa một chút. Bạn thấy ảnh như vậy có còn là "ở giữa" không? Ghi ý ở cột Ghi chú | | | |
| 13.2.5 | Ở bước máy thẳng, xoay nhanh qua lại | Câu đổi chiều theo máy, không kẹt, thẳng thì qua bước | | | |
| 13.2.6 | Người quay lưng | Không có bước mắt; chỉ máy thẳng và trục giữa | | | |

### 13.3 Camera trước

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 13.3.1 | Camera trước, bạn lệch trái / phải khung | "Xoay máy qua trái để người đứng giữa" khi cần sang phải (và ngược lại), cùng chiều camera sau; xoay theo thì bạn tiến về đường sáng | | | |
| 13.3.2 | Camera trước, mắt lệch đường ngang trên | Câu ngửa / chúc đúng chiều | | | |

### 13.4 Góp ý cho Ở giữa

- Vãn còn quá lỗi với ảnh tôi test, đã gửi kèm, không tính được ở giữa như thế nào khi người không dối xứng, nền bị gợi ý xoay trái xoay phải liên tục mà không tìm được điểm đạt.

## 14. Lần 6 — Ở giữa sau khi sửa (2026-11-26)

Chỉ thử **Ở giữa**. Chạy lại `npx expo start -c` (app dùng composition-critic v0.8.0 nên cần cài lại gói: `npm install` trước). Các dòng 13.2, 13.3 lần trước còn trống: gộp vào dưới đây.

**Đã sửa theo lần 5:**

- **13.4, trục giữa nhảy trái / phải với người không đối xứng:** Claude chạy model thật (cùng trang MediaPipe với app, ảnh 512 px như lượt chụp lặng) trên 28 khung cắt dọc 3:4 của ảnh bạn gửi. Thấy hai nguyên nhân: mặt nghiêng nên bộ dò mặt lúc thấy lúc không (có khung còn bắt nhầm "mắt" ở bàn tay cuối khung), và khi không thấy mặt, tóc / váy chạm mép khung làm app tưởng người đang ra khỏi khung, độ lệch nhảy từ 0,16 lên 0,5. Giờ chỗ người tính theo **trọng tâm phần trên vùng người** (đầu, vai, ngực, lấy từ mặt nạ tách người), không cần thấy mặt. Trên 28 khung đó độ lệch giảm đều khi dời máy (0,19 → 0,17 → … → 0,01) và thấp nhất đúng lúc mặt ở giữa. Nhận xét sau khi chụp dùng cùng cách tính.
- **13.1.4–13.1.5, bước mắt tự Đạt khi chưa kịp làm:** hai nguyên nhân. Mắt lúc thấy lúc không thì bước mắt biến mất, app coi như xong: giờ bước đang làm giữ kết quả cũ. Mắt nằm sát ngưỡng thì rung tay một lượt đã lọt: giờ phải vào sâu trong ngưỡng (0,7) mới tính là đúng, còn ở mép ngưỡng thì vẫn nói thao tác. Áp dụng cho mọi bố cục (cả 1/3), trừ máy thẳng.
- **13.1.1:** "Nghiêng máy sang trái cho máy thẳng" / "Nghiêng máy sang phải cho máy thẳng" thay cho chiều kim đồng hồ.

**Chạy thử trên máy tính sau khi sửa** (cùng cách mục 12.5, 2.202 ảnh, camera sau và trước): người chụp ảo làm theo (tay yên, rung tay, quá tay) tới Đạt ở mọi lần chạy cả 1/3 lẫn Ở giữa, không lần nào câu đổi chiều hay đổi cột; Ở giữa trung vị 6 s, 1/3 trung vị 7–8 s (lâu hơn trước 2–3 s vì phải vào sâu trong ngưỡng). Bộ ảnh này chưa có mặt nạ người nên phần trọng tâm chỉ thử được trên ảnh bạn gửi.

### 14.1 Các bước (camera sau)

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 14.1.1 | Chọn Ở giữa, cầm máy nghiêng chừng 10° | "Nghiêng máy sang trái / phải cho máy thẳng" đúng chiều; thẳng thì "Đạt: máy thẳng" | d| d| |
| 14.1.2 | Thử lại với ảnh bạn gửi lần 5 (người giơ tay, mặt nghiêng) | Câu chỉ một chiều, dời theo thì tới "Đạt", không đổi trái / phải liên tục |d |d | |
| 14.1.3 | Người giơ tay một bên hoặc váy / tóc xoè một bên, người thật | Như trên; lúc Đạt thì đầu và thân trông ở giữa |d |d| |
| 14.1.4 | Mắt người thấp hơn đường ngang trên rõ | "↓ Chúc/hạ máy xuống …"; **không** tự Đạt khi chưa di chuyển; đưa mắt tới đường sáng thì Đạt |d |d | |
| 14.1.5 | Mắt người cao hơn đường ngang trên rõ | "↑ Ngửa/nâng máy lên …", như trên |d |d | |
| 14.1.6 | Mắt người chỉ lệch đường sáng một chút | Vẫn nói thao tác tới khi mắt nằm gần hẳn đường sáng |d |d | |
| 14.1.7 | Người quay mặt nghiêng (thấy một bên mặt) | Bước mắt không tự biến mất rồi báo Đạt |d |d | |

### 14.2 Ca khó (lần 5 còn trống)

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 14.2.1 | Đang ở bước mắt, chúc máy quá tay cho mặt ra khỏi mép trên | Câu vẫn "↑ Ngửa/nâng máy lên …", không báo Đạt |d |d | |
| 14.2.2 | Người đứng sát mép, nửa thân ra ngoài khung | Câu đưa người vào giữa đúng chiều |d | d| |
| 14.2.3 | Đứng rất gần, người to hơn khung | Lúc Đạt thì đầu ở giữa khung |d |d | |
| 14.2.4 | Người quay lưng | Không có bước mắt; chỉ máy thẳng và trục giữa |l |l | không bắt được mắt người chính xác, ca khó nếu không thấy mắt căn nhắc lấy đầu hoặc nghiên cứu tìm cách giải quyết |

### 14.3 Camera trước

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 14.3.1 | Camera trước, bạn lệch trái / phải khung | "Xoay máy qua … để người đứng giữa", cùng chiều camera sau; xoay theo thì bạn tiến về đường sáng |d |d | |
| 14.3.2 | Camera trước, mắt lệch đường ngang trên | Câu ngửa / chúc đúng chiều, không tự Đạt |d |d | việc chụp theo hướng dẫn này sẽ luôn luôn ra ảnh người lấy vai  như chụp chân dung và gần gần giống lắp đầy khung ( nó có đang đúng với mục đích của bố cục ở giữa khi sử dụng cam trước chưa) |

### 14.4 Góp ý cho Ở giữa

- Hãy để chấm đích màu đỏ cho nổi bật dễ thấy 

## 15. Lần 7 — Ở giữa: người quay lưng, chấm đích đỏ (2026-11-26)

Cài lại gói rồi chạy (`npm install`, `npx expo start -c`): app dùng composition-critic v0.9.0.

**Cập nhật sau ảnh thác nước bạn gửi** (người quay lưng, dang tay): Claude chạy model thật trên 238 khung cắt của ảnh (34 vị trí ngang × 7 vị trí dọc). Trục giữa tốt: lệch giảm đều, bằng 0 đúng lúc người ở giữa. Nhưng cách đoán mắt từ tai **không ổn** với người quay lưng: khoảng 60% khung không có tai / mắt, phần còn lại khung xương nhìn từ sau lưng lấy nhầm **bàn tay** dang ra làm tai / mắt (mắt đoán ở 0,8 khung, đầu thật ở 0,4), câu ngửa / chúc đổi qua lại. Đã đổi sang **lấy đầu trên mặt nạ người** (đỉnh đầu + 0,62 bề ngang đầu; đo trên 364 khung ảnh một người có mặt: lệch mắt thật trung vị 0,019, 80% dưới 0,061 khung). Mắt / tai của khung xương chỉ dùng khi nằm gần mốc đầu (cao hơn tới 0,12, thấp hơn tới 0,05). Bộ dò mặt thấy mặt thì vẫn dùng mắt như trước. Trên ảnh thác nước: độ cao mắt đoán gần như không đổi khi dời ngang và khớp đầu thật (0,40 / 0,32 / 0,24 / 0,16 so với 0,42 / 0,33 / 0,25 / 0,17); người chụp ảo làm theo tới Đạt 177 / 182 lần, không lần nào đổi chiều (5 lần còn lại xuất phát ở mép ảnh, người gần như ra khỏi khung). Ca còn yếu: mặt nghiêng, tóc xoã dày, bộ dò mặt hụt và khung xương không có: mốc đầu đoán thấp hơn mắt chừng 0,1 (ảnh lần 5).

**Đã sửa theo lần 6:**

- **14.2.4, người quay lưng (bản đầu, đã thay, xem trên):** không thấy mắt thì app **đoán độ cao mắt từ tai** (khung xương vẫn thấy tai khi người quay lưng). Claude đo trên 2.436 ảnh thấy cả mắt lẫn hai tai: tai thấp hơn mắt trung vị 0,009 chiều cao ảnh; trừ đi thì 90% ảnh lệch dưới 0,027, nhỏ hơn nhiều so với ngưỡng bước mắt 0,07. Thử đoán từ vai thì lệch tới 0,086 nên không dùng. Không thấy cả tai thì vẫn bỏ bước mắt. Bộ ảnh mẫu gần như không có người quay lưng (35 ảnh không thấy mắt), nên chưa đo được trên ảnh quay lưng thật: cần bạn thử.
- **14.4, chấm đích đỏ:** chấm tròn đỏ viền trắng trên đường sáng, đúng chỗ người / mắt cần tới (đầu mũi tên).
- **14.3.2, camera trước ra ảnh vai trở lên:** xem trả lời trong tin nhắn; app không đổi.

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 15.1 | Người quay lưng, đầu thấp hơn đường ngang trên | Có bước mắt: "↓ Chúc/hạ máy xuống …"; làm theo thì đỉnh tai tới gần đường sáng rồi Đạt |d |d | |
| 15.2 | Người quay lưng, đầu cao hơn đường ngang trên | "↑ Ngửa/nâng máy lên …", như trên |d |d | |
| 15.3 | Người quay nghiêng / quay lưng xoay qua lại | Bước mắt không nhảy, không tự Đạt |d |d | |
| 15.3b | Người quay lưng dang hai tay (như ảnh thác nước) | Câu ngửa / chúc theo đầu, không theo tay; không đổi chiều qua lại |d |d | |
| 15.3c | Người mặt nghiêng, tóc xoã dày, giơ tay sát đầu (như ảnh lần 5) | Bước mắt không nhảy; ghi lại nếu Đạt khi mắt còn lệch đường sáng rõ |d |d | |
| 15.4 | Chấm đích đỏ khi đưa người vào trục giữa | Chấm đỏ nằm trên đường dọc sáng, ngang chỗ người; mũi tên trắng chỉ tới chấm |d |d | |
| 15.5 | Chấm đích đỏ ở bước mắt | Chấm đỏ trên đường ngang sáng, thẳng chỗ mắt |d |d | |
| 15.6 | Chấm đích đỏ ở 1/3 | Như trên, ở cột trái / phải và đường ngang trên |d |d | |

### 15.7 Góp ý
- Có lẻ chụp ở giữa chỉ cần máy thẳng và trục giữa chia đôi đúng khung người để cho bức ảnh cân bằng 2 bên là được, còn mắt ở đâu còn tùy thuộc vào người dùng muốn lấy bao nhiêu background ở phía sau, vì có những ảnh (kể cả 1/3) đầu người có thể nằm dưới lưới trên ( không quá xa), và trường hợp khác nữa là người ngồi thì đầu có thể nằm xung quanh lưới dưới. Vì vậy đúng những tiêu chí quan trọng là được. Suy nghĩ về vấn đè này, đọc lại các tài liệu vè chụp ảnh, vì nó liên quan gần như nhiều bố cục và các thẻ học
- Chấm và mũi tên luôn nhảy không đều và không đúng. Tôi biết đây là hạn chế của việc phải chụp ảnh liên tục để xét và làm điểm đích - mũi tên -> nhưng nó cũng tạo ra cảm giác app rất dở, không thật sự làm được tính năng này cần nghĩ ra cách để hướng dẫn tốt, mượt mà hơn, có thể xử lí ở fe càng tốt vì nó sẽ realtime và người dùng dễ canh chỉnh hơn
