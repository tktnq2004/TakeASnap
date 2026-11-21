# Phase 5b — Dữ liệu cho model tự chọn kỹ thuật

Nghiệp vụ ở [business-flow §6.10](business-flow.md#610-tự-chọn-kỹ-thuật-bằng-model-riêng-phase-5b), kế hoạch ở [roadmap Phase 5b](roadmap.md#phase-5b--tự-chọn-kỹ-thuật-bằng-model-ai-riêng-23-tuần-có-cổng-quyết-định).

## Quyết định (2026-11-21)

| Việc | Chọn | Thay cho (roadmap cũ) |
|---|---|---|
| Gán nhãn sẵn | Claude gán trong phiên phát triển, xem ảnh theo tấm ghép; người duyệt ≥ 300 ảnh trên trang duyệt chạy ở máy | Script gọi Claude API |
| Huấn luyện | Toàn bộ trên Windows: ImageEmbedder của MediaPipe (MobileNetV3, model gốc của Google) lấy vector ảnh trong WebView, ghép đặc trưng người sẵn có, huấn luyện một lớp phân loại nhỏ (vài chục KB) | MediaPipe Model Maker trên Colab, TFLite ~5 MB |
| Bộ nhãn | Kỹ thuật nhìn ra từ cảnh: 1/3, Đặt ở giữa, Lấp đầy khung, Đường chân trời, Đường dẫn, Nhóm người, Khác | 1/3, ở giữa, góc thấp, selfie, nhóm, khác |
| Selfie, Góc thấp | Selfie chọn bằng luật (đang dùng camera trước); Góc thấp không đoán (là cách cầm máy, cảnh không nói được) | Model đoán |
| Nguồn ảnh | Open Images V7 (ảnh ghi giấy phép CC BY 2.0) + Wikimedia Commons cho kỹ thuật hiếm + ảnh tự chụp | Ảnh tự chụp + bộ dữ liệu nghiên cứu |

Còn mở: lớp phân loại tự huấn luyện để ở đâu cho app tải. Phương án C (roadmap §3.3) ghi GitHub Releases của repo này, nhưng repo đang riêng tư nên app không tải được. Chốt ở Bước 3.

## Nguồn ảnh (BR-16)

- **Open Images V7**, tập validation: metadata ở `storage.googleapis.com/openimages`, ảnh ở kho S3 công khai `open-images-dataset`. Google ghi ảnh có giấy phép CC BY 2.0 (cho phép dùng, kể cả huấn luyện, khi ghi tác giả). Script chỉ lấy ảnh có đúng giấy phép này và ghi tác giả, tiêu đề, link gốc từng ảnh vào `eval/composition/manifest.json`.
- Lọc: người thật (bỏ tranh, poster, tượng), người lớn nhất chiếm ≥ 2% ảnh (BR-06), ảnh không xoay. Lấy thêm ảnh có thẻ cảnh hiếm (biển, hồ, cánh đồng → chân trời; đường, lối đi, đường ray, phố, cầu tàu → đường dẫn; đội nhóm → nhóm; chân dung, selfie, đối xứng), phần còn lại chọn ngẫu nhiên có seed.
- Không bao giờ dùng ảnh người dùng app. Ảnh nằm trong `eval/`, không commit.

Script: `node scripts/p5b-collect.mts [số ảnh]`.

## Hướng dẫn gán nhãn

Câu hỏi cho mỗi ảnh: **với khung cảnh này (người + nền), app nên dẫn người chụp theo kỹ thuật nào?** Gán theo đặc điểm của cảnh, không theo việc ảnh đã chụp đúng kỹ thuật hay chưa. Một ảnh có tối đa 2 nhãn, nhãn chính đứng trước.

| Nhãn | Khi nào |
|---|---|
| `thirds` Quy tắc 1/3 | Một hai người trong khung cảnh có ý nghĩa (du lịch, phố, thiên nhiên không có đường nổi bật), người cỡ vừa hoặc cả người, nền đáng giữ. Lựa chọn mặc định cho chân dung có cảnh |
| `center` Đặt ở giữa | Nền đối xứng nhìn thẳng (cửa, cổng, vòm, hành lang thẳng, mặt tiền), hoặc người nhìn thẳng vào máy trên nền đơn giản |
| `fill` Lấp đầy khung | Cận mặt, ngang vai, nửa người gần; mặt là chính, nền không quan trọng hoặc rối |
| `horizon` Đường chân trời | Chân trời rõ, trải ngang khung: biển, hồ, cánh đồng, đất bằng gặp trời |
| `lead` Đường dẫn | Đường hội tụ mạnh dẫn vào cảnh: đường đi, lối nhỏ, đường ray, hành lang, cầu, cầu tàu, bậc thang, hàng cây |
| `group` Nhóm người | Từ 3 người trở lên cùng là chủ thể (chụp chung, đứng cạnh nhau) |
| `other` Khác | Không kỹ thuật nào hợp hoặc không phải ảnh bố cục: đám đông, thể thao đang chạy, người quá nhỏ hoặc bị cắt nhiều, ảnh sự kiện ghi lại, cảnh rối |

Hay đi đôi: `horizon` + `thirds`, `lead` + `center`, `group` + `horizon`. Khi phân vân giữa hai nhãn thì ghi cả hai.

## Chia bộ

- **Giữ riêng** ≥ 300 ảnh, chọn ngẫu nhiên theo nhãn chính trước khi huấn luyện, **không bao giờ** dùng để huấn luyện hay chỉnh. Người duyệt lại nhãn của chính các ảnh này (đo độ khớp người ↔ máy), nên nhãn của bộ giữ riêng là nhãn đã duyệt.
- Kiểm tra: ~300 ảnh để chọn ngưỡng tin cậy.
- Huấn luyện: phần còn lại.

## Kết quả gán nhãn lần 1 (2026-11-21)

- 640 ảnh ngẫu nhiên (tập validation) + 892 ảnh nhắm đích (tập test: thẻ chân trời, đường dẫn, đối xứng / chân dung, nhóm; người ≥ 4% ảnh; bỏ xe, thể thao, sân khấu, đồ ăn). Dừng phần ngẫu nhiên ở 640 vì 60% là "Khác".
- 1.532 ảnh có nhãn. Nhãn chính: Khác 962, 1/3 221, Lấp đầy 129, Ở giữa 117, Nhóm 58, Chân trời 24, Đường dẫn 21 (tính cả nhãn phụ: chân trời 38, đường dẫn 21).
- **Đề xuất:** chân trời và đường dẫn quá ít ảnh để model học, nhưng Phase 5a đã có bộ dò riêng cho hai kỹ thuật này. "Tự chọn" chọn chân trời / đường dẫn khi bộ dò thấy rõ; model chỉ phân 1/3, ở giữa, lấp đầy, nhóm, khác.
- Chia (`node scripts/p5b-split.mts`): giữ riêng 310 (Khác 140, 1/3 66, Lấp đầy 39, Ở giữa 35, Nhóm 17, Chân trời 7, Đường dẫn 6), kiểm tra 230, huấn luyện 992.
- Duyệt nhãn bộ giữ riêng: `node scripts/p5b-review.mts` rồi mở http://127.0.0.1:5175 (Enter: đồng ý / lưu, phím 1–7: đổi nhãn). Kết quả ở `eval/composition/labels-review.json`.

## Duyệt nhãn bộ giữ riêng (2026-11-21)

Người duyệt 300 / 310 ảnh (10 ảnh bị trang duyệt bỏ sót do bấm Enter hai lần nhanh; đã sửa, duyệt bù sau). Cách người duyệt đánh:

- 2 nhãn: ảnh có cả hai kỹ thuật (không phân chính / phụ).
- 1 nhãn: gần như chắc chắn.
- Có "Khác": **không chắc**. Không phải "không kỹ thuật nào hợp" như hướng dẫn gán nhãn.

Độ khớp Claude ↔ người (300 ảnh):

| | |
|---|---|
| Nhãn chính trùng nhau | 84% (252) |
| Nhãn chính của Claude nằm trong nhãn người chọn | 88% (263) |
| Có ít nhất một nhãn chung | 88% (265) |

Lệch nhiều nhất: Claude ghi 1/3, người ghi Đặt ở giữa (13) hoặc Lấp đầy (6); Claude ghi Khác, người ghi Nhóm (7), 1/3 (6), Ở giữa (4), Đường dẫn (3). Chân trời, đường dẫn, lấp đầy, nhóm khớp hoàn toàn khi Claude gán. Model học từ nhãn của Claude nên có thể nghiêng về 1/3 hơn người.

**Chấm cổng trên bộ giữ riêng:** lấy nhãn người duyệt làm đáp án. Lựa chọn đầu của model đúng khi nằm trong các nhãn người chọn (ảnh 2 nhãn: đúng cả hai; ảnh "Khác + X": người không chắc, đúng khi là Khác hoặc X). Báo kèm số chặt (trùng nhãn đầu người chọn). Độ khớp người ↔ Claude (84–88%) là trần thực tế của model.

## Cổng (roadmap)

Trên bộ giữ riêng: lựa chọn đầu đúng ≥ 70% **hoặc** hai lựa chọn đầu đúng ≥ 85%; model đoán một ảnh ≤ 300 ms trên máy.
