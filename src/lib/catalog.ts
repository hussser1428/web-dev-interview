// Danh sách mảng & level. Tên hiển thị nằm trong dictionaries/*.json (tracks.*, levels.*).
export const tracks = ["frontend", "backend", "ai", "devops", "mobile", "data", "dsa", "system-design", "behavioral"] as const;
export const levels = ["intern", "junior", "mid", "senior"] as const;
// Phong cách phỏng vấn theo loại công ty. Tên hiển thị: interview.styles.* trong dictionaries.
export const styles = ["outsource", "product", "bigtech"] as const;

export type Track = (typeof tracks)[number];
export type Level = (typeof levels)[number];
export type Style = (typeof styles)[number];

export const isTrack = (v: unknown): v is Track => tracks.includes(v as Track);
export const isLevel = (v: unknown): v is Level => levels.includes(v as Level);
export const isStyle = (v: unknown): v is Style => styles.includes(v as Style);

/** Bản gọn của câu hỏi (đã chọn ngôn ngữ) để gửi xuống client. */
export type QuestionItem = { id: string; track: Track; level: Level; topic: string; title: string };

// Màu tag cho từng mảng (viết đầy đủ class để Tailwind nhận ra).
export const trackColor: Record<Track, string> = {
  frontend: "border-cyan-800 bg-cyan-950/60 text-cyan-300",
  backend: "border-violet-800 bg-violet-950/60 text-violet-300",
  ai: "border-amber-800 bg-amber-950/60 text-amber-300",
  devops: "border-green-800 bg-green-950/60 text-green-300",
  mobile: "border-pink-800 bg-pink-950/60 text-pink-300",
  data: "border-blue-800 bg-blue-950/60 text-blue-300",
  dsa: "border-orange-800 bg-orange-950/60 text-orange-300",
  "system-design": "border-red-800 bg-red-950/60 text-red-300",
  behavioral: "border-slate-700 bg-slate-900 text-slate-300",
};
