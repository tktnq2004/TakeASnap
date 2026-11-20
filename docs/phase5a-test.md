# Phiếu thử Phase 5a — Kiểm tra bố cục và dò đường

Cách điền như phiếu Phase 5: mỗi ô máy ghi `d` (đạt), lỗi thì ghi ngắn điều thấy được, `—` khi không thử được. Xong thì nhắn "đã gửi".

Chạy lại dev server có xóa cache: `npx expo start -c`.

## 1. Nút Kiểm tra bố cục (lần 1)

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 1.1 | Bố cục Tắt, rồi Lưới 3×3, rồi Lưới 4×4 | Không có nút Kiểm tra bố cục cạnh cụm zoom |d |d | |
| 1.2 | Bật Quy tắc 1/3 | Nút tròn có icon kính lúp quét ngay bên phải cụm zoom, không chạm cụm zoom, không lệch hàng |d |d | |
| 1.3 | Giữ hoặc kéo ngang cụm zoom cho thước hiện ra | Nút mờ hẳn trong lúc thước hiện, thả tay thì hiện lại | d|d | |
| 1.4 | Kéo pose (có pose) | Nút mờ cùng cụm zoom | d| d| |
| 1.5 | Quy tắc 1/3, người đứng giữa khung, chạm Kiểm tra bố cục | Không tiếng chụp, khung ngắm không nháy; vòng quay trên nút; khoảng 1 s sau: khung trắng quanh người, chấm trắng ở mắt, viên "Người đứng giữa khung, dời máy để người sang đường 1/3"; 5 s sau tự ẩn. Ghi thời gian từ lúc chạm tới lúc hiện |d |d | lúc gợi ý của bố cục 1/3 là đặt mắt người vào chấm xanh, nhưng khi kiểm tra bố cục và chụp thì review mắt người trên đường 1/3 mới đúng và được tick xanh -> đang xung đột |
| 1.6 | Chỉnh theo gợi ý (mắt trên đường 1/3, người trên đường dọc), chạm lại | Viên xanh "Đạt Quy tắc 1/3" có dấu tích, rung nhẹ | mắt người dưới đường 1/3 vẫn đạt bố cục và không có yêu cầu đưa mắt trên đường 1/3 (nếu mắt vẫn được nằm dưới thì làm đúng ) | | |
| 1.7 | Khung người và chấm mắt so với người trên khung ngắm (thử cả tỉ lệ 3:4, 9:16, 1:1) | Khớp chỗ người và mắt thật |d | d| |
| 1.8 | Camera trước, chạm Kiểm tra bố cục; thử cả hai lựa chọn Cài đặt → Ảnh camera trước (Lưu như thật / Lưu soi gương) | Khung người và chấm mắt nằm đúng bên (không bị lật ngược) |d |d | |
| 1.9 | Chạm Kiểm tra bố cục rồi bấm chụp ngay khi vòng quay còn chạy | Ảnh chụp ngay (chậm hơn bình thường tối đa ~0,6 s), không lỗi; lần kiểm tra bị bỏ: sau khi chụp không hiện khung người, chấm mắt hay viên kết quả của Kiểm tra bố cục |d |d |kết quả kiểm tra không hiện cái gì ? |
| 1.10 | Đang hiện kết quả, đổi kỹ thuật hoặc đổi camera | Kết quả ẩn ngay |d |d | |
| 1.11 | Hướng máy vào chỗ không có người, chạm Kiểm tra bố cục | "Không thấy người, tiến lại gần hoặc zoom vào" |d |d | |
| 1.12 | Chạm liên tục 10 lần (đợi mỗi lần xong) | Không lỗi, máy không nóng, nút chụp vẫn dùng bình thường |d |d | |
| 1.13 | Đặt ở giữa, Lấp đầy khung, Nhóm người, Góc thấp, Selfie: mỗi kỹ thuật chạm một lần | Có kết quả hợp kỹ thuật (Góc thấp / Selfie: dòng chung như cắt khớp, sát mép, hoặc Đạt) | d| d | |

## 2. Dò chân trời và đường dẫn (lần 1)

Bản dev hiện thêm dòng nhỏ "Dò đường … ms" dưới viên kết quả: ghi số đó vào cột Ghi chú (cổng: ≤ 300 ms).

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 2.1 | Bật Đường chân trời, hướng ra biển / cánh đồng / mặt hồ có người đứng, chạm Kiểm tra bố cục | Một đường xanh nằm đúng chân trời (kể cả đoạn người che); viên "Chân trời nằm trên đường 1/3" hoặc "Chân trời chưa nằm trên đường 1/3, …"; ghi số ms |193ms|- | gợi ý của đường chân trời khá mơ hồ, khiến tôi không biết khi nào mới đạt được bố cục đúng. Đường chân trời ở đây đang nhắm đến là chân của mẫu ? Do tôi đang hiểu nhầm hay do bạn đang làm sai ? |
| 2.2 | Như 2.1, nghiêng máy cho chân trời lên / xuống đường 1/3 rồi chạm lại | Dòng đổi theo: trên đường 1/3 thì đạt (viên xanh, rung nhẹ nếu mọi dòng đạt) |- |- | |
| 2.3 | Chân trời đi ngang cổ người | "Chân trời cắt ngang cổ, hạ hoặc nâng máy một chút" | | | |
| 2.4 | Bật Đường dẫn, người đứng trên đường đi / hành lang / đường ray hội tụ về phía người, chạm Kiểm tra bố cục | Các đường xanh trên mép đường, vòng xanh ở chỗ các đường gặp nhau; "Đường dẫn hướng tới người" | | | |
| 2.5 | Như 2.4 nhưng người đứng lệch hẳn sang một bên | "Đường dẫn chưa hướng tới người, đứng ở chỗ các đường gặp nhau" | | | |
| 2.6 | Chụp ảnh ở Đường chân trời / Đường dẫn rồi mở Xem ảnh | Thẻ nhận xét có dòng về chân trời / đường dẫn như trên | | | |
| 2.7 | Cảnh không có chân trời (trong nhà) ở Đường chân trời | Không vẽ đường sai lung tung; nếu có dòng chân trời thì ghi lại cảnh đó | | | |

