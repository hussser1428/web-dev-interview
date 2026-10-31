// Logic ôn tập thuần (không phụ thuộc React/trình duyệt) — test ở scripts/test-srs.ts.
// Ngày luôn ở dạng "YYYY-MM-DD" theo giờ địa phương.

import type { Level, Style, Track } from "./catalog";

export type Rating = 1 | 2 | 3; // 1 = khó, 2 = vừa, 3 = dễ
export const ratingKey = { 1: "hard", 2: "medium", 3: "easy" } as const;

export type QState = { saved?: boolean; rating?: Rating; interval?: number; due?: string };
export type Progress = {
  q: Record<string, QState>;
  days: Record<string, number>; // số lần luyện theo ngày
  last?: string; // id câu luyện gần nhất
  interviewDate?: string;
  interviews?: InterviewLog[]; // các buổi phỏng vấn AI, cũ -> mới
  weak?: WeakItem[]; // câu phỏng vấn AI bị chấm yếu, cũ -> mới
  terms?: Record<string, true>; // thuật ngữ đã đánh dấu "Đã hiểu"
  drafts?: Record<string, string>; // bản nháp tự trả lời theo id câu hỏi
  myQuestions?: string; // câu hỏi tự nhập cho phỏng vấn thử
  viewed?: string; // id câu mở gần nhất trong ngân hàng (last = câu chấm gần nhất)
};
export type InterviewLog = { date: string; track: Track; level: Level; style: Style; overall: number };
/**
 * Câu phỏng vấn AI bị chấm yếu. answer: câu trả lời của ứng viên; related: id câu cùng ý trong ngân hàng;
 * project: tên project nếu là buổi Deep-dive; done: đã đánh dấu "Đã nắm".
 */
export type WeakItem = {
  id: string; date: string; track: Track; level: Level; style: Style;
  question: string; score: number; answer?: string; feedback: string; betterAnswer: string; nextTime?: string;
  related?: string; project?: string; done?: boolean;
};
const MAX_LOGS = 30;
// ponytail: giữ tối đa 100 câu yếu trong localStorage; muốn giữ hết thì cần database.
const MAX_WEAK = 100;

/** Vượt MAX_WEAK thì bỏ câu đã nắm cũ nhất trước, hết câu đã nắm mới bỏ câu chưa nắm cũ nhất. */
function capWeak(all: WeakItem[]): WeakItem[] {
  let extra = all.length - MAX_WEAK;
  if (extra <= 0) return all;
  const drop = new Set<WeakItem>();
  for (const done of [true, false])
    for (const w of all)
      if (extra > 0 && !!w.done === done) {
        drop.add(w);
        extra--;
      }
  return all.filter((w) => !drop.has(w));
}
export const emptyProgress: Progress = { q: {}, days: {} };

export function today(d = new Date()): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

// ponytail: lịch ôn kiểu Leitner đơn giản; đổi sang SM-2/FSRS nếu cần chính xác hơn.
export function nextInterval(prev: number | undefined, rating: Rating): number {
  const p = prev ?? 0;
  if (rating === 1) return 1;
  if (rating === 2) return Math.max(2, Math.round(p * 1.5));
  return Math.max(4, Math.round(p * 2.5));
}

export function rate(p: Progress, id: string, rating: Rating, now = today()): Progress {
  const prev = p.q[id] ?? {};
  const interval = nextInterval(prev.interval, rating);
  return {
    ...p,
    q: { ...p.q, [id]: { ...prev, rating, interval, due: addDays(now, interval) } },
    days: { ...p.days, [now]: (p.days[now] ?? 0) + 1 },
    last: id,
  };
}

export function toggleSave(p: Progress, id: string): Progress {
  const prev = p.q[id] ?? {};
  return { ...p, q: { ...p.q, [id]: { ...prev, saved: !prev.saved } } };
}

export const isDone = (s?: QState) => s?.rating !== undefined;
export const isDue = (s: QState | undefined, now = today()) => !!s?.due && s.due <= now;

/** Số ngày học liên tiếp tính tới hôm nay (hôm nay chưa học thì tính tới hôm qua). */
export function streak(days: Progress["days"], now = today()): number {
  let d = days[now] ? now : addDays(now, -1);
  let n = 0;
  while (days[d]) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** Chuỗi ngày học dài nhất từng có. */
export function bestStreak(days: Progress["days"]): number {
  let best = 0;
  for (const d of Object.keys(days)) {
    if (!days[d] || days[addDays(d, -1)]) continue; // chỉ đếm từ ngày đầu mỗi chuỗi
    let n = 0;
    for (let x = d; days[x]; x = addDays(x, 1)) n++;
    best = Math.max(best, n);
  }
  return best;
}

/** Hàng đợi một phiên flashcard: thẻ đến hạn (hạn sớm trước) rồi thẻ mới theo thứ tự lộ trình. */
export function buildQueue(ids: string[], p: Progress, max: number, now = today()): string[] {
  const due = ids.filter((id) => isDue(p.q[id], now)).sort((a, b) => p.q[a].due!.localeCompare(p.q[b].due!));
  const fresh = ids.filter((id) => !isDone(p.q[id]));
  return [...due, ...fresh].slice(0, max);
}

/**
 * Ghi 1 buổi phỏng vấn AI. Mọi câu yếu vào danh sách câu yếu;
 * câu nào khớp ngân hàng thì câu đó vào ôn ngay hôm đó (như tự chấm "Khó").
 */
export function logInterview(p: Progress, log: InterviewLog, weak: WeakItem[]): Progress {
  const q = { ...p.q };
  for (const w of weak) if (w.related) q[w.related] = { ...q[w.related], rating: 1, interval: 1, due: log.date };
  return {
    ...p,
    q,
    interviews: [...(p.interviews ?? []), log].slice(-MAX_LOGS),
    weak: capWeak([...(p.weak ?? []), ...weak]),
  };
}

/** Sửa dữ liệu cũ khi đọc: câu yếu lưu trước khi có id thì gán id cố định theo vị trí. */
export function migrate(p: Progress): Progress {
  if (!p.weak?.some((w) => !w.id)) return p;
  return { ...p, weak: p.weak.map((w, i) => (w.id ? w : { ...w, id: `old-${i}` })) };
}

/** Bật/tắt "Đã nắm" cho một câu yếu. */
export const toggleWeak = (p: Progress, id: string): Progress => ({
  ...p,
  weak: p.weak?.map((w) => (w.id === id ? { ...w, done: !w.done } : w)),
});

/** Bật/tắt "Đã hiểu" cho một thuật ngữ. */
export function toggleTerm(p: Progress, id: string): Progress {
  const { [id]: was, ...rest } = p.terms ?? {};
  return { ...p, terms: was ? rest : { ...rest, [id]: true } };
}

/** Lưu bản nháp tự trả lời; nháp rỗng thì xoá khỏi tiến độ. */
export function setDraft(p: Progress, id: string, text: string): Progress {
  const drafts = { ...p.drafts };
  if (text) drafts[id] = text;
  else delete drafts[id];
  return { ...p, drafts };
}
