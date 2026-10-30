# DevInterview – web

App học & luyện phỏng vấn IT (Next.js 16, Tailwind 4). Hỗ trợ tiếng Việt và tiếng Anh.
~300 câu hỏi song ngữ cho 9 mảng, lộ trình học, flashcards ôn lặp lại ngắt quãng, theo dõi tiến độ.
Tiến độ lưu trong trình duyệt (localStorage), chưa cần đăng nhập.

## Chạy

```bash
npm install
npm run dev          # http://localhost:3000
```

Phỏng vấn AI (Beta) cần thêm key: `cp .env.example .env.local` rồi điền `GEMINI_API_KEY` (miễn phí ở https://aistudio.google.com).
Project Deep-dive (`/project`) dùng chung key đó để đọc repo GitHub công khai; thêm `GITHUB_TOKEN` (tuỳ chọn) nếu bị giới hạn 60 lượt gọi GitHub/giờ.

## Kiểm tra

```bash
npm run check:data   # kiểm tra src/data/questions/*.json (id, level, đủ vi/en…)
npm test             # test logic lịch ôn / chuỗi ngày học (src/lib/srs.ts)
npm run lint && npm run build
```

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| `src/data/questions/<mảng>.json` | Câu hỏi của từng mảng. **Thứ tự trong file = thứ tự lộ trình học** |
| `src/lib/catalog.ts` | Danh sách mảng, level, màu tag |
| `src/lib/questions.ts` | Đọc câu hỏi, lộ trình theo chủ đề |
| `src/lib/github.ts`, `src/lib/project.ts` | Project Deep-dive: đọc repo GitHub cho AI; schema kết quả phân tích |
| `src/lib/srs.ts` | Lịch ôn (Khó 1 ngày, Vừa ×1.5, Dễ ×2.5), chuỗi ngày, hàng đợi flashcard |
| `src/lib/progress.ts` | Lưu/đọc tiến độ trong localStorage |
| `src/locales.ts`, `src/i18n.ts`, `src/dictionaries/*.json` | Đa ngôn ngữ |
| `src/proxy.ts` | `/abc` → `/vi/abc` hoặc `/en/abc` theo cookie / ngôn ngữ trình duyệt |
| `src/lib/ai.ts`, `src/app/api/interview/` | Phỏng vấn AI (Beta) |
| `src/app/[lang]/` | Trang: tổng quan, ngân hàng câu hỏi, lộ trình, flashcards, phỏng vấn |

## Thêm câu hỏi

Thêm object vào `src/data/questions/<mảng>.json`, đặt đúng vị trí trong lộ trình, rồi chạy `npm run check:data`:

```jsonc
{
  "id": "backend-ten-cau-hoi",          // bắt đầu bằng "<mảng>-", không trùng
  "level": "junior",                    // intern | junior | mid | senior
  "topic": "Database",                  // tên chủ đề (gom nhóm trong lộ trình)
  "q": { "vi": "…", "en": "…" },
  "a": { "vi": "…", "en": "…" },
  "code": "…",                          // tuỳ chọn
  "tip": { "vi": "…", "en": "…" },      // tuỳ chọn: mẹo ghi điểm
  "followUps": [{ "vi": "…", "en": "…" }], // tuỳ chọn
  "source": "https://…"                 // tuỳ chọn: link tham khảo
}
```

## Thêm thuật ngữ

Thêm object vào `src/data/glossary.json` rồi chạy `npm run check:data`. Thuật ngữ được tự nhận diện trong tiêu đề và đáp án (chỉ lần xuất hiện đầu), bấm vào hiện popup; trang `/glossary` liệt kê tất cả.

```jsonc
{
  "id": "slo",                                  // kebab-case, không trùng
  "term": "SLO",
  "full": { "vi": "…", "en": "…" },             // tuỳ chọn: tên đầy đủ
  "match": ["SLO", "SLOs"],                     // cách viết trong đáp án; viết hoa toàn bộ thì chỉ khớp đúng chữ hoa
  "def": { "vi": "…", "en": "…" },              // 1–2 câu
  "example": { "vi": "…", "en": "…" },          // tuỳ chọn: ví dụ đời thường
  "see": "devops-sre-sli-slo-error-budget",     // tuỳ chọn: câu hỏi giải thích sâu
  "related": ["sli", "sla"],                    // tuỳ chọn
  "tracks": ["devops"]                          // tuỳ chọn: chỉ nhận diện trong các mảng này (từ nhiều nghĩa)
}
```

## Thêm ngôn ngữ mới (vd: tiếng Nhật)

1. Thêm `"ja"` vào `locales` và `localeNames` trong `src/locales.ts`.
2. Copy `src/dictionaries/en.json` → `ja.json`, dịch, đặt `meta.speechLang` = `"ja-JP"`.
3. Thêm 1 dòng `ja: () => import("./dictionaries/ja.json")…` trong `src/i18n.ts`.
4. Câu hỏi: thêm key `"ja"` vào `q` / `a` / `tip` / `followUps`. Câu chưa dịch tự hiện bản tiếng Anh.

TypeScript báo lỗi nếu quên bước 2–3 hoặc thiếu key trong từ điển.
