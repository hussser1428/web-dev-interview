"use client";

import { useProgress } from "@/lib/progress";
import { isDone } from "@/lib/srs";
import { fmt } from "@/locales";
import Bar from "./bar";

/** "Đã luyện 3/10" + thanh tiến độ cho một nhóm câu hỏi. */
export function GroupProgress({ ids, label }: { ids: string[]; label: string }) {
  const p = useProgress();
  const done = p ? ids.filter((id) => isDone(p.q[id])).length : 0;
  return (
    <div className="flex items-center gap-3">
      <Bar value={ids.length ? done / ids.length : 0} className="flex-1" />
      <span className="shrink-0 text-xs text-muted">{fmt(label, { done, total: ids.length })}</span>
    </div>
  );
}

/** Ô vuông xanh khi câu đã luyện. */
export function DoneMark({ id }: { id: string }) {
  const done = isDone(useProgress()?.q[id]);
  return (
    <span className={`size-4 shrink-0 rounded-[4px] border-[1.5px] ${done ? "border-green-500 bg-green-500" : "border-line2"}`} />
  );
}
