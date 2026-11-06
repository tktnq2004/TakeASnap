# TakeASnap — Business flow

> Tài liệu nghiệp vụ cho bản rebuild. Mô tả **app làm gì, cho ai, theo luồng nào và theo quy tắc nào**.
> Cách làm kỹ thuật ở [roadmap.md](roadmap.md), giao diện ở [design.md](design.md).

---

## 1. Sản phẩm trong một câu

**TakeASnap là app camera chụp theo dáng mẫu:** tách dáng người từ một ảnh mẫu, đặt dáng đó lên khung ngắm làm lớp hướng dẫn, rồi chụp người thật theo đúng dáng. Ngoài ra app có công cụ ghép người vào nền mới với ánh sáng và bóng đổ khớp cảnh.

Phạm vi v1: **iOS và Android (chạy trong Expo Go), chỉ tiếng Việt, chạy hoàn toàn trên máy, không có server**, là đồ án portfolio.

### Người dùng

| Vai trò | Họ cần gì | Dùng chức năng |
|---|---|---|
| **Người cầm máy** (bạn bè, người yêu, nhiếp ảnh nghiệp dư) | Biết cần bảo người mẫu đứng thế nào, căn khung ra sao | 1 — Chụp theo pose |
| **Người được chụp** | Xem nhanh dáng cần tạo, so với dáng mình đang đứng | 1 — Chụp theo pose |
| **Người sưu tầm dáng** (content creator, người hay chụp ảnh du lịch) | Lưu dáng đẹp thấy trên mạng thành thư viện riêng | 2 — Tạo và chỉnh pose |
| **Người muốn đổi bối cảnh ảnh** | Đưa mình vào một khung cảnh khác mà ảnh không lộ ghép | 3 — Thay nền |

---

## 2. Thuật ngữ (dùng thống nhất trong code, UI và tài liệu)

| Thuật ngữ | Nghĩa | Tên trong code |
|---|---|---|
| **Ảnh nguồn** | Ảnh gốc có người, dùng để tách dáng | `sourceImage` |
| **Mask** | Ảnh alpha 1 kênh: 255 = người, 0 = nền | `mask` |
| **Contour** | Đường bao vector của mask, đã làm mượt | `contours` |
| **Pose** | Một dáng đã lưu: mask + contour + bộ style 3 lớp | `Pose` |
| **Lớp viền** | Nét vẽ theo contour (bật/tắt, độ dày, màu) | `style.outline` |
| **Lớp phủ** | Màu phủ lên vùng mask (bật/tắt, màu, độ đậm) | `style.fill` |
| **Lớp người** | Phần ảnh người thật đã tách (độ hiện) | `style.subject` |
| **Overlay** | Pose đang hiện trên khung ngắm, kèm vị trí/tỉ lệ/góc xoay | `OverlayState` |
| **Ảnh nền** | Ảnh bối cảnh mới ở chức năng 3 | `backgroundImage` |
| **Ảnh ghép** | Kết quả cuối của chức năng 3 | `Composite` |

Trong UI chỉ dùng chữ **"pose"**. Không dùng "segment" hay "form" (bản cũ dùng tên "Danh sách Form").

---

## 3. Bản đồ màn hình

```mermaid
flowchart TD
    Launch([Mở app]) --> Perm{Đã có quyền camera?}
    Perm -- Chưa --> PermScreen[Màn xin quyền]
    PermScreen --> Camera
    Perm -- Có --> Camera[Camera<br/>màn chính]

    Camera -- "Nút pose" --> Library[Thư viện pose]
    Library -- "Chọn pose" --> Camera
    Library -- "Thêm ảnh từ máy / Pose mẫu" --> Processing[Đang tách người]
    Processing --> Editor[Chỉnh pose]
    Library -- "Sửa" --> Editor
    Editor -- "Lưu pose" --> Camera

    Camera -- "Chế độ Thay nền" --> C1[Bước 1: Chọn ảnh người]
    C1 --> C2[Bước 2: Chọn ảnh nền]
    C2 --> C3[Bước 3: Đặt vị trí]
    C3 -- "Tạo ảnh" --> C4[Bước 4: Kết quả]
    C4 -- "Lưu vào Ảnh" --> Photos[(Album TakeASnap)]

    Camera -- "Chụp" --> Photos
    Camera -- "Ảnh vừa chụp" --> Photos
```

---

## 4. Chức năng 1 — Chụp theo pose

