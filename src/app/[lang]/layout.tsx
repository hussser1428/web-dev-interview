import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/nav";
import { getDictionary, getLocale } from "@/i18n";
import { locales } from "@/locales";
import LangSwitch from "./lang-switch";
import "./globals.css";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getDictionary();
  return { title: meta.title, description: meta.description };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const lang = await getLocale();
  const { nav } = await getDictionary();

  return (
    <html lang={lang}>
      <body className="flex min-h-screen font-sans antialiased max-md:flex-col">
        <aside className="flex shrink-0 gap-1 border-line bg-panel px-3.5 max-md:items-center max-md:overflow-x-auto max-md:border-b max-md:py-2 md:sticky md:top-0 md:h-screen md:w-58 md:flex-col md:border-r md:py-5">
          <Link href={`/${lang}`} className="flex shrink-0 items-center gap-2.5 px-1.5 text-lg font-bold md:mb-5">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand2 text-sm">
              &lt;/&gt;
            </span>
            DevInterview
          </Link>
          <Nav
            items={[
              { href: `/${lang}`, label: nav.home, icon: "◧", exact: true },
              { href: `/${lang}/questions`, label: nav.questions, icon: "☰" },
              { href: `/${lang}/roadmap`, label: nav.roadmap, icon: "◎" },
              { href: `/${lang}/flashcards`, label: nav.flashcards, icon: "▤" },
              { href: `/${lang}/interview`, label: nav.interview, icon: "▶", badge: nav.beta },
              { href: `/${lang}/project`, label: nav.project, icon: "⌘" },
            ]}
          />
          <div className="shrink-0 md:mt-auto">
            <LangSwitch current={lang} />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </body>
    </html>
  );
}
