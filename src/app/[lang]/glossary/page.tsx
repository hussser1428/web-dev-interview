import { Suspense } from "react";
import { getDictionary, getLocale } from "@/i18n";
import { glossaryItems } from "@/lib/glossary";
import GlossaryView from "./glossary-view";

// Thuật ngữ đang chọn nằm ở ?t= (useSearchParams) nên cần Suspense.
export default async function GlossaryPage() {
  const lang = await getLocale();
  const t = await getDictionary();
  return (
    <Suspense>
      <GlossaryView lang={lang} t={t.glossary} trackNames={t.tracks} levelNames={t.levels} items={glossaryItems(lang)} />
    </Suspense>
  );
}
