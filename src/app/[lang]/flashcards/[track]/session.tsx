"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Bar from "@/components/bar";
import type { Dict } from "@/i18n";
import { hue, ratingColor } from "@/lib/catalog";
import { updateProgress, useProgress } from "@/lib/progress";
import { buildQueue, rate, ratingKey, type Rating } from "@/lib/srs";
import { fmt, type Locale } from "@/locales";

const MAX = 20;

type Card = { id: string; question: string; answer: string; code?: string; tip?: string };
type Props = { lang: Locale; t: Dict["flashcards"]; ratings: Dict["ratings"]; cards: Card[] };

export default function Session({ lang, t, ratings, cards }: Props) {
  const p = useProgress();
  const [queue, setQueue] = useState<string[] | null>(null); // null = chưa dựng hàng đợi
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

  // Vào là ôn luôn: dựng hàng đợi một lần khi đã đọc được tiến độ, rồi giữ cố định suốt phiên.
  if (!queue) {
    setQueue(buildQueue(cards.map((c) => c.id), p, MAX));
    return null;
  }

  if (!queue.length) {
    return (
      <div className="card flex flex-col items-start gap-4">
        <p className="text-lg">{t.nothing}</p>
        <Link href={`/${lang}/flashcards`} className="text-sm text-muted hover:text-fg">{t.back}</Link>
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
            <p className="whitespace-pre-line leading-relaxed text-[#334155]">{card.answer}</p>
            {card.code && (
              <pre className="overflow-x-auto rounded-xl bg-code p-4 font-mono text-[13px] text-[#e2e8f0]">{card.code}</pre>
            )}
            {card.tip && <p className="text-sm text-[#c2410c]">💡 {card.tip}</p>}
          </>
        ) : (
          <button className="btn mt-auto self-center" onClick={() => setFlipped(true)}>{t.flip}</button>
        )}
      </div>

      {flipped && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">{t.ratePrompt}</span>
          {([1, 2, 3] as const).map((r) => (
            <button key={r} onClick={() => answer(r)} style={hue(ratingColor[r])} className="soft cursor-pointer rounded-lg px-5 py-2 text-sm font-semibold text-(--c) hover:brightness-97">
              {r} · {ratings[ratingKey[r]]}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-muted">{t.keysHint}</p>
    </div>
  );
}
