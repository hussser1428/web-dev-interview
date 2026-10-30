"use client";

import { useState } from "react";
import Icon from "@/components/icon";
import Rich from "@/components/rich-text";
import type { Dict } from "@/i18n";
import type { Seg, TermMap } from "@/lib/glossary-match";

type Props = {
  t: Dict["questions"];
  lang: string;
  /** Đáp án đã đánh dấu thuật ngữ: đoạn đầu = bản trả lời ngắn, phần còn lại = giải thích thêm. */
  quick: Seg[];
  /** Ví dụ thực tế (tuỳ chọn), hiện ngay dưới bản trả lời ngắn. */
  example?: Seg[];
  rest: Seg[];
  terms: TermMap;
  termT: Dict["terms"];
  code?: string;
  tip?: string;
  followUps: string[];
};

export default function AnswerTabs({ t, lang, quick, example, rest, terms, termT, code, tip, followUps }: Props) {
  const [tab, setTab] = useState<"try" | "answer" | "followUps">("try");
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const tabs = [
    ["try", t.tabs.try],
    ["answer", t.tabs.answer],
    ["followUps", t.tabs.followUps],
  ] as const;

  return (
    <>
      <div className="flex w-fit flex-wrap gap-1 rounded-[11px] bg-hover p-1">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm ${
              tab === key ? "bg-white font-semibold text-brand shadow-[var(--shadow)]" : "font-medium text-muted hover:text-fg"
            }`}
          >
            {label}
            {key === "followUps" && <span className="rounded-full border border-line2 bg-white px-1.5 text-[11px] font-semibold">{followUps.length}</span>}
          </button>
        ))}
      </div>

      {tab === "try" && (
        <div className="flex flex-col gap-3">
          <p className="text-muted">{t.tryFirst}</p>
          <textarea
            placeholder={t.draft}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="field min-h-40 resize-y"
          />
          <button className="btn self-start" onClick={() => setTab("answer")}>
            <Icon name="spark" /> {t.showAnswer}
          </button>
        </div>
      )}

      {tab === "answer" && (
        <>
          <div className="flex gap-3 rounded-xl border border-brand-line bg-brand-soft px-4 py-3.5 leading-[1.65] text-[#1e1b4b]">
            <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[image:var(--grad)] text-white">
              <Icon name="spark" />
            </span>
            <div>
              <b className="text-brand">{t.quick}</b>
              <p className="whitespace-pre-line"><Rich segs={quick} terms={terms} lang={lang} t={termT} /></p>
            </div>
          </div>

          {example && (
            <div className="flex gap-3 rounded-xl border border-[#bae6fd] bg-[#f0f9ff] px-4 py-3.25 leading-relaxed text-[#0c4a6e]">
              <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[linear-gradient(135deg,#0284c7,#0d9488)] text-white">
                <Icon name="target" />
              </span>
              <div>
                <b className="text-[#0369a1]">{t.example}</b>
                <p className="whitespace-pre-line"><Rich segs={example} terms={terms} lang={lang} t={termT} /></p>
              </div>
            </div>
          )}

          {rest.length > 0 && (
            <p className="whitespace-pre-line leading-[1.7] text-[#334155]"><Rich segs={rest} terms={terms} lang={lang} t={termT} /></p>
          )}

          {code && (
            <>
              <div className="overflow-hidden rounded-xl bg-code">
                <div className="flex items-center gap-1.5 border-b border-white/8 px-3 py-2 text-xs text-[#94a3b8]">
                  <span className="mr-2 flex gap-1.5">
                    <i className="size-2.5 rounded-full bg-red-500" />
                    <i className="size-2.5 rounded-full bg-amber-500" />
                    <i className="size-2.5 rounded-full bg-emerald-500" />
                  </span>
                  code
                  <button
                    className="ml-auto flex cursor-pointer items-center gap-1.5 hover:text-white"
                    onClick={() => navigator.clipboard.writeText(code).then(() => setCopied(true))}
                  >
                    <Icon name={copied ? "check" : "copy"} size={13} /> {copied ? t.copied : t.copy}
                  </button>
                </div>
                <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-[1.7] text-[#e2e8f0]">{code}</pre>
              </div>
            </>
          )}

          {tip && (
            <div className="flex gap-3 rounded-xl border border-[#fed7aa] bg-[#fff7ed] px-4 py-3.25 leading-relaxed text-[#431407]">
              <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[image:var(--g-warm)] text-white">
                <Icon name="bulb" />
              </span>
              <div>
                <b className="text-[#c2410c]">{t.tip}</b>
                <p>{tip}</p>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "followUps" &&
        (followUps.length ? (
          <div className="card flex flex-col gap-3">
            <p className="text-sm text-muted">{t.followUpsHint}</p>
            <ol className="flex list-decimal flex-col gap-2 pl-5">
              {followUps.map((f, i) => <li key={i}>{f}</li>)}
            </ol>
          </div>
        ) : (
          <p className="text-sm text-muted">{t.noFollowUps}</p>
        ))}
    </>
  );
}
