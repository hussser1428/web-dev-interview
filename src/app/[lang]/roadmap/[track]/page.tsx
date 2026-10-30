import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/page-header";
import { DoneMark, GroupProgress } from "@/components/progress-marks";
import { getDictionary, getLocale } from "@/i18n";
import { isTrack, tracks } from "@/lib/catalog";
import { roadmap } from "@/lib/questions";
import { fmt, pick } from "@/locales";

export function generateStaticParams() {
  return tracks.map((track) => ({ track }));
}

export default async function TrackRoadmap({ params }: PageProps<"/[lang]/roadmap/[track]">) {
  const { track } = await params;
  if (!isTrack(track)) notFound();
  const lang = await getLocale();
  const t = await getDictionary();
  const topics = roadmap(track);

  return (
    <div className="page max-w-4xl">
      <PageHeader
        title={`${t.nav.roadmap} · ${t.tracks[track]}`}
        sub={
          <Link href={`/${lang}/roadmap`} className="hover:text-white">
            {t.roadmap.back}
          </Link>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <GroupProgress ids={topics.flatMap((x) => x.questions.map((q) => q.id))} label={t.roadmap.done} />
        </div>
        <Link href={`/${lang}/flashcards/${track}`} className="btn-ghost">▤ {t.roadmap.flashcards}</Link>
      </div>

      <ol className="relative flex flex-col gap-4 border-l border-line pl-6">
        {topics.map(({ topic, questions }, i) => (
          <li key={topic} className="relative">
            <span className="absolute -left-[33px] top-5 grid size-4 place-items-center rounded-full border-2 border-brand bg-bg" />
            <details className="card group" open={i === 0}>
              <summary className="flex cursor-pointer list-none flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-wide text-brand2">{fmt(t.roadmap.step, { n: i + 1 })}</span>
                  <span className="font-semibold">{topic}</span>
                  <span className="ml-auto text-xs text-muted">{fmt(t.roadmap.questions, { n: questions.length })}</span>
                  <span className="text-muted transition group-open:rotate-90">›</span>
                </div>
                <GroupProgress ids={questions.map((q) => q.id)} label={t.roadmap.done} />
              </summary>
              <div className="mt-3 flex flex-col border-t border-line pt-1">
                {questions.map((q) => (
                  <Link key={q.id} href={`/${lang}/questions/${q.id}?track=${track}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm hover:bg-panel2">
                    <DoneMark id={q.id} />
                    <span className="flex-1">{pick(q.q, lang)}</span>
                    <span className="tag">{t.levels[q.level]}</span>
                  </Link>
                ))}
              </div>
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}
