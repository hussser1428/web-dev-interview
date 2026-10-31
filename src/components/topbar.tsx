"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import Icon from "./icon";

type Props = {
  lang: string;
  /** [đường dẫn, tên] để dựng breadcrumb theo URL hiện tại. */
  sections: [string, string][];
  trackNames: Record<string, string>;
  search: string;
};

/** Thanh trên cùng: breadcrumb + ô tìm kiếm (Ctrl K) gửi sang ngân hàng câu hỏi. */
export default function TopBar({ lang, sections, trackNames, search }: Props) {
  const path = usePathname();
  const sp = useSearchParams();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const section = sections.find(([href]) => (href === `/${lang}` ? path === href : path.startsWith(href)));
  // Mảng đang xem: ?track=… ở ngân hàng câu hỏi hoặc /roadmap/<track>, /flashcards/<track>.
  const track = trackNames[sp.get("track") ?? ""] ?? trackNames[path.split("/")[3] ?? ""];

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-1.5 border-b border-line bg-panel/80 px-7 text-[13px] text-subtle backdrop-blur-md max-md:hidden">
      {section && (
        <Link href={section[0]} className={track ? "hover:text-fg" : "font-semibold text-fg"}>
          {section[1]}
        </Link>
      )}
      {track && (
        <>
          <Icon name="chev" size={14} />
          <b className="font-semibold text-fg">{track}</b>
        </>
      )}
      <form action={`/${lang}/questions`} className="ml-auto flex h-8.5 w-[340px] items-center gap-2 rounded-[9px] border border-line bg-panel2 px-2.5 focus-within:border-brand">
        <Icon name="search" />
        <input ref={input} key={sp.get("q")} name="q" type="search" defaultValue={sp.get("q") ?? ""} placeholder={search} className="min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-subtle" />
        <kbd className="rounded border border-line2 bg-panel px-1.5 font-mono text-[11px] text-muted">Ctrl K</kbd>
      </form>
    </header>
  );
}
