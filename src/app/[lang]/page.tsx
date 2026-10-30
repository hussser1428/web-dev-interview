import PageHeader from "@/components/page-header";
import { getDictionary, getLocale } from "@/i18n";
import { questions, toItem } from "@/lib/questions";
import Countdown from "./countdown";
import Dashboard from "./dashboard";

export default async function Home() {
  const lang = await getLocale();
  const t = await getDictionary();

  return (
    <div className="page">
      <PageHeader title={t.dashboard.greeting} sub={<Countdown t={t.dashboard} />} />
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
