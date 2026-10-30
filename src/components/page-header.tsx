import type { ReactNode } from "react";

/** Tiêu đề trang (ô tìm kiếm nằm ở topbar chung). */
export default function PageHeader({ title, sub, children }: { title: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="text-[28px] font-bold tracking-tight">{title}</h1>
        {sub && <div className="mt-0.5 text-muted">{sub}</div>}
      </div>
      {children}
    </header>
  );
}
