// Nhận diện thuật ngữ trong văn bản (logic thuần, dùng được cả server lẫn client) — test ở scripts/test-glossary.ts.
import type { Level, Track } from "./catalog";

/** Đoạn văn đã đánh dấu: chuỗi thường, hoặc thuật ngữ g (id trong glossary). self = câu hỏi đang xem chính là nơi giải thích nó. */
export type Seg = string | { t: string; g: string; self?: true };

/** Thuật ngữ đã chọn ngôn ngữ, gửi xuống client cho popup / trang Thuật ngữ. */
export type TermItem = {
  id: string;
  term: string;
  full?: string;
  def: string;
  example?: string;
  see?: QuestionRef;
};
export type QuestionRef = { id: string; title: string; track: Track; level: Level };
export type TermMap = Record<string, TermItem>;

type Entry = { id: string; match: string[]; tracks?: readonly Track[]; see?: string };
export type Matcher = ReturnType<typeof makeMatcher>;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

/** Từ viết hoa toàn bộ (SLO, CAP, JWT) chỉ khớp đúng chữ hoa; còn lại không phân biệt hoa thường. */
export function makeMatcher(entries: Entry[]) {
  const forms = new Map<string, { id: string; form: string; exact: boolean }>();
  for (const e of entries)
    for (const form of e.match) forms.set(form.toLowerCase(), { id: e.id, form, exact: /[A-Z]/.test(form) && form === form.toUpperCase() });
  // Cụm dài trước để "load balancer" thắng "load"; ranh giới là ký tự không phải chữ/số (kể cả chữ có dấu tiếng Việt).
  const alt = [...forms.values()].map((f) => f.form).sort((a, b) => b.length - a.length).map(escape).join("|");
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${alt})(?![\\p{L}\\p{N}])`, "giu");
  return { re, forms, byId: new Map(entries.map((e) => [e.id, e])) };
}

/** Tách text thành đoạn thường + thuật ngữ. Mỗi thuật ngữ chỉ đánh dấu lần đầu (seen dùng chung cho cả một đáp án). */
export function annotate(text: string, m: Matcher, ctx: { track: Track; questionId?: string; seen: Set<string> }): Seg[] {
  const out: Seg[] = [];
  let last = 0;
  for (const hit of text.matchAll(m.re)) {
    const f = m.forms.get(hit[0].toLowerCase());
    if (!f || (f.exact && hit[0] !== f.form) || ctx.seen.has(f.id)) continue;
    const e = m.byId.get(f.id)!;
    if (e.tracks && !e.tracks.includes(ctx.track)) continue;
    ctx.seen.add(f.id);
    if (hit.index > last) out.push(text.slice(last, hit.index));
    out.push(e.see && e.see === ctx.questionId ? { t: hit[0], g: f.id, self: true } : { t: hit[0], g: f.id });
    last = hit.index + hit[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Các id thuật ngữ xuất hiện trong danh sách đoạn. */
export const termIds = (...lists: Seg[][]) => lists.flat().flatMap((s) => (typeof s === "string" ? [] : [s.g]));
