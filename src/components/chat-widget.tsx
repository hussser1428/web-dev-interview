"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Icon from "@/components/icon";
import type { Dict } from "@/i18n";
import type { Turn } from "@/lib/ai";
import { useProgress } from "@/lib/progress";
import { fmt } from "@/locales";

// ponytail: lịch sử chat chỉ nằm trong bộ nhớ, đổi câu / tải lại là mất; lưu localStorage theo id câu nếu cần.
const MAX_ASK = 10; // số tin người dùng mỗi cuộc trò chuyện, khớp với api/chat
// Các trang đã có phòng phỏng vấn AI riêng (khung chat toàn màn hình) thì ẩn gia sư.
const hiddenOn = /^\/[^/]+\/(interview|project|weak)(\/|$)/;

// Câu đang xem / vừa xem: trang câu hỏi gắn vào qua <ChatTopic>, gia sư đọc ra làm ngữ cảnh.
type Topic = { id: string; title: string };
let topic: Topic | null = null;
const subs = new Set<() => void>();
function setTopic(t: Topic | null) {
  topic = t;
  subs.forEach((f) => f());
}
function subscribe(f: () => void) {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
}

/** Đặt trong trang câu hỏi: gia sư AI sẽ hỏi đáp quanh câu này. */
export function ChatTopic({ id, title }: Topic) {
  // Không xoá khi rời trang: sang Lộ trình, Thuật ngữ… vẫn hỏi tiếp được về câu vừa xem.
  useEffect(() => setTopic({ id, title }), [id, title]);
  return null;
}

/** Chữ trong tin nhắn: ``` là code, [[id]] là link tới câu trong ngân hàng, **x** là chữ đậm. */
function Text({ text, lang, links }: { text: string; lang: string; links: Record<string, string> }) {
  return text.split(/```[^\n]*\n([\s\S]*?)```/).map((part, i) =>
    i % 2 ? (
      <pre key={i} className="my-1.5 overflow-x-auto rounded-lg bg-code p-2.5 font-mono text-xs text-[#e2e8f0]">{part.trimEnd()}</pre>
    ) : (
      <span key={i} className="whitespace-pre-line">
        {part.replace(/^\n+|\n+$/g, "").split(/(\[\[[^\]]+\]\]|\*\*[^*\n]+\*\*)/).map((s, j) => {
          if (j % 2 === 0) return s;
          if (s.startsWith("**")) return <b key={j}>{s.slice(2, -2)}</b>;
          const id = s.slice(2, -2);
          return links[id] ? (
            <Link key={j} href={`/${lang}/questions/${id}`} className="font-semibold text-brand hover:underline">
              {links[id]} →
            </Link>
          ) : null;
        })}
      </span>
    ),
  );
}

