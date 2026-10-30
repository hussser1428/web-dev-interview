import "server-only";
import ai from "@/data/questions/ai.json";
import backend from "@/data/questions/backend.json";
import behavioral from "@/data/questions/behavioral.json";
import cs from "@/data/questions/cs.json";
import data from "@/data/questions/data.json";
import devops from "@/data/questions/devops.json";
import dsa from "@/data/questions/dsa.json";
import frontend from "@/data/questions/frontend.json";
import mobile from "@/data/questions/mobile.json";
import java from "@/data/questions/java.json";
import qa from "@/data/questions/qa.json";
import systemDesign from "@/data/questions/system-design.json";
import { pick } from "@/locales";
import { tracks, type Level, type QuestionItem, type Track } from "./catalog";

// ponytail: đọc từ file JSON (mỗi mảng 1 file, kiểm tra bằng `npm run check:data`);
// chuyển sang database khi có người dùng đóng góp nội dung.
type Localized = Record<string, string>;
export type Question = {
  id: string;
  track: Track;
  level: Level;
  topic: string;
  q: Localized;
  a: Localized;
  code?: string;
  tip?: Localized;
  /** Ví dụ thực tế / so sánh đời thường, 2–4 câu. */
  example?: Localized;
  followUps?: Localized[];
  source?: string;
};

const files: Record<Track, unknown> = {
  frontend, backend, java, ai, devops, mobile, data, qa, cs, dsa, "system-design": systemDesign, behavioral,
};

/** Thứ tự trong file = thứ tự học (lộ trình). */
export const questions: Question[] = tracks.flatMap((track) =>
  (files[track] as Omit<Question, "track">[]).map((q) => ({ ...q, track })),
);

export const getQuestion = (id: string) => questions.find((q) => q.id === id);

export const byTrack = (track: Track) => questions.filter((q) => q.track === track);

export const toItem = (q: Question, lang: string): QuestionItem => ({
  id: q.id, track: q.track, level: q.level, topic: q.topic, title: pick(q.q, lang),
});

/** Chủ đề của một mảng theo thứ tự xuất hiện lần đầu. */
export function roadmap(track: Track) {
  const topics = new Map<string, Question[]>();
  for (const q of byTrack(track)) topics.set(q.topic, [...(topics.get(q.topic) ?? []), q]);
  return [...topics].map(([topic, qs]) => ({ topic, questions: qs }));
}
