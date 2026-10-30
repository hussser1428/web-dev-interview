import { getDictionary, getLocale } from "@/i18n";
import { questions, toItem } from "@/lib/questions";
import Dashboard from "./dashboard";

export default async function Home() {
  const lang = await getLocale();
  const t = await getDictionary();

  return (
    <div className="page">
      <h1 className="sr-only">{t.nav.home}</h1>
      <Dashboard
        lang={lang}
        t={t.dashboard}
        trackNames={t.tracks}
        levelNames={t.levels}
        items={questions.map((q) => toItem(q, lang))}
      />
    </div>
  );
}
