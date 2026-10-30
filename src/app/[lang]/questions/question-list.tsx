"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, type CSSProperties, type ReactNode } from "react";
import Icon, { trackIcon, type IconName } from "@/components/icon";
import type { Dict } from "@/i18n";
import { hue, levelColor, levels, trackColor, tracks, type QuestionItem, type Track } from "@/lib/catalog";
import { useProgress } from "@/lib/progress";
import { emptyProgress, isDone, isDue, today } from "@/lib/srs";
import { fmt, type Locale } from "@/locales";

type Props = {
  lang: Locale;
  t: Dict["questions"] & { title: string };
  trackNames: Dict["tracks"];
  levelNames: Dict["levels"];
  items: QuestionItem[];
};

const statuses = ["all", "todo", "due", "saved"] as const;
const topicHue = hue(["#4f46e5", "#4f46e5"]);

export default function QuestionList({ lang, t, trackNames, levelNames, items }: Props) {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const activeId = path.split("/")[3];
  const loaded = useProgress();
  const p = loaded ?? emptyProgress;
  const now = loaded ? today() : "";

  const track = (sp.get("track") ?? "") as Track | "";
  const level = sp.get("level") ?? "";
  const topic = sp.get("topic") ?? "";
  const search = sp.get("q") ?? "";
  const status = sp.get("status") ?? "all";

  function set(key: string, value: string) {
    const next = new URLSearchParams(sp);
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    if (key === "track") next.delete("topic");
    const qs = next.toString();
    router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
  }

  const needle = search.trim().toLowerCase();
  const filtered = items.filter(
    (q) =>
      (!track || q.track === track) &&
      (!level || q.level === level) &&
      (!topic || q.topic === topic) &&
      (!needle || `${q.title} ${q.topic}`.toLowerCase().includes(needle)),
  );
  const match = (st: string, q: QuestionItem) => {
    const s = p.q[q.id];
    return st === "all" || (st === "todo" && !isDone(s)) || (st === "saved" && !!s?.saved) || (st === "due" && isDue(s, now));
  };
  const list = filtered.filter((q) => match(status, q));
  const topics = [...new Set(items.filter((q) => !track || q.track === track).map((q) => q.topic))];
  const qs = sp.toString();

  // Màn rộng không để khung phải trống: tự mở câu chưa làm đầu tiên theo bộ lọc. Mobile giữ danh sách (khung phải ẩn).
  const first = loaded && !activeId ? (list.find((q) => !isDone(p.q[q.id])) ?? list[0])?.id : undefined;
  useEffect(() => {
    if (first && matchMedia("(min-width: 768px)").matches) router.replace(`/${lang}/questions/${first}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [first, lang, qs, router]);

  return (
    <aside
      className={`flex w-full shrink-0 flex-col overflow-hidden bg-panel md:w-[440px] md:border-r md:border-line ${activeId ? "max-md:hidden" : ""}`}
    >
      <div className="flex flex-col gap-3 px-5 pb-3 pt-4.5">
        <div className="flex items-center gap-3">
          <h1 className="text-[17px] font-semibold">{t.title}</h1>
          <span className="text-xs text-muted">{fmt(t.count, { count: list.length, total: items.length })}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip
            style={track ? hue(trackColor[track]) : undefined}
            active={!!track}
            icon={track ? trackIcon[track] : undefined}
            value={track}
            onChange={(v) => set("track", v)}
            onClear={() => set("track", "")}
            options={[["", t.allTracks], ...tracks.map((tr) => [tr, trackNames[tr]] as [string, string])]}
          />
          <Chip value={level} onChange={(v) => set("level", v)} options={[["", t.allLevels], ...levels.map((l) => [l, levelNames[l]] as [string, string])]} />
          <Chip value={topic} onChange={(v) => set("topic", v)} options={[["", t.allTopics], ...topics.map((x) => [x, x] as [string, string])]} />
          {search && (
            <button onClick={() => set("q", "")} className="tagc h-7 cursor-pointer rounded-lg" style={topicHue}>
              <Icon name="search" size={13} /> {search} <Icon name="x" size={12} />
            </button>
          )}
        </div>

      </div>

      {/* Tab trạng thái: gạch chân gradient ở tab đang chọn. */}
      <div className="flex gap-0.5 border-b border-line px-5">
        {statuses.map((st) => {
          const n = filtered.filter((q) => match(st, q)).length;
          const on = status === st;
          const badge = st === "due" ? "bg-[#fff4e5] text-[#b45309]" : st === "saved" ? "bg-brand-soft text-brand" : "bg-hover text-muted";
          return (
            <button
              key={st}
              onClick={() => set("status", st)}
              className={`relative flex cursor-pointer items-center gap-1.5 px-2 py-2.5 text-[13px] font-medium ${
                on ? "font-semibold text-brand after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-brand" : "text-subtle hover:text-fg"
              }`}
            >
              {t.status[st]}
              <em className={`rounded-full px-1.5 text-[10.5px] font-bold not-italic ${badge}`}>{loaded || st === "all" ? n : "–"}</em>
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        {list.length === 0 && <p className="p-4 text-sm text-muted">{t.empty}</p>}
        {list.map((q) => {
          const s = p.q[q.id];
          const due = isDue(s, now);
          const active = q.id === activeId;
          return (
            <Link
              key={q.id}
              href={`/${lang}/questions/${q.id}${qs ? `?${qs}` : ""}`}
              scroll={false}
              className={`relative flex shrink-0 gap-3 border-b border-line px-5 py-2.75 ${
                active
                  ? "bg-brand-soft before:absolute before:inset-y-0 before:left-0 before:w-0.75 before:bg-[image:var(--grad)]"
                  : "hover:bg-panel2"
              }`}
            >
              <Status done={isDone(s)} due={due} />
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 line-clamp-2 text-sm font-medium leading-normal">{q.title}</div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-subtle">
                  {!track && (
                    <>
                      <span style={{ color: trackColor[q.track][0] }}>{trackNames[q.track]}</span>
                      <i className="not-italic opacity-60">·</i>
                    </>
                  )}
                  {q.topic}
                  <i className="not-italic opacity-60">·</i>
                  <span className="text-[11px] font-semibold" style={{ color: levelColor[q.level][0] }}>{levelNames[q.level]}</span>
                  {due && (
                    <>
                      <i className="not-italic opacity-60">·</i>
                      <span className="font-semibold text-amber-800">{t.due}</span>
                    </>
                  )}
                </div>
              </div>
              {s?.saved && <Icon name="star" size={14} className="mt-0.5 shrink-0 fill-amber-400 text-amber-400" />}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

/** Vòng trạng thái: xanh = đã luyện, cam = đến hạn ôn, rỗng = chưa làm. */
function Status({ done, due }: { done: boolean; due: boolean }) {
  if (due || done)
    return (
      <span className="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full text-white" style={{ background: due ? "#f59e0b" : "#059669" }}>
        <Icon name={due ? "clock" : "check"} size={10} strokeWidth={3.2} />
      </span>
    );
  return <span className="mt-0.5 size-4.5 shrink-0 rounded-full border-[1.5px] border-line2" />;
}

/** Ô lọc dạng chip: select gốc của trình duyệt phủ trong suốt lên trên. */
function Chip({ value, options, onChange, onClear, active, icon, style }: {
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
  onClear?: () => void;
  active?: boolean;
  icon?: IconName;
  style?: CSSProperties;
}) {
  const label: ReactNode = options.find(([v]) => v === value)?.[1] ?? options[0][1];
  return (
    <span
      style={style}
      className={`relative flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium ${
        active ? "tagc rounded-lg" : value ? "border-brand-line bg-brand-soft text-brand" : "border-line2 bg-panel text-muted"
      }`}
    >
      {icon && <Icon name={icon} size={14} />}
      {label}
      {active && onClear ? (
        <button onClick={onClear} className="relative z-10 cursor-pointer" aria-label="clear">
          <Icon name="x" size={13} />
        </button>
      ) : (
        <Icon name="down" size={13} />
      )}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer bg-panel opacity-0">
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </span>
  );
}
