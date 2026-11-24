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
| 11.1.1 | Bật Quy tắc 1/3 | Khung ngắm không còn chip nào ở góc |d |d | |
| 11.1.2 | Chạm ⌄ trên thanh trên | Bảng thả xuống có 3 hàng: Đèn flash, Hẹn giờ, Bố cục phụ `[Tắt \| Chân trời \| Đường dẫn]`; chữ không bị cắt trên máy của bạn |d |d | |
| 11.1.3 | Chọn Chân trời | Rung nhẹ, bảng thu lên, 1/3 vẫn bật, lớp kẻ vẽ cả hai; nút Bố cục có huy hiệu "+"; hướng dẫn chạy lại |d |d | |
| 11.1.4 | Mở lại bảng, chọn Tắt ở hàng Bố cục phụ | Bỏ chân trời, 1/3 vẫn bật, huy hiệu "+" mất | d| d| |
| 11.1.5 | Chạm nút Bố cục khi đang bật 1/3 + chân trời | Tắt cả hai như trước | d| d| |
| 11.1.6 | Cách này có dễ tìm không, có cần lối khác không | Ghi cảm nhận |d |d | tạm thời ổn |

### 11.2 Viên hướng dẫn hai dòng (camera sau, người nhìn thẳng)

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 11.2.1 | Người hơi lệch phải, chọn 1/3 | Viên hai dòng: "← Xoay máy sang trái" / "→ Hoặc người bước sang phải"; mũi tên trắng trên khung chỉ sang phải tới đường sáng |d |d | ý tôi là luôn hướng dẫn người chụp, không bắt mẫu di chuyển. Có nghĩa là 1: di chuyển điện thoại qua trái, 2 là di chuyển cả người qua trái |
| 11.2.2 | Người hơi lệch trái | "→ Xoay máy sang phải" / "← Hoặc người bước sang trái" |d |d | |
| 11.2.3 | Không xoay máy, bảo người mẫu bước theo dòng thứ hai | Người tiến về đường sáng; tới nơi thì "Đúng rồi, giữ yên máy" như khi xoay máy | d|d | |
| 11.2.4 | Bước mắt, mắt dưới đường 1/3 trên | "↓ Chúc máy xuống" / "↓ Hoặc hạ máy xuống"; mũi tên trên khung chỉ lên |d |d | |
| 11.2.5 | Hạ máy thấp xuống (không chúc) theo dòng thứ hai | Mắt tiến lên đường 1/3 |d |d | |
| 11.2.6 | Bước mắt, mắt trên đường (người sát mép trên) | "↑ Ngửa máy lên" / "↑ Hoặc đưa máy lên" |d |d | |
| 11.2.7 | Camera trước, bạn lệch khỏi đường sáng | Hai dòng đúng chiều với khung ngắm soi gương: làm theo dòng nào bạn cũng tiến về đường sáng | d|d | |
| 11.2.8 | Hai dòng, mũi tên có đủ rõ và đủ gọn không | Ghi cảm nhận |d |d | chưa ổn, chỉ 1 dòng và gộp lại , ví dụ xoay máy sang phải / bước qua phải , 2 dòng chiếm quá nhiều  |

### 11.3 Hướng nhìn, camera sau

Thử ở hai khoảng cách: **nửa người** (khoảng 1,5–2 m) và **cả người** (khoảng 3–4 m).

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 11.3.1 | Nửa người, đứng giữa khung, **chỉ quay đầu** sang phải của khung (vai thẳng), rồi chọn 1/3 | Đường 1/3 **bên trái** sáng (chừa chỗ phía người nhìn), chậm nhất sau khoảng 1–2 s |d |d | |
| 11.3.2 | Như trên, quay đầu sang trái của khung | Đường 1/3 **bên phải** sáng |d |d | |
| 11.3.3 | Cả người, lặp lại 11.3.1 | Như 11.3.1. Ghi lại nếu sai: người rất xa có thể không dò được mặt |d |d | |
| 11.3.4 | Cả người, lặp lại 11.3.2 | Như 11.3.2 |d |d | |
| 11.3.5 | Đang hướng dẫn, người quay đầu sang phía kia và giữ | Khoảng 2 s sau cột đích đổi sang bên kia |d |d | |
| 11.3.6 | Đang hướng dẫn, người quay đầu qua lại liên tục | Cột đích không đổi theo từng lần quay (lần 2, 10.3.5: đôi lúc bị xác định sai) |d |d | |

