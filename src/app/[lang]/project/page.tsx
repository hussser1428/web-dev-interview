import { getDictionary, getLocale } from "@/i18n";
import DeepDive from "./deep-dive";

export default async function ProjectPage() {
  const t = await getDictionary();
  return (
    <div className="page">
      <DeepDive
        lang={await getLocale()}
        t={t.project}
        ratings={t.ratings}
        room={{
          t: { ...t.interview, title: t.project.title, subtitle: t.project.interviewSubtitle, speechLang: t.meta.speechLang },
          trackNames: t.tracks,
          levelNames: t.levels,
        }}
      />
    </div>
  );
}
