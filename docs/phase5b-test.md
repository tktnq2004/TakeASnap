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

## 16. Lần 8 — Dải đích đứng yên, dấu chiều, chỉ kiểm tra khi máy yên (2026-11-26)

Chạy lại `npx expo start -c` (**chưa commit**, thử trên bản đang có ở máy tính).

**Đổi gì:**

- **Bỏ bước mắt ở mọi bố cục** (đã commit `8679e05`): 1/3 chỉ còn cột trái / phải + không cắt khớp; Ở giữa chỉ còn máy thẳng + trục giữa.
- **Đích (cách C):** đường đích đỏ và **dải đỏ mờ** đúng bằng vùng đạt, đứng yên, kèm **ba dấu ‹‹ / ››** cố định trên đường (trên, giữa, dưới khung) cùng chiều câu "xoay máy qua …". **Không còn** khung người, chấm mắt, chấm đỏ, mũi tên: không có gì vẽ theo vị trí người nên không có gì nhảy. Bạn nhìn khung ngắm và dời máy cho người vào dải; vào dải là đủ. Đang đúng chờ xác nhận: dải và đường đổi màu nhấn (xanh dương của app), hết dấu chiều.
- **Chỉ chụp kiểm tra khi máy yên:** con quay cho biết máy đang dời hay yên; máy yên 0,4 s mới chụp (dời mãi thì 2,5 s vẫn kiểm tra một lần). Câu và dấu chiều chỉ đổi sau mỗi lần kiểm tra.

### 16.1 Ở giữa

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 16.1.1 | Chọn Ở giữa, cầm máy nghiêng | "Nghiêng máy sang trái / phải cho máy thẳng"; thẳng thì sang bước trục giữa (không có bước mắt) |d |d | |
| 16.1.2 | Người lệch trái khung | Đường đỏ giữa khung + dải đỏ mờ, ba dấu ‹‹; câu "← Đi/xoay máy qua trái …" |d |d | |
| 16.1.3 | Xoay máy từ từ, không dừng | Dải, dấu không nhảy; người trôi về dải ngay trên khung ngắm |d |d | di chuyển máy tầm 0.5s cam sẽ giật 1 cái , có phải là do chụp ảnh ? nó mang lại trải nghiệm kém |
| 16.1.4 | Xoay quá tay, người sang phía bên kia dải rồi dừng | Khoảng 1 s sau dấu đổi thành ›› và câu đổi chiều |d |d | |
| 16.1.5 | Người vào dải, giữ yên | Dải đổi màu nhấn, "Đúng rồi, giữ yên máy", rồi "Đạt" |d |d | |
| 16.1.6 | Đi ngang (bước chân) thay vì xoay | Vẫn tới Đạt | d|d | |
| 16.1.7 | Người đứng / ngồi, đầu cao thấp khác nhau | Không có câu nào về mắt; chỉ cần người vào dải giữa |d | d| |

### 16.2 Quy tắc 1/3 (thử lại với cách mới)

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 16.2.1 | Chọn 1/3, người nhìn thẳng, đứng hơi lệch phải giữa khung | Dải đỏ ở cột gần người (cột phải), ba dấu theo chiều câu; câu "→ Đi/xoay máy qua phải để người đứng cột …" hoặc ngược lại đúng chiều |d |d |  |
| 16.2.2 | Người quay đầu nhìn sang trái / phải | Dải ở cột phía còn chỗ trước mặt người (nhìn sang phải → cột trái) |l |l |khi người đứng ngang (vai đối diện với cam) app lại bị xác định mắt sai và gợi ý cột mắt đang nhìn |
| 16.2.3 | Xoay máy cho người vào dải | Dải đổi màu nhấn, "Đúng rồi, giữ yên máy", "Đạt: người đứng đúng cột" | d| d| |
| 16.2.4 | Sau khi đạt cột, mép dưới khung cắt ngang gối | Bước "Lùi ra để không cắt ngang tay chân"; không có bước mắt | — | — | Claude thử trên máy tính: mô phỏng 1/3 trên 2202 ảnh một người, người chụp ảo làm theo; sau bước cột chỉ còn bước không cắt khớp (745 lần chạy dừng ở bước này vì khung chạm mép ảnh gốc), không có bước mắt |
| 16.2.5 | Người ngồi, đầu thấp gần đường dưới | Vẫn Đạt khi người ở cột; không bảo ngửa / chúc máy | — | — | Claude đọc code: 1/3 chỉ còn cột + không cắt khớp, không tiêu chí nào nói ngửa / chúc máy |
| 16.2.6 | Camera trước, bạn lệch cột | "Xoay máy qua … để người đứng cột …", dải và dấu cùng chiều câu | — | — | Claude thử trên máy tính: mô phỏng camera trước 9251 lần chạy làm theo, 8080 Đạt, 0 lần đổi chiều câu giữa chừng (còn lại khung chạm mép ảnh gốc) |
| 16.2.7 | Xoay qua lại quanh dải | Dải không đổi cột, dấu chỉ đổi chiều khi người sang hẳn phía kia | — | — | Claude thử trên máy tính: mô phỏng 0 lần đổi cột giữa chừng. Nhưng ảnh của mô phỏng đứng yên nên không có độ quay đầu lắc qua lại như ngoài đời; xem 16.2.2 và góp ý vòng lặp ở 16.4 |

### 16.3 Chung

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 16.3.1 | Đặt máy xuống / không làm theo | App vẫn nhắc và tự dừng sau chừng 17 s |d |d | |
| 16.3.2 | Bấm chụp lúc đang hướng dẫn | Chụp ngay, hướng dẫn chạy tiếp |d |d | |
| 16.3.3 | So với lần 7 (chấm đỏ, mũi tên) | Dễ canh hơn hay không, máy đỡ nóng không (ghi ở Ghi chú) |d |d | |

### 16.4 Góp ý

- thông báo khi không tìm thấy người : Không tìm thấy người 
- bỏ hiệu ứng ảnh nhảy xuống album vì nó gây cản trở cho chức năng này 
- chỉ cần 1 mũi tên đủ đẹp, đủ nổi bật và đủ để chỉ dẫn 
- ở giữa tạm ổn nhwung cần bạn tự test lại 1 lần nữa với đầy đủ ảnh dễ đến những ảnh khó 

