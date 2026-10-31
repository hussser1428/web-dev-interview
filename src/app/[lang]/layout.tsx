import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import ChatWidget from "@/components/chat-widget";
import Icon from "@/components/icon";
import Nav from "@/components/nav";
import TopBar from "@/components/topbar";
import { getDictionary, getLocale } from "@/i18n";
import { glossary } from "@/lib/glossary";
import { questions } from "@/lib/questions";
import { locales } from "@/locales";
import LangSwitch from "./lang-switch";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin", "vietnamese"], variable: "--font-jb" });

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getDictionary();
  return { title: meta.title, description: meta.description };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const lang = await getLocale();
  const t = await getDictionary();
  const { nav } = t;
  const learn = [
    { href: `/${lang}`, label: nav.home, icon: "dash", exact: true, short: nav.home },
    { href: `/${lang}/questions`, label: nav.questions, icon: "book", count: questions.length, short: nav.bankShort },
    { href: `/${lang}/roadmap`, label: nav.roadmap, icon: "map" },
    { href: `/${lang}/flashcards`, label: nav.flashcards, icon: "layers", badge: "due", short: nav.flashcards },
    { href: `/${lang}/glossary`, label: nav.glossary, icon: "gloss", count: glossary.length },
  ] as const;
  const ai = [
    { href: `/${lang}/interview`, label: nav.interview, icon: "chat", short: nav.interviewShort },
    { href: `/${lang}/project`, label: nav.project, icon: "git" },
    { href: `/${lang}/weak`, label: nav.weak, icon: "alert", badge: "weak" },
  ] as const;

  return (
    <html lang={lang} className={`${inter.variable} ${mono.variable}`}>
      <body className="flex min-h-screen font-sans antialiased max-md:flex-col">
        <aside className="flex shrink-0 gap-1 border-line bg-side px-3 max-md:sticky max-md:top-0 max-md:z-20 max-md:items-center max-md:justify-between max-md:border-b max-md:py-2 md:sticky md:top-0 md:z-20 md:h-screen md:w-59 md:flex-col md:border-r md:border-line2 md:py-4 md:shadow-[6px_0_24px_-12px_rgb(15_23_42/0.22)]">
          <Link href={`/${lang}`} className="flex shrink-0 items-center gap-2.5 px-2 text-[15px] font-bold md:pb-3.5 md:pt-1">
            <span className="grid size-7.5 place-items-center rounded-[9px] bg-[image:var(--grad)] text-white shadow-[0_4px_12px_-4px_rgb(109_40_217/0.6)]">
              <Icon name="code" size={15} strokeWidth={2.2} />
            </span>
            DevInterview
          </Link>
          <Nav
            groups={[
              { label: nav.learn, items: [...learn] },
              { label: nav.ai, items: [...ai] },
            ]}
            t={nav}
          />
          <div className="shrink-0 md:mt-2.5">
            <LangSwitch current={lang} />
          </div>
        </aside>
        <main className="flex min-w-0 flex-1 flex-col max-md:pb-16 bg-[radial-gradient(900px_320px_at_15%_-10%,rgb(124_58_237/0.07),transparent_70%)]">
          <Suspense>
            <TopBar
              lang={lang}
              search={t.header.search}
              trackNames={t.tracks}
              sections={[...learn, ...ai].map((i) => [i.href, i.label])}
            />
          </Suspense>
          {children}
        </main>
        {/* Gia sư AI chỉ hiện khi đã cấu hình key. */}
        {process.env.GEMINI_API_KEY && (
          <Suspense>
            <ChatWidget lang={lang} t={t.chat} />
          </Suspense>
        )}
      </body>
    </html>
  );
}
