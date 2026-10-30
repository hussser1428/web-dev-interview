"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import type { Dict } from "@/i18n";
import { updateProgress, useProgress } from "@/lib/progress";
import { rate, ratingKey, toggleSave, type Rating } from "@/lib/srs";
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

export function SaveButton({ id, t }: { id: string; t: Dict["questions"] }) {
  const saved = !!useProgress()?.q[id]?.saved;
  return (
    <button
      onClick={() => updateProgress((p) => toggleSave(p, id))}
      className={`btn-ghost py-1.5 ${saved ? "border-amber-700 text-amber-300" : ""}`}
    >
      {saved ? t.saved : t.save}
    </button>
  );
}

const styles: Record<Rating, string> = {
  1: "border-red-800 text-red-300 data-[on=true]:bg-red-950",
  2: "border-amber-800 text-amber-300 data-[on=true]:bg-amber-950",
  3: "border-green-800 text-green-300 data-[on=true]:bg-green-950",
};

export function RateBar({ id, t, ratings }: { id: string; t: Dict["questions"]; ratings: Dict["ratings"] }) {
  const s = useProgress()?.q[id];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted">{t.rate}</span>
      {([1, 2, 3] as const).map((r) => (
        <button
          key={r}
          data-on={s?.rating === r}
          onClick={() => updateProgress((p) => rate(p, id, r))}
          className={`cursor-pointer rounded-full border px-3.5 py-1 text-sm hover:brightness-125 data-[on=true]:font-semibold ${styles[r]}`}
        >
          {ratings[ratingKey[r]]}
        </button>
      ))}
      {s?.interval && <span className="text-xs text-muted">✓ {fmt(t.nextReview, { n: s.interval })}</span>}
    </div>
  );
}