-> 1/3 đang quá sai vì khong nhận ra được hướng mắt người nửa. đang gợi ý cột mà người đang nhìn vào kể cả vai ngang hay vai dọc. Có ảnh còn bị vòng lặp gợi ý cột trái - phải liên tục khi máy đứng im

### 16.5 Trả lời góp ý lần 8

- **16.2.2, vòng lặp cột (1/3 chọn cột người đang nhìn vào):** Claude chạy model thật trên máy tính. Ở ảnh người to, lưới mặt đoán đúng chiều quay đầu (60 ảnh xem bằng mắt; 525 lượt cắt 512 px: 487 khớp, 3 lật). Ở ảnh 512 px, người càng nhỏ thì càng mất mặt: người cao 0,3 khung chỉ thấy mặt 32/80, một nửa số lượt không đoán được hướng nhìn. Không đoán được thì app lấy **cột gần người nhất**, mà người đứng lệch về phía mình nhìn thì đó chính là cột họ đang nhìn vào. Vòng lặp trái phải khi máy đứng im: người nhìn gần thẳng thì độ quay lắc quanh ngưỡng 0,07, hai lượt ngược chiều là đổi cột. Sửa:
  - Ảnh nhỏ không thấy mặt: cắt vùng đầu từ **ảnh cỡ thật** (vẫn trong bộ nhớ) rồi dò mặt lại. Trên máy tính (ảnh mẫu chỉ khoảng 1024 px nên còn thấp hơn điện thoại): người cao 0,4 khung đúng 52 → 61/80, 0,3 khung 34 → 40/80, không tăng lượt lật.
  - Đã chốt cột theo hướng nhìn thì chỉ đổi khi quay đầu rõ (độ quay từ 0,2), hai lượt.
- **16.1.3, camera giật khi dời máy:** đúng là do chụp kiểm tra (chụp ảnh làm khung ngắm khựng một nhịp; lúc máy yên thì không thấy). Giờ xoay chậm chừng 5°/s vẫn tính là đang dời (trước 8,6°/s), và chỉ ép kiểm tra khi dời liền 5 s (trước 2,5 s).
- **Không tìm thấy người:** mất người hai lượt liền thì viên chỉ hiện "Không tìm thấy người"; cảnh không có người lúc bắt đầu cũng báo câu này.
- **Bỏ ảnh bay xuống album:** bỏ hẳn; ô ảnh vừa chụp hiện ảnh mới khi lưu xong.
- **Một mũi tên:** thay ba dấu ‹‹ bằng một mũi tên to giữa đường đích (nền tròn đỏ viền trắng, nhích nhẹ tới lui theo chiều cần dời máy).
- **Ở giữa, tự thử lại:** mô phỏng trên 2202 ảnh một người (người chụp ảo làm theo, tay yên / rung tay / làm nhanh): khoảng 97% tới Đạt (còn lại khung chạm mép ảnh gốc, giới hạn của mô phỏng), 0 lần đổi chiều câu giữa chừng, 2–3 lần Đạt sai trên 9251 lần chạy (người sát mép dưới, đầu ra ngoài khung). Hai ảnh bạn gửi (thác nước, ảnh 2): 178 Đạt, 4 tự dừng, 0 lần đổi chiều.

## 17. Lần 9 — Hướng nhìn người đứng xa, một mũi tên, bớt giật (2026-11-26)

Chạy lại `npx expo start -c` (**chưa commit**). Phần 1/3 ghi thêm: người đứng **toàn thân / nửa người**, **cách máy bao xa**, quay đầu sang **phía nào của khung**, và **dải ở cột nào** (trái / phải).

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 17.1 | Ở giữa, người lệch một bên | **Một mũi tên** to giữa đường đỏ (nền đỏ viền trắng, nhích tới lui) cùng chiều câu; không còn ba dấu ‹‹ | d| d| không cần hiệu ứng, và nhìn nó rất nhựa và giả, thiếu chuyên nghiệp, vẽ khoảng 10 cách để tôi chọn  |
| 17.2 | Xoay máy chậm, đều, không dừng | Khung ngắm không giật; câu, mũi tên giữ nguyên tới khi dừng tay |l |l | vẫn còn khựng và giật |
| 17.3 | Dừng tay | Khoảng 0,4 s sau mới kiểm tra (có thể thấy khung khựng nhẹ lúc này) | d| d| |
| 17.4 | Người ra khỏi khung khi đang hướng dẫn | Khoảng 2 s sau viên "Không tìm thấy người"; người vào lại thì tiếp bước cũ | d| d| |
| 17.5 | Chọn bố cục khi khung không có ai | Viên "Không tìm thấy người" rồi dừng |d |d | |
| 17.6 | Bấm chụp vài ảnh | Chớp màn; ô ảnh vừa chụp đổi sang ảnh mới, **không có ảnh bay** từ khung ngắm xuống |d |d | |
| 17.7 | 1/3, người **nửa người** gần máy, quay đầu sang phải của khung | Dải ở **cột trái** |l |l | |
| 17.8 | 1/3, người **toàn thân** cách 3–4 m, quay đầu sang phải của khung | Dải ở **cột trái** (trước đây hay ra cột phải) |l |l |vẫn còn lỗi, và toi đã gửi ảnh trường hợp tôi test lỗi, hãy thử áp dụng 1/3 lên 2 ảnh đó, thử đi thử lại, sẽ có lỗi cột đứng yên nhưng chỉ đưa máy qua trái xong đưa máy qua phải liên tục |
| 17.9 | Như 17.8, quay đầu sang trái của khung | Dải ở **cột phải** |l |l | |
| 17.10 | Người đứng nghiêng hẳn (vai hướng về máy), mặt nhìn sang một bên | Dải ở cột phía sau lưng người (chừa chỗ phía người nhìn) |l |l | tôi đã gủi ảnh để test ra lỗi |
| 17.11 | Người nhìn gần thẳng, máy đứng im 10 s | Dải **không đổi cột** qua lại | | | ở trên lỗi lớn, ở đây không test |
| 17.12 | Đang hướng dẫn, người quay đầu hẳn sang phía kia và giữ | Khoảng 2–3 s sau dải đổi cột | | |ở trên lỗi lớn, ở đây không test |
| 17.13 | So với lần 8: máy nóng, độ trễ câu ở 1/3 (có thể chậm hơn chút khi người đứng xa) | Ghi ở Ghi chú | | | ở trên lỗi lớn, ở đây không test|

### 17.14 Góp ý

- (ghi trong cột Ghi chú)

### 17.15 Trả lời góp ý lần 9

