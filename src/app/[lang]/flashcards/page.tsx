import PageHeader from "@/components/page-header";
import { getDictionary, getLocale } from "@/i18n";
import { tracks } from "@/lib/catalog";
import { byTrack } from "@/lib/questions";
import TrackPicker from "./track-picker";

export default async function FlashcardsPage() {
  const lang = await getLocale();
  const t = await getDictionary();
  return (
    <div className="page">
      <PageHeader title={t.nav.flashcards} sub={t.flashcards.subtitle} />
      <TrackPicker
        lang={lang}
        t={t.flashcards}
        tracks={tracks.map((tr) => ({ track: tr, name: t.tracks[tr], ids: byTrack(tr).map((q) => q.id) }))}
      />
    </div>
  );
}
