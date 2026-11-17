# Phase 5 — Trợ lý bố cục

> Bản giải thích ý tưởng, chưa phải đặc tả.
> Nghiên cứu chi tiết từng kỹ thuật và nguồn tham khảo: [composition.md](composition.md).

---

## 1. Nó là gì

Một **trợ lý bố cục** nằm sẵn trong camera. Nó giúp người chụp, kể cả người chưa biết gì về nhiếp ảnh:

- **đặt người vào đúng chỗ** trong khung;
- **cầm máy đúng góc**;
- **tránh các lỗi hay gặp**: cắt ngang đầu gối, thừa trời trên đầu, đứng quá gần làm mặt méo.

**Ví dụ.** Bạn nhờ một người bạn chụp giúp. Họ giơ máy lên, app nhắc:

> *"Thừa khoảng trống trên đầu, nghiêng máy xuống một chút"*

Họ chỉnh theo, khung chuyển xanh, rồi bấm chụp.

### Pose và bố cục đi cùng nhau

| | Trả lời câu hỏi | Đã có? |
|---|---|---|
| **Pose** | Người **đứng thế nào** | Có (Phase 1–4) |
| **Bố cục** | Đặt người **ở đâu trong khung**, chụp **từ góc nào** | Phase 5 |

---

## 2. Dùng ra sao

### Bước 1 — Chọn kỹ thuật

Trên thanh trên của camera, nút **Lưới** hiện tại thành nút **Bố cục**. Bấm vào thì hiện danh sách:

```
┌───────────────────────────────┐
│ Bố cục                        │
│                               │
│ ○ Tắt                         │
│ ● Quy tắc 1/3                 │
│ ○ Đặt ở giữa                  │
│ ○ Góc thấp (dài chân)         │
│ ○ Selfie                      │
│ ○ Nhóm người                  │
└───────────────────────────────┘
```

### Bước 2 — Ngắm

Khung ngắm hiện:

- **đường kẻ** của kỹ thuật đã chọn;
- **chấm đích ◎**: chỗ nên đặt mắt hoặc người;
- **một dòng gợi ý** ngắn ở dưới khung.

```
┌─────────────────────────────┐
│      ┆         ┆            │
│ ┄┄┄┄┄◎┄┄┄┄┄┄┄┄┄┼┄┄┄┄┄┄┄┄    │   ◎ = chỗ nên đặt mắt
│      ┆ (người) ┆            │
│ ┄┄┄┄┄┼┄┄┄┄┄┄┄┄┄┼┄┄┄┄┄┄┄┄    │
│      ┆         ┆            │
└─────────────────────────────┘
     ← Dời máy sang phải một chút
```

Khi đã đúng: **đường kẻ chuyển xanh, máy rung nhẹ**, dòng gợi ý biến mất.
Mỗi lúc chỉ có **một** gợi ý và không che khung ngắm.

### Bước 3 — Chụp xong

Ở màn **Xem ảnh vừa chụp** có một nhận xét ngắn và một gợi ý cắt lại:

```
┌───────────────┐
│               │   ✓ Mắt nằm trên đường 1/3
│  ảnh vừa chụp │   ✗ Cắt ngang đầu gối
│  + lưới       │
│               │   [ Xem khung cắt gợi ý ]
└───────────────┘
```

### Bước 4 — Học

Mỗi kỹ thuật có một **thẻ học**:

```
┌─────────────────────────────────┐
│  Khoảng trống trên đầu          │
│                                 │
│  ┌─────────┐   ┌─────────┐      │
│  │  sai    │   │  đúng   │      │
│  │ (thừa   │   │         │      │
│  │  trời)  │   │         │      │
│  └─────────┘   └─────────┘      │
│                                 │
│  Mắt nên nằm khoảng 1/3 từ trên │
│  xuống. Thừa trời trên đầu làm  │
│  người trông nhỏ và lạc lõng.   │
│                                 │
│        [ Chụp thử ]             │
└─────────────────────────────────┘
```

Nút **Chụp thử** mở camera với kỹ thuật đó bật sẵn.

### Bước 5 — Đi cùng pose