- **17.7–17.10, câu "qua trái" rồi "qua phải" liên tục khi máy đứng yên:** Claude chạy model thật trên hai ảnh bạn gửi (ảnh núi: 42 + 40 khung 3:4, ảnh hoa anh đào: 28 + 44 khung), người chụp ảo làm theo câu từ mọi chỗ bắt đầu. Đã tái hiện đúng lỗi. Ảnh núi, khung cao 0,9: 6 lần chạy đổi chiều liên tục, mỗi lần 14–17 lượt qua lại. Có ba nguyên nhân:
  1. **Khung xương bắt nhầm cảnh:** MediaPipe Pose đặt "mắt" lên đỉnh núi / mái nhà (x = 0,42 trong khi người ở 0,70–1,00). Lượt đó app tưởng người ở 0,42 nên bảo qua trái; lượt sau thấy đúng thì bảo qua phải. Điểm sai này cũng cho hướng nhìn sai, nên có lượt chọn cột trái. Sửa ở composition-critic: chỉ nhận khung xương có mắt / mũi nằm trong vùng một người, không thì thử khung xương khác hoặc bỏ.
  2. **Đổi cách đo giữa các lượt:** lượt thấy mắt thì đo theo mắt; lượt không thấy (mũ che, mặt nghiêng) thì coi như người ở mép khung. Hai cách lệch nhau nhiều nên câu đổi chiều. Sửa: 1/3 đo chỗ người bằng **trọng tâm phần trên vùng người** (như Ở giữa, đã ổn từ lần 6), có ở mọi lượt.
  3. **Một lượt đoán sai hướng nhìn là chốt cột sai:** giờ cột theo **phiếu** của nhiều lượt (quay đầu rõ 2 phiếu, quay nhẹ 1 phiếu, tối đa ±3). Một lượt sai không đổi cột; quay đầu hẳn sang phía kia 2 lượt thì đổi.
  - Sau sửa: ảnh núi H 0,9: 0 lần đổi chiều, 35/42 tới Đạt (còn lại dừng ở bước "lùi ra không cắt khớp" vì mô phỏng không lùi được); H 0,75: 40/40 Đạt; ảnh hoa anh đào H 0,5: 40 Đạt + 4 bước lùi ra, 0 đổi chiều; H 0,65: 4 lần đổi chiều **một lần** (lượt đầu chưa thấy hướng nhìn nên lấy cột gần, lượt sau thấy thì đổi sang cột đúng). Cả hai ảnh đều về **cột phải** (người nhìn sang trái), đúng.
  - Lưới mặt (độ quay đầu) không thấy mặt ở cả hai ảnh (vành mũ, mặt nghiêng hẳn); hướng nhìn lấy từ khung xương (mũi so với tai) và đúng.
- **17.2, vẫn khựng khi xoay:** sau lúc chụp kiểm tra, model còn chạy khoảng 1 s; bạn bắt đầu dời máy trong lúc đó thì khung ngắm giật. Giờ: máy dời từ lúc chụp thì bỏ lượt, không chạy model; phải yên 0,6 s mới chụp (trước 0,4 s). Lúc chụp vẫn có thể khựng một nhịp; Expo Go không cho lấy khung hình mà không chụp ảnh.
- **17.1, mũi tên:** bỏ hiệu ứng nhích. Trang so sánh 10 kiểu mũi tên (tĩnh) để bạn chọn: https://claude.ai/artifact/NqKKaENMLeJJDLUBdJtoin
- **Mô phỏng 1/3 trên ảnh mẫu với cách đo mới** (chạy lại model cho 1202 ảnh một người có trọng tâm vùng người): 0 lần đổi chiều câu và 0 lần đổi cột ở cả năm kiểu người chụp ảo (làm theo tay yên, rung tay, làm nhanh, đứng yên, làm ngược), camera sau và trước. Làm theo tay yên: 4457/5101 Đạt, còn lại khung chạm mép ảnh gốc hoặc dừng ở bước lùi ra.
- **Ở giữa sau bản sửa khung xương:** vẫn 0 lần đổi chiều. Số lần Đạt sai tăng từ 2–3 lên chừng 40 trên 9258 lần chạy, tất cả cùng một kiểu: người to hơn khung (vùng người phủ kín khung), đầu đã ra ngoài khung mà vẫn báo Đạt. Mô phỏng chỉ ước lượng trọng tâm nên có thể phóng đại; ngoài đời gặp khi đứng quá gần. Chưa sửa, ghi lại để xem ở lần sau.
- **Chưa thử được trên máy tính:** độ giật thật trên điện thoại.

## 18. Lần 10 — 1/3 hết đổi chiều, cột theo phiếu (2026-11-27)

Chạy lại `npx expo start -c` (**chưa commit**; bản sửa composition-critic đang chép thẳng vào `node_modules` trên máy tính, đừng chạy `npm install` trước khi thử). Ghi như lần 9: toàn thân / nửa người, cách máy bao xa, quay đầu phía nào của khung, dải ở cột nào.

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 18.1 | Tái hiện đúng cảnh lỗi lần 9 (người nghiêng, đội mũ, nhìn sang trái), chọn 1/3, đứng im | Dải ở **cột phải**; câu **không** đổi qua lại trái phải |l | l | tôi đã thử mẹo với ảnh này, để người sát mép trái khung -> kiểm tra -> cột trái đỏ -> lập tức đưa người vào cột trái -> kiểm tra nháy xanh đạt -> trong khi người đang nhìn cột trái |
| 18.2 | Như 18.1, làm theo câu tới khi đạt | Câu giữ một chiều tới lúc vào dải (có thể đổi một lần ở 1–2 lượt đầu khi app mới thấy hướng nhìn) | | | |
| 18.3 | Người nửa người gần máy, quay đầu sang phải của khung | Dải ở **cột trái** | | | |
| 18.4 | Người toàn thân 3–4 m, quay đầu sang phải / trái | Dải ở cột trái / phải | | | |
| 18.5 | Người nhìn gần thẳng, máy đứng im 10 s | Dải không đổi cột, câu không đổi chiều | | | |
| 18.6 | Đang hướng dẫn, người quay đầu hẳn sang phía kia và giữ | Khoảng 2–3 s sau dải đổi cột | | | |
| 18.7 | Người chụp cận (vai chạm hai mép khung) | Vẫn có câu xoay máy tới cột, không bảo lùi ra liên tục | | | |
| 18.8 | Ở giữa: chạy lại như lần 8 | Vẫn đạt như trước (Ở giữa không đổi) |d | d| |
| 18.9 | Xoay máy chậm, đều, rồi xoay ngay sau khi vừa dừng | Ít khựng hơn lần 9; ghi mức khựng |d |d | khi di chuyển rất chậm (di chuyển một cách từ từ ) sẽ giật  |
| 18.10 | Chiều dời máy (bạn chọn kiểu 6) | Trên dải **không có mũi tên**, chỉ dải + đường đỏ; chiều nằm ở icon đầu câu |d |d | |

