"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import Icon, { trackIcon, type IconName } from "@/components/icon";
import type { Dict } from "@/i18n";
import { hue, levelColor, trackColor, tracks, type QuestionItem } from "@/lib/catalog";
import { updateProgress, useProgress } from "@/lib/progress";
import { addDays, bestStreak, daysBetween, emptyProgress, isDone, isDue, streak, today } from "@/lib/srs";
import { fmt, type Locale } from "@/locales";

const DAILY_GOAL = 5;
const WEEKS = 26;

type Props = {
  lang: Locale;
  t: Dict["dashboard"];
  trackNames: Dict["tracks"];
  levelNames: Dict["levels"];
  items: QuestionItem[];
};

/** fmt nhưng chèn được ReactNode: rich("Có {n} thẻ", { n: <b>3</b> }) */
const rich = (s: string, vars: Record<string, ReactNode>) =>
  s.split(/\{(\w+)\}/).map((part, i) => (i % 2 ? <span key={i}>{vars[part]}</span> : part));

export default function Dashboard({ lang, t, trackNames, levelNames, items }: Props) {
  const loaded = useProgress();
  const p = loaded ?? emptyProgress;
  const now = loaded ? today() : "";
  const s = (id: string) => p.q[id];

  const done = items.filter((q) => isDone(s(q.id)));
  const dueItems = items.filter((q) => isDue(s(q.id), now));
  const dueHard = dueItems.filter((q) => s(q.id)?.rating === 1).length;
  const dueMedium = dueItems.filter((q) => s(q.id)?.rating === 2).length;
  const saved = items.filter((q) => s(q.id)?.saved).length;
  const streakDays = loaded ? streak(p.days, now) : 0;
  const todayCount = p.days[now] ?? 0;
  const fresh = Math.max(0, DAILY_GOAL - todayCount);
  const logs = p.interviews ?? [];
  const last = logs.at(-1);
  const weak = (p.weak ?? []).filter((w) => !w.done);

  // Mảng đang học = mảng của câu luyện gần nhất.
  const focus = items.find((q) => q.id === p.last)?.track;
  const suggestions = (
    focus
      ? items.filter((q) => q.track === focus && !isDone(s(q.id)))
      : tracks.map((tr) => items.find((q) => q.track === tr && !isDone(s(q.id)))).filter((q) => !!q)
  ).slice(0, 3);
  const next = suggestions[0];
  const interviewTrack = focus ?? "backend";
  const paceTrack = focus ?? next?.track;

  // Giờ của trình duyệt chỉ đọc sau khi hydrate (loaded) để HTML server/client khớp nhau.
  const hour = loaded ? new Date().getHours() : 0;
  const greeting = hour < 11 ? t.greetMorning : hour < 18 ? t.greetAfternoon : t.greetEvening;

  // Kế hoạch hôm nay: việc chưa xong đầu tiên tô cam (ưu tiên), xong thì gạch ngang.
  const tasks = [
    {
      done: todayCount >= DAILY_GOAL,
      title: fmt(t.planGoal, { goal: DAILY_GOAL, done: Math.min(todayCount, DAILY_GOAL) }),
      meta: next ? [trackNames[next.track], next.topic] : [],
      href: next ? `/${lang}/questions/${next.id}` : `/${lang}/questions`,
    },
    {
      done: loaded !== null && dueItems.length === 0,
      title: dueItems.length ? fmt(t.planReview, { n: dueItems.length }) : t.planNoReview,
      meta: dueItems.length ? [fmt(t.planReviewMeta, { min: Math.ceil(dueItems.length * 0.75), hard: dueHard, medium: dueMedium })] : [],
      href: `/${lang}/flashcards`,
    },
    {
      done: false,
      title: t.planInterview,
      meta: [trackNames[interviewTrack], t.planInterviewMeta],
      href: `/${lang}/interview?track=${interviewTrack}`,
    },
  ];
  const firstOpen = tasks.findIndex((x) => !x.done);

  return (
    <>
      <header className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 max-sm:basis-full">
          <h1 className={`text-[28px] font-bold tracking-tight ${loaded ? "" : "invisible"}`}>{greeting}</h1>
          <p className={`mt-0.5 text-[17px] text-muted ${loaded ? "" : "invisible"}`}>
            {rich(t.todayLine, {
              due: <b className="text-[#c2410c]">{fmt(t.dueCards, { n: dueItems.length })}</b>,
              fresh: <b className="text-brand">{fmt(t.newQs, { n: fresh })}</b>,
            })}
          </p>
        </div>
        <Link href={`/${lang}/flashcards`} className="btn-ghost h-11 max-sm:flex-1">
          <Icon name="layers" className="text-brand" /> {t.flashBtn}
        </Link>
        <Link href={`/${lang}/interview`} className="btn h-11 px-5 max-sm:flex-1">
          <Icon name="play" /> {t.interviewBtn}
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat c={["#e11d48", "#f97316"]} label={t.streak} icon="flame" num={streakDays} unit={t.daysUnit} pill={loaded && fmt(t.record, { n: bestStreak(p.days) })}>
          <Week days={p.days} now={now} names={t.weekdays} />
        </Stat>
        <Stat c={["#0e7490", "#10b981"]} label={t.practiced} icon="check" num={done.length} unit={fmt(t.ofTotal, { n: items.length })}>
          <div className="bar flex-1">
            <span style={{ width: `${(done.length / items.length) * 100}%` }} />
          </div>
          <b className="text-(--c)">{Math.round((done.length / items.length) * 100)}%</b>
        </Stat>
        <Stat c={["#4f46e5", "#3b82f6"]} label={t.due} icon="rotate" num={dueItems.length} unit={t.cardsUnit}>
          <Pill>{fmt(t.hardN, { n: dueHard })}</Pill>
          <Pill>{fmt(t.mediumN, { n: dueMedium })}</Pill>
          <Link href={`/${lang}/flashcards`} className="ml-auto inline-flex items-center gap-1 font-semibold text-(--c) hover:underline">
            {t.reviewNow} <Icon name="arrow" size={12} strokeWidth={2.4} />
          </Link>
        </Stat>
        <Stat c={["#a21caf", "#ec4899"]} label={t.saved} icon="bookmark" num={saved} unit={t.qUnit}>
          <Link href={`/${lang}/questions?status=saved`} className="inline-flex items-center gap-1 font-semibold text-(--c) hover:underline">
            {t.viewSaved} <Icon name="arrow" size={12} strokeWidth={2.4} />
          </Link>
        </Stat>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-5">
          <section className="card overflow-hidden p-0">
            <div className="card-h">
              <span className="chipi sm"><Icon name="target" size={15} /></span>
              <h2 className="font-semibold">{t.planTitle}</h2>
              <span className="tagc" style={hue(levelColor.intern)}>{fmt(t.planDone, { n: tasks.filter((x) => x.done).length })}</span>
              <div className="bar ml-auto w-32">
                <span style={{ width: `${(tasks.filter((x) => x.done).length / 3) * 100}%` }} />
              </div>
            </div>
            <div className="flex flex-col">
              {tasks.map((x, i) => {
                const kind = x.done ? "done" : i === firstOpen ? "hot" : "next";
                return (
                  <Link
                    key={i}
                    href={x.href}
                    className={`flex items-center gap-3.5 border-b border-line px-5 py-3.25 last:border-0 hover:bg-panel2 ${
                      kind === "hot" ? "bg-[#fffbf5] shadow-[inset_3px_0_0_#f97316]" : ""
                    }`}
                  >
                    <span
                      className={`grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] ${
                        kind === "done" ? "border-[#059669] bg-[#059669] text-white" : kind === "hot" ? "border-[#f97316]" : "border-line2"
                      }`}
                    >
                      {x.done && <Icon name="check" size={12} strokeWidth={3} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className={`font-semibold ${x.done ? "text-subtle" : ""}`}>{x.title}</div>
                      {x.meta.length > 0 && <div className="text-xs text-subtle">{x.meta.join(" · ")}</div>}
                    </div>
                    {kind === "done" ? (
                      <Icon name="chev" className="text-subtle" />
                    ) : (
                      <span className={`${kind === "hot" ? "btn" : "btn-ghost"} h-8 px-3 text-xs`}>
                        {t.start} {kind === "hot" && <Icon name="arrow" size={14} />}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>

          {weak.length > 0 && (
            <section className="card overflow-hidden p-0">
              <div className="card-h">
                <span className="chipi sm" style={hue(levelColor.senior)}><Icon name="alert" size={15} /></span>
                <h2 className="font-semibold">{t.weakTitle}</h2>
                <span className="text-xs text-subtle">{fmt(t.weakCount, { n: weak.length })}</span>
                <Link href={`/${lang}/weak`} className="ml-auto flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                  {t.seeAll} <Icon name="chev" size={14} />
                </Link>
              </div>
              {weak.slice(-3).reverse().map((w) => (
                <Link key={w.id} href={`/${lang}/weak`} className="flex items-center gap-3.5 border-b border-line px-5 py-3 last:border-0 hover:bg-panel2">
                  <span className="soft grid h-7 w-11 shrink-0 place-items-center rounded-lg border-0! text-sm font-extrabold text-(--c)" style={hue(levelColor.senior)}>
                    {w.score.toFixed(1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{w.question}</div>
                    <div className="text-xs text-subtle">{w.project ? `${t.weakProject} ${w.project}` : trackNames[w.track]}</div>
                  </div>
                </Link>
              ))}
            </section>
          )}

          <section className="card overflow-hidden p-0">
            <div className="card-h">
              <span className="chipi sm"><Icon name="map" size={15} /></span>
              <h2 className="font-semibold">{t.masteryTitle}</h2>
              <Link href={`/${lang}/roadmap`} className="ml-auto flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                {t.roadmapLink} <Icon name="chev" size={14} />
              </Link>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {tracks.map((tr) => {
                const total = items.filter((q) => q.track === tr).length;
                const d = done.filter((q) => q.track === tr).length;
                const pct = total ? Math.round((d / total) * 100) : 0;
                return (
                  <Link key={tr} href={`/${lang}/roadmap/${tr}`} style={hue(trackColor[tr])} className="tint flex flex-col gap-2.5 rounded-xl px-3.5 py-3 hover:border-line2">
                    <div className="flex items-center gap-2.5">
                      <span className="chipi"><Icon name={trackIcon[tr]} /></span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{trackNames[tr]}</div>
                        <div className="text-xs text-subtle">{fmt(t.qCount, { done: d, total })}</div>
                      </div>
                      <span className={`ml-auto ${d ? "text-[15px] font-bold text-(--c)" : "text-xs font-semibold text-subtle"}`}>
                        {d ? `${pct}%` : t.notStarted}
                      </span>
                    </div>
                    <div className="bar">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <Countdown t={t} date={loaded ? p.interviewDate : undefined} loaded={!!loaded} remaining={paceTrack ? items.filter((q) => q.track === paceTrack && !isDone(s(q.id))).length : 0} trackName={paceTrack ? trackNames[paceTrack] : ""} />

          <section className="card overflow-hidden p-0">
            <div className="card-h">
              <span className="chipi sm"><Icon name="bot" size={15} /></span>
              <h2 className="font-semibold">{t.aiTitle}</h2>
              {logs.length > 0 && <span className="ml-auto text-xs text-subtle">{fmt(t.aiSessions, { n: logs.length })}</span>}
            </div>
            {last ? (
              <Link href={`/${lang}/interview?track=${last.track}&level=${last.level}`} className="flex items-end gap-4 p-4 hover:bg-panel2">
                <div>
                  <div className="text-xs text-subtle">{t.aiLast}</div>
                  <b className="text-[34px] font-extrabold leading-tight tracking-tight">{last.overall.toFixed(1)}</b>
                  <span className="text-sm text-subtle"> / 10</span>
                  <div className="text-xs text-subtle">{trackNames[last.track]} · {levelNames[last.level]}</div>
                </div>
                {/* điểm các buổi gần nhất, cũ -> mới */}
                <div className="flex h-16 flex-1 items-end justify-end gap-1">
                  {logs.slice(-12).map((l, i) => (
                    <span key={i} title={`${l.date} · ${l.overall}`} className="max-w-4 flex-1 rounded-t bg-[image:var(--grad)]" style={{ height: `${Math.max(l.overall, 0.5) * 10}%` }} />
                  ))}
                </div>
              </Link>
            ) : (
              <Link href={`/${lang}/interview`} className="block p-4 text-sm text-muted hover:bg-panel2">{t.aiEmpty}</Link>
            )}
          </section>

          <section className="card overflow-hidden p-0">
            <div className="card-h">
              <span className="chipi sm"><Icon name="cal" size={15} /></span>
              <h2 className="font-semibold">{t.activityTitle}</h2>
              <span className="ml-auto text-xs text-subtle">
                {fmt(t.activeDays, { n: loaded ? Object.keys(p.days).filter((d) => d > addDays(now, -WEEKS * 7)).length : 0 })}
              </span>
            </div>
            <Heatmap days={p.days} now={now} />
          </section>

          <section className="card overflow-hidden p-0">
            <div className="card-h">
              <span className="chipi sm"><Icon name="spark" size={15} /></span>
              <h2 className="font-semibold">{t.suggestTitle}</h2>
              <Link href={`/${lang}/questions`} className="ml-auto flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                {t.seeAll} <Icon name="chev" size={14} />
              </Link>
            </div>
            {suggestions.map((q) => (
              <Link key={q.id} href={`/${lang}/questions/${q.id}`} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0 hover:bg-panel2">
                <span className="chipi" style={hue(trackColor[q.track])}><Icon name={trackIcon[q.track]} /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{q.title}</div>
                  <div className="text-xs text-subtle">
                    {trackNames[q.track]} · <span className="font-semibold" style={{ color: levelColor[q.level][0] }}>{levelNames[q.level]}</span>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}

function Stat({ c, label, icon, num, unit, pill, children }: { c: [string, string]; label: string; icon: IconName; num: number; unit: string; pill?: ReactNode; children: ReactNode }) {
  return (
    <div style={hue(c)} className="card relative flex flex-col gap-2 overflow-hidden px-4.5 py-4 before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-linear-to-r before:from-(--c) before:to-(--c2)">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted">
        <span className="chipi solid size-8! rounded-xl!">
          <Icon name={icon} size={17} strokeWidth={2.2} />
        </span>
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[34px] font-extrabold leading-tight tracking-tight">{num}</span>
        <span className="text-sm font-semibold text-subtle">{unit}</span>
        {pill && <span className="tagc ml-auto self-center">{pill}</span>}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2 text-xs font-medium">{children}</div>
    </div>
  );
}

const Pill = ({ children }: { children: ReactNode }) => <span className="rounded-full bg-hover px-2.5 py-0.5 font-semibold text-muted">{children}</span>;

/** 7 ô của tuần hiện tại (T2 → CN), hôm nay viền trắng. */
function Week({ days, now, names }: { days: Record<string, number>; now: string; names: string[] }) {
  const monday = now ? addDays(now, -((new Date(`${now}T00:00`).getDay() + 6) % 7)) : "";
  return (
    <div className="flex flex-1 gap-1">
      {names.map((n, i) => {
        const d = monday && addDays(monday, i);
        const on = d && days[d] ? "bg-(--c) text-white" : "bg-hover text-subtle";
        const cls = d === now ? `${on} ring-2 ring-(--c) ring-offset-1` : on;
        return (
          <i key={n} className={`h-6 flex-1 rounded-md text-center text-[10px] font-semibold not-italic leading-6 ${cls}`}>{n}</i>
        );
      })}
    </div>
  );
}

function Countdown({ t, date, loaded, remaining, trackName }: { t: Dict["dashboard"]; date?: string; loaded: boolean; remaining: number; trackName: string }) {
  const input = useRef<HTMLInputElement>(null);
  const n = date ? daysBetween(today(), date) : -1;
  return (
    <section className="vivid g-hero relative rounded-2xl p-5">
      <span className="pointer-events-none absolute -bottom-24 -right-16 size-48 rounded-full border border-white/18" />
      <span className="pointer-events-none absolute -bottom-32 -right-24 size-64 rounded-full border border-white/18" />
      <div className="flex items-center gap-2 text-sm text-white/92">
        <Icon name="cal" /> {date ? fmt(t.interviewDay, { date: new Date(`${date}T00:00`).toLocaleDateString(undefined, { day: "numeric", month: "numeric" }) }) : t.noDateTitle}
      </div>
      <div className={`mt-2 text-[44px] font-extrabold leading-tight tracking-tighter ${loaded ? "" : "invisible"}`}>
        {n < 0 ? "—" : n === 0 ? "🎯" : fmt(t.daysBig, { n })}
      </div>
      <p className="max-w-64 text-sm text-white/92">
        {n < 0 ? t.noDateHint : n === 0 ? t.countdownToday : remaining && trackName ? fmt(t.paceHint, { n: Math.ceil(remaining / n), track: trackName }) : ""}
      </p>
      <div className="relative mt-4">
        <button className="btn-white h-8 px-3.5 text-xs" onClick={() => input.current?.showPicker()}>
          {date ? t.changeDate : t.setDate}
        </button>
        <input
          ref={input}
          type="date"
          tabIndex={-1}
          aria-label={t.changeDate}
          value={date ?? ""}
          min={loaded ? today() : undefined}
          onChange={(e) => updateProgress((p) => ({ ...p, interviewDate: e.target.value || undefined }))}
          className="pointer-events-none absolute left-0 top-0 h-8 w-0 opacity-0"
        />
      </div>
    </section>
  );
}

function Heatmap({ days, now }: { days: Record<string, number>; now: string }) {
  // 26 tuần × 7 ngày, cột cuối là tuần hiện tại.
  const cells = now
    ? Array.from({ length: WEEKS * 7 }, (_, i) => days[addDays(now, i - (WEEKS * 7 - 1))] ?? 0)
    : Array<number>(WEEKS * 7).fill(0);
  const color = (n: number) =>
    n === 0
      ? "bg-[#eef0f5]"
      : n < 3
        ? "bg-[#ddd6fe]"
        : n < 6
          ? "bg-[#a78bfa]"
          : "bg-[#6d28d9]";
  return (
    <div className="grid grid-flow-col grid-rows-7 gap-[3px] p-4">
      {cells.map((n, i) => (
        <span key={i} className={`aspect-square rounded-[3px] ${color(n)}`} title={n ? String(n) : undefined} />
      ))}
    </div>
  );
}
