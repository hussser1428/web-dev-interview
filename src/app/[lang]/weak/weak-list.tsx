"use client";

import Link from "next/link";
import { useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import Icon, { trackIcon } from "@/components/icon";
import type { Dict } from "@/i18n";
import { hue, levelColor, trackColor, tracks, type Track } from "@/lib/catalog";
import { updateProgress, useProgress } from "@/lib/progress";
import { toggleWeak, type WeakItem } from "@/lib/srs";
import { fmt, type Locale } from "@/locales";
import InterviewRoom from "../interview/interview-room";

type Props = {
  lang: Locale;
  t: Dict["weak"];
  trackNames: Dict["tracks"];
  levelNames: Dict["levels"];
  styleNames: Dict["interview"]["styles"];
  room: Pick<ComponentProps<typeof InterviewRoom>, "t" | "trackNames" | "levelNames">;
};

const tabs = ["todo", "interview", "project", "done"] as const;
type Tab = (typeof tabs)[number];
const inTab = (tab: Tab, w: WeakItem) =>
  tab === "done" ? !!w.done : !w.done && (tab === "todo" || (tab === "project") === !!w.project);

const red = hue(levelColor.senior);
const projectHue = hue(["#0f766e", "#0f766e"]);
const scoreHue = (s: number) => hue(s >= 4.5 ? levelColor.mid : levelColor.senior);
const day = (d: string) => new Date(`${d}T00:00`).toLocaleDateString(undefined, { day: "numeric", month: "numeric" });

/** Kế hoạch cho buổi luyện lại: hỏi lại đúng câu đó rồi đào sâu phần còn thiếu. */
const retryPlan = (w: WeakItem) =>
  [
    "Retry session: the candidate answered this question weakly in an earlier mock interview and wants to practise it again.",
    "Start with this question (rephrase it naturally), then use follow-ups and closely related questions to probe what was missing.",
    w.project && `Project: ${w.project}`,
    `Question: ${w.question}`,
    `What was missing last time: ${w.feedback}`,
  ]
    .filter(Boolean)
    .join("\n");

export default function WeakList({ lang, t, trackNames, levelNames, styleNames, room }: Props) {
  const loaded = useProgress();
  const all = loaded?.weak ?? [];
  const [tab, setTab] = useState<Tab>("todo");
  const [track, setTrack] = useState<Track | "">("");
  const [sort, setSort] = useState<"new" | "low">("new");
  const [activeId, setActiveId] = useState("");
  const [practice, setPractice] = useState<WeakItem | null>(null);

  if (practice)
    return (
      <div className="page">
        <button className="btn-ghost self-start" onClick={() => setPractice(null)}>
          {t.back}
        </button>
        <InterviewRoom
          lang={lang}
          {...room}
          initialTrack={practice.track}
          initialLevel={practice.level}
          context={retryPlan(practice)}
          project={practice.project}
        />
      </div>
    );

  const filtered = all.filter((w) => !track || w.track === track);
  const list = filtered.filter((w) => inTab(tab, w)).reverse(); // mới nhất trước
  if (sort === "low") list.sort((a, b) => a.score - b.score);
  const active = list.find((w) => w.id === activeId) ?? list[0];

  return (
    <div className="flex max-md:flex-col md:h-[calc(100vh-3.5rem)]">
      <aside className="flex w-full shrink-0 flex-col overflow-hidden bg-panel md:w-[440px] md:border-r md:border-line">
        <div className="flex flex-col gap-3 px-5 pb-3 pt-4.5">
          <div className="flex items-center gap-3">
            <h1 className="text-[17px] font-semibold">{t.title}</h1>
            <span className="text-xs text-muted">{fmt(t.count, { n: all.filter((w) => !w.done).length })}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <select className={select} value={track} onChange={(e) => setTrack(e.target.value as Track | "")}>
              <option value="">{t.allTracks}</option>
              {tracks.map((tr) => <option key={tr} value={tr}>{trackNames[tr]}</option>)}
            </select>
            <select className={select} value={sort} onChange={(e) => setSort(e.target.value as "new" | "low")}>
              <option value="new">{t.sortNew}</option>
              <option value="low">{t.sortLow}</option>
            </select>
          </div>
        </div>

        <div className="flex gap-0.5 border-b border-line px-5">
          {tabs.map((tb) => {
            const on = tab === tb;
            const badge = tb === "todo" ? "bg-[#fff4e5] text-[#b45309]" : tb === "project" ? "bg-brand-soft text-brand" : "bg-hover text-muted";
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
                  {loaded ? filtered.filter((w) => inTab(tb, w)).length : "–"}
                </em>
              </button>
            );
          })}
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto max-md:max-h-96">
          {loaded && all.length === 0 && (
            <div className="flex flex-col items-start gap-3 p-5 text-sm text-muted">
              {t.empty}
              <Link href={`/${lang}/interview`} className="btn h-9 px-4 text-sm">
                <Icon name="play" size={14} /> {t.startInterview}
              </Link>
            </div>
          )}
          {all.length > 0 && list.length === 0 && <p className="p-5 text-sm text-muted">{t.emptyTab}</p>}
          {list.map((w) => (
            <button
              key={w.id}
              onClick={() => setActiveId(w.id)}
              className={`relative flex shrink-0 cursor-pointer gap-3 border-b border-line px-5 py-3.25 text-left ${
                w === active
                  ? "bg-brand-soft before:absolute before:inset-y-0 before:left-0 before:w-0.75 before:bg-[image:var(--grad)]"
                  : "hover:bg-panel2"
              }`}
            >
              <Score s={w.score} className="mt-0.5 h-6.5 w-10 text-xs" />
              <div className="min-w-0 flex-1">
                <div className="mb-1.25 line-clamp-2 text-sm font-medium leading-[1.55]">{w.question}</div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-subtle">
                  <Icon name={w.project ? "git" : trackIcon[w.track]} size={12} />
                  {w.project ? fmt(t.project, { name: w.project }) : trackNames[w.track]}
                  <i className="not-italic opacity-60">·</i>
                  {day(w.date)}
                  {w.related && !w.done && (
                    <>
                      <i className="not-italic opacity-60">·</i>
                      <span className="font-semibold text-amber-800">{t.inFlash}</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {active && (
          <>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-10 py-6.5 text-sm *:max-w-[900px] *:shrink-0 max-md:px-5">
              <div className="flex flex-wrap items-center gap-2">
                {active.project && (
                  <span className="tagc py-0.75" style={projectHue}>
                    <Icon name="git" size={13} /> {fmt(t.project, { name: active.project })}
                  </span>
                )}
                <span className="tagc py-0.75" style={hue(trackColor[active.track])}>
                  <Icon name={trackIcon[active.track]} size={13} /> {trackNames[active.track]}
                </span>
                <span className="rounded-full border border-line2 bg-panel px-2 py-0.5 text-[11px] font-semibold text-muted">
                  {[fmt(t.from, { date: day(active.date) }), styleNames[active.style], levelNames[active.level]].filter(Boolean).join(" · ")}
                </span>
                <Score s={active.score} className="ml-auto h-7.5 px-3 text-[13px]" suffix=" / 10" />
              </div>

              <h1 className="text-[25px] font-bold leading-[1.35] tracking-tight">{active.question}</h1>

              {active.answer !== undefined && (
                <Box title={t.yourAnswer} className="border border-line bg-panel2" titleCls="text-muted">
                  {active.answer || <i className="text-subtle">{t.noAnswer}</i>}
                </Box>
              )}
              <div className="grid gap-3.5 md:grid-cols-2">
                <Box title={t.feedback} className="soft" style={red} titleCls="text-(--c)">{active.feedback}</Box>
                <Box title={t.better} className="soft" style={hue(levelColor.intern)} titleCls="text-(--c)">{active.betterAnswer}</Box>
              </div>
              {active.nextTime && (
                <div className="flex gap-3 rounded-xl border border-[#fed7aa] bg-[#fff7ed] px-4 py-3.25 leading-relaxed text-[#431407]">
                  <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[image:var(--g-warm)] text-white">
                    <Icon name="bulb" />
                  </span>
                  <div>
                    <b className="text-[#c2410c]">{t.nextTime}</b>
                    <p>{active.nextTime}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 border-t border-line bg-panel px-10 py-3.5 max-md:px-5">
              <span className="text-xs text-muted">{fmt(t.added, { date: day(active.date) })}</span>
              <div className="ml-auto flex flex-wrap gap-2.5">
                {active.project && (
                  <Link href={`/${lang}/project`} className="btn-ghost h-10">
                    <Icon name="git" size={15} /> {t.openProject}
                  </Link>
                )}
                {active.related && (
                  <Link href={`/${lang}/questions/${active.related}`} className="btn-ghost h-10">
                    <Icon name="book" size={15} /> {t.openBank}
                  </Link>
                )}
                <button className="btn-ghost h-10" onClick={() => setPractice(active)}>
                  <Icon name="play" size={15} /> {t.retry}
                </button>
                <button className="btn h-10 px-4" onClick={() => updateProgress((p) => toggleWeak(p, active.id))}>
                  <Icon name={active.done ? "rotate" : "check"} size={15} /> {active.done ? t.undo : t.done}
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

const select = "h-7 cursor-pointer rounded-lg border border-line2 bg-panel px-2 text-xs font-medium text-muted";

const Score = ({ s, className, suffix = "" }: { s: number; className: string; suffix?: string }) => (
  <span className={`soft grid shrink-0 place-items-center rounded-lg border-0! font-extrabold text-(--c) ${className}`} style={scoreHue(s)}>
    {s.toFixed(1)}{suffix}
  </span>
);

function Box({ title, className, titleCls, style, children }: { title: string; className: string; titleCls: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <div className={`rounded-xl px-4 py-3 leading-relaxed text-[#334155] ${className}`} style={style}>
      <h2 className={`mb-1 text-xs font-bold uppercase tracking-wide ${titleCls}`}>{title}</h2>
      {children}
    </div>
  );
}