### 18.11 Góp ý

- (ghi trong cột Ghi chú)

### 18.12 Trả lời góp ý lần 10

- **18.1 (người sát mép trái, cột trái đỏ, đưa vào là Đạt dù người nhìn về cột trái):** lượt đầu app chưa thấy hướng nhìn (người sát mép, mũ che) nên lấy cột gần nhất; bước cột chỉ cần 2 lượt đúng nên Đạt trước khi kịp thấy hướng nhìn. Sửa: **chưa lượt nào thấy hướng nhìn thì bước cột cần 3 lượt đúng liền** (thấy rồi thì vẫn 2). Lượt thêm cho app cơ hội thấy hướng nhìn; thấy là đổi cột ngay, câu bảo dời tiếp. Người nhìn thẳng thật vẫn Đạt, chậm hơn chừng 1 s.
  - Mô phỏng trên hai ảnh bạn gửi (170 lần chạy): 168 về cột phải (đúng). 2 lần còn về cột trái: khung đó 3 lượt liền không thấy khung xương nào (không có mắt, mũi). Mô phỏng dùng đúng một khung cho mọi lượt nên lần nào cũng không thấy; trên điện thoại mỗi lượt là ảnh mới nên dễ thấy hơn. Chặn hẳn ca này thì người quay lưng sẽ không bao giờ Đạt, nên giữ cột gần nhất sau 3 lượt.
  - Mô phỏng 1/3 trên 1202 ảnh mẫu: vẫn 0 lần đổi chiều, 0 lần đổi cột.
- **18.9 (xoay rất chậm vẫn giật):** xoay rất chậm thì con quay coi như máy đứng yên, nên app vẫn chụp kiểm tra giữa lúc xoay. Chưa sửa: hạ ngưỡng thêm thì rung tay lúc cầm yên cũng thành "đang dời" và app không bao giờ chụp kiểm tra. Ghi lại để bàn.

## 19. Lần 11 — Chưa thấy hướng nhìn thì chưa Đạt cột vội (2026-11-27)

Chạy lại `npx expo start -c` (**chưa commit**; đừng chạy `npm install`). Các dòng 18.2–18.7 bạn chưa thử thì thử ở đây.

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 19.1 | Như 18.1: người sát mép trái, chọn 1/3, đưa người vào cột trái và giữ | Không báo Đạt ngay; trong 3 lượt app thấy người nhìn trái thì dải sang **cột phải**, câu bảo dời tiếp | l| l| |
| 19.2 | Làm theo câu tới khi đạt (18.2) | Câu giữ một chiều tới lúc vào dải |d |d | |
| 19.3 | Người nửa người gần máy, quay đầu sang phải của khung (18.3) | Dải ở **cột trái** | d| d| |
| 19.4 | Người toàn thân 3–4 m, quay đầu sang phải / trái (18.4) | Dải ở cột trái / phải |d | d| |
| 19.5 | Người nhìn gần thẳng, máy đứng im 10 s (18.5) | Dải không đổi cột, câu không đổi chiều; Đạt sau chừng 3 s khi đã ở cột |d |d | |
| 19.6 | Đang hướng dẫn, người quay đầu hẳn sang phía kia và giữ (18.6) | Khoảng 2–3 s sau dải đổi cột |d |d | |
| 19.7 | Người chụp cận, vai chạm hai mép khung (18.7) | Vẫn có câu xoay máy tới cột, không bảo lùi ra liên tục |d |d | |

### 19.8 Góp ý

- Ảnh người đội mũ nhìn sang trái (bạn gửi): đưa người vào cột trái, bật kiểm tra → cột trái xanh, báo Đạt, trong khi phải về cột phải.

### 19.9 Trả lời góp ý lần 11

- **Thử trên máy tính với đúng ảnh bạn gửi:** cả khung, nhiều khung 3:4, và đặt người ở cột trái với 5 cỡ (người cao 0,29–0,83 khung), mắt ở 0,12 và 0,2 bề ngang. Lần nào khung xương cũng đoán "nhìn trái" nên chọn **cột phải**; trọng tâm người ở 0,43–0,63 nên không thể lọt dải cột trái. **Claude chưa tái hiện được lỗi** trên máy tính. Có thể khi quay ảnh trên màn hình bằng điện thoại, khung xương ở ảnh 512 px không thấy hướng nhìn mấy lượt liền.
- **Đã sửa chỗ yếu tìm thấy:** lần dò lại trên ảnh cỡ thật trước chỉ dùng lưới mặt, mà lưới mặt **không bao giờ** thấy mặt nghiêng hẳn (cả hai ảnh của bạn: 0 lần). Giờ vùng cắt gồm cả đầu và vai, và lấy hướng nhìn từ **khung xương** của vùng cắt khi không thấy mặt. Trên máy tính, khung xương ở vùng cắt này thấy "nhìn trái" ở 13/15 lần thử (3 cảnh × 5 cỡ), không lần nào thấy "nhìn phải".
- **Dòng chẩn đoán (chỉ bản dev):** khi hướng dẫn 1/3, góc trên trái khung ngắm hiện một dòng nhỏ, ví dụ `nguồn hiSkeleton · nhìn trái · phiếu -2 · cột phải · x 0.52`: hướng nhìn lấy từ đâu (`face` / `skeleton` ở ảnh nhỏ, `hiFace` / `hiSkeleton` ở ảnh cỡ thật, `không`), người nhìn về đâu, tổng phiếu, cột đang chọn, chỗ người. Nếu còn sai, chụp màn hình lúc sai gửi Claude.

