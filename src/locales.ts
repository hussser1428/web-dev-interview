// Dùng được ở cả server, client và proxy.
// Thêm ngôn ngữ mới: thêm mã vào đây + tạo dictionaries/<mã>.json (TypeScript sẽ báo nếu thiếu).
export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "vi";

export const localeNames: Record<Locale, string> = { vi: "Tiếng Việt", en: "English" };

export const hasLocale = (l: string): l is Locale => (locales as readonly string[]).includes(l);

/** Lấy bản dịch của nội dung; thiếu thì rơi về tiếng Anh rồi tiếng Việt. */
export function pick(text: Partial<Record<string, string>>, l: string): string {
  return text[l] ?? text.en ?? text.vi ?? "";
}

/** fmt("Chào {name}", {name: "An"}) -> "Chào An" */
export function fmt(s: string, vars: Record<string, string | number>) {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
