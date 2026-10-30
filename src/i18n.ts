import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "./locales";
import vi from "./dictionaries/vi.json";

export type Dict = typeof vi;

// Mỗi ngôn ngữ trong locales.ts bắt buộc có từ điển với đủ key như vi.json.
const dictionaries: Record<Locale, () => Promise<Dict>> = {
  vi: () => Promise.resolve(vi),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
};

export async function getLocale(): Promise<Locale> {
  const l = await lang();
  if (!hasLocale(l)) notFound();
  return l;
}

export async function getDictionary(): Promise<Dict> {
  return dictionaries[await getLocale()]();
}
