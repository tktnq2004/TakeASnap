# TakeASnap — Kết quả spike Phase 0

> Ghi số đo trên máy thật. Mở app bằng Expo Go → màn "Phase 0 · Spike" → chọn từng spike.
> Kế hoạch spike ở [roadmap.md Phase 0](roadmap.md#phase-0--nền-móng-và-spike-12-tuần).

Thiết bị test:

| | iPhone | Android |
|---|---|---|
| Máy | | |
| Hệ điều hành | | |
| Expo Go | | |

---

## A — Camera và zoom

Mục tiêu: khi pinch zoom (CameraLayer re-render), khung cam vẫn kéo/pinch/xoay mượt, **UI ≥ 55 fps**.

| Test | iPhone | Android |
|---|---|---|
| UI fps khi đứng yên | | |
| UI fps khi pinch zoom liên tục | | |
| JS fps khi pinch zoom liên tục | | |
| UI fps khi kéo + pinch + xoay khung (chế độ chỉnh) | | |
| Kéo, thả, kéo tiếp: đi tiếp từ chỗ thả | | |
| Pinch 2 lần liên tiếp: lần 2 bắt đầu từ cỡ lần 1 | | |
| Xoay gần 0°/90°: hít góc + rung | | |
| Chạm đúp: về vị trí gốc | | |
| Ở chế độ chụp, pinch chỉ zoom camera | | |
| Flash auto hoạt động khi chụp trong tối | (chưa có nút chụp, Phase 2) | |

Kết luận:

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
| UI fps khi kéo slider Độ dày | | |
| JS fps khi kéo slider Độ dày | | |
| UI fps khi kéo slider Độ đậm | | |
| Viền giữ đúng độ dày px khi đổi kích thước | | |
| Đổi tab không làm preview co giãn | | |

Kết luận:

---

## D — Giới hạn Expo Go

| Test | iPhone | Android |
|---|---|---|
| `expo-haptics` (dòng "expo-haptics: có/không có") | | |
| Nút "Thử rung" có rung không | | |
| Lưu ảnh mẫu vào album "TakeASnap" (dòng KẾT QUẢ) | | |
| Mở sheet: cao ~88%, có tay kéo, kéo xuống để đóng | | |
| Slider trong sheet kéo được, không bị sheet giành cử chỉ | | |

Kết luận:
