"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeNames, locales, type Locale } from "@/locales";

export default function LangSwitch({ current }: { current: Locale }) {
  const rest = usePathname().split("/").slice(2).join("/");
  return (
    <div className="flex rounded-[9px] border border-line bg-hover p-[3px]">
      {locales.map((l) => (
        <Link
          key={l}
          href={`/${l}/${rest}`}
          // Ghi nhớ lựa chọn để lần sau vào "/" sẽ tự mở đúng ngôn ngữ (xem proxy.ts).
          onClick={() => (document.cookie = `lang=${l}; path=/; max-age=31536000`)}
          className={`flex-1 whitespace-nowrap rounded-md px-2.5 py-1 text-center text-xs font-semibold ${
            l === current ? "bg-panel text-fg shadow-[var(--shadow)]" : "text-subtle hover:text-fg"
          }`}
        >
          {localeNames[l]}
        </Link>
      ))}
    </div>
  );
}