- **Chạy thêm bộ ảnh mới:** 1146 mục còn lại của bộ cũ không chạy lại được (ảnh gốc không còn trên máy). Claude chạy model trên bộ 1977 ảnh một người khác (`eval/composition/images`, chưa từng dùng cho mô phỏng hướng dẫn). Đây là dữ liệu để thử, **không làm model học thêm** (model MediaPipe cố định).
  - 1/3 trên 1764 ảnh dùng được: **0 lần đổi chiều câu, 0 lần đổi cột** ở cả năm kiểu người chụp ảo, camera sau và trước. Làm theo tay yên: 6586/8095 Đạt.
  - Ở giữa: 0 lần đổi chiều.
  - Khoảng 12% lần chạy "làm theo" vẫn tự dừng. Claude chạy lại model giữ **mặt nạ người** để mô phỏng tính trọng tâm phần người thấy trong từng khung như app. Ca tự dừng còn lại khoảng 10%, và là lỗi thật: người rộng hơn khung (nằm, dang tay, cận quá), phần trên của người phủ hết bề ngang nên xoay máy trọng tâm trượt theo khung, không bao giờ tới đường đích. **Sửa:** phần trên của người phủ từ 90% bề ngang khung thì câu là "Lùi ra" (1/3 và Ở giữa; composition-critic đo thêm bề ngang phần trên).
  - Sau sửa, 1/3 làm theo tay yên: tự dừng 832 → 111 / 8095 lần chạy; 0 lần đổi chiều, 0 lần đổi cột ở các kiểu làm theo (làm nhanh: 1 lần đổi chiều do quá tay). Số lần "chạm mép ảnh" tăng vì người chụp ảo lùi ra tới mép ảnh gốc (giới hạn của mô phỏng).
  - Ở giữa làm theo tay yên: 5837 Đạt, 144 tự dừng, 1 lần đổi chiều; Đạt khi mắt đã ra ngoài khung 15 / 8095 lần chạy.

## 20. Lần 12 — Dò hướng nhìn lại bằng khung xương ở ảnh cỡ thật, dòng chẩn đoán (2026-11-27)

Chạy lại `npx expo start -c`, **tắt hẳn Expo Go rồi mở lại** cho chắc nạp bản mới (**chưa commit**; đừng chạy `npm install`).

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 20.1 | Có dòng chẩn đoán | Khi hướng dẫn 1/3, góc trên trái khung có dòng `nguồn … · nhìn … · phiếu … · cột … · x …` |d |d | |
| 20.2 | Ảnh người đội mũ nhìn trái (ảnh bạn gửi), người ở cột trái, chọn 1/3, đứng im | Dòng chẩn đoán "nhìn trái", phiếu âm, **cột phải**; không báo Đạt ở cột trái. Nếu sai: chụp màn hình dòng chẩn đoán |d |d | dù vẫn có đoán nhìn phải nhưng vẫn kịp đổi lại nhìn trái, không còn bị vòng lặp nhắc trái phải liên tục, ổn   |
| 20.3 | Như 20.2, người ở giữa và ở cột phải | Luôn cột phải |d |d | khá tốt |
| 20.4 | Người thật nhìn sang phải của khung | Cột trái |d |d | |
| 20.5 | Người nhìn thẳng | "nhìn ?" phiếu 0, cột gần nhất; Đạt sau chừng 3 s ở cột |d |d |khong báo nhìn ? mà luôn nhìn trái và luôn chọn cột phải. cũng đúng vì mắt người thường thích chủ thể nằm bên phải vì nó là ở tay phải nên thuận hơn, nếu ko xác định được mặt cứ chọn cột phải |
| 20.6 | Các dòng 19.2–19.7 chưa thử | Như mục 19 | — | — | Không cần thử lại: 19.2–19.7 đã đạt (d) trên cả hai máy ở mục 19. |

### 20.7 Góp ý

- (ghi trong cột Ghi chú)

### 20.8 Trả lời góp ý lần 12

- **20.2 (lúc đầu vẫn đoán nhìn phải rồi mới đổi lại):** Claude tái hiện được trên lưới khung cắt của ảnh lần 11. Ở một khung, khung xương đoán nhầm "nhìn phải". Phiếu đang 0 thì một lượt nhầm (2 phiếu) là sang cột trái, lượt sau thấy nhìn trái chỉ kéo phiếu về 0 nên cột kẹt ở trái. **Sửa:** giữa chừng hướng dẫn, muốn rời cột phải sang cột trái phải có tổng 3 phiếu, tức ít nhất 2 lượt thấy nhìn phải; một lượt nhầm không đổi cột nữa. Lượt đầu (chưa hiện câu nào) vẫn chọn ngay theo hướng nhìn, vì bắt đợi thêm lượt thì người quay đầu nhẹ sang phải bị bảo dời về cột phải rồi lại dời ngược (Claude thử cách đợi trước: mô phỏng ra 550 lần đổi chiều, nên bỏ).
- **20.5 (nhìn thẳng vẫn báo nhìn trái, chọn cột phải; không biết hướng thì cứ chọn cột phải):** đã làm. Chưa thấy hướng nhìn thì dải ở **cột phải**, không còn theo cột gần người nhất. Bước cột vẫn cần 3 lượt đúng liền khi chưa thấy hướng nhìn, để app kịp thấy nếu người thật ra nhìn sang phải.
  - Người nhìn thẳng mà app vẫn báo "nhìn trái" là lưới mặt / khung xương lệch nhẹ về một phía khi mặt gần thẳng. Với cột phải mặc định thì lệch này không đổi kết quả (đằng nào cũng cột phải). Nếu có lúc người nhìn **phải** nhẹ mà dải vẫn ở cột phải, ghi lại kèm dòng chẩn đoán.
- **Thử trên máy tính sau sửa:**
  - Lưới khung cắt của 3 ảnh bạn gửi (137 điểm bắt đầu): 0 lần đổi chiều; mọi lần Đạt đều ở **cột phải**. Trước sửa, ảnh 3 có 2 lần đổi chiều. Còn 1 lần ở ảnh 3 chạm mép ảnh: bắt đầu đúng ở khung mà khung xương đoán nhầm, nên lượt đầu đã chọn cột trái.
  - 1/3 trên 1764 ảnh: **0 lần đổi cột, 0 lần đổi chiều** ở các kiểu làm theo (làm nhanh camera trước: 1, đứng yên camera sau: 1). Làm theo tay yên camera sau: Đạt 5601 → 5366, tự dừng 111 → 169, chạm mép ảnh 2383 → 2560. Giảm vì người không rõ hướng nhìn đứng bên trái giờ phải dời xa hơn, sang cột phải; trong mô phỏng ô cắt hay chạm mép ảnh gốc trước khi tới.

