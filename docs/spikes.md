# TakeASnap — Kết quả spike Phase 0

> Ghi số đo trên máy thật. Mở app bằng Expo Go → màn "Phase 0 · Spike" → chọn từng spike.
> Kế hoạch spike ở [roadmap.md Phase 0](roadmap.md#phase-0--nền-móng-và-spike-12-tuần).

Thiết bị test:

| | iPhone | Android |
|---|---|---|
| Máy | iphone 15promax | |
| Hệ điều hành | IOS 26.6.2| |
| Expo Go |58.0.0 | |

---

## A — Camera và zoom

Mục tiêu: khi pinch zoom (CameraLayer re-render), khung cam vẫn kéo/pinch/xoay mượt, **UI ≥ 55 fps**.

| Test | iPhone | Android |
|---|---|---|
| UI fps khi đứng yên |60 | |
| UI fps khi pinch zoom liên tục |180-200| |
| JS fps khi pinch zoom liên tục |56-58| |
| UI fps khi kéo + pinch + xoay khung (chế độ chỉnh) |60 | |
| Kéo, thả, kéo tiếp: đi tiếp từ chỗ thả |tay kéo khá xa khung mới đi theo - không đi theo ngón tay | |
| Pinch 2 lần liên tiếp: lần 2 bắt đầu từ cỡ lần 1 | phải giữ 1 ngón tay trước tầm 0,5s mới có thể pinch bằng ngón kia, hoặc 2 ngón tay chạm tầm 0,5s mới có thể pinch. Đây chắc cũng là lí do ở lần kéo thả ở trên khiến có cảm giác ngón tay đi xa mới đi theo | |
| Xoay gần 0°/90°: hít góc + rung | tự động về 0 độ / 90 tốt| |
| Chạm đúp: về vị trí gốc | tốt | |
| Ở chế độ chụp, pinch chỉ zoom camera | tốt | |
| Flash auto hoạt động khi chụp trong tối | (chưa có nút chụp, Phase 2) | |

Kết luận: khá 5/10 , sự kiện bắt ngón tay còn delay, tốc độ zoom còn quá nhanh

**Đã sửa sau lần đo 1 (cần đo lại):**
- Trễ ~0.5 s trước khi kéo/pinch: do ghép chạm đúp bằng `useExclusiveGestures`, bắt kéo/pinch/xoay chờ chạm đúp thất bại. Đổi sang chạy song song; pan kích hoạt sau 2 pt.
- Zoom quá nhanh: đổi từ `+ (scaleChange − 1) × 0.6` sang thang log `+ ln(scaleChange) × 0.12` (`cameraZoom.pinchSensitivity` trong tokens). Nếu vẫn nhanh/chậm, báo để chỉnh hệ số.
- "UI 180–200 fps" là số ảo: bộ đo đếm cả callback chạy thêm trong cùng khung hình khi có sự kiện chạm. Đã bỏ qua các lần dt < 4 ms.

| Đo lại (lần 2) | iPhone |
|---|---|
| UI fps khi pinch zoom liên tục |60 |
| Kéo, thả, kéo tiếp: bám ngón tay ngay | tốt |
| Pinch/xoay bằng 2 ngón chạm cùng lúc, không phải chờ | tốt|
| Tốc độ zoom vừa tay | js tuột còn 50-52 và chậm|

Kết luận lần 2: 3/4 pinch kéo thả tốt mượt, zoom chưa tốt, không mượt

**Đã sửa sau lần đo 2 (cần đo lại):** zoom giật vì làm tròn prop theo bước 0.01, nên một lần pinch chỉ đi ~8 nấc; chậm vì cộng log ×0.12. Đổi sang kiểu app camera: pinch ×2 khoảng cách → hệ số zoom ×2, quy đổi sang prop 0..1 với `maxFactor` giả định 15 và bước 0.001 (`src/features/camera/zoom.ts`, có test). Màn hiện hệ số dạng "2.0× (ước lượng)".

| Đo lại (lần 3) | iPhone |
|---|---|
| UI fps khi pinch zoom liên tục | 60|
| JS fps khi pinch zoom liên tục | 55-58|
| Zoom liền mạch, không nhảy nấc |zoom out mạnh  |
| Pinch ×2 khoảng cách thì ảnh to gấp đôi (so với app Camera của iPhone) | tốt |

Kết luận lần 3: tốt, mượt

---

## B — Tách người bằng WebView

Màn "B · Tách người bằng WebView": chọn model → "Chạy 25 ảnh mẫu" → đọc bảng tổng ở trên, chạm từng dòng để soi ảnh tách / mask. Thư viện và model tải từ CDN (spike), nên **lần đầu cần mạng**; Phase 1 sẽ đóng gói kèm app để chạy offline.

Thay đổi so với kế hoạch: bỏ U²-Net human seg (file 176 MB, quá nặng cho WebView), thay bằng MediaPipe `selfie_segmenter` (nhẹ, chuyên người).

### Chạy thử trên máy tính (Chrome headless, GPU giả lập) — chỉ để xem độ chính xác

3 ảnh: street1 (ngồi bệt, có xe phía sau), travel3 (váy dài xòe, cầm giỏ), coffee2 (đứng một chân, giơ tay).

| Model | Kết quả bằng mắt | Model chạy (máy tính) |
|---|---|---|
| Multiclass | Giữ đủ toàn thân, chân, giày, váy; nền sạch sau khi sửa (xem dưới) | 20–50 ms |
| Selfie | Mép sạch nhưng **cắt mất chân và váy** → không dùng được cho dáng toàn thân | 15–40 ms |
| DeepLab | Mép nhòe, dính nền (xe hơi, ghế đỏ) → kém nhất | 30–55 ms |
| RMBG | Mép đẹp nhất, giữ tóc; giữ cả đồ cầm tay (túi, giỏ) | ~7.5 s (CPU 1 luồng) |

Lỗi đã sửa: Multiclass lúc đầu để nền hiện mờ ~4–20%, vì kênh "nền" chỉ đạt 0.8–0.96 trên vùng nền. Đã kéo dãn xác suất người trong khoảng [0.25, 0.65].

Dự đoán: **Multiclass cho pose, RMBG cho Thay nền.** Cần số đo trên iPhone để chốt.

### Đo trên iPhone

Mỗi model chạy "25 ảnh mẫu" một lần. Thời gian đọc ở bảng tổng trên màn.

| Model | Backend | Nạp lần đầu | Chạy model TB | Cả vòng TB | Cả vòng lâu nhất | Lỗi | Mép (tóc, ngón tay, khe tay–thân) |
|---|---|---|---|---|---|---|---|
| Multiclass |mediapipe-gpu |4.8s |51ms |105ms |288ms |0 |không tốt |
| Selfie |mediapipe-gpu |794ms |12ms |71ms |101ms |0 | tệ hơn Multiclass và còn cả vật dính lên người model |
| DeepLab |mediapipe-gpu |5.4s |72ms |148ms |182ms |0 |gọt ko sát model, còn quá nhiều chi tiết thừa |
| RMBG | Báo lỗi |

Mục tiêu (roadmap Phase 1): pose có trong **dưới 4 s** mỗi ảnh. Thay nền: dưới 5 s cả vòng (Phase 4).

Nhận xét lần đo 1:
- MediaPipe trên iPhone rất nhanh: Multiclass ~105 ms cả vòng, dư xa mục tiêu 4 s.
- Mép Multiclass chưa đẹp vì model tính ở 256 × 256 rồi phóng lên. Với **pose** điều này chấp nhận được: Phase 1 vẽ viền từ contour vector đã làm mượt, nên cái cần là bóng dáng gọn (bỏ mảng thừa), không cần mép tóc.
- Đã thử làm mịn mép bằng guided filter (ảnh dẫn xám, r = 8/12, eps = 1e-3/1e-4) trên máy tính: **tệ hơn**, mép quầng sáng và lem nền khi áo và nền có độ sáng gần nhau. Đã gỡ.
- RMBG báo lỗi trên iPhone, chưa có nội dung lỗi. Đã sửa: tải model bằng fetch để lỗi mạng hiện rõ, thử **WebGPU** trước (iOS 26 có WebGPU) rồi lùi về WASM, log từng bước. Trên máy tính, đường lùi về WASM đã chạy đúng.

| Đo lại RMBG (lần 2) | iPhone |
|---|---|
| Backend (ort-webgpu / ort-wasm) | |
| Nạp lần đầu | |
| Chạy model TB | |
| Cả vòng TB | |
| Lỗi (nếu có: chép nguyên 3 dòng log cuối trên màn) | |

Kết luận:

---

## C — Overlay Skia 3 lớp

Mục tiêu: kéo slider độ dày 1–12 px, hình đổi ngay, **UI ≥ 55 fps**.

| Test | iPhone | Android |
|---|---|---|
| UI fps khi kéo slider Độ dày | tốt trên 60| |
| JS fps khi kéo slider Độ dày |tốt từ 58 trở lên | |
| UI fps khi kéo slider Độ đậm | tốt trên 60| |
| Viền giữ đúng độ dày px khi đổi kích thước |tốt | |
| Đổi tab không làm preview co giãn | đổi qua người và người đi ngược lại có sự co giãn  | |

Kết luận: tốt 4/5 

**Đã sửa sau lần đo 1:** panel dùng `minHeight: 296`, tab Viền/Phủ có 2 hàng ô màu nên cao hơn, tab Người ngắn hơn nên preview giãn. Đổi sang `height: 336` cố định. Đo lại: đổi qua lại Viền ↔ Người, preview phải đứng yên.

Kết luận lần 2: Tốt đã fix được

---

## D — Giới hạn Expo Go

| Test | iPhone | Android |
|---|---|---|
| `expo-haptics` (dòng "expo-haptics: có/không có") |có| |
| Nút "Thử rung" có rung không |có rung (lần 1 ghi nhầm "không") | |
| Lưu ảnh mẫu vào album "TakeASnap" (dòng KẾT QUẢ) | Đạt | |
| Mở sheet: cao ~88%, có tay kéo, kéo xuống để đóng | tốt| |
| Slider trong sheet kéo được, không bị sheet giành cử chỉ |tốt | |

Kết luận: 5/5
