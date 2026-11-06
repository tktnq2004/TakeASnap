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

Chưa làm. Sẽ thêm màn spike B ở bước tiếp theo của Phase 0.

| Model | iPhone: thời gian | iPhone: mép | Android: thời gian | Android: mép |
|---|---|---|---|---|
| MediaPipe selfie_multiclass_256x256 | | | | |
| MediaPipe DeepLab v3 | | | | |
| RMBG-1.4 (lượng tử hóa) | | | | |
| U²-Net human seg (nhỏ) | | | | |

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
