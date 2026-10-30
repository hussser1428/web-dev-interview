# Kế hoạch giai đoạn 2 (chưa gồm phỏng vấn AI)

Mục tiêu: app học & luyện câu hỏi dùng được thật — nhiều nội dung, có tiến độ, có ôn tập, giao diện giống mockup.
Tiến độ lưu trong trình duyệt (localStorage), chưa cần đăng nhập.

| # | Việc | Kết quả | Trạng thái |
|---|---|---|---|
| 1 | **Chuẩn hoá dữ liệu** | Mỗi mảng 1 file `src/data/questions/<mảng>.json`; thêm `tip` (mẹo ghi điểm), `followUps` (câu hỏi follow-up), `source` (link tham khảo); script kiểm tra dữ liệu | ✅ |
| 2 | **Nội dung** | 296 câu song ngữ vi/en cho 9 mảng, sắp theo thứ tự học (cơ bản → nâng cao), đáp án tự viết (không copy nguyên văn nguồn có bản quyền) | ✅ |
| 3 | **Giao diện theo mockup** | Sidebar có icon + trạng thái đang chọn, thanh tiêu đề + ô tìm kiếm, thẻ/tag màu như mockup | ✅ |
| 4 | **Ngân hàng câu hỏi 2 cột** | Danh sách bên trái (lọc mảng/level/từ khoá/trạng thái), chi tiết bên phải: đáp án, code, mẹo, follow-up, tự chấm Dễ/Vừa/Khó, lưu ⭐ | ✅ |
| 5 | **Tiến độ** | Đánh dấu đã làm, đã lưu, lịch ôn; chuỗi ngày học; lịch hoạt động | ✅ |
| 6 | **Flashcards** | Ôn lặp lại ngắt quãng: câu "Khó" quay lại sớm, câu "Dễ" giãn dần | ✅ |
| 7 | **Lộ trình học** | Mỗi mảng: các chủ đề theo thứ tự + % hoàn thành | ✅ |
| 8 | **Tổng quan (dashboard)** | Chỉ số, kế hoạch hôm nay, mức thành thạo từng mảng, lịch hoạt động, đếm ngược ngày phỏng vấn | ✅ |
| 9 | **Kiểm tra** | Script dữ liệu + test logic ôn tập, build, chụp màn hình so với mockup | ✅ |

| 10 | **Project Deep-dive** | Dán link GitHub / tải CV (PDF) → AI phân tích stack, điểm mạnh / rủi ro, 15–20 câu hỏi gắn file + dòng code; "Luyện" mở phỏng vấn AI xoay quanh project | ✅ |
| 11 | **Code editor trong phỏng vấn** | Khung code bên phải phòng phỏng vấn (chọn ngôn ngữ, Tab thụt lề); code gửi kèm câu trả lời dạng khối ``` để AI hỏi tiếp và chấm — chưa chạy code | ✅ |
| 12 | **Phong cách phỏng vấn** | Chọn Outsource / Product / Big tech; AI đổi kiểu hỏi và chấm theo kỳ vọng của loại công ty đó | ✅ |

Để sau: live coding có chạy test (sandbox), đăng nhập + database (đồng bộ nhiều thiết bị), cộng đồng, xuất PDF ôn tập, lưu nhiều project.