## 21. Lần 13 — Không rõ hướng nhìn thì cột phải; một lượt đoán nhầm không đổi cột (2026-11-27)

Chạy lại `npx expo start -c`, **tắt hẳn Expo Go rồi mở lại** (**chưa commit**; đừng chạy `npm install`). Dòng chẩn đoán vẫn còn (bản dev).

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 21.1 | Người nhìn thẳng, đứng ở **cột trái**, chọn 1/3, máy đứng im | Dải ở **cột phải**, câu bảo dời tới cột phải; không Đạt ở cột trái | d| d| |
| 21.2 | Như 21.1, người đứng ở cột phải | Đạt sau chừng 3 s |d |d | |
| 21.3 | Ảnh người đội mũ nhìn trái (20.2), người ở cột trái / giữa / phải | Luôn cột phải; câu không đổi chiều, kể cả lúc đầu |d |d | |
| 21.4 | Người thật nhìn rõ sang phải của khung, bật 1/3 | Dải ở **cột trái** ngay lượt đầu |d | d| |
| 21.5 | Đang hướng dẫn ở cột phải, người quay đầu hẳn sang phải và giữ | Khoảng 2–3 lượt sau dải sang cột trái (một lượt thoáng quay không đổi) |d |d | |
| 21.6 | Ở giữa: chạy lại nhanh | Vẫn đạt như trước (Ở giữa không đổi) |d | d| ở giữa hơi trống, cho lưới 3x3 vào |

### 21.7 Góp ý

- (ghi trong cột Ghi chú)

### 21.8 Trả lời góp ý lần 13

- **21.1–21.5:** đạt trên cả hai máy, chọn cột 1/3 giữ như bản này.
- **21.6 (Ở giữa hơi trống, cho lưới 3×3 vào):** đã làm. Lớp kẻ của Ở giữa giờ là lưới 3×3 thêm trục dọc giữa (cùng nét trắng mờ như lưới). Đang hướng dẫn thì dải đích đỏ vẫn nằm trên trục giữa. Chỗ dính khi thả pose không đổi (vẫn trục giữa và điểm đích).

## 22. Lần 14 — Lưới 3×3 cho Ở giữa (2026-11-27)

Chạy lại `npx expo start -c`, **tắt hẳn Expo Go rồi mở lại** (**chưa commit**; đừng chạy `npm install`).

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 22.1 | Chọn Ở giữa trong bảng Bố cục | Khung có lưới 3×3 và trục dọc giữa |d |d | |
| 22.2 | Hướng dẫn Ở giữa | Dải đích đỏ nằm trên trục giữa, dễ phân biệt với lưới |d |d | |
| 22.3 | Thả pose khi đang Ở giữa | Pose vẫn dính trục giữa, không dính các đường 1/3 |d |d | |

### 22.4 Góp ý

- (không có)

### 22.5 Trả lời lần 14

- 22.1–22.3 đạt trên cả hai máy. 1/3 (lần 13) và Ở giữa (lần 14) giữ như bản này; chưa commit, chờ bạn đồng ý.

## 23. Lần 15 — Lấp đầy khung (2026-11-27)

Chạy lại `npx expo start -c`, **tắt hẳn Expo Go rồi mở lại** (**chưa commit**). Lấp đầy có hai bước: ① người cao từ 70% khung (hoặc chiếm từ 30% khung) → câu "Tiến lại gần để người lấp đầy khung"; ② đỉnh đầu không bị cắt → câu "Ngửa máy lên để không cắt đỉnh đầu".

**Claude đã thử trên máy tính trước** (mô phỏng 1764 ảnh, mỗi ảnh 6 khung bắt đầu: người nhỏ / vừa, lệch trái / giữa / phải, 7200 lần chạy mỗi kiểu người chụp):
- Câu không đổi chiều lần nào; không lần nào Đạt khi đầu bị cắt (mắt đã sát mép trên).
- **Lỗi tìm được và đã sửa:** bước đỉnh đầu đo theo đỉnh **vùng người**. Tay giơ lên, mũ, vùng người lan ra nền chạm mép trên thì app bảo "Ngửa máy lên" mãi, tới lúc mắt người xuống tận đáy khung rồi tự dừng; vùng người cũng không cho biết đầu ra ngoài bao xa nên ngửa máy mà app tưởng không làm theo. Giờ thấy mắt thì **đoán đỉnh đầu từ mắt** (theo bề ngang vai, không thấy vai thì theo khoảng hai mắt). Làm theo tay yên: tự dừng ở bước đỉnh đầu 57 → 3, Đạt 5968 → 6573.
- **Còn lại (chưa sửa, cần bạn thử):** người đứng thấp trong khung (ví dụ ngồi, nửa dưới khung) mà người chụp chỉ bước lại gần, không hướng máy về người: người tràn ra mép dưới, không bao giờ lấp đầy, app tự dừng (1,2% lần chạy). Người thật thường tự hướng máy theo người khi bước lại gần nên có thể không gặp.

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 23.1 | Chọn Lấp đầy, người đứng xa (người cao chừng nửa khung) | Câu "Tiến lại gần để người lấp đầy khung"; khung có lưới 3×3 |d |d | tiến lại gần / zoom  |
| 23.2 | Bước lại gần theo câu | Người cao khoảng 70% khung thì Đạt bước 1; câu không đổi chiều | d| d| |
| 23.3 | Chụp cận, đỉnh đầu ra ngoài mép trên | Câu "Ngửa máy lên để không cắt đỉnh đầu"; ngửa máy tới khi đầu vào khung thì Đạt |d |d | |
| 23.4 | Người **giơ tay lên cao** (tay chạm mép trên, đầu còn trong khung) | **Không** bảo ngửa máy; Đạt |d |d | |
| 23.5 | Người đội mũ cao / tóc búi chạm mép trên, mắt còn ở giữa khung | Không bảo ngửa máy mãi |d |d | |
| 23.6 | Người ngồi ở nửa dưới khung, chỉ bước lại gần (không chỉnh hướng máy) | Ghi lại: có lấp đầy được không, có tự dừng không |d |d | |
| 23.7 | Người quay lưng (không thấy mắt), đầu chạm mép trên | Vẫn bảo ngửa máy (theo đỉnh vùng người như trước) |d |d | |

### 23.8 Góp ý

- Nếu chụp trực diện thì có vẻ nó giống bố cục chụp ở giữa. Hãy cho tôi thấy sự khác nhau giữa 2 bố cục này bằng ảnh minh họa các trường hợp khác nhau


