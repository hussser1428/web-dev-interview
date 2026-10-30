"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import Icon, { trackIcon } from "@/components/icon";
import type { Dict } from "@/i18n";
import { hue, levelColor, trackColor, tracks, type Track } from "@/lib/catalog";
import type { GlossaryItem } from "@/lib/glossary";
import { updateProgress, useProgress } from "@/lib/progress";
import { toggleTerm } from "@/lib/srs";
import { fmt, type Locale } from "@/locales";

type Props = {
  lang: Locale;
  t: Dict["glossary"];
  trackNames: Dict["tracks"];
  levelNames: Dict["levels"];
  items: GlossaryItem[];
};

const tabs = ["all", "todo", "known"] as const;
const SHOWN = 3; // số câu "xuất hiện trong" hiện sẵn
const letter = (s: string) => s[0].toUpperCase();
const select = "h-7 cursor-pointer rounded-lg border border-line2 bg-panel px-2 text-xs font-medium text-muted";

export default function GlossaryView({ lang, t, trackNames, levelNames, items }: Props) {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const p = useProgress();
  const known = (id: string) => !!p?.terms?.[id];
  const [search, setSearch] = useState("");
  const [track, setTrack] = useState<Track | "">("");
  const [tab, setTab] = useState<(typeof tabs)[number]>("all");
  const [more, setMore] = useState(false);

  const needle = search.trim().toLowerCase();
  const filtered = items.filter(
    (g) => (!track || g.tracks.includes(track)) && (!needle || `${g.term} ${g.full ?? ""} ${g.def}`.toLowerCase().includes(needle)),
  );
  const inTab = (tb: (typeof tabs)[number], g: GlossaryItem) => tb === "all" || (tb === "known") === known(g.id);
  const list = filtered.filter((g) => inTab(tab, g));
  const sel = sp.get("t");
  const active = items.find((g) => g.id === sel) ?? list[0];
  const index = active ? list.indexOf(active) : -1;
  const letters = new Set(list.map((g) => letter(g.term)));

  function open(id: string) {
    setMore(false);
    router.replace(`${path}?t=${id}`, { scroll: false });
    document.getElementById(`g-${id}`)?.scrollIntoView({ block: "nearest" });
  }

  return (
    <div className="flex max-md:flex-col md:h-[calc(100vh-3.5rem)]">
      <aside className="flex w-full shrink-0 flex-col overflow-hidden bg-panel md:w-[440px] md:border-r md:border-line">
        <div className="flex flex-col gap-3 px-5 pb-3 pt-4.5">
          <div className="flex items-center gap-3">
            <h1 className="text-[17px] font-semibold">{t.title}</h1>
            <span className="text-xs text-muted">{fmt(t.count, { n: items.length, known: p ? Object.keys(p.terms ?? {}).length : 0 })}</span>
          </div>
          <label className="flex h-9 items-center gap-2 rounded-[9px] border border-line2 bg-panel px-3 focus-within:border-brand">
            <Icon name="search" size={15} className="text-subtle" />
            <input
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-subtle"
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select className={`${select} self-start`} value={track} onChange={(e) => setTrack(e.target.value as Track | "")}>
            <option value="">{t.allTracks}</option>
            {tracks.map((tr) => <option key={tr} value={tr}>{trackNames[tr]}</option>)}
          </select>
        </div>

        {/* A–Z: chữ đang xem tô màu, chữ không có thuật ngữ nào thì mờ */}
        <div className="flex flex-wrap gap-0.5 px-5 pb-2.5">
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c) => {
            const has = letters.has(c);
            const on = active && letter(active.term) === c;
            return (
              <button
                key={c}
                disabled={!has}
                onClick={() => open(list.find((g) => letter(g.term) === c)!.id)}
                className={`grid size-5.5 place-items-center rounded-md text-[11.5px] font-semibold ${
                  on ? "bg-brand text-white" : has ? "cursor-pointer text-muted hover:bg-hover" : "text-[#cbd5e1]"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        <div className="flex gap-0.5 border-b border-line px-5">
          {tabs.map((tb) => {
            const on = tab === tb;
            const badge = tb === "todo" ? "bg-[#fff4e5] text-[#b45309]" : tb === "known" ? "bg-brand-soft text-brand" : "bg-hover text-muted";
            return (
              <button
                key={tb}
                onClick={() => setTab(tb)}
                className={`relative flex cursor-pointer items-center gap-1.5 px-2 py-2.5 text-[13px] font-medium ${
                  on ? "font-semibold text-brand after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-brand" : "text-subtle hover:text-fg"
                }`}
              >
                {t.tabs[tb]}
                <em className={`rounded-full px-1.5 text-[10.5px] font-bold not-italic ${badge}`}>
                  {p || tb === "all" ? filtered.filter((g) => inTab(tb, g)).length : "–"}
                </em>
              </button>
            );
          })}
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto max-md:max-h-96">
          {list.length === 0 && <p className="p-5 text-sm text-muted">{t.empty}</p>}
          {list.map((g) => (
            <button
              key={g.id}
              id={`g-${g.id}`}
              onClick={() => open(g.id)}
              className={`relative flex shrink-0 cursor-pointer flex-col gap-0.75 border-b border-line px-5 py-2.75 text-left ${
                g === active
                  ? "bg-brand-soft before:absolute before:inset-y-0 before:left-0 before:w-0.75 before:bg-[image:var(--grad)]"
                  : "hover:bg-panel2"
              }`}
            >
              <span className="flex items-center gap-2 pr-6 text-sm font-bold">
                {g.term}
                {known(g.id) && <Icon name="check" size={15} className="absolute right-5 top-3 text-[#059669]" />}
              </span>
              <span className="line-clamp-1 text-[12.5px] text-muted">{g.def}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {active && (
          <>
            <div className="flex flex-1 flex-col gap-4.5 overflow-y-auto px-10 py-6.5 text-sm *:max-w-[900px] *:shrink-0 max-md:px-5">
              <div className="flex flex-wrap items-center gap-2">
                {active.tracks.map((tr) => (
                  <span key={tr} className="tagc py-0.75" style={hue(trackColor[tr])}>
                    <Icon name={trackIcon[tr]} size={13} /> {trackNames[tr]}
                  </span>
                ))}
                <button className="btn-ghost ml-auto h-8 px-3 text-xs" onClick={() => updateProgress((x) => toggleTerm(x, active.id))}>
                  <Icon name={known(active.id) ? "rotate" : "check"} size={14} /> {known(active.id) ? t.unmark : t.mark}
                </button>
              </div>

              <div>
                <h2 className="text-[25px] font-bold leading-tight tracking-tight">{active.term}</h2>
                {active.full && <p className="mt-1 text-muted">{active.full}</p>}
              </div>
              <p className="text-[15.5px] leading-[1.75] text-[#1e293b]">{active.def}</p>

              {active.example && (
                <div className="flex gap-3 rounded-xl border border-[#bae6fd] bg-[#f0f9ff] px-4 py-3.25 leading-relaxed text-[#0c4a6e]">
                  <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[linear-gradient(135deg,#0284c7,#0d9488)] text-white">
                    <Icon name="target" />
                  </span>
                  <div>
                    <b className="text-[#0369a1]">{t.example}</b>
                    <p>{active.example}</p>
                  </div>
                </div>
              )}

              {active.see && (
                <Section title={t.seeFull}>
                  <QLink lang={lang} q={active.see} levelName={levelNames[active.see.level]} primary />
                </Section>
              )}

              {active.appears.length > 0 && (
                <Section title={fmt(t.appears, { n: active.appears.length })}>
                  {(more ? active.appears : active.appears.slice(0, SHOWN)).map((q) => (
                    <QLink key={q.id} lang={lang} q={q} levelName={levelNames[q.level]} />
                  ))}
                  {!more && active.appears.length > SHOWN && (
                    <button className="w-fit cursor-pointer pl-1 text-xs text-muted hover:text-brand" onClick={() => setMore(true)}>
                      {fmt(t.more, { n: active.appears.length - SHOWN })}
                    </button>
                  )}
                </Section>
              )}

              {active.related.length > 0 && (
                <Section title={t.related}>
                  <div className="flex flex-wrap gap-2">
                    {active.related.map((r) => (
                      <button key={r.id} onClick={() => open(r.id)} className="cursor-pointer rounded-full border border-line2 bg-panel px-3 py-1 text-[12.5px] font-semibold text-[#334155] hover:border-brand hover:text-brand">
                        {r.term}
                      </button>
                    ))}
                  </div>
                </Section>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 border-t border-line bg-panel px-10 py-3.5 max-md:px-5">
              {index >= 0 && <span className="text-xs text-muted">{fmt(t.position, { i: index + 1, n: list.length })}</span>}
              {index >= 0 && index < list.length - 1 && (
                <button className="btn-ghost ml-auto h-10" onClick={() => open(list[index + 1].id)}>
                  {t.next} <Icon name="arrow" size={15} />
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-bold uppercase tracking-wide text-muted">{title}</h3>
      {children}
    </div>
  );
}

function QLink({ lang, q, levelName, primary }: { lang: string; q: GlossaryItem["appears"][number]; levelName: string; primary?: boolean }) {
  return (
    <Link
      href={`/${lang}/questions/${q.id}`}
      className={`flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 ${primary ? "border-brand-line bg-brand-soft" : "border-line bg-panel hover:border-line2"}`}
    >
      <span className="chipi sm" style={hue(trackColor[q.track])}><Icon name={trackIcon[q.track]} size={14} /></span>
      <span className="min-w-0 flex-1 text-[13.5px] font-medium">{q.title}</span>
      {primary && <span className="text-[11px] font-semibold" style={{ color: levelColor[q.level][0] }}>{levelName}</span>}
      <Icon name={primary ? "arrow" : "chev"} size={15} className={primary ? "text-brand" : "text-subtle"} />
    </Link>
  );
}