### 11.4 Bước và nhắc

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 11.4.1 | Bật 1/3, người thấy rõ mắt và chân | Trên viên có ô "Bước 1/3" và 3 chấm mờ | d|d | |
| 11.4.2 | Đứng yên không làm theo | Mỗi khoảng 2 s sáng thêm một chấm và rung; sau chấm thứ 3, vòng quanh nút Kiểm tra bố cục chạy 10 s rồi dừng với "Chưa đạt: …" |d |d | |
| 11.4.3 | Làm xong bước 1 sau 1–2 lần nhắc | "Đạt: người trên đường 1/3", rồi ô thành "Bước 2/3", 3 chấm về mờ (đếm lại) |d |d | |
| 11.4.4 | Làm hết 3 bước | Viên xanh "Đạt Quy tắc 1/3", dừng |d |d | |
| 11.4.5 | Sau khi đạt, chạm nút Kiểm tra bố cục | Hướng dẫn chạy lại từ "Bước 1/3". Tôi hiểu mục 10.6.1 là "hiện bước + mỗi bước nhắc 3 lần"; nếu ý bạn là khác (ví dụ chạy lại từ bước đang dở), ghi ở đây |d |d | |

### 11.5 Góp ý cho 1/3

- bỏ luôn chấm xanh ở 2 góc vuông
- Tôi có một ý tưởng, thay vì phải chụp liên tục, kiểm tra liên tục và cập nhật liên tục như v, thì mình xử lí realtime bằng fe -> cụ thể :
+ chọn bố cục 1/3 - > chụp ảnh -> tạo 1 chấm ở người -> tạo 1 chấm ở cột 1/3 -> ở giữa là mũi tên khoảng cách -> lúc này người dùng chỉ việc đưa 2 điểm đó lại gần nhau theo mũi tên mà không cần phải chụp liên tục -> mũi tên là fe nên tự kéo dài , co lại theo vị trí của 2 nút một cách realtime không delay -> khi 2 nút chạm vào hoặc mũi tên biến mất -> báo giữ yên đồng thời chụp kiểm tra cho bước 2 -> cũng tương tự với mặt tạo 2 chấm và mũi tên -> cứ liên tục như v tới hết bước. Điều kiện hủy là khi người dùng tắt chức năng hoặc đã hoàn thành -> vì không càn chụp liên tục nên không sợ tốn pin, nóng máy 

## 12. Lần 4 — Quy tắc 1/3 theo máy xoay

Vẫn chỉ thử Quy tắc 1/3. Chạy lại `npx expo start -c`. Lần 3 đạt hết; mục này thử cách hướng dẫn mới theo góp ý 11.2.1, 11.2.8 và 11.5.

**Đã sửa theo lần 3:**

- **11.5, ý tưởng chấm + mũi tên:** app không chụp mỗi giây nữa. Chụp **một** ảnh, đặt **chấm trắng ở người** (ngang mắt; bước mắt: ở mắt), **chấm xanh ở đích** (trên đường 1/3 sáng), giữa là **mũi tên**. Sau đó chấm trắng và mũi tên **chạy theo máy ngay trên màn hình**, không chụp thêm: app đọc **con quay** của máy (có sẵn trong Expo Go) và tính người dịch tới đâu khi máy xoay. Chấm trắng chạm chấm xanh → mũi tên biến mất, viên xanh "Đúng rồi, giữ yên máy", máy yên chừng 0,4 s thì **chụp kiểm tra**: đạt thì sang bước sau (ảnh đó đặt chấm cho bước sau), chưa đạt thì đặt lại chấm từ ảnh đó.
  - **Giới hạn:** con quay chỉ đo được **máy xoay** (xoay ngang, ngửa / chúc). Bạn **bước ngang** hay người mẫu tự đi thì chấm không chạy; khi máy yên lại chừng 0,7 s, app chụp một ảnh đặt lại chấm. Góc nhìn của camera app ước lượng (camera chính chừng 26 mm), nên trên máy bạn chấm có thể chạy nhanh / chậm hơn người thật một chút; ảnh kiểm tra sửa lại.
  - **Chỉ dừng khi đạt hết hoặc bạn tắt.** Bỏ luật tự dừng sau 3 lần nhắc + 10 s và vòng đếm lùi quanh nút; mỗi bước vẫn nhắc tối đa 3 lần rồi thôi nhắc. Chưa thấy người thì viên ghi "Hướng máy về phía người" và chờ, không tự dừng.
  - Các bước không theo được bằng máy xoay (③ không cắt tay chân: lùi ra) không có chấm, mũi tên; app chụp khi máy yên lại sau khi di chuyển, và thêm một ảnh mỗi 4 s.
