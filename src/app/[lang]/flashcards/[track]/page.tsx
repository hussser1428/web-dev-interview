import { notFound } from "next/navigation";
import PageHeader from "@/components/page-header";
import { getDictionary, getLocale } from "@/i18n";
import { isTrack, tracks } from "@/lib/catalog";
import { byTrack } from "@/lib/questions";
import { pick } from "@/locales";
import Session from "./session";

export function generateStaticParams() {
  return tracks.map((track) => ({ track }));
}

export default async function FlashcardSession({ params }: PageProps<"/[lang]/flashcards/[track]">) {
  const { track } = await params;
  if (!isTrack(track)) notFound();
  const lang = await getLocale();
  const t = await getDictionary();
  return (
    <div className="page max-w-4xl">
      <PageHeader title={`${t.nav.flashcards} · ${t.tracks[track]}`} sub={t.flashcards.subtitle} />
      <Session
        lang={lang}
        t={t.flashcards}
        ratings={t.ratings}
        cards={byTrack(track).map((q) => ({
          id: q.id,
          question: pick(q.q, lang),
          answer: pick(q.a, lang),
          code: q.code,
          tip: q.tip && pick(q.tip, lang),
        }))}
      />
    </div>
  );
}
