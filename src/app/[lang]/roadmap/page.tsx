import Link from "next/link";
import PageHeader from "@/components/page-header";
import { GroupProgress } from "@/components/progress-marks";
import { getDictionary, getLocale } from "@/i18n";
import Icon, { trackIcon } from "@/components/icon";
import { hue, trackColor, tracks } from "@/lib/catalog";
import { byTrack, roadmap } from "@/lib/questions";
import { fmt } from "@/locales";

export default async function RoadmapIndex() {
  const lang = await getLocale();
  const t = await getDictionary();
  return (
    <div className="page">
      <PageHeader title={t.nav.roadmap} sub={t.roadmap.subtitle} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tracks.map((tr) => {
          const topics = roadmap(tr);
          return (
            <Link key={tr} href={`/${lang}/roadmap/${tr}`} className="card flex flex-col gap-3 hover:border-brand">
              <div className="flex items-center gap-3" style={hue(trackColor[tr])}>
                <span className="chipi solid"><Icon name={trackIcon[tr]} /></span>
                <span className="flex-1 text-lg font-semibold">{t.tracks[tr]}</span>
                <span className="tagc">{fmt(t.roadmap.topics, { n: topics.length })}</span>
              </div>
              <p className="line-clamp-2 min-h-[2lh] text-xs text-muted">{topics.map((x) => x.topic).join(" → ")}</p>
              <GroupProgress ids={byTrack(tr).map((q) => q.id)} label={t.roadmap.done} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
