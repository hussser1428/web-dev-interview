"use client";

import { useState } from "react";
import type { Dict } from "@/i18n";
import { fmt } from "@/locales";

type Props = {
  t: Dict["questions"];
  answer: string;
  code?: string;
  tip?: string;
  followUps: string[];
};

export default function AnswerTabs({ t, answer, code, tip, followUps }: Props) {
  const [tab, setTab] = useState<"try" | "answer" | "followUps">("try");
  const [draft, setDraft] = useState("");
  const tabs = [
    ["try", t.tabs.try],
    ["answer", t.tabs.answer],
    ["followUps", fmt(t.tabs.followUps, { n: followUps.length })],
  ] as const;

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`cursor-pointer rounded-lg border px-3.5 py-1.5 text-sm ${
              tab === key ? "border-brand bg-brand text-white" : "border-line bg-panel text-muted hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card flex flex-col gap-4">
        {tab === "try" && (
          <>
            <p className="text-sm text-muted">{t.tryFirst}</p>
            <textarea
              placeholder={t.draft}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="field min-h-40 resize-y bg-bg"
            />
            <button className="btn self-start" onClick={() => setTab("answer")}>
              {t.showAnswer}
            </button>
          </>
        )}

        {tab === "answer" && (
          <>
            <p className="whitespace-pre-line leading-relaxed text-[#d5d9e5]">{answer}</p>
            {code && (
              <pre className="overflow-x-auto rounded-xl border border-line bg-bg p-4 font-mono text-[13px] leading-relaxed text-[#c9d1e4]">
                {code}
              </pre>
            )}
            {tip && (
              <div className="rounded-xl border border-[#7a5a0f] bg-[#2b2108] px-4 py-3 text-sm text-[#e9dcb5]">
                <b className="text-amber-300">{t.tip}</b> {tip}
              </div>
            )}
          </>
        )}

        {tab === "followUps" &&
          (followUps.length ? (
            <>
              <p className="text-sm text-muted">{t.followUpsHint}</p>
              <ol className="flex list-decimal flex-col gap-2 pl-5">
                {followUps.map((f, i) => <li key={i}>{f}</li>)}
              </ol>
            </>
          ) : (
            <p className="text-sm text-muted">{t.noFollowUps}</p>
          ))}
      </div>
    </>
  );
}