### 4.1 Luồng chính

```mermaid
sequenceDiagram
    actor U as Người cầm máy
    participant C as Camera
    participant L as Thư viện pose
    participant A as Album máy

    U->>C: Mở app
    C-->>U: Khung ngắm (không có overlay hoặc pose dùng gần nhất)
    U->>L: Chạm nút pose
    L-->>U: Pose mẫu + Pose của bạn
    U->>L: Chọn một pose
    L->>C: Đặt overlay ở giữa khung, vừa chiều cao khung
    U->>C: Vào chế độ chỉnh overlay: kéo, pinch, xoay
    U->>C: Chạm "Xong" (khóa overlay)
    U->>C: Bảo người mẫu đứng khớp dáng, căn khung
    U->>C: Chụp
    C->>A: Lưu ảnh KHÔNG kèm overlay
    C-->>U: Thumbnail ảnh vừa chụp cập nhật
```

### 4.2 Hai chế độ thao tác trên khung ngắm

Bản cũ giật vì mọi cử chỉ chồng lên nhau. Bản mới tách hẳn thành **hai chế độ**, mỗi lúc chỉ một chế độ nhận cử chỉ:

| | **Chế độ chụp** (mặc định, overlay đã khóa) | **Chế độ chỉnh overlay** |
|---|---|---|
| Vào bằng | Chạm "Xong", hoặc chạm ra vùng trống | Chạm vào overlay, hoặc nút "Chỉnh pose" |
| 1 ngón kéo | — | Di chuyển overlay |
| 2 ngón pinch | Zoom camera | Phóng/thu overlay quanh tâm hai ngón |
| 2 ngón xoay | — | Xoay overlay (hít về 0° khi lệch dưới 3°, rung nhẹ) |
| Chạm 1 lần | — (camera tự lấy nét; `expo-camera` không có lấy nét theo điểm chạm, để dành cho bản dùng VisionCamera) | — |
| Chạm đúp | — | Đặt lại vị trí/tỉ lệ/góc ban đầu |
| Kéo xuống vùng xóa | — | Gỡ overlay khỏi khung (rung cảnh báo khi vào vùng) |
| Thanh điều khiển | Hiện đủ | Ẩn hết, chỉ còn "Xong" và vùng xóa |

Pinch và xoay chạy cùng lúc. Kéo, pinch và xoay đều cộng dồn từ trạng thái trước, không bao giờ nhảy về giá trị cũ.

### 4.3 Điều khiển camera

| Điều khiển | Giá trị | Ghi chú |
|---|---|---|
| Đổi camera | sau / trước | Camera trước: preview soi gương, ảnh lưu không soi gương (theo cài đặt) |
| Flash | tắt / bật / tự động | Dùng flash gốc của camera, không dùng đèn pin |
| Lưới | tắt / 3×3 / 4×4 | Vẽ trong vùng ảnh thật sẽ được lưu |
| Thước cân bằng | bật / tắt | Đổi sang màu nhấn khi máy lệch dưới 1° |
| Tỉ lệ khung | 3:4 / 9:16 / 1:1 | Khung ngắm hiển thị đúng vùng ảnh sẽ được lưu |
| Hẹn giờ | tắt / 3 s / 10 s | Cho người chụp tự đặt máy |
| Zoom | chip 0.5× / 1× / 2× + pinch | 0.5× chỉ có trên iPhone có ống góc rộng (đổi ống kính qua `selectedLens`); Android có 1× / 2× |

### 4.4 Điều khiển nhanh cho overlay (khi đang có pose)

- **Độ hiện overlay**: 3 mức chạm nhanh 100% / 60% / 30%.
- **Lật ngang**: soi gương dáng (dáng tay trái thành tay phải).
- **Ẩn tạm**: giữ nút để ẩn overlay, thả ra để hiện lại, dùng khi cần nhìn rõ người thật.
- **Gỡ pose**: xóa overlay khỏi khung. Pose vẫn còn trong thư viện.

---

## 5. Chức năng 2 — Tạo và chỉnh pose

### 5.1 Luồng chính

