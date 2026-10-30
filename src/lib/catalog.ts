import type { CSSProperties } from "react";

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

// Màu cho từng mảng / level: [màu chữ/icon — sắc 700, đạt tương phản 4.5:1 trên nền trắng, màu cuối gradient] -> CSS var --c / --c2 (xem .tagc, .chipi trong globals.css).
export const trackColor: Record<Track, [string, string]> = {
  frontend: ["#0e7490", "#3b82f6"],
  backend: ["#6d28d9", "#c026d3"],
  ai: ["#b45309", "#f97316"],
  devops: ["#047857", "#0891b2"],
  mobile: ["#be185d", "#9333ea"],
  data: ["#1d4ed8", "#6366f1"],
  dsa: ["#c2410c", "#e11d48"],
  "system-design": ["#b91c1c", "#db2777"],
  behavioral: ["#475569", "#64748b"],
};
export const levelColor: Record<Level, [string, string]> = {
  intern: ["#047857", "#0e7490"],
  junior: ["#1d4ed8", "#6366f1"],
  mid: ["#b45309", "#ea580c"],
  senior: ["#b91c1c", "#be123c"],
};

// Nút tự chấm Khó / Vừa / Dễ (srs Rating 1/2/3).
export const ratingColor: Record<1 | 2 | 3, [string, string]> = { 1: ["#b91c1c", "#b91c1c"], 2: ["#b45309", "#b45309"], 3: ["#047857", "#047857"] };
export const dueColor: [string, string] = ["#b45309", "#ea580c"];

/** style={hue(trackColor[t])} để đặt --c / --c2. */
export const hue = ([c, c2]: [string, string]) => ({ "--c": c, "--c2": c2 }) as CSSProperties;
