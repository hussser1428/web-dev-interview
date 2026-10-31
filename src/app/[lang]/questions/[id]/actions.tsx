"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import Icon from "@/components/icon";
import type { Dict } from "@/i18n";
import { dueColor, hue, ratingColor } from "@/lib/catalog";
import { updateProgress, useProgress } from "@/lib/progress";
import { isDue, nextInterval, today, rate, ratingKey, toggleSave, type Rating } from "@/lib/srs";
import { fmt } from "@/locales";

/** Link giữ nguyên bộ lọc đang chọn (?track=…&status=…) của danh sách. */
export function KeepQueryLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const qs = useSearchParams().toString();
  return (
    <Link href={qs ? `${href}?${qs}` : href} scroll={false} className={className}>
      {children}
    </Link>
  );
}

export function DueTag({ id, label }: { id: string; label: string }) {
  const p = useProgress();
  if (!p || !isDue(p.q[id], today())) return null;
  return (
    <span className="tagc py-0.75" style={hue(dueColor)}>
      <Icon name="clock" size={12} /> {label}
    </span>
  );
}

export function SaveButton({ id, t }: { id: string; t: Dict["questions"] }) {
  const saved = !!useProgress()?.q[id]?.saved;
  return (
    <button onClick={() => updateProgress((p) => toggleSave(p, id))} className="btn-ghost h-7.5 px-2.75 text-xs">
      {saved ? <Icon name="star" size={14} className="fill-amber-400 text-amber-400" /> : <Icon name="bookmark" size={14} />}
      {saved ? t.saved : t.save}
    </button>
  );
}

export function RateBar({ id, t, ratings }: { id: string; t: Dict["questions"]; ratings: Dict["ratings"] }) {
  const s = useProgress()?.q[id];

  // Phím 1/2/3 = Khó/Vừa/Dễ (bỏ qua khi đang gõ trong ô nhập).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const r = Number(e.key);
      if (![1, 2, 3].includes(r) || e.ctrlKey || e.metaKey || e.altKey) return;
      if ((e.target as HTMLElement).closest("input, textarea, select, [contenteditable]")) return;
      updateProgress((p) => rate(p, id, r as Rating));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id]);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="whitespace-nowrap text-xs text-muted">{t.rate}</span>
      {([1, 2, 3] as const).map((r) => (
        <button
          key={r}
          onClick={() => updateProgress((p) => rate(p, id, r))}
          style={hue(ratingColor[r])}
          className={`soft flex h-9 cursor-pointer items-center gap-2 rounded-[9px] px-3.25 text-[13px] font-bold text-(--c) hover:brightness-97 ${
            s?.rating === r ? "ring-2 ring-(--c)/40" : ""
          }`}
        >
          {ratings[ratingKey[r]]}
          <small className="text-[11px] font-medium">{fmt(t.inDays, { n: nextInterval(s?.interval, r) })}</small>
          <kbd className="rounded border border-current bg-panel px-1.25 font-mono text-[10px]">{r}</kbd>
        </button>
      ))}
    </div>
  );
}
