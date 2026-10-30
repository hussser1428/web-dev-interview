"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: string; badge?: string; exact?: boolean };

export default function Nav({ items }: { items: Item[] }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 md:flex-col">
      {items.map((it) => {
        const active = it.exact ? path === it.href : path.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
              active ? "bg-panel2 text-white" : "text-muted hover:bg-panel2/60 hover:text-white"
            }`}
          >
            <span className="w-5 text-center">{it.icon}</span>
            {it.label}
            {it.badge && <span className="tag ml-auto px-1.5 py-0 text-[10px]">{it.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
