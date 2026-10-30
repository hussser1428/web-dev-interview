import { getDictionary, getLocale } from "@/i18n";
import WeakList from "./weak-list";

// Danh sách câu yếu nằm trong localStorage nên toàn bộ phần dữ liệu render ở client.
export default async function WeakPage() {
  const t = await getDictionary();
  return (
    <WeakList
      lang={await getLocale()}
      t={t.weak}
      trackNames={t.tracks}
      levelNames={t.levels}
      styleNames={t.interview.styles}
      room={{
        t: { ...t.interview, title: t.weak.retryTitle, subtitle: t.weak.retrySubtitle, speechLang: t.meta.speechLang },
        trackNames: t.tracks,
        levelNames: t.levels,
      }}
    />
  );
}
