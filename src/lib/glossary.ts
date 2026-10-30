import "server-only";
import glossaryData from "@/data/glossary.json";
import { pick } from "@/locales";
import type { Track } from "./catalog";
import { annotate, makeMatcher, termIds, type QuestionRef, type Seg, type TermItem, type TermMap } from "./glossary-match";
import { getQuestion, questions, type Question } from "./questions";

// ponytail: thuật ngữ là file JSON tĩnh, nhận diện bằng regex lúc build/render; muốn người dùng tự thêm thì cần database.
type Localized = Record<string, string>;
export type GlossaryEntry = {
  id: string;
  term: string;
  full?: Localized;
  match: string[];
  def: Localized;
  example?: Localized;
  see?: string;
  related?: string[];
  /** Chỉ nhận diện trong các mảng này (từ nhiều nghĩa như "pod", "container"). */
  tracks?: Track[];
};

export const glossary = glossaryData as GlossaryEntry[];
const byId = new Map(glossary.map((e) => [e.id, e]));
const matcher = makeMatcher(glossary);

const ref = (q: Question, lang: string): QuestionRef => ({ id: q.id, title: pick(q.q, lang), track: q.track, level: q.level });

/** Tiêu đề + đáp án đã đánh dấu thuật ngữ. Mỗi thuật ngữ chỉ đánh dấu lần đầu trong tiêu đề, và lần đầu trong đáp án. */
function annotateQuestion(q: Question, lang: string) {
  const [quick, ...rest] = pick(q.a, lang).split(/\n\s*\n/);
  const ctx = { track: q.track, questionId: q.id };
  const answer = { ...ctx, seen: new Set<string>() };
  return {
    title: annotate(pick(q.q, lang), matcher, { ...ctx, seen: new Set() }),
    quick: annotate(quick, matcher, answer),
    // thứ tự đọc: trả lời ngắn → ví dụ → giải thích, nên thuật ngữ được đánh dấu ở chỗ gặp đầu tiên
    example: q.example ? annotate(pick(q.example, lang), matcher, answer) : undefined,
    rest: annotate(rest.join("\n\n"), matcher, answer),
  };
}

export function termItem(id: string, lang: string): TermItem {
  const e = byId.get(id)!;
  const see = e.see ? getQuestion(e.see) : undefined;
  return {
    id,
    term: e.term,
    full: e.full && pick(e.full, lang),
    def: pick(e.def, lang),
    example: e.example && pick(e.example, lang),
    see: see && ref(see, lang),
  };
}

const termMap = (ids: string[], lang: string): TermMap => Object.fromEntries([...new Set(ids)].map((id) => [id, termItem(id, lang)]));

/** Dữ liệu cho trang chi tiết câu hỏi: các đoạn đã đánh dấu + thông tin những thuật ngữ có mặt. */
export function richQuestion(q: Question, lang: string) {
  const segs = annotateQuestion(q, lang);
  return { ...segs, terms: termMap(termIds(segs.title, segs.quick, segs.example ?? [], segs.rest), lang) };
}

// Thuật ngữ → các câu có nhắc tới (tính một lần lúc khởi động, gộp bản vi + en).
const appearsIn = new Map<string, Question[]>();
for (const q of questions) {
  const ids = ["vi", "en"].flatMap((lang) => {
    const s = annotateQuestion(q, lang);
    return termIds(s.title, s.quick, s.example ?? [], s.rest);
  });
  for (const id of new Set(ids)) appearsIn.set(id, [...(appearsIn.get(id) ?? []), q]);
}

export type GlossaryItem = TermItem & { tracks: Track[]; appears: QuestionRef[]; related: { id: string; term: string }[] };

/** Toàn bộ thuật ngữ cho trang Thuật ngữ, sắp xếp A–Z. */
export function glossaryItems(lang: string): GlossaryItem[] {
  return glossary
    .map((e) => {
      const qs = (appearsIn.get(e.id) ?? []).filter((q) => q.id !== e.see);
      const see = e.see ? getQuestion(e.see) : undefined;
      return {
        ...termItem(e.id, lang),
        tracks: [...new Set([...(see ? [see.track] : []), ...qs.map((q) => q.track)])],
        appears: qs.map((q) => ref(q, lang)),
        related: (e.related ?? []).map((id) => ({ id, term: byId.get(id)!.term })),
      };
    })
    .sort((a, b) => a.term.localeCompare(b.term, "en", { sensitivity: "base" }));
}

export type { Seg };
