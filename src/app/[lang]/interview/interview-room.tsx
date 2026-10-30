"use client";

import { useEffect, useRef, useState } from "react";
import type { Dict } from "@/i18n";
import type { Turn } from "@/lib/ai";
import { levels, styles, tracks, type Level, type Style, type Track } from "@/lib/catalog";
import type { Report } from "@/lib/report";
import { fmt, type Locale } from "@/locales";

type Props = {
  lang: Locale;
  t: Dict["interview"] & { title: string; speechLang: string };
  trackNames: Dict["tracks"];
  levelNames: Dict["levels"];
  initialTrack: Track;
  initialLevel: Level;
  /** Có thì phỏng vấn xoay quanh project này (từ trang Project Deep-dive). */
  context?: string;
};

// Web Speech API chưa có trong lib.dom của TypeScript, khai báo phần cần dùng.
type Recognition = {
  lang: string;
  continuous: boolean;
  onresult: (e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void;
  onend: () => void;
  start(): void;
  stop(): void;
};

const codeLangs = ["TypeScript", "JavaScript", "Python", "Java", "Go", "C#", "C++", "SQL"];

/** Hiện tin nhắn: phần trong ``` là code (giữ thụt lề), phần còn lại là chữ. */
const renderText = (text: string) =>
  text.split(/```[^\n]*\n?/).map((part, i) =>
    i % 2 ? (
      <pre key={i} className="my-2 overflow-x-auto rounded-lg bg-bg p-3 font-mono text-xs">{part.trimEnd()}</pre>
    ) : (
      <span key={i} className="whitespace-pre-line">{part.trim()}</span>
    ),
  );

const scoreColor = (s: number) => (s >= 8 ? "text-green-400" : s >= 5 ? "text-amber-400" : "text-red-400");

export default function InterviewRoom({ lang, t, trackNames, levelNames, initialTrack, initialLevel, context }: Props) {
  const [stage, setStage] = useState<"setup" | "chat" | "report">("setup");
  const [track, setTrack] = useState(initialTrack);
  const [level, setLevel] = useState(initialLevel);
  const [style, setStyle] = useState<Style>("product");
  const [total, setTotal] = useState(5);
  const [messages, setMessages] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<"thinking" | "grading" | null>(null);
  const [error, setError] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [listening, setListening] = useState(false);
  const [code, setCode] = useState("");
  const [codeLang, setCodeLang] = useState(codeLangs[0]);
  const [sentCode, setSentCode] = useState("");
  const retry = useRef<() => void>(() => {});
  const rec = useRef<Recognition | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  const asked = messages.filter((m) => m.role === "model").length;
  // Chỉ gửi kèm code khi có thay đổi so với lần gửi trước.
  const codePending = code.trim() !== "" && code !== sentCode;

  // Ngoặc nhọn: scrollIntoView ở trình duyệt mới trả về Promise, React sẽ tưởng là hàm cleanup.
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function call(action: "chat" | "report", msgs: Turn[]) {
    const res = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, lang, track, level, style, total, messages: msgs, context }),
    });
    const data = await res.json().catch(() => ({ error: res.statusText }));
    if (!res.ok) throw new Error(data.error === "missing_key" ? t.missingKey : fmt(t.error, { msg: data.error }));
    return data;
  }

  async function run(kind: "thinking" | "grading", fn: () => Promise<void>) {
    setBusy(kind);
    setError("");
    retry.current = () => run(kind, fn);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  const nextQuestion = (msgs: Turn[]) =>
    run("thinking", async () => {
      const { text } = await call("chat", msgs);
      setMessages([...msgs, { role: "model", text }]);
    });

  const grade = (msgs: Turn[]) =>
    run("grading", async () => {
      const data = await call("report", msgs);
      setReport(data.report);
      setStage("report");
    });

  function start() {
    setMessages([]);
    setReport(null);
    setCode("");
    setSentCode("");
    setStage("chat");
    nextQuestion([]);
  }

  function send() {
    const answer = input.trim();
    if ((!answer && !codePending) || busy) return;
    rec.current?.stop();
    const fence = "```";
    const text = codePending ? `${answer}\n\n${fence}${codeLang}\n${code.trimEnd()}\n${fence}` : answer;
    if (codePending) setSentCode(code);
    const msgs: Turn[] = [...messages, { role: "user", text }];
    setMessages(msgs);
    setInput("");
    if (asked >= total) grade(msgs);
    else nextQuestion(msgs);
  }

  function toggleMic() {
    if (rec.current) return rec.current.stop();
    const w = window as unknown as Record<string, new () => Recognition>;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return setError(t.noSpeech);
    const r = new SR();
    r.lang = t.speechLang;
    r.continuous = true;
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++)
        if (e.results[i].isFinal) setInput((v) => `${v} ${e.results[i][0].transcript}`.trim());
    };
    r.onend = () => {
      rec.current = null;
      setListening(false);
    };
    r.start();
    rec.current = r;
    setListening(true);
  }

  const errorBox = error && (
    <div className="flex items-center gap-3 rounded-xl border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
      <span className="flex-1">{error}</span>
      {stage !== "setup" && (
        <button className="btn-ghost" onClick={() => retry.current()}>
          ↻
        </button>
      )}
    </div>
  );

  if (stage === "setup")
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="mt-1 text-muted">{t.subtitle}</p>
        </div>
        <div className="card flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            {t.track}
            <select className="field" value={track} onChange={(e) => setTrack(e.target.value as Track)}>
              {tracks.map((tr) => (
                <option key={tr} value={tr}>{trackNames[tr]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            {t.level}
            <select className="field" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
              {levels.map((l) => (
                <option key={l} value={l}>{levelNames[l]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            {t.style}
            <select className="field" value={style} onChange={(e) => setStyle(e.target.value as Style)}>
              {styles.map((s) => (
                <option key={s} value={s}>{t.styles[s]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            {t.count}
            <select className="field" value={total} onChange={(e) => setTotal(Number(e.target.value))}>
              {[3, 5, 8].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <button className="btn mt-2" onClick={start}>
            ▶ {t.start}
          </button>
        </div>
        {errorBox}
      </div>
    );

  if (stage === "report" && report)
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t.reportTitle}</h1>
            <p className="text-sm text-muted">{trackNames[track]} · {levelNames[level]}</p>
          </div>
          <button className="btn ml-auto" onClick={() => setStage("setup")}>{t.again}</button>
        </div>

        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="card grid place-items-center text-center">
            <div className={`text-5xl font-bold ${scoreColor(report.overall)}`}>{report.overall.toFixed(1)}</div>
            <div className="text-sm text-muted">/ 10</div>
          </div>
          <div className="card flex flex-col gap-3">
            <p className="text-sm">{report.summary}</p>
            {(Object.keys(t.criteria) as (keyof Report["criteria"])[]).map((k) => (
              <div key={k}>
                <div className="flex justify-between text-sm">
                  <span>{t.criteria[k]}</span>
                  <span className={scoreColor(report.criteria[k])}>{report.criteria[k].toFixed(1)}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-panel2">
                  <div className="h-2 rounded-full bg-gradient-to-r from-brand to-brand2" style={{ width: `${report.criteria[k] * 10}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {([[t.strengths, report.strengths, "text-green-400"], [t.improvements, report.improvements, "text-amber-400"]] as const).map(
            ([title, items, color]) => (
              <div key={title} className="card">
                <h2 className={`mb-2 font-semibold ${color}`}>{title}</h2>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {items.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            ),
          )}
        </div>

        <div className="card flex flex-col divide-y divide-line py-1">
          <h2 className="pb-3 pt-2 font-semibold">{t.perQuestion}</h2>
          {report.questions.map((q, i) => (
            <details key={i} className="py-3">
              <summary className="flex cursor-pointer items-center gap-3">
                <span className={`w-10 shrink-0 font-semibold ${scoreColor(q.score)}`}>{q.score.toFixed(1)}</span>
                <span className="flex-1">{q.question}</span>
              </summary>
              <div className="mt-3 grid gap-4 pl-13 text-sm md:grid-cols-2">
                <p className="text-muted">{q.feedback}</p>
                <div>
                  <div className="mb-1 text-xs uppercase tracking-wide text-brand2">{t.betterAnswer}</div>
                  <p>{q.betterAnswer}</p>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    );

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[1fr_420px]">
      <div className="flex h-[calc(100vh-3rem)] min-w-0 flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h1 className="font-bold">{trackNames[track]} · {levelNames[level]}</h1>
            <div className="mt-1.5 flex items-center gap-3 text-sm text-muted">
              {fmt(t.progress, { n: Math.min(asked, total), total })}
              <div className="h-1.5 w-40 rounded-full bg-panel2">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-brand to-brand2" style={{ width: `${(asked / total) * 100}%` }} />
              </div>
            </div>
          </div>
          <button className="btn bg-red-500" disabled={!!busy || !messages.some((m) => m.role === "user")} onClick={() => grade(messages)}>
            {t.end}
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-2xl border px-4 py-3 ${
                m.role === "model" ? "border-line bg-panel2" : "self-end border-[#3b2f80] bg-[#1d1840]"
              }`}
            >
              <div className="mb-1 text-xs text-muted">{m.role === "model" ? `🤖 ${t.interviewer}` : t.you}</div>
              {renderText(m.text)}
            </div>
          ))}
          {busy && (
            <div className="max-w-[85%] rounded-2xl border border-dashed border-line px-4 py-3 text-muted">
              ● ● ● {busy === "thinking" ? t.thinking : t.grading}
            </div>
          )}
          <div ref={bottom} />
        </div>

        {errorBox}

        <div className="card flex flex-col gap-3 p-3">
          <textarea
            className="field min-h-24 resize-none border-0 bg-transparent"
            placeholder={t.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && send()}
            disabled={!!busy || asked === 0}
            maxLength={3500}
          />
          <div className="flex gap-2">
            <button className={listening ? "btn bg-red-500" : "btn-ghost"} onClick={toggleMic} disabled={!!busy}>
              {listening ? t.stopMic : t.mic}
            </button>
            {codePending && <span className="tag self-center">{t.codeAttached}</span>}
            <button className="btn ml-auto" onClick={send} disabled={!!busy || asked === 0 || (!input.trim() && !codePending)}>
              {t.send}
            </button>
          </div>
        </div>
      </div>

      <div className="card flex flex-col gap-3 p-4 lg:h-[calc(100vh-3rem)]">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{t.code}</span>
          <select className="field ml-auto py-1 text-xs" value={codeLang} onChange={(e) => setCodeLang(e.target.value)}>
            {codeLangs.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
        <textarea
          className="field min-h-72 flex-1 resize-none bg-bg font-mono text-xs leading-relaxed"
          placeholder={t.codePlaceholder}
          spellCheck={false}
          maxLength={4000}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) return send();
            if (e.key !== "Tab" || e.shiftKey) return;
            // Tab chèn 2 dấu cách thay vì chuyển focus (Shift+Tab để rời ô).
            e.preventDefault();
            e.currentTarget.setRangeText("  ", e.currentTarget.selectionStart, e.currentTarget.selectionEnd, "end");
            setCode(e.currentTarget.value);
          }}
        />
        <p className="text-xs text-muted">{t.codeHint}</p>
      </div>
    </div>
  );
}
