"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Dict } from "@/i18n";
import { levels, trackColor, tracks, type QuestionItem } from "@/lib/catalog";
import { useProgress } from "@/lib/progress";
import { emptyProgress, isDone, isDue, today } from "@/lib/srs";
import { fmt, type Locale } from "@/locales";

type Props = {
  lang: Locale;
  t: Dict["questions"] & { title: string };
  trackNames: Dict["tracks"];
  levelNames: Dict["levels"];
  items: QuestionItem[];
};

const statuses = ["all", "todo", "saved", "due"] as const;

export default function QuestionList({ lang, t, trackNames, levelNames, items }: Props) {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const activeId = path.split("/")[3];
  const loaded = useProgress();
  const p = loaded ?? emptyProgress;
  const now = loaded ? today() : "";

  const track = sp.get("track") ?? "";
  const level = sp.get("level") ?? "";
  const search = sp.get("q") ?? "";
  const status = sp.get("status") ?? "all";

  function set(key: string, value: string) {
    const next = new URLSearchParams(sp);
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
  }

  const needle = search.trim().toLowerCase();
  const list = items.filter((q) => {
    const s = p.q[q.id];
    return (
      (!track || q.track === track) &&
      (!level || q.level === level) &&
      (!needle || `${q.title} ${q.topic}`.toLowerCase().includes(needle)) &&
      (status === "all" ||
        (status === "todo" && !isDone(s)) ||
        (status === "saved" && !!s?.saved) ||
        (status === "due" && isDue(s, now)))
    );
  });
  const qs = sp.toString();

  return (
    <aside
      className={`flex w-full shrink-0 flex-col gap-3 border-line px-5 py-6 md:w-[460px] md:border-r ${activeId ? "max-md:hidden" : ""}`}
    >
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold">{track ? trackNames[track as keyof typeof trackNames] : t.title}</h1>
        <span className="text-sm text-muted">{fmt(t.count, { count: list.length })}</span>
      </div>

      <input
        type="search"
        defaultValue={search}
        placeholder={`⌕  ${t.search}`}
        onChange={(e) => set("q", e.target.value)}
        className="field"
      />
      <div className="flex gap-2">
        <select value={track} onChange={(e) => set("track", e.target.value)} className="field min-w-0 flex-1 py-1.5 text-xs">
          <option value="">{t.allTracks}</option>
          {tracks.map((tr) => (
            <option key={tr} value={tr}>{trackNames[tr]}</option>
          ))}
        </select>
        <select value={level} onChange={(e) => set("level", e.target.value)} className="field min-w-0 flex-1 py-1.5 text-xs">
          <option value="">{t.allLevels}</option>
          {levels.map((l) => (
            <option key={l} value={l}>{levelNames[l]}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-1.5">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => set("status", s)}
            className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs ${
              status === s ? "border-brand bg-brand text-white" : "border-line bg-panel text-muted hover:text-white"
            }`}
          >
            {t.status[s]}
          </button>
        ))}
      </div>

      <div className="card -mx-1 flex-1 overflow-y-auto p-1.5">
        {list.length === 0 && <p className="p-4 text-sm text-muted">{t.empty}</p>}
        {list.map((q) => {
          const s = p.q[q.id];
          const active = q.id === activeId;
          return (
            <Link
              key={q.id}
              href={`/${lang}/questions/${q.id}${qs ? `?${qs}` : ""}`}
              scroll={false}
              className={`flex items-start gap-3 rounded-xl border px-3 py-3 ${
                active ? "border-[#3b2f80] bg-panel2" : "border-transparent hover:bg-panel2/60"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className={`line-clamp-2 text-sm ${active ? "font-semibold" : ""}`}>{q.title}</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {!track && <span className={`tag ${trackColor[q.track]}`}>{trackNames[q.track]}</span>}
                  <span className="tag">{q.topic}</span>
                  <span className="tag">{levelNames[q.level]}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5 text-xs">
                <span
                  className={`size-4.5 rounded-[5px] border-[1.5px] ${isDone(s) ? "border-green-500 bg-green-500" : "border-[#3a4560]"}`}
                />
                {s?.saved && <span className="text-amber-400">★</span>}
                {isDue(s, now) && <span className="text-brand2" title={t.status.due}>⟳</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