```mermaid
flowchart TD
    A[Thư viện pose] --> B{Nguồn ảnh}
    B -- "Thêm ảnh từ máy" --> P[Image picker]
    B -- "Pose mẫu" --> S[Pose mẫu đã tách sẵn<br/>không cần xử lý]
    B -- "Từ ảnh vừa chụp" --> P
    P --> Q[Chuẩn hóa ảnh<br/>xoay EXIF, giới hạn cạnh dài 2048px]
    Q --> R[Tách người trên máy]
    R --> D{Kết quả}
    D -- "0 người" --> E1[Báo: Không tìm thấy người<br/>Chọn ảnh khác]
    D -- "1 người" --> CT[Tạo contour]
    D -- "Nhiều người" --> M[Chọn người: chạm vào từng người<br/>hoặc chọn tất cả]
    M --> CT
    CT --> ED[Chỉnh pose]
    S --> ED
    ED --> SV[Lưu pose]
    SV --> CAM[Về Camera với pose làm overlay]
```

### 5.2 Màn Chỉnh pose — 3 lớp và các điều khiển

Thứ tự lớp từ trên xuống: **viền → phủ → người**.

| Lớp | Điều khiển | Khoảng giá trị | Mặc định |
|---|---|---|---|
| **Viền** | Bật/tắt | on/off | on |
| | Độ dày | 1–12 px (theo pixel màn hình, giữ nguyên khi zoom overlay) | 3 px |
| | Màu | 8 màu có sẵn + bảng chọn màu | Trắng |
| **Phủ** | Bật/tắt | on/off | on |
| | Màu | 8 màu có sẵn + bảng chọn màu | Cam |
| | Độ đậm | 0–100% | 40% |
| **Người** | Độ hiện | 0–100% | 0% (chỉ thấy viền và phủ) |
| **Sửa nét** | Cọ thêm / cọ xóa vùng mask | cỡ cọ 8–64 px | — |
| | Hoàn tác / làm lại | 30 bước | — |

Mọi thay đổi hiện ngay khi kéo slider, không có nút "Áp dụng". Khi sửa nét bằng cọ, contour được tính lại lúc nhấc ngón tay.

### 5.3 Thư viện pose

- **Pose mẫu**: đi kèm app, chia nhóm (Quán cà phê, Trường học, Đường phố, Du lịch). Mask đã tách sẵn nên chọn là dùng ngay. Không sửa được bản gốc, chỉ "Tạo bản sao để sửa".
- **Pose của bạn**: sắp xếp mới nhất trước. Mỗi pose có 3 thao tác: **Dùng để chụp**, **Sửa**, **Xóa**.
- Xóa pose thì xóa luôn mọi file của nó (ảnh nguồn, mask, contour, thumbnail).

---

## 6. Chức năng 3 — Thay nền

### 6.1 Mục tiêu chất lượng

Ảnh ghép đạt yêu cầu khi người xem **không chỉ ra được ngay đâu là ảnh ghép**. Có 6 tiêu chí, dùng để chấm điểm (xem [roadmap.md](roadmap.md), Phase 4):

1. **Viền**: tóc và mép áo mềm, không còn viền màu của nền cũ.
2. **Tỉ lệ và phối cảnh**: người to nhỏ đúng với vị trí đứng trong cảnh, chân chạm mặt đất.
3. **Hướng sáng**: phía sáng/tối trên người cùng phía với nguồn sáng của nền.
4. **Màu và nhiệt độ màu**: tông da và áo ăn theo không khí màu của nền.
5. **Bóng**: có bóng tiếp xúc dưới chân, và bóng đổ theo hướng sáng khi nền có nắng gắt.
6. **Độ nét, nhiễu, độ mờ hậu cảnh**: người không nét hơn hoặc sạch nhiễu hơn hẳn so với nền.

### 6.2 Luồng chính

```mermaid
flowchart TD
    S1[Bước 1: Chọn ảnh người] --> SEG[Tách người<br/>model mép mềm]
    SEG --> S2[Bước 2: Chọn ảnh nền]
    S2 --> AN[Phân tích nền trên máy<br/>độ sáng, tông màu, độ sâu, hướng sáng ước lượng]
    AN --> S3[Bước 3: Đặt vị trí<br/>kéo, pinch, xoay người trên nền]
    S3 --> ADJ[Tinh chỉnh: hướng sáng, bóng, mức khớp màu]
    ADJ --> PRE[Xem trước tức thì]
    PRE -- "Tạo ảnh" --> OUT[Render full độ phân giải]
    OUT --> S4[Bước 4: Kết quả]
    S4 -- "Lưu vào Ảnh" --> SAVE[(Album TakeASnap)]
    S4 -- "Giữ để so sánh" --> CMP[Hiện ảnh trước khi xử lý]
    S4 -- "Chỉnh lại" --> S3
```

