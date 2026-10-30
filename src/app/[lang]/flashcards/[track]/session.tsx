"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Bar from "@/components/bar";
import type { Dict } from "@/i18n";
import { updateProgress, useProgress } from "@/lib/progress";
import { buildQueue, isDue, rate, ratingKey, today, type Rating } from "@/lib/srs";
import { fmt, type Locale } from "@/locales";

const MAX = 20;

type Card = { id: string; question: string; answer: string; code?: string; tip?: string };
type Props = { lang: Locale; t: Dict["flashcards"]; ratings: Dict["ratings"]; cards: Card[] };

const rateStyle: Record<Rating, string> = {
  1: "border-red-800 bg-red-950/50 text-red-300",
  2: "border-amber-800 bg-amber-950/50 text-amber-300",
  3: "border-green-800 bg-green-950/50 text-green-300",
};

export default function Session({ lang, t, ratings, cards }: Props) {
  const p = useProgress();
  const [queue, setQueue] = useState<string[] | null>(null); // null = chưa bắt đầu
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [requeued, setRequeued] = useState<Set<string>>(new Set());

  const card = queue && cards.find((c) => c.id === queue[idx]);

  function answer(r: Rating) {
    if (!queue || !card) return;
    updateProgress((p) => rate(p, card.id, r));
    // Câu "khó" được hỏi lại một lần cuối phiên.
    if (r === 1 && !requeued.has(card.id)) {
      setQueue([...queue, card.id]);
      setRequeued(new Set(requeued).add(card.id));
    }
    setIdx(idx + 1);
    setFlipped(false);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!card) return;
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped(true);
      } else if (flipped && ["1", "2", "3"].includes(e.key)) answer(Number(e.key) as Rating);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!p) return null;

  if (!queue) {
    const ids = cards.map((c) => c.id);
    const next = buildQueue(ids, p, MAX);
    const due = next.filter((id) => isDue(p.q[id], today())).length;
    return (
      <div className="card flex flex-col items-start gap-4">
        {next.length ? (
          <>
            <p>{fmt(t.summary, { total: next.length, due, max: MAX })}</p>
            <button className="btn" onClick={() => setQueue(next)}>▶ {t.start}</button>
          </>
        ) : (
          <p className="text-lg">{t.nothing}</p>
        )}
        <Link href={`/${lang}/flashcards`} className="text-sm text-muted hover:text-white">{t.back}</Link>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="card flex flex-col items-center gap-3 py-12 text-center">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-semibold">{t.doneTitle}</h2>
        <p className="text-muted">{fmt(t.doneText, { n: idx })}</p>
        <div className="mt-2 flex gap-2">
          <button
            className="btn"
            onClick={() => {
              setQueue(null);
              setIdx(0);
              setRequeued(new Set());
            }}
          >
            {t.again}
          </button>
          <Link href={`/${lang}/flashcards`} className="btn-ghost">{t.back}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 text-sm text-muted">
        {fmt(t.progress, { n: idx + 1, total: queue.length })}
        <Bar value={idx / queue.length} className="flex-1" />
      </div>

      <div className="card flex min-h-80 flex-col gap-4 p-7">
        <h2 className="text-xl font-semibold leading-snug">{card.question}</h2>
        {flipped ? (
          <>
            <hr className="border-line" />
            <p className="whitespace-pre-line leading-relaxed text-[#d5d9e5]">{card.answer}</p>
            {card.code && (
              <pre className="overflow-x-auto rounded-xl border border-line bg-bg p-4 font-mono text-[13px] text-[#c9d1e4]">{card.code}</pre>
            )}
            {card.tip && <p className="text-sm text-amber-200">💡 {card.tip}</p>}
          </>
        ) : (
          <button className="btn mt-auto self-center" onClick={() => setFlipped(true)}>{t.flip}</button>
        )}
      </div>

      {flipped && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">{t.ratePrompt}</span>
          {([1, 2, 3] as const).map((r) => (
            <button key={r} onClick={() => answer(r)} className={`cursor-pointer rounded-lg border px-5 py-2 text-sm font-semibold hover:brightness-125 ${rateStyle[r]}`}>
              {r} · {ratings[ratingKey[r]]}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-muted">{t.keysHint}</p>
    </div>
  );
}
