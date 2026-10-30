"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Bar from "@/components/bar";
import type { Dict } from "@/i18n";
import { trackColor, tracks, type QuestionItem } from "@/lib/catalog";
import { useProgress } from "@/lib/progress";
import { addDays, emptyProgress, isDone, isDue, streak, today } from "@/lib/srs";
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

export default function Dashboard({ lang, t, trackNames, levelNames, items }: Props) {
  const loaded = useProgress();
  const p = loaded ?? emptyProgress;
  const now = loaded ? today() : "";
  const s = (id: string) => p.q[id];

  const done = items.filter((q) => isDone(s(q.id)));
  const due = items.filter((q) => isDue(s(q.id), now)).length;
  const saved = items.filter((q) => s(q.id)?.saved).length;
  const week = loaded ? Array.from({ length: 7 }, (_, i) => p.days[addDays(now, -i)] ?? 0).reduce((a, b) => a + b, 0) : 0;
  const streakDays = loaded ? streak(p.days, now) : 0;
  const todayCount = p.days[now] ?? 0;

  // Mảng đang học = mảng của câu luyện gần nhất.
  const focus = items.find((q) => q.id === p.last)?.track;
  const nextInFocus = focus && items.find((q) => q.track === focus && !isDone(s(q.id)));
  const suggestions = (
    focus
      ? items.filter((q) => q.track === focus && !isDone(s(q.id)))
      : tracks.map((tr) => items.find((q) => q.track === tr && !isDone(s(q.id)))).filter((q) => !!q)
  ).slice(0, 5);

  const value = (v: ReactNode) => (loaded ? v : "–");

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={t.streak} value={value(`🔥 ${fmt(t.days, { n: streakDays })}`)} hint={t.streakHint} />
        <Stat label={t.practiced} value={value(done.length)} hint={fmt(t.thisWeek, { n: week })} hintClass="text-green-400" />
        <Stat label={t.due} value={value(due)} hint={t.dueHint} valueClass="text-brand2" />
        <Stat label={t.saved} value={value(saved)} hint={t.savedHint} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="card">
            <h3 className="mb-2 font-semibold">{t.planTitle}</h3>
            <PlanRow checked={due === 0} href={`/${lang}/flashcards`} action={due > 0 ? t.start : undefined}>
              {due > 0 ? fmt(t.planReview, { n: due }) : t.planNoReview}
            </PlanRow>
            <PlanRow
              checked={todayCount >= DAILY_GOAL}
              href={suggestions[0] ? `/${lang}/questions/${suggestions[0].id}` : `/${lang}/questions`}
              action={todayCount < DAILY_GOAL ? t.start : undefined}
            >
              {fmt(t.planGoal, { goal: DAILY_GOAL, done: Math.min(todayCount, DAILY_GOAL) })}
            </PlanRow>
            <PlanRow
              checked={!!focus && !nextInFocus}
              href={focus ? `/${lang}/roadmap/${focus}` : `/${lang}/roadmap`}
              action={t.start}
            >
              {focus
                ? nextInFocus
                  ? fmt(t.planNext, { topic: nextInFocus.topic, track: trackNames[focus] })
                  : t.allDone
                : t.planPick}
            </PlanRow>
          </div>

          <div className="card flex-1">
            <h3 className="mb-1 flex items-center font-semibold">
              {t.suggestTitle}
              <Link href={`/${lang}/questions`} className="ml-auto text-xs font-normal text-brand2">{t.seeAll}</Link>
            </h3>
            {suggestions.map((q) => (
              <Link key={q.id} href={`/${lang}/questions/${q.id}`} className="flex items-center gap-2 border-t border-line py-3 first-of-type:border-0 hover:text-brand2">
                <span className="flex-1 text-sm">{q.title}</span>
                <span className={`tag ${trackColor[q.track]}`}>{trackNames[q.track]}</span>
                <span className="tag">{levelNames[q.level]}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card">
            <h3 className="mb-3 font-semibold">{t.masteryTitle}</h3>
            <div className="flex flex-col gap-2.5">
              {tracks.map((tr) => (
                <Mastery key={tr} name={trackNames[tr]} href={`/${lang}/roadmap/${tr}`} total={items.filter((q) => q.track === tr).length} done={done.filter((q) => q.track === tr).length} />
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="mb-3 font-semibold">{t.activityTitle}</h3>
            <Heatmap days={p.days} now={now} />
          </div>

          <div className="card bg-gradient-to-br from-[#1d1840] to-[#0c2a33]">
            <h3 className="mb-2 font-semibold">🧭 {t.continueTitle}</h3>
            <p className="text-sm text-muted">
              {focus && nextInFocus ? fmt(t.continueText, { track: trackNames[focus], topic: nextInFocus.topic }) : t.continueEmpty}
            </p>
            <Link href={focus ? `/${lang}/roadmap/${focus}` : `/${lang}/roadmap`} className="btn mt-3">
              {t.continueBtn}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, hint, valueClass = "", hintClass = "text-muted" }: { label: string; value: ReactNode; hint: string; valueClass?: string; hintClass?: string }) {
  return (
    <div className="card">
      <div className="text-sm text-muted">{label}</div>
      <div className={`my-1 text-2xl font-bold ${valueClass}`}>{value}</div>
      <div className={`text-xs ${hintClass}`}>{hint}</div>
    </div>
  );
}

function PlanRow({ checked, href, action, children }: { checked: boolean; href: string; action?: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-t border-line py-3 first-of-type:border-0">
      <span className={`size-4.5 shrink-0 rounded-[5px] border-[1.5px] ${checked ? "border-green-500 bg-green-500" : "border-[#3a4560]"}`} />
      <span className="flex-1 text-sm">{children}</span>
      {action && !checked && (
        <Link href={href} className="btn px-3 py-1.5 text-xs">{action}</Link>
      )}
    </div>
  );
}

function Mastery({ name, href, done, total }: { name: string; href: string; done: number; total: number }) {
  const ratio = total ? done / total : 0;
  return (
    <Link href={href} className="group">
      <div className="flex justify-between text-sm">
        <span className="group-hover:text-brand2">{name}</span>
        <span className="text-muted">{Math.round(ratio * 100)}% · {done}/{total}</span>
      </div>
      <Bar value={ratio} className="mt-1 h-1.5" />
    </Link>
  );
}

function Heatmap({ days, now }: { days: Record<string, number>; now: string }) {
  // 26 tuần × 7 ngày, cột cuối là tuần hiện tại.
  const cells = now
    ? Array.from({ length: WEEKS * 7 }, (_, i) => days[addDays(now, i - (WEEKS * 7 - 1))] ?? 0)
    : Array<number>(WEEKS * 7).fill(0);
  const color = (n: number) => (n === 0 ? "bg-panel2" : n < 3 ? "bg-[#2b2466]" : n < 6 ? "bg-[#4c3bb8]" : "bg-brand");
  return (
    <div className="grid grid-flow-col grid-rows-7 gap-1">
      {cells.map((n, i) => (
        <span key={i} className={`aspect-square rounded-[3px] ${color(n)}`} title={n ? String(n) : undefined} />
      ))}
    </div>
  );
}

