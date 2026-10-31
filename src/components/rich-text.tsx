"use client";

import Link from "next/link";
import { useId, useRef, type ToggleEvent } from "react";
import type { Dict } from "@/i18n";
import { hue } from "@/lib/catalog";
import type { Seg, TermItem, TermMap } from "@/lib/glossary-match";
import Icon from "./icon";

type Props = { segs: Seg[]; terms: TermMap; lang: string; t: Dict["terms"] };

/** Văn bản đã đánh dấu thuật ngữ (đoạn từ server, xem lib/glossary.ts). */
export default function Rich({ segs, terms, lang, t }: Props) {
  return segs.map((s, i) =>
    typeof s === "string" ? s : <Term key={i} text={s.t} self={!!s.self} item={terms[s.g]} lang={lang} t={t} />,
  );
}

const W = 340;
const brand = hue(["#6d28d9", "#4f46e5"]);

/**
 * Thuật ngữ gạch chân chấm; bấm để mở popup (Popover API: nổi lên trên cùng, bấm ra ngoài / Esc tự đóng).
 * self = câu đang xem chính là phần giải thích đầy đủ, nên không link vòng về nó.
 */
function Term({ text, self, item, lang, t }: { text: string; self: boolean; item: TermItem; lang: string; t: Dict["terms"] }) {
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);

  function place(e: ToggleEvent<HTMLSpanElement>) {
    if (e.newState !== "open") return;
    const pop = e.currentTarget;
    const r = btn.current!.getBoundingClientRect();
    const w = Math.min(W, innerWidth - 16);
    const left = Math.max(8, Math.min(r.left + r.width / 2 - 34, innerWidth - w - 8));
    Object.assign(pop.style, { width: `${w}px`, left: `${left}px`, top: `${r.bottom + 10}px` });
    delete pop.dataset.up;
    pop.style.setProperty("--ax", `${r.left + r.width / 2 - left - 6}px`);
    // Popup cố định theo màn hình nên cuộn / đổi kích thước là đóng.
    const close = () => pop.hidePopover();
    addEventListener("scroll", close, { capture: true, once: true });
    addEventListener("resize", close, { once: true });
  }

  // Thiếu chỗ phía dưới thì lật lên trên chữ (đo sau khi đã hiện).
  function flip(e: ToggleEvent<HTMLSpanElement>) {
    const pop = e.currentTarget;
    if (e.newState !== "open" || pop.getBoundingClientRect().bottom <= innerHeight - 8) return;
    const r = btn.current!.getBoundingClientRect();
    pop.style.top = `${Math.max(8, r.top - pop.offsetHeight - 10)}px`;
    pop.dataset.up = "";
  }

  return (
    <>
      <button
        ref={btn}
        type="button"
        popoverTarget={id}
        className={`cursor-pointer border-b-[1.5px] border-dotted leading-[inherit] hover:bg-brand-soft ${self ? "border-subtle" : "border-brand"}`}
      >
        {text}
      </button>
      <span
        id={id}
        popover="auto"
        onBeforeToggle={place}
        onToggle={flip}
        className="term-pop fixed m-0 rounded-xl border border-line2 bg-panel p-0 text-left text-[13px] font-normal leading-relaxed tracking-normal text-body shadow-[0_18px_40px_-12px_rgb(15_23_42/0.28)]"
      >
        <span className="flex flex-col gap-2 px-4 py-3.5">
          <span className="flex items-start gap-2">
            <span className="chipi sm shrink-0" style={brand}><Icon name="gloss" size={14} /></span>
            <b className="text-[14.5px] leading-snug text-fg">
              {item.term}
              {item.full && <span className="font-medium text-muted"> — {item.full}</span>}
            </b>
            <span className="tagc ml-auto shrink-0 px-2 py-0 text-[10.5px]" style={brand}>{t.badge}</span>
          </span>
          <span>{item.def}</span>
          {item.example && (
            <span className="text-[12.5px] text-muted">
              <b className="font-semibold">{t.example}:</b> {item.example}
            </span>
          )}
          <span className="flex flex-col gap-1 border-t border-line pt-2.5 text-[12.5px]">
            {item.see && !self && (
              <Link href={`/${lang}/questions/${item.see.id}`} className="group font-semibold text-brand">
                <span className="flex items-center gap-1.5 group-hover:underline">{t.seeFull} <Icon name="arrow" size={13} /></span>
                <span className="block font-medium text-muted">{item.see.title}</span>
              </Link>
            )}
            {self && <span className="text-muted">{t.self}</span>}
            <Link href={`/${lang}/glossary?t=${item.id}`} className="w-fit font-medium text-brand hover:underline">
              {t.openGlossary}
            </Link>
          </span>
        </span>
      </span>
    </>
  );
}
