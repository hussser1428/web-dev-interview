import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDictionary, getLocale } from "@/i18n";
import { trackColor } from "@/lib/catalog";
import { byTrack, getQuestion, questions } from "@/lib/questions";
import { pick } from "@/locales";
import { KeepQueryLink, RateBar, SaveButton } from "./actions";
import AnswerTabs from "./answer-tabs";

export function generateStaticParams() {
  return questions.map((q) => ({ id: q.id }));
}

export default async function QuestionPage({ params }: PageProps<"/[lang]/questions/[id]">) {
  const q = getQuestion((await params).id);
  if (!q) notFound();
  const lang = await getLocale();
  const t = await getDictionary();
  const t2 = t.questions;

  // Câu trước / sau theo thứ tự lộ trình của cùng mảng.
  const siblings = byTrack(q.track);
  const i = siblings.indexOf(q);
  const prev = siblings[i - 1];
  const next = siblings[i + 1];
  const href = (id: string) => `/${lang}/questions/${id}`;

  return (
    <div className="flex min-h-full flex-col gap-4 px-7 py-6">
      <div className="flex flex-wrap items-center gap-2">
        <Suspense>
          <KeepQueryLink href={`/${lang}/questions`} className="btn-ghost px-3 py-1 md:hidden">{t2.back}</KeepQueryLink>
        </Suspense>
        <span className={`tag ${trackColor[q.track]}`}>{t.tracks[q.track]}</span>
        <span className="tag">{q.topic}</span>
        <span className="tag">{t.levels[q.level]}</span>
        <div className="ml-auto">
          <SaveButton id={q.id} t={t2} />
        </div>
      </div>

      <h1 className="text-2xl font-semibold leading-snug">{pick(q.q, lang)}</h1>
      {q.source && (
        <div className="text-xs text-muted">
          {t2.source}:{" "}
          <a href={q.source} target="_blank" rel="noreferrer" className="text-brand2 hover:underline">
            {q.source.replace(/^https:\/\//, "")}
          </a>
        </div>
      )}

      <AnswerTabs
        key={q.id}
        t={t2}
        answer={pick(q.a, lang)}
        code={q.code}
        tip={q.tip && pick(q.tip, lang)}
        followUps={(q.followUps ?? []).map((f) => pick(f, lang))}
      />

      <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Suspense>
          {prev && <KeepQueryLink href={href(prev.id)} className="btn-ghost">{t2.prev}</KeepQueryLink>}
          <RateBar id={q.id} t={t2} ratings={t.ratings} />
          {next && <KeepQueryLink href={href(next.id)} className="btn-ghost ml-auto">{t2.next}</KeepQueryLink>}
        </Suspense>
      </div>
    </div>
  );
}
