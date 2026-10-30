// Kết quả phân tích project: schema gửi cho AI + type dùng ở giao diện.
import { tracks, type Track } from "./catalog";

export const categories = ["architecture", "tradeoff", "scale", "reliability", "security", "behavioral"] as const;
export type Category = (typeof categories)[number];
export type Difficulty = "easy" | "medium" | "hard";
export type FindingKind = "strength" | "likely" | "risk";

export type ProjectQuestion = {
  question: string;
  category: Category;
  difficulty: Difficulty;
  file: string;
  lines: string;
  points: string[];
};

export type Project = {
  name: string;
  summary: string;
  track: Track;
  stack: string[];
  findings: { kind: FindingKind; text: string }[];
  questions: ProjectQuestion[];
  // Do server gắn thêm, không phải AI sinh.
  repo?: string;
  files?: number;
};

/** Độ dài tối đa phần tóm tắt project gửi kèm khi phỏng vấn. */
export const MAX_CONTEXT = 8000;

const str = { type: "string" };

export const projectSchema = {
  type: "object",
  properties: {
    name: str,
    summary: str,
    track: { type: "string", enum: [...tracks] },
    stack: { type: "array", items: str },
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: { kind: { type: "string", enum: ["strength", "likely", "risk"] }, text: str },
        required: ["kind", "text"],
      },
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: str,
          category: { type: "string", enum: [...categories] },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          file: str,
          lines: str,
          points: { type: "array", items: str },
        },
        required: ["question", "category", "difficulty", "file", "lines", "points"],
      },
    },
  },
  required: ["name", "summary", "track", "stack", "findings", "questions"],
};