**Trả lời 23.8 (Claude):** Hai bố cục chỉ cho cùng kết quả khi người đã to, đứng giữa, máy thẳng, đầu trong khung, tức đúng cảnh chụp trực diện. Khác nhau ở chỗ mỗi bố cục bỏ qua điều gì: **Ở giữa** đo máy thẳng và người trên trục giữa, không đo cỡ người, không đo đỉnh đầu; **Lấp đầy** đo cỡ người (cao từ 70% hoặc chiếm từ 30% khung) và đỉnh đầu, không đo người đứng đâu, không đo máy nghiêng. Trang minh hoạ sáu cảnh (người xa ở giữa, người gần lệch trái, người gần ở giữa, chụp cận cắt đầu, máy nghiêng, giơ tay chạm mép trên), mỗi cảnh hai khung ngắm và câu app nói: https://claude.ai/artifact/QRWgFKryRXADA8SSkmBNo3 (riêng tư, chỉ chủ tài khoản mở được). Phần còn lại của phiếu 23 đạt cả hai máy; 23.6 (người ngồi nửa dưới khung) đạt nên chưa thêm bước mới.

## 24. Lần 16 — Nhóm người (2026-11-28)

Chạy lại `npx expo start -c`, **tắt hẳn Expo Go rồi mở lại**. Cần từ 2 người. Nhóm có ba bước: ① cả nhóm trong khung, không ai sát mép trái / phải → "Lùi ra để cả nhóm vào khung"; ② không cắt đầu ai → "Ngửa máy lên để không cắt đầu ai" (**bước mới**); ③ nhóm ở giữa → "Đi/xoay máy qua trái / phải để nhóm đứng giữa".

**Claude đã thử trên máy tính trước** (mô phỏng 231 ảnh nhóm mà cả nhóm vừa khung dọc, mỗi ảnh 8 khung bắt đầu, 1493 lần chạy mỗi kiểu người chụp):
- **Lỗi tìm được và đã sửa:** bộ tách người gộp người nhỏ hơn 2% ảnh (đứng xa, đứng sau, bị che) vào người gần nhất mà **không nới khung người**, nên app không biết có người đó. Người đó bị cắt ở mép mà app vẫn báo Đạt; giữa nhóm tính lệch. Giờ bề ngang nhóm tính thêm **khung xương** từng người (thấy hai vai là tính, kể cả quay lưng). Làm theo tay yên: Đạt mà có người bị cắt ở mép 46 → 7 (7 ca còn lại là người gần như ra hẳn ngoài khung, app không thấy được); Đạt mà nhóm lệch giữa 54 → 7; tự dừng 16 → 1.
- **Bước mới, cắt đầu:** trước đây Nhóm không xét mép trên. Bắt đầu với đầu người cao nhất ra ngoài mép trên: Đạt mà mắt ai đó sát mép trên 109 → 5. Đỉnh đầu đoán theo vai từng người như Lấp đầy; vùng người phủ người đó mà đỉnh còn trong khung thì tin vùng người (chụp cận nhóm, đoán theo vai hay cao quá: bảo ngửa máy nhầm 12 → 1).
- Câu không đổi chiều lần nào khi làm theo.
- Mô phỏng không lùi ra xa hơn ảnh gốc được nên phần lớn lần "Lùi ra" dừng ở mép ảnh gốc; cần bạn thử bước ① trên máy thật (24.2, 24.3).

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 24.1 | Chọn Nhóm người, khung chỉ có 1 người | "Cảnh này chưa thấy nhóm người", dừng ngay | — | — | Claude thử trên máy tính: 1212 ảnh một người, khung quanh người đó: người không chạm mép trái / phải thì báo ngay "Cảnh này chưa thấy nhóm người". **Đổi sau lần này:** người chạm mép trái / phải thì app bảo "Lùi ra" trước (xem 24.2), lùi rồi vẫn chỉ một người 2 lượt liền thì báo "chưa thấy nhóm" và dừng |
| 24.2 | 2–3 người đứng cạnh nhau, một người bị mép trái hoặc phải cắt một nửa | "Lùi ra để cả nhóm vào khung"; lùi tới khi đủ người thì sang bước sau | — | — | Claude thử trên máy tính: 94 ảnh nhóm, mép trái qua giữa người ngoài cùng. **Lỗi tìm được:** 26/94 lần báo "chưa thấy nhóm" rồi dừng (hai người đứng sát thì vùng người dính làm một, mặt và khung xương người bị cắt ở ngoài khung, app chỉ đếm được một người). Đã sửa: 90/94 bảo "Lùi ra"; 4 lần còn lại người bị cắt không có trong vùng người nên app không thấy |
| 24.3 | Nhóm có **một người đứng sau / xa hơn** (nhỏ hơn hẳn) ở sát mép | Vẫn bảo lùi ra cho người đó vào khung (lỗi vừa sửa) | — | — | Claude thử trên máy tính: 28 ảnh có người chỉ khung xương thấy (vùng người gộp mất), mép khung qua giữa người đó: 23 bảo "Lùi ra" (bản cũ: 12; 3 lần bản cũ báo Đạt luôn, 7 lần báo không thấy nhóm), 5 lần không thấy người đó |
| 24.4 | Chụp gần, đầu người cao nhất bị mép trên cắt | "Ngửa máy lên để không cắt đầu ai"; ngửa tới khi đầu vào khung thì Đạt bước 2 | — | — | Claude thử trên máy tính: 14 ảnh, mép trên ngang mắt người cao nhất (cả nhóm đã vừa ngang): 14/14 bảo "Ngửa máy lên" |
| 24.5 | Chụp cận nhóm 2 người (nửa người), đầu sát nhưng còn trong khung | **Không** bảo ngửa máy | — | — | Claude thử trên máy tính: 28 ảnh, đỉnh đầu còn trong khung cách mép 3%: 28/28 không bảo ngửa máy |
| 24.6 | Một người giơ tay chạm mép trên, đầu còn trong khung | Không bảo ngửa máy | — | — | Claude thử trên máy tính: 7 ảnh vùng người cao hẳn trên đầu (tay giơ / vật cầm) chạm mép trên, đầu còn trong: 6/7 không bảo ngửa, 1 lần bảo ngửa |
| 24.7 | Cả nhóm trong khung nhưng lệch hẳn một bên | "Đi/xoay máy qua … để nhóm đứng giữa"; câu không đổi chiều | — | — | Claude thử trên máy tính: 162 lần nhóm sát một bên: 162/162 đúng chiều; mô phỏng làm theo không lần nào đổi chiều |
| 24.8 | Nhóm quay lưng (không thấy mặt) | Vẫn nhận ra nhóm và hướng dẫn | — | — | Claude thử trên máy tính: bộ ảnh không có ảnh nhóm nào không thấy mặt ai nên không thử được trên ảnh thật; có test với khung xương không thấy đầu (vẫn nhận ra nhóm). Cần thử trên điện thoại khi có dịp |

