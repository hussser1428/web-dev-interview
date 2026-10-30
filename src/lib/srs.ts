// Logic ôn tập thuần (không phụ thuộc React/trình duyệt) — test ở scripts/test-srs.ts.
// Ngày luôn ở dạng "YYYY-MM-DD" theo giờ địa phương.

export type Rating = 1 | 2 | 3; // 1 = khó, 2 = vừa, 3 = dễ
export const ratingKey = { 1: "hard", 2: "medium", 3: "easy" } as const;

export type QState = { saved?: boolean; rating?: Rating; interval?: number; due?: string };
export type Progress = {
  q: Record<string, QState>;
  days: Record<string, number>; // số lần luyện theo ngày
  last?: string; // id câu luyện gần nhất
  interviewDate?: string;
};
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
