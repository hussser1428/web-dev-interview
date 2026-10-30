"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeNames, locales, type Locale } from "@/locales";

export default function LangSwitch({ current }: { current: Locale }) {
  const rest = usePathname().split("/").slice(2).join("/");
  return (
    <div className="flex gap-1 rounded-lg border border-line p-1">
      {locales.map((l) => (
        <Link
          key={l}
          href={`/${l}/${rest}`}
          // Ghi nhớ lựa chọn để lần sau vào "/" sẽ tự mở đúng ngôn ngữ (xem proxy.ts).
          onClick={() => (document.cookie = `lang=${l}; path=/; max-age=31536000`)}
          className={`flex-1 rounded-md py-1 text-center text-xs ${l === current ? "bg-brand text-white" : "text-muted hover:text-white"}`}
          title={localeNames[l]}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
