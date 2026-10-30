import { Suspense } from "react";
import { getDictionary, getLocale } from "@/i18n";
import { questions, toItem } from "@/lib/questions";
import QuestionList from "./question-list";

// Danh sách nằm ở layout nên giữ nguyên (cả vị trí cuộn) khi chuyển giữa các câu hỏi.
export default async function QuestionsLayout({ children }: LayoutProps<"/[lang]/questions">) {
  const lang = await getLocale();
  const t = await getDictionary();
  return (
    <div className="flex md:h-screen">
      {/* Bộ lọc đọc từ URL (useSearchParams) nên cần Suspense. */}
      <Suspense>
        <QuestionList
          lang={lang}
          t={{ ...t.questions, title: t.nav.questions }}
          trackNames={t.tracks}
          levelNames={t.levels}
          items={questions.map((q) => toItem(q, lang))}
        />
      </Suspense>
      <section className="min-w-0 flex-1 md:overflow-y-auto">{children}</section>
    </div>
  );
}
