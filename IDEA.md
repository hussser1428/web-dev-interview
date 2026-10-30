# DevInterview – App học & luyện phỏng vấn IT

> Một nơi để **học kiến thức → luyện câu hỏi → phỏng vấn thử với AI → nhận feedback → ôn lại chỗ yếu**, cho mọi mảng liên quan đến code.

Mockup: [mockups/](mockups/) (mở `mockups/index.html?s=dashboard|bank|interview|project|report` để xem bản HTML)

---

## 1. Vấn đề & người dùng

| Người dùng | Nỗi đau |
|---|---|
| Sinh viên / Fresher | Không biết nên học gì, câu hỏi rải rác khắp nơi, chưa từng phỏng vấn thật |
| Junior → Mid | Biết làm nhưng **giải thích không trôi**, bị hỏi sâu vào project của mình là bí |
| Người chuyển mảng (vd: Backend → AI) | Cần lộ trình nhanh, biết câu nào hay được hỏi |

Điểm khác biệt so với LeetCode / InterviewBit / các repo GitHub:
1. **Hỏi về chính project của bạn** (đọc repo GitHub / CV) – thứ nhà tuyển dụng VN hỏi nhiều nhất nhưng không chỗ nào luyện được.
2. **AI interviewer nói tiếng Việt**, biết hỏi follow-up như người thật.
3. Hỏi theo **level & loại công ty** (outsource / product / big tech). Gắn câu với tên công ty cụ thể (Shopee, FPT…) để sau: chỉ làm khi có nguồn kiểm chứng được, qua đóng góp của cộng đồng có kiểm duyệt — không tự gắn bằng phỏng đoán.

---

## 2. Các mảng nội dung

Frontend · Backend · Fullstack · Mobile (iOS/Android/Flutter/RN) · AI/ML/LLM · Data Engineer/Analyst · DevOps/Cloud/SRE · Security · Tester/QA · Embedded · Game dev
Cộng các phần chung: **DSA, System Design, OS, Network, Database, OOP/Design Pattern, Behavioral (STAR)**.

Mỗi câu hỏi có: mảng, chủ đề, level (Intern → Senior), nguồn, đáp án gợi ý (bản 30 giây + bản chi tiết), code mẫu, câu follow-up, lỗi hay gặp.

---

## 3. Tính năng chính

### MVP (làm trước)
1. **Ngân hàng câu hỏi** – lọc theo mảng / level / chủ đề; chế độ "tự trả lời trước rồi mới xem đáp án".
2. **Phỏng vấn thử với AI** – chọn vị trí + level + phong cách (outsource / product / big tech); trả lời bằng **gõ hoặc giọng nói**; có code editor; AI hỏi follow-up dựa trên câu trả lời.
3. **Báo cáo sau buổi phỏng vấn** – điểm theo tiêu chí (kiến thức, giải quyết vấn đề, code, giao tiếp), so sánh câu trả lời của bạn với câu trả lời mẫu, câu yếu tự đưa vào danh sách ôn.
4. **Project Deep-dive** – dán link GitHub hoặc tải CV → AI phân tích tech stack, điểm mạnh/rủi ro → sinh câu hỏi gắn với file/dòng code cụ thể.
5. **Dashboard + lộ trình** – mức thành thạo từng mảng, kế hoạch mỗi ngày, đếm ngược ngày phỏng vấn.

### Giai đoạn 2
- Flashcards ôn lặp lại ngắt quãng (spaced repetition).
- Live coding có chạy test (sandbox).
- Phân tích giọng nói: tốc độ, từ đệm, khoảng im lặng.
- Cộng đồng: chia sẻ kinh nghiệm phỏng vấn theo công ty (kiểu Glassdoor), bình chọn đáp án; từ đây mới gắn câu hỏi với công ty (cần đăng nhập + database + kiểm duyệt).
- Phỏng vấn tiếng Anh, chế độ phỏng vấn nhóm/HR.

---

## 4. Nguồn nội dung

| Nguồn | Cách dùng |
|---|---|
| GitHub: `kamranahmedse/developer-roadmap`, `yangshun/tech-interview-handbook`, `donnemartin/system-design-primer`, `sudheerj/javascript-interview-questions`, `sudheerj/reactjs-interview-questions`, `DopplerHQ/awesome-interview-questions`, `alirezadir/Machine-Learning-Interviews`, `chiphuyen/ml-interviews-book`, `Devinterview-io/*` | Lấy danh sách chủ đề & câu hỏi, **kiểm tra license** (MIT/CC thì dùng được, ghi nguồn) |
| Viblo, TopDev, ITviec blog, Dev.to, roadmap.sh | Câu hỏi thực tế ở VN, bài giải thích tiếng Việt |
| Review phỏng vấn trên Glassdoor, nhóm Facebook, Reddit (r/cscareerquestions) | Tham khảo xu hướng câu hay hỏi theo level/loại công ty – **chỉ tóm tắt, không copy nguyên văn**, không ghi tên công ty khi chưa kiểm chứng |
| Người dùng đóng góp | Kinh nghiệm phỏng vấn, có kiểm duyệt |
| AI sinh thêm | Đáp án gợi ý, follow-up, câu hỏi theo project – **có người duyệt** trước khi vào ngân hàng chung |

Quy trình: crawl/nhập → AI chuẩn hoá (phân loại mảng, level, loại bỏ trùng lặp) → người duyệt → xuất bản.

---

## 5. Gợi ý công nghệ

- **Frontend:** Next.js + Tailwind + shadcn/ui; Monaco Editor cho code.
- **Backend:** Next.js API routes hoặc NestJS; PostgreSQL (+ `pgvector` để tìm câu hỏi tương tự / chống trùng lặp).
- **AI:** MVP dùng Gemini API (free tier từ Google AI Studio). Gom mọi lời gọi AI vào 1 file `lib/ai.ts` để sau đổi sang Claude API (`claude-sonnet-5-5` cho phỏng vấn, `claude-opus-5-5` cho chấm điểm & phân tích repo) mà không phải sửa chỗ khác.
- **Giọng nói:** Web Speech API (miễn phí, làm MVP) → nâng cấp lên dịch vụ speech-to-text tốt hơn cho tiếng Việt.
- **Đọc repo:** GitHub API lấy cây thư mục + các file quan trọng (README, package.json, các service chính) rồi đưa cho AI.
- **Auth:** đăng nhập bằng GitHub/Google (GitHub còn giúp lấy repo luôn).

---

## 6. Kiếm tiền

- **Free:** ngân hàng câu hỏi, 3 buổi phỏng vấn AI/tháng.
- **Pro (~99k/tháng):** phỏng vấn không giới hạn, chấm giọng nói, Project deep-dive, xuất PDF.
- **B2B:** trường đại học / bootcamp mua cho sinh viên; công ty dùng để sàng lọc ứng viên.

---

## 7. Lộ trình làm

1. **Tuần 1–2:** ngân hàng câu hỏi (≈500 câu cho 3 mảng: Frontend, Backend, DSA) + giao diện xem/lọc.
2. **Tuần 3–4:** phỏng vấn AI dạng chat gõ phím + báo cáo chấm điểm.
3. **Tuần 5–6:** Project Deep-dive từ link GitHub.
4. **Tuần 7+:** giọng nói, dashboard/lộ trình, flashcards, mở thêm mảng.
