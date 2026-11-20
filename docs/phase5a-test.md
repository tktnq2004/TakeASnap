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

## Góp ý thêm

