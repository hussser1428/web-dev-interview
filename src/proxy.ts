import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, locales } from "./locales";

// URL chưa có mã ngôn ngữ (vd: /questions) -> chuyển sang /vi/questions hoặc /en/questions
// theo cookie đã chọn, rồi tới ngôn ngữ trình duyệt.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return;

  const cookie = req.cookies.get("lang")?.value ?? "";
  const browser = (req.headers.get("accept-language") ?? "")
    .split(",")
    .map((p) => p.split(";")[0].trim().slice(0, 2))
    .find(hasLocale);
  const locale = hasLocale(cookie) ? cookie : (browser ?? defaultLocale);

  req.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(req.nextUrl);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