- Chọn một pose mẫu thì **kỹ thuật hợp với nó tự bật**:

  | Chọn pose | Tự bật |
  |---|---|
  | Selfie | Selfie + Đặt ở giữa |
  | Toàn thân ngoài phố | Góc thấp + Quy tắc 1/3 |
  | Quán cà phê, ngồi | Quy tắc 1/3 + Khoảng trên đầu |

- Kéo pose trên khung thì nó **dính vào đường 1/3** hoặc **trục giữa**.

---

## 3. App "nhìn" bằng cách nào

App **không** cần một AI biết "ảnh đẹp". Nó dùng những thứ **đã có sẵn trong app**:

| Công cụ đã có | Cho app biết |
|---|---|
| Bộ tách người | Người ở đâu, đỉnh đầu ở đâu, người to hay nhỏ |
| Nhận diện mặt | Mắt ở đâu, mặt quay trái hay phải |
| 33 khớp cơ thể | Vai, khuỷu, cổ tay, hông, gối, cổ chân |
| Cảm biến nghiêng | Máy đang thẳng, nghiêng, ngửa hay cúi |
| Zoom, camera trước / sau | Đang ở 0,5× / 1× / 2×, có đang selfie không |

Từ đó app áp **quy tắc của nghề ảnh** để đưa ra lời khuyên.

### 10 kỹ thuật có hướng dẫn trên camera

| # | Kỹ thuật | App kiểm tra | Câu gợi ý ví dụ |
|---|---|---|---|
| 1 | **Quy tắc 1/3** | Mắt có nằm gần đường 1/3 trên không | "Dời máy sang phải" |
| 2 | **Đặt ở giữa** | Người có ở trục giữa không | "Đưa người vào giữa" |
| 3 | **Khoảng trên đầu** | Từ đỉnh đầu tới mép trên còn bao nhiêu | "Thừa khoảng trên đầu, nghiêng máy xuống" |
| 4 | **Khoảng phía nhìn** | Mặt quay hướng nào, phía đó còn chỗ không | "Chừa chỗ phía người đang nhìn" |
| 5 | **Không sát mép** | Người có chạm mép khung không | "Người đang sát mép trái" |
| 6 | **Cỡ cảnh, không cắt khớp** | Mép khung có đi qua gối, cổ tay không | "Đang cắt ngang gối, lùi ra hoặc cắt ở đùi" |
| 7 | **Máy thẳng** | Máy nghiêng trái / phải bao nhiêu độ | "Nghiêng 3°" |
| 8 | **Góc thấp kéo chân** | Máy hạ thấp, ngửa lên, thấy cả chân | "Hạ máy ngang hông, ngửa lên nhẹ" |
| 9 | **Selfie** | Máy có cao hơn mắt không | "Giơ máy cao hơn mắt một chút" |
| 10 | **Khoảng cách, ống kính** | Mặt quá to khi đang ở 0,5× / 1× | "Đứng xa ra và dùng 2× để mặt không méo" |
| + | **Nhóm người** | Các đầu có cùng một độ cao không | "Cho một người ngồi xuống hoặc đứng lên bậc" |

> "Cỡ cảnh" và "không cắt khớp" gộp làm một mục, nên bảng có 10 dòng đánh số và thêm mục Nhóm người.

### 5 kỹ thuật chỉ có thẻ học (chưa tự phát hiện)

| Kỹ thuật | Vì sao chỉ dạy |
|---|---|
| Vật "mọc" sau đầu, chân trời cắt cổ | Cần dò đường thẳng quanh đầu, khó làm ổn trên máy |
| Đường dẫn | Cần dò đường thẳng trên cả ảnh |
| Khung trong khung | Cần hiểu cảnh (cửa, vòm, cành lá) |
| Tiền cảnh tạo chiều sâu | Cần biết vật nào gần máy |
| Ánh sáng (ngược sáng, giờ vàng) | Phụ thuộc nhiều vào cảnh, dạy rõ hơn đo |

### Thử thách lớn nhất

**Gợi ý lúc đang ngắm.** Expo Go không cho đọc từng khung hình camera, nên app phải **tự chụp ảnh nhỏ không tiếng liên tục** để phân tích.

