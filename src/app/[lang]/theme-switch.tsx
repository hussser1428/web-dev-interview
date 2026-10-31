"use client";

import { useEffect, useSyncExternalStore } from "react";
import Icon from "@/components/icon";
import type { Dict } from "@/i18n";
import { fmt } from "@/locales";

// Chế độ sáng/tối lưu ở localStorage, mặc định sáng. Script trong layout đọc cùng key trước khi vẽ trang.
const THEME_KEY = "devinterview:theme";
type Mode = "light" | "dark";
const read = (): Mode => (localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light");

const subs = new Set<() => void>();
function subscribe(f: () => void) {
  subs.add(f);
  window.addEventListener("storage", f); // đổi ở tab khác
  return () => {
    subs.delete(f);
    window.removeEventListener("storage", f);
  };
}

export default function ThemeSwitch({ t }: { t: Dict["nav"] }) {
  const mode = useSyncExternalStore(subscribe, read, () => null);

  useEffect(() => {
    if (mode) document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  const m = mode ?? "light";
  const label = fmt(t.theme, { mode: t.themes[m] });
  return (
    <button
      aria-label={label}
      title={label}
      onClick={() => {
        localStorage.setItem(THEME_KEY, m === "dark" ? "light" : "dark");
        subs.forEach((f) => f());
      }}
      className="grid size-[30px] shrink-0 cursor-pointer place-items-center rounded-[9px] border border-line bg-hover text-subtle hover:text-fg"
    >
      <Icon name={m === "dark" ? "moon" : "sun"} size={15} />
    </button>
  );
}
