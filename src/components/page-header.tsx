import type { ReactNode } from "react";
import { getDictionary, getLocale } from "@/i18n";

/** Tiêu đề trang + ô tìm kiếm (gửi sang ngân hàng câu hỏi) như mockup. */
export default async function PageHeader({ title, sub }: { title: ReactNode; sub?: ReactNode }) {
  const lang = await getLocale();
  const t = await getDictionary();
  return (
    <header className="flex flex-wrap items-center gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {sub && <div className="mt-0.5 text-sm text-muted">{sub}</div>}
      </div>
      <form action={`/${lang}/questions`} className="ml-auto">
        <input name="q" type="search" placeholder={`⌕  ${t.header.search}`} className="field w-80 max-w-full" />
      </form>
    </header>
  );
}
