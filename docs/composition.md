# Bố cục khi chụp người bằng điện thoại — nghiên cứu cho Phase 5

Bản nghiên cứu để chọn kỹ thuật cho chức năng hướng dẫn bố cục. Phạm vi: chỉ những kỹ thuật **dùng được trên điện thoại** và **có người trong ảnh**, vì app đã có pose. Chưa phải đặc tả; roadmap và business-flow chỉ sửa sau khi chốt danh sách.

## 1. Những điều rút ra trước khi chọn

1. **Quy tắc là gợi ý, không phải luật.** Nghiên cứu cho thấy quy tắc 1/3 chỉ là yếu tố phụ trong ảnh đẹp; có thí nghiệm người xem thích chủ thể ở giữa hơn ở 1/3 ([Amirshahi 2014](https://uniklinikum-jena.de/anatomie1_media/Inhalte/AmirshahiARTP2014-font-1.pdf), [SIGGRAPH Asia 2023](https://asia.siggraph.org/2023/index.html%3Fpost_type=page&p=14494&id=pos_144&sess=sess202.html), [Palmer lab](https://palmerlab.berkeley.edu/spatial.html)). Vì vậy app **không chấm "đúng / sai"** theo một quy tắc. Người dùng chọn kỹ thuật muốn theo (hoặc app gợi ý một kỹ thuật hợp cảnh), rồi app dẫn tới kỹ thuật đó.
2. **Ảnh có người có những lỗi riêng, rõ ràng hơn quy tắc chung.** Thừa khoảng trên đầu, cắt ngang khớp gối / cổ tay, người nhìn vào sát mép khung, cột điện "mọc" sau đầu, chân trời cắt ngang cổ. Các nguồn dạy chụp chân dung gần như thống nhất về những lỗi này ([SLR Lounge](https://www.slrlounge.com/portrait-cropping-guide-bad-portrait-crops-how-to-fix-them/), [Adorama](https://www.adorama.com/alc/7-mistakes-to-avoid-when-shooting-a-portrait), [PetaPixel](https://petapixel.com/2022/05/22/in-portrait-photography-beware-lines-intersecting-your-subjects-head)). Chúng cũng dễ đo hơn "đẹp".
3. **Điện thoại có những kỹ thuật riêng.** Góc thấp với ống 0,5× để kéo dài chân; lùi xa và dùng 2× để mặt không méo; selfie cầm máy hơi cao hơn mắt, xa tay ([Adorama low angle](https://www.adorama.com/alc/low-angle-shot), [How-To Geek](https://www.howtogeek.com/678397/why-people-look-different-in-photos-taken-with-different-lenses/), [PopSci selfie](https://www.popsci.com/story/diy/take-better-selfies/)). Đây là điểm app chụp ảnh thường không dạy.
4. **Đã có hướng nghiên cứu và sản phẩm làm việc này.** Có các hướng: dùng độ nổi bật (saliency) để chấm quy tắc 1/3 ([Liu, PSU](https://web.cecs.pdx.edu/~fliu/project/thirdsrule.htm)); lưới gợi ý thay đổi theo cảnh ([Stanford/Adobe, Adaptive Armatures](https://graphics.stanford.edu/projects/adaptivearmatures)); chấm bố cục ngay khi đang chụp ([PMC7036822](https://pmc.ncbi.nlm.nih.gov/articles/PMC7036822)). Có app iPhone ([SnapFrame](https://apps.apple.com/app/id6773542560)) dùng nhận mặt, dáng người, độ nổi bật và chân trời, rồi nhắc bằng chữ. Hướng "AI phát hiện, quy tắc ra lời khuyên" vì vậy là hướng đã được thử, không phải ý tưởng chưa ai làm.
5. **Bộ dữ liệu bố cục có sẵn nhưng không hợp người.** KU-PCP có 9 lớp (1/3, giữa, ngang, đối xứng, chéo, cong, dọc, tam giác, lặp lại) nhưng không có đường dẫn, và không tập trung vào ảnh có người ([KU-PCP](https://mcl.korea.ac.kr/research/Submitted/jtlee_JVCIR2018/index.html)). Tự huấn luyện model bố cục là việc lớn, không cần cho v1.

## 2. App đã đo được gì (không cần model mới)

| Nguồn | Có sẵn ở | Cho biết |
|---|---|---|
| Tách người Multiclass | WebView (Phase 1) | Vùng người, tóc, da mặt, áo → khung người, đỉnh đầu, diện tích người, độ tương phản người / nền |
| FaceLandmarker | WebView | Mắt, mũi, đường mặt → vị trí mắt, hướng mặt (trái / phải), cỡ mặt |
| PoseLandmarker 33 khớp | WebView | Vai, khuỷu, cổ tay, hông, gối, cổ chân → cỡ cảnh, khớp sát mép, hướng thân, số người |
| Cảm biến trọng lực | `useAnimatedSensor` (thước cân bằng) | Máy nghiêng trái / phải (chân trời), ngửa / cúi (góc thấp, góc cao) |
| Ống kính và zoom đang dùng | `CameraLayer` | 0,5× / 1× / 2× → gợi ý ống kính |
| Camera trước / sau | Camera | Đang selfie hay không |

Muốn có gợi ý lúc đang ngắm, app phải tự chụp ảnh nhỏ định kỳ. Lý do: Expo Go không đọc được từng khung hình. `takePictureAsync` của expo-camera 58 có `shutterSound: false`, cần đo xem được mấy ảnh một giây. Phân tích sau khi chụp thì không vướng giới hạn này.

## 3. Danh mục kỹ thuật

Cột **Đo**: Dễ = có sẵn dữ liệu ở §2; Vừa = cần tính thêm; Khó = cần dò cạnh / đường thẳng hoặc hiểu cảnh; — = chỉ dạy, không đo.

### A. Đặt người trong khung

| # | Kỹ thuật | Quy tắc thường dùng | Khi nào phá lệ | Đo | App đo bằng |
|---|---|---|---|---|---|
| A1 | **Quy tắc 1/3** | Mắt nằm quanh đường 1/3 trên; người đứng trên đường dọc 1/3 ([Photography Mad](https://www.photographymad.com/pages/view/3-portrait-composition-tips-for-framing-your-subject-perfectly)) | Chân dung chính diện, nền đối xứng | Dễ | Mắt (FaceLandmarker), khung người |
| A2 | **Ở giữa và đối xứng** | Người ở trục giữa, nền hai bên cân | Nền lệch, người nhìn sang ngang | Dễ (người) / Khó (nền) | Tâm người so với trục giữa |
| A3 | **Khoảng trống trên đầu** | Ít khoảng trống trên đầu; mắt ở khoảng 1/3 trên. Thừa trên đầu là lỗi người mới hay gặp nhất ([Headroom](https://wikipedia.com/wiki/Headroom_(photographic_framing))) | Ảnh rộng có cảnh, chụp cận cố ý cắt tóc | Dễ | Đỉnh đầu (mask) so với mép trên |
| A4 | **Khoảng trống phía nhìn / phía đi** | Chừa nhiều chỗ ở phía người đang nhìn hoặc đi tới; không để người "nhìn vào tường" ([Photography Icon](https://photographyicon.com/headroom/)) | Cố ý tạo cảm giác bí bách | Vừa | Hướng mặt / vai trái phải + vị trí người |
| A5 | **Không đặt sát mép** | Người sát mép kéo mắt ra khỏi ảnh ([PetaPixel](https://petapixel.com/photography-tips-for-landscapes-with-people-in-them/)) | Chủ ý cắt một phần người | Dễ | Khung người so với mép |
| A6 | **Lấp đầy khung / không gian âm** | Chọn một: người to rõ, hoặc người nhỏ giữa khoảng trống lớn để kể chuyện; người dưới ~1/4 bề rộng khung là "nhỏ" ([Adorama](https://www.adorama.com/alc/wildlife-photography-when-you-cant-fill-the-frame/)) | — | Dễ | Diện tích người |

### B. Cỡ cảnh và chỗ cắt

| # | Kỹ thuật | Quy tắc thường dùng | Đo | App đo bằng |
|---|---|---|---|---|
| B1 | **Cỡ cảnh** | Cận mặt (vai trở lên), trung cận (ngực), trung (eo), 3/4 (gối), toàn thân; toàn thân chừa chỗ trên đầu và dưới chân ([MasterClass](https://www.masterclass.com/articles/shot-sizes-explained), [SLR Lounge](https://www.slrlounge.com/portrait-cropping-guide-bad-portrait-crops-how-to-fix-them/)) | Dễ | Khớp nào còn trong khung |
| B2 | **Không cắt ngang khớp** | Không để mép khung đi qua cổ, khuỷu, cổ tay, gối, cổ chân; cắt ở giữa đùi / bắp chân thay vì gối ([PhotographyTalk](https://www.photographytalk.com/contest-articles/7375-how-to-crop-portraits-an-essential-guide)) | Dễ | Khớp nằm sát mép khung |

### C. Góc máy và ống kính (riêng điện thoại)

| # | Kỹ thuật | Quy tắc thường dùng | Đo | App đo bằng |
|---|---|---|---|---|
| C1 | **Máy thẳng** | Chân trời và đường dọc không nghiêng | Dễ (đã có) | Cảm biến nghiêng trái / phải |
| C2 | **Góc thấp kéo dài chân** | Hạ máy ngang hông hoặc thấp hơn, ngửa nhẹ, chụp toàn thân; ống 0,5× làm rõ hơn nhưng dễ méo ([Adorama](https://www.adorama.com/alc/low-angle-shot), [iPhotography](https://www.iphotography.com/blog/low-angle-photography-without-kneeling/)) | Dễ | Máy ngửa (cảm biến) + cỡ cảnh toàn thân + zoom |
| C3 | **Ngang tầm mắt / selfie hơi cao** | Chân dung: máy ngang mắt; selfie: hơi cao hơn mắt, nghiêng mặt nhẹ ([PopSci](https://www.popsci.com/story/diy/take-better-selfies/)) | Dễ | Cảm biến + camera trước |
| C4 | **Khoảng cách và ống kính** | Đứng quá gần với ống rộng làm mũi to, mặt méo; lùi ra và dùng khoảng 2× ([How-To Geek](https://www.howtogeek.com/678397/why-people-look-different-in-photos-taken-with-different-lenses/), [PhoneArena](https://www.phonearena.com/news/Did-you-know-here-is-how-you-can-take-better-portrait-pictures-on-your-smartphone_id74860)) | Dễ | Cỡ mặt trong khung + zoom đang dùng |

### D. Nền và đường nét

| # | Kỹ thuật | Quy tắc thường dùng | Đo | Ghi chú |
|---|---|---|---|---|
| D1 | **Tách người khỏi nền** | Người khác tông / sáng với nền sau đầu; tóc sáng trên trời sáng là "dính tông" ([Zoner](https://learn.zoner.com/portrait-backgrounds-the-most-common-composition-mistakes/)) | Vừa | Có mask nên so được độ sáng người với vòng nền quanh người |
| D2 | **Không có vật "mọc" sau đầu, chân trời không cắt cổ** | Bước sang trái / phải một chút thay vì sửa sau ([PetaPixel](https://petapixel.com/2022/05/22/in-portrait-photography-beware-lines-intersecting-your-subjects-head), [Fstoppers](https://fstoppers.com/education/common-easily-fixed-mistake-portrait-photography-275518)) | Khó | Cần dò đường thẳng quanh đầu; v1 chỉ dạy |
| D3 | **Đường dẫn** | Đường, hàng rào, cầu thang dẫn mắt tới người; tìm đường trước rồi đặt người ([Imaginated](https://www.imaginated.com/photography/composition/techniques/)) | Khó | Dò đường thẳng; có thể thử sau |
| D4 | **Khung trong khung** | Cửa, vòm, cành lá bao quanh người; ống rộng của điện thoại dễ đưa tiền cảnh vào ([Imaginated](https://imaginated.com/photography/composition/techniques/frame-within-a-frame)) | — | Chỉ dạy |
| D5 | **Tiền cảnh tạo chiều sâu** | Đặt vật gần máy (lá, ly, lan can) để có lớp trước – người – nền | — | Chỉ dạy |

### E. Nhiều người

| # | Kỹ thuật | Quy tắc thường dùng | Đo | App đo bằng |
|---|---|---|---|---|
| E1 | **Đầu so le, xếp tam giác** | Tránh mọi đầu cùng một độ cao; nối các đầu thành tam giác; hàng sau đứng vào khe hàng trước ([Digital Photo Mentor](https://www.digitalphotomentor.com/?p=79479), [Daily Photo Tips](https://dailyphototips.com/portraits/group-photos/)) | Vừa | Đỉnh đầu từng người (tách người + khớp) |
| E2 | **Khoảng cách đều** | Không để hai người dính nhau, hai người cách xa | Vừa | Khoảng cách giữa các người |

### F. Ánh sáng (không phải bố cục nhưng quyết định ảnh điện thoại)

| # | Kỹ thuật | Đo | Ghi chú |
|---|---|---|---|
| F1 | **Ngược sáng / mặt tối** | Vừa | So độ sáng mặt với nền; gợi ý đổi hướng hoặc chạm để đo sáng mặt |
| F2 | **Nguồn sáng trước mặt, ánh sáng mềm, giờ vàng** | — | Chỉ dạy; cảm biến nhỏ của điện thoại kém trong tối ([Engadget](https://www.engadget.com/cameras/how-to-improve-your-smartphone-photography-010037588.html)) |

## 4. Đề xuất số kỹ thuật

Chấm mỗi kỹ thuật theo 4 tiêu chí: hợp ảnh có người, hợp điện thoại, đo được bằng thứ app đã có, và người mới hay mắc.

**v1 có hướng dẫn trên camera: 10 kỹ thuật.** Đều đo được bằng dữ liệu đã có, không cần model mới:

| Nhóm | Kỹ thuật |
|---|---|
| Đặt người | A1 Quy tắc 1/3 · A2 Ở giữa · A3 Khoảng trên đầu · A4 Khoảng phía nhìn · A5 Không sát mép |
| Cắt | B1 + B2 Cỡ cảnh và không cắt khớp (gộp một) |
| Góc máy | C1 Máy thẳng · C2 Góc thấp kéo chân · C3 Ngang mắt / selfie · C4 Khoảng cách và ống kính |
| Nhiều người | E1 Đầu so le |

**v1 chỉ dạy (thẻ học, không đo): 5 kỹ thuật.** D2 Vật mọc sau đầu, D3 Đường dẫn, D4 Khung trong khung, D5 Tiền cảnh, F2 Ánh sáng.

**Để sau (cần đo thêm hoặc model mới):** A6 Không gian âm, D1 Tách nền, E2 Khoảng cách, F1 Ngược sáng, phát hiện D2 / D3 bằng dò đường thẳng.

Tổng v1: **15 kỹ thuật**, trong đó **10 có hướng dẫn** trên camera.

**Đã chốt phạm vi:**
- Giữ cả các mục không hẳn là quy tắc bố cục (góc thấp, selfie, khoảng cách – ống kính, ánh sáng) vì giúp ảnh có người đẹp hơn.
- Đường chân trời và đường dẫn chia hai mức. **Phase 5 (đơn giản):** chân trời = máy thẳng + lớp kẻ hai đường ngang 1/3; đường dẫn = lớp kẻ hai đường chéo hội tụ về giao điểm 1/3, người dùng tự xếp cảnh, app không dò. **Phase 5a (nâng cao):** app dò đường thẳng trong ảnh để tìm chân trời, đường dẫn và vật "mọc" sau đầu, có cổng quyết định riêng. **Phase 5b:** model AI tự chọn kỹ thuật.

## 5. Ghép với pose

- Mỗi pose mẫu gắn 1–2 kỹ thuật hợp với nó. Ví dụ selfie: C3 + A2; toàn thân ngoài phố: A1 + C2 + B1.
- Kéo pose trên camera thì dính vào đường và giao điểm 1/3 (A1) hoặc trục giữa (A2).
- Pose đã cho biết cỡ cảnh (B1): app so cỡ cảnh của pose với người thật trong khung.

## 6. Còn phải quyết

1. Người dùng chọn kỹ thuật rồi app dẫn, hay app tự đoán kỹ thuật hợp cảnh? **Đã chốt:** Phase 5 người dùng chọn; Phase 5b thêm "Tự chọn" bằng model tự huấn luyện (phân loại khung cảnh → kỹ thuật), có cổng quyết định riêng (roadmap).
2. Gợi ý sau khi chụp, lúc đang ngắm, hay cả hai? Phụ thuộc kết quả đo `takePictureAsync({ shutterSound: false })`.
3. Thẻ học đặt ở đâu.
4. Có cho AI trên cloud hay không (khuyên không, giữ nguyên tắc ảnh không rời máy).
