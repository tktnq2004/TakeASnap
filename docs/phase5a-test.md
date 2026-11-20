# Phiếu thử Phase 5a — Kiểm tra bố cục và dò đường

Cách điền như phiếu Phase 5: mỗi ô máy ghi `d` (đạt), lỗi thì ghi ngắn điều thấy được, `—` khi không thử được. Xong thì nhắn "đã gửi".

Chạy lại dev server có xóa cache: `npx expo start -c`.

## 1. Nút Kiểm tra bố cục (lần 1)

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 1.1 | Bố cục Tắt, rồi Lưới 3×3, rồi Lưới 4×4 | Không có nút Kiểm tra bố cục cạnh cụm zoom | | | |
| 1.2 | Bật Quy tắc 1/3 | Nút tròn có icon kính lúp quét ngay bên phải cụm zoom, không chạm cụm zoom, không lệch hàng | | | |
| 1.3 | Giữ hoặc kéo ngang cụm zoom cho thước hiện ra | Nút mờ hẳn trong lúc thước hiện, thả tay thì hiện lại | | | |
| 1.4 | Kéo pose (có pose) | Nút mờ cùng cụm zoom | | | |
| 1.5 | Quy tắc 1/3, người đứng giữa khung, chạm Kiểm tra bố cục | Không tiếng chụp, khung ngắm không nháy; vòng quay trên nút; khoảng 1 s sau: khung trắng quanh người, chấm trắng ở mắt, viên "Người đứng giữa khung, dời máy để người sang đường 1/3"; 5 s sau tự ẩn. Ghi thời gian từ lúc chạm tới lúc hiện | | | |
| 1.6 | Chỉnh theo gợi ý (mắt trên đường 1/3, người trên đường dọc), chạm lại | Viên xanh "Đạt Quy tắc 1/3" có dấu tích, rung nhẹ | | | |
| 1.7 | Khung người và chấm mắt so với người trên khung ngắm (thử cả tỉ lệ 3:4, 9:16, 1:1) | Khớp chỗ người và mắt thật | | | |
| 1.8 | Camera trước, chạm Kiểm tra bố cục; thử cả hai lựa chọn Cài đặt → Ảnh camera trước (Lưu như thật / Lưu soi gương) | Khung người và chấm mắt nằm đúng bên (không bị lật ngược) | | | |
| 1.9 | Chạm Kiểm tra bố cục rồi bấm chụp ngay khi vòng quay còn chạy | Ảnh chụp ngay (chậm hơn bình thường tối đa ~0,6 s), không lỗi; kết quả kiểm tra không hiện | | | |
| 1.10 | Đang hiện kết quả, đổi kỹ thuật hoặc đổi camera | Kết quả ẩn ngay | | | |
| 1.11 | Hướng máy vào chỗ không có người, chạm Kiểm tra bố cục | "Không thấy người, tiến lại gần hoặc zoom vào" | | | |
| 1.12 | Chạm liên tục 10 lần (đợi mỗi lần xong) | Không lỗi, máy không nóng, nút chụp vẫn dùng bình thường | | | |
| 1.13 | Đặt ở giữa, Lấp đầy khung, Nhóm người, Góc thấp, Selfie: mỗi kỹ thuật chạm một lần | Có kết quả hợp kỹ thuật (Góc thấp / Selfie: dòng chung như cắt khớp, sát mép, hoặc Đạt) | | | |

## 2. Dò chân trời và đường dẫn (lần 1)

Bản dev hiện thêm dòng nhỏ "Dò đường … ms" dưới viên kết quả: ghi số đó vào cột Ghi chú (cổng: ≤ 300 ms).

| # | Thao tác | Kỳ vọng | iPhone | Android | Ghi chú |
|---|---|---|---|---|---|
| 2.1 | Bật Đường chân trời, hướng ra biển / cánh đồng / mặt hồ có người đứng, chạm Kiểm tra bố cục | Một đường xanh nằm đúng chân trời (kể cả đoạn người che); viên "Chân trời nằm trên đường 1/3" hoặc "Chân trời chưa nằm trên đường 1/3, …"; ghi số ms | | | |
| 2.2 | Như 2.1, nghiêng máy cho chân trời lên / xuống đường 1/3 rồi chạm lại | Dòng đổi theo: trên đường 1/3 thì đạt (viên xanh, rung nhẹ nếu mọi dòng đạt) | | | |
| 2.3 | Chân trời đi ngang cổ người | "Chân trời cắt ngang cổ, hạ hoặc nâng máy một chút" | | | |
| 2.4 | Bật Đường dẫn, người đứng trên đường đi / hành lang / đường ray hội tụ về phía người, chạm Kiểm tra bố cục | Các đường xanh trên mép đường, vòng xanh ở chỗ các đường gặp nhau; "Đường dẫn hướng tới người" | | | |
| 2.5 | Như 2.4 nhưng người đứng lệch hẳn sang một bên | "Đường dẫn chưa hướng tới người, đứng ở chỗ các đường gặp nhau" | | | |
| 2.6 | Chụp ảnh ở Đường chân trời / Đường dẫn rồi mở Xem ảnh | Thẻ nhận xét có dòng về chân trời / đường dẫn như trên | | | |
| 2.7 | Cảnh không có chân trời (trong nhà) ở Đường chân trời | Không vẽ đường sai lung tung; nếu có dòng chân trời thì ghi lại cảnh đó | | | |

## 3. Ảnh tự chụp để đo cổng (không bắt buộc, rất có ích)

Bộ ảnh đo hiện chỉ có 12 ảnh chân trời và 6 ảnh đường dẫn lấy từ Wikimedia, và tôi đã chỉnh ngưỡng trên chính các ảnh đó. Muốn chốt cổng cho công bằng cần ảnh chưa dùng để chỉnh. Nếu được, chụp bằng app camera thường rồi chép vào `eval/lines/user/` (thư mục này không bao giờ được commit):

- 10–15 ảnh có chân trời (biển, hồ, cánh đồng), có hoặc không có người;
- 10–15 ảnh có đường dẫn (đường đi, hành lang, đường ray, cầu, hàng cây) có người;
- 5–10 ảnh có cột / thân cây ngay sau đầu người, và vài ảnh cột ở cạnh người (không sau đầu).

## Góp ý thêm

