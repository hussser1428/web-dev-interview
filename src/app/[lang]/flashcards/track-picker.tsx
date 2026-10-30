"use client";

import Link from "next/link";
import type { Dict } from "@/i18n";
import Icon, { trackIcon } from "@/components/icon";
import { dueColor, hue, trackColor, type Track } from "@/lib/catalog";
import { useProgress } from "@/lib/progress";
import { isDone, isDue, today } from "@/lib/srs";
import { fmt, type Locale } from "@/locales";

type Props = { lang: Locale; t: Dict["flashcards"]; tracks: { track: Track; name: string; ids: string[] }[] };

export default function TrackPicker({ lang, t, tracks }: Props) {
  const p = useProgress();
  const now = p ? today() : "";
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tracks.map(({ track, name, ids }) => {
        const due = p ? ids.filter((id) => isDue(p.q[id], now)).length : 0;
        const fresh = p ? ids.filter((id) => !isDone(p.q[id])).length : ids.length;
        return (
          <Link key={track} href={`/${lang}/flashcards/${track}`} className="card flex items-center gap-3 px-4 py-3.5 hover:border-brand" style={hue(trackColor[track])}>
            <span className="chipi solid"><Icon name={trackIcon[track]} /></span>
            <span className="min-w-0 flex-1 truncate font-semibold">{name}</span>
            <div className="flex flex-col items-end gap-1">
              <span className="tagc" style={hue(due ? dueColor : ["#5b6576", "#5b6576"])}>{fmt(t.due, { n: due })}</span>
              <span className="tagc">{fmt(t.fresh, { n: fresh })}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