export default function ChatWidget({ lang, t }: { lang: string; t: Dict["chat"] }) {
  const path = usePathname();
  const cur = useSyncExternalStore(subscribe, () => topic, () => null);
  const draft = useProgress()?.drafts?.[cur?.id ?? ""];
  const [open, setOpen] = useState(false);
  // Cuộc trò chuyện gắn với id câu; đổi câu đang xem = cuộc trò chuyện mới.
  const [chat, setChat] = useState<{ id?: string; msgs: Turn[]; note?: string }>({ msgs: [] });
  const [links, setLinks] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const same = chat.id === cur?.id;
  const msgs = same ? chat.msgs : [];
  const note = same ? chat.note : undefined;
  const asked = msgs.filter((m) => m.role === "user").length;
  const left = asked < MAX_ASK;

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length, busy, note, open]);

  if (hiddenOn.test(path)) return null;

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || busy || !left) return;
    const id = cur?.id;
    const next: Turn[] = [...msgs, { role: "user", text }];
    setChat({ id, msgs: next });
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, id, draft: id ? draft : undefined, messages: next }),
      });
      const data = await res.json().catch(() => ({ error: res.statusText }));
      if (!res.ok) throw new Error(data.error);
      setLinks((l) => ({ ...l, ...data.links }));
      setChat((c) => (c.id === id ? { id, msgs: [...next, { role: "model", text: data.text }] } : c));
    } catch (e) {
      // Lỗi thì bỏ tin vừa gửi (để không có 2 lượt user liền nhau) và trả lại chữ vào ô nhập.
      setChat((c) => (c.id === id ? { id, msgs, note: fmt(t.error, { msg: e instanceof Error ? e.message : String(e) }) } : c));
      setInput(text);
    } finally {
      setBusy(false);
    }
  }

  function grade() {
    if (draft?.trim()) send(t.gradePrompt);
    else setChat({ id: cur?.id, msgs, note: t.noDraft });
  }

  const quick = cur ? t.quickTopic : t.quickGeneral;
  const chip = "flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-brand-line bg-panel px-2.5 text-xs font-medium text-brand hover:bg-brand-soft";
  const bubble = "max-w-[85%] rounded-[4px_14px_14px_14px] border border-line bg-panel px-3 py-2 text-[13px] leading-relaxed";

  return (
    <>
      {open && (
        <div
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          className="fixed z-30 flex flex-col overflow-hidden bg-panel max-md:inset-0 md:bottom-38 md:right-6 md:h-[min(560px,calc(100vh-11rem))] md:w-95 md:rounded-[18px] md:border md:border-line md:shadow-[0_24px_60px_-18px_rgb(15_23_42/0.35)]"
        >
          <div className="flex items-center gap-2.5 bg-[image:var(--grad)] px-4 py-3 text-white">
            <span className="grid size-8 place-items-center rounded-full bg-white/20"><Icon name="bot-chat" size={16} /></span>
            <div className="min-w-0 flex-1">
              <b className="text-sm">{t.title}</b>
              <div className="text-[11.5px] opacity-85">{cur ? t.subTopic : t.subGeneral}</div>
            </div>
            <button aria-label={t.reset} title={t.reset} onClick={() => setChat({ id: cur?.id, msgs: [] })} className="grid size-7 cursor-pointer place-items-center rounded-lg bg-white/14 hover:bg-white/25">
              <Icon name="rotate" size={14} />
            </button>
            <button aria-label={t.close} title={t.close} onClick={() => setOpen(false)} className="grid size-7 cursor-pointer place-items-center rounded-lg bg-white/14 hover:bg-white/25">
              <Icon name="x" size={14} />
            </button>
          </div>

          {cur && (
            <div className="mx-3.5 mt-3 flex items-center gap-2 rounded-[10px] border border-brand-line bg-brand-soft px-2.5 py-2 text-xs">
              <Icon name="book" size={14} className="shrink-0 text-brand" />
              <b className="line-clamp-1 font-semibold text-brand">{cur.title}</b>
              <span className="ml-auto shrink-0 text-subtle">{path.endsWith(`/questions/${cur.id}`) ? t.viewing : t.recent}</span>
              <button aria-label={t.clearTopic} title={t.clearTopic} onClick={() => setTopic(null)} className="shrink-0 cursor-pointer text-subtle hover:text-fg">
                <Icon name="x" size={13} />
              </button>
            </div>
          )}

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-panel2 p-3.5 md:mt-3">
            <div className={bubble}>{cur ? t.greetTopic : t.greetGeneral}</div>
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="max-w-[85%] self-end whitespace-pre-line rounded-[14px_4px_14px_14px] bg-[image:var(--grad)] px-3 py-2 text-[13px] leading-relaxed text-white">
                  {m.text}
                </div>
              ) : (
                <div key={i} className={bubble}><Text text={m.text} lang={lang} links={links} /></div>
              ),
            )}
            {busy && (
              <div className="flex gap-1.5 self-start rounded-[4px_14px_14px_14px] border border-line bg-panel px-3.5 py-3">
                {[1, 0.6, 0.3].map((o) => <i key={o} className="size-1.5 animate-pulse rounded-full bg-brand" style={{ opacity: o }} />)}
              </div>
            )}
            {note && <p className="text-xs text-muted">{note}</p>}
            {!left && <p className="text-xs text-muted">{fmt(t.limit, { n: MAX_ASK })}</p>}
            <div ref={bottom} />
          </div>

          {left && (
            <div className="flex gap-1.5 overflow-x-auto px-3.5 pt-2.5 [scrollbar-width:none]">
              {cur && (
                <button className={chip} onClick={grade} disabled={busy}>
                  <Icon name="target" size={12} /> {t.grade}
                </button>
              )}
              {quick.map(([label, prompt]) => (
                <button key={label} className={chip} onClick={() => send(prompt)} disabled={busy}>
                  {label}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="m-3.5 flex items-end gap-2 rounded-xl border border-brand-line bg-panel py-1.5 pl-3 pr-1.5 shadow-[0_0_0_4px_var(--color-brand-soft)]"
          >
            <textarea
              rows={1}
              autoFocus
              value={input}
              maxLength={2000}
              disabled={!left}
              placeholder={t.placeholder}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send(input);
                }
              }}
              className="max-h-28 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-[13px] outline-none"
            />
            <span className="pb-2 text-[11px] text-subtle">{asked}/{MAX_ASK}</span>
            <button aria-label={t.send} disabled={busy || !left || !input.trim()} className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-[9px] bg-[image:var(--grad)] text-white disabled:opacity-50">
              <Icon name="send" size={15} />
            </button>
          </form>
        </div>
      )}

      <button
        aria-label={open ? t.close : t.open}
        onClick={() => setOpen(!open)}
        className={`fixed bottom-20 right-5 z-30 size-14 cursor-pointer place-items-center rounded-full bg-[image:var(--grad)] text-white shadow-[0_12px_28px_-10px_rgb(79_70_229/0.8)] hover:brightness-110 md:right-6 ${open ? "hidden md:grid" : "grid"}`}
      >
        <Icon name={open ? "x" : "bot-chat"} size={26} />
      </button>
    </>
  );
}
