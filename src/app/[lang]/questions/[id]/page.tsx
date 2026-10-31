import { notFound } from "next/navigation";
import { Suspense } from "react";
import Icon, { trackIcon } from "@/components/icon";
import { getDictionary, getLocale } from "@/i18n";
import { hue, levelColor, trackColor } from "@/lib/catalog";
import { byTrack, getQuestion, questions } from "@/lib/questions";
import { pick } from "@/locales";
import { DueTag, KeepQueryLink, RateBar, SaveButton } from "./actions";
import Rich from "@/components/rich-text";
import { richQuestion } from "@/lib/glossary";
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

  // Câu tiếp theo thứ tự lộ trình của cùng mảng.
  const siblings = byTrack(q.track);
  const next = siblings[siblings.indexOf(q) + 1];
  const rich = richQuestion(q, lang);

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-10 py-6.5 text-sm *:max-w-[820px] *:shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <Suspense>
            <KeepQueryLink href={`/${lang}/questions`} className="btn-ghost h-8 px-3 md:hidden">{t2.back}</KeepQueryLink>
          </Suspense>
          <span className="tagc py-0.75" style={hue(trackColor[q.track])}>
            <Icon name={trackIcon[q.track]} size={13} /> {t.tracks[q.track]}
          </span>
          <span className="rounded-full border border-line2 bg-panel px-2 py-0.5 text-[11px] font-semibold text-muted">{q.topic}</span>
          <span className="tagc py-0.75" style={hue(levelColor[q.level])}>{t.levels[q.level]}</span>
          <DueTag id={q.id} label={t2.due} />
          <div className="ml-auto">
            <SaveButton id={q.id} t={t2} />
          </div>
        </div>

        <h1 className="text-[25px] font-bold leading-[1.35] tracking-tight">
          <Rich segs={rich.title} terms={rich.terms} lang={lang} t={t.terms} />
        </h1>

        <AnswerTabs
          key={q.id}
          t={t2}
          lang={lang}
          quick={rich.quick}
          id={q.id}
          example={rich.example}
          rest={rich.rest}
          terms={rich.terms}
          termT={t.terms}
          code={q.code}
          tip={q.tip && pick(q.tip, lang)}
          followUps={(q.followUps ?? []).map((f) => pick(f, lang))}
        />

        {q.source && (
          <div className="text-xs text-subtle">
            {t2.source}:{" "}
            <a href={q.source} target="_blank" rel="noreferrer" className="text-brand2 hover:underline">
              {q.source.replace(/^https:\/\//, "")}
            </a>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 border-t border-line bg-panel px-10 py-3.5">
        <Suspense>
          <RateBar id={q.id} t={t2} ratings={t.ratings} />
          {next && (
            <KeepQueryLink href={`/${lang}/questions/${next.id}`} className="btn-ghost ml-auto">
              {t2.next} <Icon name="arrow" />
            </KeepQueryLink>
          )}
        </Suspense>
      </div>
    </>
  );
}