- **11.2.1, 11.2.8 (chỉ bảo người chụp; một dòng):** viên còn **một dòng**, một mũi tên: "**← Xoay máy sang trái / bước sang trái**" (xoay máy sang trái hay bạn bước sang trái thì người trên khung đều dịch sang phải); mắt: "**↓ Chúc máy xuống / hạ máy xuống**", "**↑ Ngửa máy lên / đưa máy lên**". Camera trước chỉ nói xoay máy.
- **11.5, chấm xanh ở 2 góc vuông:** bỏ hai vòng xanh ở hai giao điểm trên của lưới 1/3 (lúc chưa đặt pose).

### 12.1 Chấm, mũi tên chạy theo máy (camera sau)

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 12.1.1 | Bật 1/3, chưa đặt pose | Lưới 1/3 không còn hai vòng xanh ở giao điểm trên | | | |
| 12.1.2 | Người đứng giữa khung, chọn 1/3 | Sau chừng 1 s: chấm trắng ở người (ngang mắt), chấm xanh trên đường 1/3 sáng cùng độ cao, mũi tên trắng từ chấm trắng tới chấm xanh | | | |
| 12.1.3 | Xoay máy **chậm** theo viên | Chấm trắng trượt về chấm xanh **liền tay, không giật**; mũi tên ngắn dần; không nghe / thấy app chụp trong lúc xoay | | | |
| 12.1.4 | Xoay **ngược** chiều viên | Chấm trắng đi xa chấm xanh, mũi tên dài ra | | | |
| 12.1.5 | Xoay tới khi chấm trắng chạm chấm xanh rồi giữ yên | Mũi tên biến mất, viên xanh "Đúng rồi, giữ yên máy", rung nhẹ; chừng 0,5–1,5 s sau "Đạt: người trên đường 1/3", rồi "Bước 2/3" | | | |
| 12.1.6 | Lúc chấm trắng chạm chấm xanh, người thật có nằm trên đường 1/3 không | Ghi lệch bao nhiêu (ví dụ "còn cách nửa ngón tay", "vượt qua đường"); lệch nhiều là góc nhìn ước lượng sai trên máy bạn | | | |
| 12.1.7 | Bước 2 (mắt): ngửa / chúc máy theo viên | Chấm trắng ở mắt chạy lên / xuống tới chấm xanh trên đường 1/3 trên; như 12.1.5 | | | |
| 12.1.8 | Bước 3 (không cắt tay chân), nếu có | Không có chấm, mũi tên; viên "Lùi ra để không cắt ngang tay chân"; lùi xong đứng yên thì chừng 1–4 s sau app kiểm tra | | | |
| 12.1.9 | Zoom 2× rồi làm lại 12.1.3 | Chấm vẫn bám theo người (chạy nhanh gấp đôi so với zoom 1×) | | | |

### 12.2 Bước ngang, máy yên, không làm theo

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 12.2.1 | Đang bước 1, **không xoay máy, bạn bước ngang** theo viên ("… / bước sang trái") rồi đứng yên | Lúc bước chấm không chạy theo (giới hạn ở trên); đứng yên chừng 1 s thì chấm nhảy tới chỗ mới | | | |
| 12.2.2 | Để máy yên không làm gì | Mỗi 2 s một chấm nhắc sáng + rung, tối đa 3; sau đó **không tự dừng**, chấm và viên vẫn còn | | | |
| 12.2.3 | Để máy yên 30 s | Không nóng máy hơn bình thường (app không chụp khi máy yên và chấm đã đặt) | | | |
| 12.2.4 | Chọn 1/3 khi khung **không có người** | Viên "Hướng máy về phía người", không dừng; hướng máy về người rồi giữ yên thì chừng 1–4 s sau có chấm | | | |
| 12.2.5 | Chạm nút Kiểm tra bố cục khi đang hướng dẫn | Dừng, "Đã dừng hướng dẫn" | | | |

### 12.3 Viên một dòng

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 12.3.1 | Người lệch phải (camera sau) | "← Xoay máy sang trái / bước sang trái", một dòng | | | |
| 12.3.2 | Người lệch trái | "→ Xoay máy sang phải / bước sang phải" | | | |
| 12.3.3 | Bước mắt, mắt thấp hơn đường 1/3 trên | "↓ Chúc máy xuống / hạ máy xuống" | | | |
| 12.3.4 | Camera trước, bạn lệch khỏi đường sáng | Chỉ "Xoay máy sang …" (không có "bước"); xoay theo thì chấm trắng tới chấm xanh | | | |
| 12.3.5 | Câu có vừa một dòng trên máy bạn, có đủ rõ không | Ghi cảm nhận | | | |

### 12.4 Góp ý cho 1/3

-
