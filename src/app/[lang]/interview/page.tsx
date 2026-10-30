import { Suspense } from "react";
import { getDictionary, getLocale } from "@/i18n";
import { isLevel, isTrack } from "@/lib/catalog";
import InterviewRoom from "./interview-room";

// searchParams chỉ có lúc request -> bọc Suspense để phần còn lại vẫn render tĩnh.
export default function InterviewPage({ searchParams }: PageProps<"/[lang]/interview">) {
  return (
    <Suspense>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ searchParams }: Pick<PageProps<"/[lang]/interview">, "searchParams">) {
  const sp = await searchParams;
  const t = await getDictionary();
  return (
    <div className="page">
      <InterviewRoom
        lang={await getLocale()}
        t={{ ...t.interview, title: t.nav.interview, speechLang: t.meta.speechLang }}
        trackNames={t.tracks}
        levelNames={t.levels}
        initialTrack={isTrack(sp.track) ? sp.track : "backend"}
        initialLevel={isLevel(sp.level) ? sp.level : "junior"}
      />
    </div>
  );
}
