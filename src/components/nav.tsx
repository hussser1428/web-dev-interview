"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgress } from "@/lib/progress";
import { addDays, isDue, streak, today } from "@/lib/srs";
import { fmt } from "@/locales";
import Icon, { type IconName } from "./icon";

export type NavItem = { href: string; label: string; icon: IconName; exact?: boolean; count?: number; badge?: "due" | "weak" };
type Props = {
  groups: { label: string; items: NavItem[] }[];
  t: { streak: string; keepStreak: string; streakDone: string };
};

export default function Nav({ groups, t }: Props) {
  const path = usePathname();
  const p = useProgress();
  const now = p ? today() : "";
  const badges = {
    due: p ? Object.values(p.q).filter((s) => isDue(s, now)).length : 0,
    weak: p?.weak?.filter((w) => !w.done).length ?? 0,
  };
  const days = p ? streak(p.days, now) : 0;

  return (
    <>
      <nav className="flex gap-1 md:flex-col">
        {groups.map((g) => (
          <div key={g.label} className="contents">
            <div className="px-2.5 pb-1.5 pt-3.5 text-[11px] font-semibold uppercase tracking-wider text-subtle max-md:hidden">{g.label}</div>
            {g.items.map((it) => {
              const active = it.exact ? path === it.href : path.startsWith(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[9px] px-2.5 py-1.5 text-sm ${
                    active ? "bg-brand-soft font-semibold text-brand" : "font-medium text-muted hover:bg-hover hover:text-fg"
                  }`}
                >
                  <span className={`grid size-6.5 place-items-center rounded-[7px] ${active ? "bg-[image:var(--grad)] text-white" : "text-subtle"}`}>
                    <Icon name={it.icon} size={16} />
                  </span>
                  {it.label}
                  {it.count !== undefined && (
                    <span className="ml-auto text-[11px] text-subtle">{it.count}</span>
                  )}
                  {it.badge && badges[it.badge] > 0 && (
                    <span className="ml-auto rounded-full bg-[#fff1e6] px-[7px] text-[10px] font-bold text-[#c2410c]">
                      {badges[it.badge]}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto max-md:hidden" />
      {p && (
        <div className="rounded-xl border border-[#fed7aa] bg-[#fff7ed] p-3 text-[#9a3412] max-md:hidden">
          <div className="flex items-center gap-2 font-bold text-[#c2410c]">
            <Icon name="flame" /> {fmt(t.streak, { n: days })}
          </div>
          <div className="mt-2.5 flex gap-1">
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-[3px] ${p.days[addDays(now, i - 6)] ? "bg-[image:var(--g-warm)]" : "bg-[#fed7aa]"}`} />
            ))}
          </div>
          <div className="mt-2 text-xs">{p.days[now] ? t.streakDone : t.keepStreak}</div>
        </div>
      )}
    </>
  );
}