2.2–2.7 chưa thử: làm ở mục 4 với kỳ vọng mới (đường tìm được giờ vẽ màu trắng).

## 3. Ảnh tự chụp để đo cổng (không bắt buộc, rất có ích)

Bộ ảnh đo hiện chỉ có 12 ảnh chân trời và 6 ảnh đường dẫn lấy từ Wikimedia, và tôi đã chỉnh ngưỡng trên chính các ảnh đó. Muốn chốt cổng cho công bằng cần ảnh chưa dùng để chỉnh. Nếu được, chụp bằng app camera thường rồi chép vào `eval/lines/user/` (thư mục này không bao giờ được commit):

- 10–15 ảnh có chân trời (biển, hồ, cánh đồng), có hoặc không có người;
- 10–15 ảnh có đường dẫn (đường đi, hành lang, đường ray, cầu, hàng cây) có người;
- 5–10 ảnh có cột / thân cây ngay sau đầu người, và vài ảnh cột ở cạnh người (không sau đầu).

## 4. Sau góp ý lần 1 (chấm 1/3, chân trời)

Sửa theo 1.5, 1.6, 2.1. Cái app **tìm thấy** (khung người, chấm mắt, chân trời, đường dẫn) vẽ màu **trắng**; chỗ **cần đặt** (lớp bố cục) màu **xanh**. Chạy lại `npx expo start -c` (package composition-critic lên v0.2.1).

**Trả lời 1.6:** Quy tắc 1/3 cho lệch tới ±7% chiều cao khung quanh đường 1/3 trên (khoảng 1/5 một ô lưới), nên mắt hơi dưới đường vẫn đạt. Đó là cố ý: ảnh của nhiếp ảnh gia ít khi đặt mắt đúng tuyệt đối. Thấy rộng quá thì ghi vào Góp ý, tôi thu hẹp lại.

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 4.1 | Bật Quy tắc 1/3, chưa có pose | Chỉ hai vòng nhỏ ở hai giao điểm **trên** (không còn hai giao điểm dưới) | | | |
| 4.2 | Có pose, kéo mắt người mẫu tới gần giao điểm dưới rồi thả | Không dính vào giao điểm dưới; chấm đích xanh ở giao điểm trên gần nhất. Kéo tới gần giao điểm trên thì dính như cũ | | | |
| 4.3 | Quy tắc 1/3: đặt mắt người thật vào chấm xanh, chạm Kiểm tra bố cục | Chấm trắng ở mắt trùng chấm xanh; dòng mắt đạt (nếu người còn ở giữa khung thì dòng về đường dọc) | | | |
| 4.4 | Bật Đường chân trời | Cả hai đường ngang 1/3 đều xanh; dòng giới thiệu "Đặt chỗ trời gặp biển hoặc đất lên một đường xanh" | | | |
| 4.5 | Đường chân trời, ngoài trời có chân trời thật (biển, hồ, cánh đồng, hoặc dãy nhà xa), chân trời **cao hơn** đường xanh trên, chạm Kiểm tra bố cục | Đường trắng nằm đúng chỗ trời gặp đất; "Chân trời cao hơn đường 1/3, ngửa máy lên một chút"; ghi số ms | | | |
| 4.6 | Như 4.5 nhưng chân trời **thấp hơn** đường xanh gần nhất | "Chân trời thấp hơn đường 1/3, chúc máy xuống một chút" | | | |
| 4.7 | Làm theo dòng ở 4.5 / 4.6 tới khi đường trắng trùng một đường xanh, chạm lại | Viên xanh "Đạt Đường chân trời", rung nhẹ (nếu không còn dòng chung chưa đạt) | | | |
| 4.8 | Người đứng cả người trong khung, có mép sàn / chân tường / bậc thềm ngay ở bàn chân, ở Đường chân trời | Không vẽ đường trắng ở bàn chân (nếu không có chân trời khác thì không có đường nào). Nếu vẫn có đường sai, ghi đường đó nằm ở đâu | | | |
| 4.9 | Chân trời đi ngang cổ người | "Chân trời cắt ngang cổ, hạ hoặc nâng máy một chút" | | | |
| 4.10 | Bật Đường dẫn, người đứng trên đường đi / hành lang / đường ray hội tụ về phía người, chạm Kiểm tra bố cục | Các đường trắng trên mép đường, vòng trắng ở chỗ các đường gặp nhau; "Đường dẫn hướng tới người" | | | |
| 4.11 | Như 4.10 nhưng người đứng lệch hẳn sang một bên | "Đường dẫn chưa hướng tới người, đứng ở chỗ các đường gặp nhau" | | | |
| 4.12 | Chụp ảnh ở Đường chân trời / Đường dẫn rồi mở Xem ảnh | Thẻ nhận xét có dòng về chân trời / đường dẫn như trên | | | |
| 4.13 | Android: làm 4.5 và ghi số ms | ≤ 300 ms | — | | |

## Góp ý thêm