### 6.3 Giới hạn của bản v1

- Toàn bộ xử lý trên điện thoại, không gửi ảnh đi đâu. Mục tiêu xuất ảnh dưới 5 s.
- Không có relight bằng model AI (cần GPU). App dùng **relight giả lập**: tô sáng/tối theo hướng sáng và thêm viền sáng ở phía nguồn sáng.
- Kết quả tốt nhất với nền có **ánh sáng mềm** (trong nhà, ngoài trời râm). Nền nắng gắt và cảnh đêm khó khớp hơn.
- Chức năng này có **cổng quyết định** ở [roadmap Phase 4](roadmap.md#phase-4--thay-nền-timebox-3-tuần-có-cổng-quyết-định): có thể bị thu hẹp chỉ còn nền ánh sáng mềm, hoặc bị bỏ khỏi v1.

---

## 7. Luồng phụ

### 7.1 Quyền truy cập

| Quyền | Xin khi nào | Nếu bị từ chối |
|---|---|---|
| Camera | Lần đầu mở app | Màn giải thích + nút "Mở Cài đặt" (`Linking.openSettings()`). App vẫn vào được Thư viện pose và Thay nền |
| Ảnh (đọc) | Lần đầu chọn ảnh từ máy | Dùng image picker của hệ thống. Không cần quyền đọc toàn bộ thư viện |
| Ảnh (ghi) | Lần đầu lưu ảnh | Báo không lưu được, giữ ảnh tạm, cho thử lại |

Không xin quyền nào trước khi người dùng cần đến nó.

### 7.2 Lần đầu mở app

1. Xin quyền camera, một màn, một câu giải thích.
2. Vào thẳng Camera. Không có onboarding nhiều trang.
3. Nút pose nhấp nháy một lần duy nhất để chỉ chỗ chọn pose. Gợi ý: "Chọn một pose để chụp theo".

---

## 8. Quy tắc nghiệp vụ

| Mã | Quy tắc |
|---|---|
| BR-01 | Ảnh chụp ở chức năng 1 **không bao giờ** kèm overlay. Overlay chỉ để hướng dẫn |
| BR-02 | Ảnh lưu vào album "TakeASnap" đúng tỉ lệ khung đang chọn. Vùng ảnh lưu trùng đúng vùng thấy trên khung ngắm |
| BR-03 | Mọi xử lý ảnh (tách người, phân tích nền, ghép ảnh) chạy **hoàn toàn trên máy**. App không có kết nối mạng nào |
| BR-04 | Ảnh ghép xuất ra đúng độ phân giải gốc của ảnh nền. Người trong ảnh không bị phóng quá 1.5× độ phân giải gốc của ảnh người (vượt quá thì báo "Ảnh người sẽ bị vỡ nét ở cỡ này") |
| BR-05 | Trong Thay nền, chân người phải nằm trong ảnh nền. Kéo chân ra ngoài mép dưới thì bóng không được vẽ, và app hiện gợi ý "Kéo người lên để thấy bóng" |
| BR-06 | Một pose phải có ít nhất một vùng người chiếm từ 2% diện tích ảnh trở lên. Nhỏ hơn thì báo "Người trong ảnh quá nhỏ" |
| BR-07 | Ảnh nguồn được chuẩn hóa: xoay theo EXIF, cạnh dài tối đa 2048 px cho pose, giữ nguyên độ phân giải gốc cho chức năng 3 |
| BR-08 | Mọi file của pose nằm trong `documentDirectory`, không bao giờ nằm trong cache |
| BR-09 | Pose mẫu chỉ đọc. Sửa pose mẫu là tạo bản sao |
| BR-10 | Overlay nhớ vị trí/tỉ lệ/góc lần dùng gần nhất của từng pose |
| BR-11 | Khi ở chế độ chỉnh overlay, camera không nhận pinch-zoom |
| BR-12 | Lưu ảnh lỗi thì không mất ảnh: giữ bản tạm và cho thử lại |

---

## 9. Mô hình dữ liệu

```mermaid
erDiagram
    POSE ||--o{ CONTOUR : has
    POSE ||--|| POSE_STYLE : has
    POSE ||--o| OVERLAY_PLACEMENT : remembers
    COMPOSE_JOB }o--|| POSE : "may use"

    POSE {
        string id PK
        string origin "sample | library | camera"
        string sourceImageUri
        string maskUri "PNG 1 kênh"
        int width
        int height
        json bbox "x,y,w,h chuẩn hóa 0..1"
        string thumbnailUri
        string sampleGroup "null nếu không phải pose mẫu"
        datetime createdAt
        datetime updatedAt
    }
    CONTOUR {
        string poseId FK
        int index
        json points "tọa độ chuẩn hóa 0..1, đã làm mượt"
        bool isHole
    }
    POSE_STYLE {
        string poseId FK
        bool outlineEnabled
        float outlineWidth "px màn hình"
        string outlineColor
        bool fillEnabled
        string fillColor
        float fillOpacity
        float subjectOpacity
    }
    OVERLAY_PLACEMENT {
        string poseId FK
        float x "chuẩn hóa theo khung"
        float y
        float scale
        float rotation "radian"
        bool mirrored
    }
    COMPOSE_JOB {
        string id PK
        string status
        string subjectUri
        string backgroundUri
        json placement
        json lighting "hướng sáng, độ mềm bóng, mức khớp màu"
        string resultUri
        datetime createdAt
    }
```

Khác với bản cũ:
- Bỏ `bg` và `bgOpacity`. Nền của ảnh nguồn không phải một lớp của pose.
- Bỏ file `outline.png`. Viền được vẽ từ contour vector nên đổi độ dày được.
- Kiểu `SegmentData` không còn bị khai báo lặp ở 3 file.

---

## 10. Trạng thái và lỗi

### 10.1 Tách người (chức năng 2)

```mermaid
stateDiagram-v2
    [*] --> Normalizing: chọn ảnh
    Normalizing --> Segmenting
    Segmenting --> Contouring: có người
    Segmenting --> NoPerson: 0 người
    Segmenting --> PickPerson: nhiều người
    PickPerson --> Contouring
    Contouring --> Editing
    Segmenting --> Failed: lỗi model
    Failed --> Segmenting: Thử lại
    NoPerson --> [*]: Chọn ảnh khác
    Editing --> Saved: Lưu pose
    Saved --> [*]
```

### 10.2 Ghép ảnh (chức năng 3)

```mermaid
stateDiagram-v2
    [*] --> SubjectPicked: chọn ảnh người
    SubjectPicked --> Analyzing: chọn ảnh nền
    Analyzing --> Placing: phân tích xong
    Analyzing --> Placing: không ước lượng được hướng sáng<br/>(dùng hướng mặc định: trên-trái)
    Placing --> Rendering: Tạo ảnh
    Rendering --> Result
    Rendering --> Failed: hết bộ nhớ
    Failed --> Rendering: Thử lại ở cỡ nhỏ hơn
    Result --> Placing: Chỉnh lại
    Result --> Saved: Lưu vào Ảnh
    Saved --> [*]
```

### 10.3 Thông báo lỗi

Mỗi thông báo nói **chuyện gì xảy ra** và **làm gì tiếp**, không đổ lỗi cho người dùng, không dùng dấu chấm than.

| Tình huống | Thông báo | Hành động |
|---|---|---|
| Không có người | Không tìm thấy người trong ảnh. Chọn ảnh có người nhìn rõ. | Chọn ảnh khác |
| Người quá nhỏ | Người trong ảnh quá nhỏ để lấy dáng. Chọn ảnh chụp gần hơn. | Chọn ảnh khác |
| Lưu ảnh lỗi | Chưa lưu được ảnh vào máy. Ảnh vẫn được giữ tạm. | Thử lưu lại |
| Không đoán được hướng sáng | Chưa xác định được hướng sáng của nền. Xoay vòng Hướng sáng để chọn. | (vòng xoay được làm nổi) |
| Ghép ảnh hết bộ nhớ | Ảnh nền quá lớn để ghép. Thử lại ở 12 MP. | Thử lại ở 12 MP |
| Thiếu quyền camera | TakeASnap cần camera để chụp theo pose. | Mở Cài đặt |

---

## 11. Online / offline

App **không dùng mạng**. Mọi chức năng chạy được ở chế độ máy bay.

| Chức năng | Chạy bằng |
|---|---|
| Camera, chụp, lưu | `expo-camera`, `expo-media-library` |
| Tách người, chỉnh pose, thư viện | Model trong WebView ẩn, Skia, SQLite |
| Pose mẫu | Đóng gói sẵn trong app (mask + contour tính trước) |
| Thay nền | Model trong WebView ẩn, Skia |
