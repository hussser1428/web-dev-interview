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
| 13 | **Báo cáo → ôn tập** | AI gắn mỗi câu phỏng vấn với câu cùng ý trong ngân hàng; mọi câu dưới 5 điểm (kể cả câu về project) lưu ở trang riêng **Câu yếu** (`/weak`: câu trả lời của bạn, nhận xét, câu trả lời mẫu, "lần sau nên", luyện lại với AI, đánh dấu đã nắm), câu khớp ngân hàng vào lịch ôn ngay hôm đó; dashboard hiện điểm buổi gần nhất + xu hướng (30 buổi gần nhất, localStorage) | ✅ |
| 14 | **Mở rộng ngân hàng — đợt 1** | Mảng mới **Nền tảng CS** (30 câu: OOP, Clean Code, Design Patterns, ngôn ngữ lập trình, hệ điều hành, mạng, bảo mật & mã hoá ký tự) ✅ · AI/LLM +15 và DSA +15 (thêm chủ đề Matrix; code DSA đã chạy thử) ✅ · Behavioral +18 câu bối cảnh VN (chủ đề mới Working with Clients, Work Culture; OT, khách Nhật/horenso, deal lương gross/net, thời gian báo trước) ✅. Không gắn tên công ty (xem IDEA.md) | ✅ |
| 18 | **Mở rộng ngân hàng — đợt 2** | +26 câu: Backend +6 (presigned upload, Redis ngoài cache, background job/cron, structured logging, scale WebSocket, Saga), Data +6 (bẫy NULL, pandas groupby/merge, dbt, stream processing, thống kê cho analyst, PII/governance), Mobile +6 (accessibility, chủ đề mới Navigation + deep link, state Flutter, tác vụ nền, tải ảnh), DevOps +4 (Nginx, Docker Compose, Helm/GitOps, serverless), AI +4 (hệ gợi ý, multimodal, guardrails, thiết kế hệ thống chống gian lận). Tổng 400 câu. Còn: Behavioral Senior, CS Mid/Senior, System Design, Frontend, DSA | ⏳ |
| 19 | **Mảng mới QA / Tester** | 36 câu (Testing Fundamentals, Test Design gồm 2 bài tập viết test case, Test Types, Bug Management, Test Planning & Agile, SQL & API, Automation với Playwright, Performance & Strategy). Đề câu hỏi lấy từ nguồn công khai (Viblo, CareerLink, BugBug) và tin tuyển dụng QA; đáp án tự viết; SQL chạy thử trên SQLite, code Playwright/k6/Postman kiểm tra cú pháp. +33 thuật ngữ QA. Tổng 436 câu | ✅ |
| 20 | **Mảng mới Java & Spring** | 43 câu (Core Java, Collections, Streams & Lambda, Concurrency, JVM & Memory, Spring Core, Spring MVC & REST, Spring Data JPA, Spring Security, Testing, Production & Microservices; có live coding, bài thiết kế REST API, sự cố production). Đề lấy từ ITviec, CareerLink, Glassdoor và tin tuyển dụng Java; đáp án tự viết. Code Java thuần chạy thật bằng jshell (JDK 21), code Spring biên dịch bằng javac với Spring Boot 3.5 / Spring 6.2 / Security 6.5, YAML parse thử. +43 thuật ngữ Java/Spring, mở 15 thuật ngữ backend cho mảng java. Tổng 479 câu | ✅ |
| 15 | **Thuật ngữ** | 273 thuật ngữ (`src/data/glossary.json`) tự nhận diện trong tiêu đề + đáp án (quét bổ sung các thuật ngữ hay gặp chưa có; bỏ qua từ dính dấu chấm như `index.html`), bấm hiện popup: nghĩa, ví dụ đời thường, link câu giải thích đầy đủ; trang **Thuật ngữ** (A–Z, tìm kiếm, lọc mảng, đã hiểu / chưa hiểu, xuất hiện trong câu nào, thuật ngữ liên quan). Còn: ôn thuật ngữ bằng flashcard | ⏳ |
| 16 | **Ví dụ thực tế** | Trường `example` (so sánh đời thường / tình huống dự án) hiện dưới "Trả lời 30 giây", có đánh dấu thuật ngữ; `check:data` báo tỉ lệ theo mảng. Đã có: CS 30/30, Backend 47/47, Frontend 43/43, DevOps 40/40, AI 55/55, Mobile 33/33, Data 33/33, System Design 29/29, Behavioral 38/38 (câu trả lời mẫu), QA 36/36, Java 43/43. Còn: dsa | ⏳ |
| 17 | **Bổ sung code minh hoạ** | +61 đoạn code ở những câu "làm thế nào / sửa thế nào" (SQL, lệnh Linux, YAML, Kotlin, Python, TS); câu khái niệm, kiến trúc, quy trình, System Design, Behavioral giữ dạng chữ. Có code: 299/479 | ✅ |

Để sau: live coding có chạy test (sandbox), đăng nhập + database (đồng bộ nhiều thiết bị), cộng đồng, xuất PDF ôn tập, lưu nhiều project.