| | Trạng thái |
|---|---|
| Chụp không tiếng (`shutterSound: false`) | Có trong expo-camera 58 |
| Mỗi giây phân tích được mấy lần | **Chưa đo** |
| Nóng máy, tốn pin | **Chưa đo** |
| Phân tích **sau khi chụp** | Chắc chắn làm được |

---

## 4. Tôi sẽ làm gì

Khoảng **3 tuần**, cùng cách làm với Phase 4: thiết kế trước, code sau, bạn thử bằng phiếu kiểm tra.

```
Tuần 1                  Tuần 2                      Tuần 3
──────────────────────  ──────────────────────────  ──────────────────────
Vẽ phương án lên        Nhận xét sau khi chụp       Hoàn thiện chữ,
canvas → bạn chọn                                   hiệu ứng
                        Thử gợi ý lúc ngắm:
Đường kẻ từng kỹ thuật  đo tốc độ, pin, nhiệt       Phiếu phase5-test.md
                                                    → bạn thử → sửa
Thẻ học                 ┌──────────────────────┐
                        │ CỔNG QUYẾT ĐỊNH      │
Pose dính đường 1/3     │ cuối tuần 2          │
                        └──────────────────────┘
Gợi ý từ cảm biến
(máy thẳng, góc thấp,
selfie)
```

### Cổng quyết định cuối tuần 2

| Kết quả đo | Quyết định |
|---|---|
| Gợi ý lúc ngắm **đủ nhanh và đúng** | Giữ gợi ý lúc ngắm |
| **Chậm** hoặc **nóng máy** | Chỉ nhận xét sau khi chụp |
| **Cả hai không ổn** | Giữ phần của tuần 1 (vẫn là chức năng hoàn chỉnh) |

---

## 5. Kết quả được gì

| Cho ai | Được gì |
|---|---|
| **Người dùng** | Người không biết chụp vẫn chụp đúng bố cục; học dần các kỹ thuật qua thẻ học và gợi ý |
| **App** | Tập trung hẳn vào chụp ảnh: pose lo dáng đứng, bố cục lo vị trí và góc máy |
| **Portfolio** | Câu chuyện kỹ thuật rõ: phân tích người ngay trên máy, không gửi ảnh lên mạng, lời khuyên giải thích được thay vì một điểm số mơ hồ |

### Trường hợp xấu nhất

Nếu phân tích ảnh không đạt, app **vẫn có**:

- đường kẻ bố cục cho từng kỹ thuật;
- thẻ học;
- pose dính đường 1/3;
- gợi ý góc máy từ cảm biến.

### Giới hạn cần biết trước

- App **không biết ảnh "đẹp"**, chỉ biết ảnh có theo kỹ thuật bạn chọn hay không.
- Quy tắc là **gợi ý, không phải luật**. Nghiên cứu cho thấy quy tắc 1/3 không phải lúc nào cũng đẹp hơn đặt ở giữa, nên app không chấm "đúng / sai".
- Bản đầu **chưa tự phát hiện** đường dẫn và vật mọc sau đầu, chỉ có thẻ học.

---

## 6. Cần bạn quyết trước khi làm

| # | Câu hỏi | Tôi khuyên |
|---|---|---|
| 1 | 15 kỹ thuật (10 có hướng dẫn + 5 thẻ học) có hợp không, hay ít hơn để làm kỹ hơn? | 15 |
| 2 | Người dùng chọn kỹ thuật rồi app dẫn, hay app tự đoán kỹ thuật hợp cảnh? | **Đã chốt:** Phase 5 chọn tay; Phase 5b thêm "Tự chọn" bằng model tự huấn luyện (roadmap Phase 5b) |
| 3 | Có cho dùng AI trên cloud không? | Không, giữ nguyên tắc ảnh không rời máy |
| 4 | Gợi ý sau khi chụp hay lúc đang ngắm? | Sau khi chụp trước; lúc ngắm để cổng quyết định |
| 5 | Thẻ học đặt ở đâu: tab thứ ba trong Thư viện, hay màn riêng? | Vẽ cả hai lên canvas để chọn |
