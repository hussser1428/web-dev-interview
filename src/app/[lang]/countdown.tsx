"use client";

import type { Dict } from "@/i18n";
import { updateProgress, useProgress } from "@/lib/progress";
import { daysBetween, today } from "@/lib/srs";
import { fmt } from "@/locales";

export default function Countdown({ t }: { t: Dict["dashboard"] }) {
  const p = useProgress();
  if (!p) return <span>&nbsp;</span>;

  const date = p.interviewDate;
  const n = date ? daysBetween(today(), date) : -1;
  const input = (
    <input
      type="date"
      aria-label={t.changeDate}
      value={date ?? ""}
      min={today()}
      onChange={(e) => updateProgress((p) => ({ ...p, interviewDate: e.target.value || undefined }))}
      className="field ml-2 px-2 py-0.5 text-xs [color-scheme:dark]"
    />
  );

  if (n < 0) return <span>{t.noDate}{input}</span>;
  return (
    <span>
      <b className="text-white">{n === 0 ? t.countdownToday : fmt(t.countdown, { n })}</b>
      {input}
    </span>
  );
}
