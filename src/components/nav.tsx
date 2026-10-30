"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgress } from "@/lib/progress";
import { addDays, isDue, streak, today } from "@/lib/srs";
import { fmt } from "@/locales";
import Icon, { type IconName } from "./icon";

/** short: nhãn ngắn trên thanh tab mobile — có short thì mục nằm ở thanh tab, không thì nằm trong "Thêm". */
export type NavItem = { href: string; label: string; icon: IconName; exact?: boolean; count?: number; badge?: "due" | "weak"; short?: string };
type Props = {
  groups: { label: string; items: NavItem[] }[];
  t: { streak: string; keepStreak: string; streakDone: string; more: string };
};

const MORE = "nav-more";

export default function Nav({ groups, t }: Props) {
  const path = usePathname();
  const p = useProgress();
  const now = p ? today() : "";
  const badges = {
    due: p ? Object.values(p.q).filter((s) => isDue(s, now)).length : 0,
    weak: p?.weak?.filter((w) => !w.done).length ?? 0,
  };
  const days = p ? streak(p.days, now) : 0;
  const isActive = (it: NavItem) => (it.exact ? path === it.href : path.startsWith(it.href));
  const badge = (it: NavItem) => (it.badge ? badges[it.badge] : 0);
  const all = groups.flatMap((g) => g.items);
  const tabs = all.filter((it) => it.short);
  const more = all.filter((it) => !it.short);
  const moreActive = more.some(isActive);
  const moreBadge = more.reduce((n, it) => n + badge(it), 0);

  return (
    <>
      <nav className="flex flex-col gap-1 max-md:hidden">
        {groups.map((g) => (
          <div key={g.label} className="contents">
            <div className="px-2.5 pb-1.5 pt-3.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">{g.label}</div>
            {g.items.map((it) => {
              const active = isActive(it);
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
                  {badge(it) > 0 && (
                    <span className="ml-auto rounded-full bg-[#fff1e6] px-[7px] text-[10px] font-bold text-[#c2410c]">
                      {badge(it)}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Mobile: thanh tab cố định dưới đáy, mục phụ nằm trong popover "Thêm". */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        {tabs.map((it) => (
          <Link key={it.href} href={it.href} className="flex flex-col items-center">
            <Tab icon={it.icon} label={it.short!} active={isActive(it)} n={badge(it)} />
          </Link>
        ))}
        <button popoverTarget={MORE} className="flex cursor-pointer flex-col items-center">
          <Tab icon="menu" label={t.more} active={moreActive} n={moreBadge} />
        </button>
      </nav>
      <div id={MORE} popover="auto" className="inset-auto bottom-[calc(64px+env(safe-area-inset-bottom))] right-3 m-0 w-60 rounded-2xl border border-line bg-white p-1.5 shadow-[0_12px_32px_-8px_rgb(15_23_42/0.25)] md:hidden">
        {more.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            onClick={() => document.getElementById(MORE)?.hidePopover()}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${isActive(it) ? "bg-brand-soft font-semibold text-brand" : "font-medium text-fg"}`}
          >
            <Icon name={it.icon} size={17} className={isActive(it) ? "" : "text-subtle"} />
            {it.label}
            {badge(it) > 0 && <span className="ml-auto rounded-full bg-[#fff1e6] px-[7px] text-[10px] font-bold text-[#c2410c]">{badge(it)}</span>}
          </Link>
        ))}
      </div>

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

function Tab({ icon, label, active, n }: { icon: IconName; label: string; active: boolean; n: number }) {
  return (
    <span className={`relative flex w-full flex-col items-center gap-0.5 pb-1.5 pt-2 text-[11px] ${active ? "font-semibold text-brand" : "font-medium text-subtle"}`}>
      <span className={`grid h-7 w-12 place-items-center rounded-full ${active ? "bg-brand-soft" : ""}`}>
        <Icon name={icon} size={19} />
      </span>
      {label}
      {n > 0 && (
        <span className="absolute left-1/2 top-1 ml-2.5 min-w-4 rounded-full bg-[#ea580c] px-1 text-center text-[10px] font-bold leading-4 text-white">{n}</span>
      )}
    </span>
  );
}