### 24.9 Góp ý

- 

### 24.10 Trả lời lần 16 (Claude)

Bạn để trống cả phần, nên tôi thử từng dòng trên máy tính bằng ảnh thật (234 ảnh nhóm vừa khung dọc, 1212 ảnh một người), ghi ở cột Ghi chú. Dòng 24.2 lộ ra một lỗi, đã sửa: một vùng người chạm mép trái / phải thì app bảo **"Lùi ra để cả nhóm vào khung"** trước, không báo ngay "chưa thấy nhóm"; lùi rồi mà 2 lượt liền vẫn chỉ thấy một người thì dừng với câu "Cảnh này chưa thấy nhóm người" (trước đây nhắc "để thấy lại người" rồi mới tự dừng). Không tách được "một người chụp cận chạm mép" với "người bên cạnh bị cắt": trên ảnh hai trường hợp này giống nhau, nên một người chụp cận chạm mép cũng bị bảo lùi ra trước. Mô phỏng cả lượt (làm theo, tay yên): báo không thấy nhóm ngay lượt đầu 76 → 37, tự dừng 2 → 0, các số khác giữ nguyên.

## 25. Lần 17 — Cầm máy ngang, bước 1 (2026-11-28)

Chạy lại `npx expo start -c`, **tắt hẳn Expo Go rồi mở lại**. Bước 1 đã chốt: app chưa tính bố cục cho khung ngang, nên cầm máy ngang (hoặc lộn ngược) thì mọi bố cục trừ Tắt hiện viên **"Cầm máy dọc để dùng bố cục"** giữa khung, chữ xoay theo cách cầm cho đọc được; hướng dẫn tạm dừng rồi làm tiếp khi cầm dọc lại. Ngưỡng: nghiêng quá 60° là ngang, về dưới 30° mới là dọc lại (để không nhấp nháy quanh ngưỡng).

**Claude đã thử trên máy tính:** cách tính dọc / ngang / lộn ngược và độ trễ có test; lúc tạm dừng không tính vào giờ nhắc / hết hạn (tạm dừng 60 s rồi cầm dọc lại: bước đang làm như vừa bắt đầu, không bị nhắc, không tự dừng). Chưa thử được trên điện thoại.

**Cần bạn xem thêm ở 25.8:** đọc mã thư viện camera thì thấy hai máy có thể lưu ảnh chụp ngang khác nhau: iPhone xoay ảnh theo màn hình (đang khóa dọc), nên có thể ra **ảnh dọc, cảnh nằm nghiêng**; Android xoay ảnh theo cách cầm, nên ảnh là ảnh ngang mà app lại cắt theo khung dọc, có thể ra **ảnh bị cắt mất hai bên**. Đây là chuyện có từ trước, không do lần này. Bạn ghi lại ảnh trong album trông thế nào để tôi biết bước 2 phải sửa gì.

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 25.1 | Bật Quy tắc 1/3 có người, đang hướng dẫn thì xoay máy ngang | Viên "Cầm máy dọc để dùng bố cục" giữa khung, chữ đọc được khi đang cầm ngang; câu hướng dẫn, khung người, chấm, vạch đích ẩn |d |d | |
| 25.2 | Xoay ngang sang **phía kia** | Viên xoay theo, vẫn đọc được |d | d| |
| 25.3 | Giữ ngang khoảng 20 s rồi cầm dọc lại | Hướng dẫn làm tiếp bước đang dở, **không** tự dừng vì đã để lâu; vòng đếm trên nút (nếu có) không chạy lúc cầm ngang |d |d | |
| 25.4 | Nghiêng chừng 45° rồi về | Không hiện viên cầm dọc (chỉ câu nghiêng máy như cũ nếu bố cục có), không nhấp nháy |d |d | nghiêng trên 60 thì mới hiện viên, nhưng phải nghiêng về gần dọc mới tắt viên |
| 25.5 | Nhóm người, Lấp đầy, Ở giữa: xoay ngang | Như 25.1 |d |d | |
| 25.6 | Lưới 3×3, Góc thấp, Selfie: xoay ngang | Viên cầm dọc hiện; Góc thấp / Selfie chạm Kiểm tra bố cục thì không chạy |d |d | |
| 25.7 | Bố cục Tắt, xoay ngang | Không hiện gì |d |d | |
| 25.8 | Cầm ngang bấm chụp, mở ảnh trong album | Ghi lại ảnh ra sao: ảnh ngang đúng chiều / ảnh dọc cảnh nằm nghiêng / bị cắt mất hai bên |d |d | ảnh nằm ngang như những gì đã chụp |
| 25.9 | Cầm dọc rồi đặt máy nằm ngửa trên bàn | Không hiện viên cầm dọc (máy nằm ngửa thì không tính ngang hay dọc) |d |d | |

### 25.10 Góp ý

-

### 25.11 Trả lời lần 17 (Claude)

- **25.4:** đúng như đã định. Nghiêng quá 60° mới hiện viên, về dưới 30° mới tắt: nếu tắt ngay dưới 60° thì cầm quanh 60° viên sẽ hiện tắt liên tục. Lúc nghiêng 30–60° hướng dẫn chạy lại trên ảnh nghiêng nhiều nên cũng không đo đúng; giữ khoảng này là hợp lý. Nếu bạn thấy khó chịu, tôi hạ ngưỡng tắt lên 40°.
- **25.8:** cả hai máy lưu ảnh **ngang, đúng chiều như đã chụp**, không phải ảnh nghiêng hay bị cắt như tôi lo. Vậy bước 2 không phải sửa cách lưu ảnh; ảnh chụp lặng để phân tích có lẽ cũng đã đúng chiều, việc chính còn lại là đổi khung đo sang 4:3 ngang và vẽ vạch, chấm, mũi tên, chữ theo cách cầm.

