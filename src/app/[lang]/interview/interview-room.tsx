"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Icon, { trackIcon, type IconName } from "@/components/icon";
import type { Dict } from "@/i18n";
import type { Turn } from "@/lib/ai";
import { hue, levelColor, levels, styles, trackColor, tracks, type Level, type Style, type Track } from "@/lib/catalog";
import { updateProgress, useProgress } from "@/lib/progress";
import { MAX_CONTEXT } from "@/lib/project";
import { WEAK, type Report } from "@/lib/report";
import { logInterview, today } from "@/lib/srs";
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
  /** Tên project, lưu kèm câu yếu để biết câu đó thuộc project nào. */
  project?: string;
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

const codeLangs: [string, string][] = [
  ["TypeScript", "ts"], ["JavaScript", "js"], ["Python", "py"], ["Java", "java"],
  ["Go", "go"], ["C#", "cs"], ["C++", "cpp"], ["SQL", "sql"],
];
const counts = { 3: 10, 5: 15, 8: 25 } as const; // số câu -> phút ước tính
const styleLook: Record<Style, { icon: IconName; color: [string, string] }> = {
  outsource: { icon: "globe", color: ["#1d4ed8", "#4f46e5"] },
  product: { icon: "rocket", color: ["#6d28d9", "#c026d3"] },
  bigtech: { icon: "building", color: ["#c2410c", "#c2410c"] },
};
const violet = hue(["#7c3aed", "#7c3aed"]);
const green = hue(levelColor.intern);
const red = hue(levelColor.senior);

/**
 * Hiện tin nhắn: phần trong ``` là code (giữ thụt lề), phần còn lại là chữ.
 * Tin của mình thì code thu gọn thành chip "solution.ts · 12 dòng" (bấm để xem).
 */
function renderText(text: string, mine: boolean, linesLabel: string) {
  // split với 2 nhóm bắt: [chữ, ngôn ngữ, code, chữ, ngôn ngữ, code, chữ…]
  const parts = text.split(/```([^\n]*)\n([\s\S]*?)```/);
  return parts.map((part, i) => {
    if (i % 3 === 1) return null;
    if (i % 3 === 0) return part.trim() && <span key={i} className="whitespace-pre-line">{part.trim()}</span>;
    const code = <pre className="mt-2 overflow-x-auto rounded-lg bg-code p-3 font-mono text-xs text-[#e2e8f0]">{part.trimEnd()}</pre>;
    if (!mine) return <div key={i}>{code}</div>;
    const ext = codeLangs.find(([l]) => l === parts[i - 1])?.[1] ?? "txt";
    return (
      <details key={i} className="mt-2">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg bg-white/18 px-2.5 py-1 text-xs">
          <Icon name="code" size={13} /> solution.{ext} · {fmt(linesLabel, { n: part.trimEnd().split("\n").length })}
        </summary>
        {code}
      </details>
    );
  });
}

/** Bốc ngẫu nhiên tối đa n phần tử (Fisher–Yates). */
function sample<T>(list: T[], n: number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

const scoreHue = (s: number) => hue(s >= 8 ? levelColor.intern : s >= 5 ? levelColor.mid : levelColor.senior);
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function InterviewRoom({ lang, t, trackNames, levelNames, initialTrack, initialLevel, context, project }: Props) {
  const [stage, setStage] = useState<"setup" | "chat" | "report">("setup");
  const [track, setTrack] = useState(initialTrack);
  const [level, setLevel] = useState(initialLevel);
  const [style, setStyle] = useState<Style>("product");
  const [total, setTotal] = useState<keyof typeof counts>(5);
  const [messages, setMessages] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<"thinking" | "grading" | null>(null);
  const [error, setError] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [listening, setListening] = useState(false);
  const [code, setCode] = useState("");
  const [codeLang, setCodeLang] = useState(codeLangs[0]);
  const [sentCode, setSentCode] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const mine = useProgress()?.myQuestions ?? ""; // câu hỏi tự nhập, mỗi dòng một câu (lưu cùng tiến độ)
  const retry = useRef<() => void>(() => {});
  const rec = useRef<Recognition | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  // Kế hoạch của buổi đang chạy, chốt lúc bắt đầu (ref để lượt hỏi đầu tiên dùng được ngay).
  const plan = useRef(context);

  const mineList = mine.split("\n").map((l) => l.trim()).filter(Boolean);
  const asked = messages.filter((m) => m.role === "model").length;
  // Chỉ gửi kèm code khi có thay đổi so với lần gửi trước.
  const codePending = code.trim() !== "" && code !== sentCode;

  // Ngoặc nhọn: scrollIntoView ở trình duyệt mới trả về Promise, React sẽ tưởng là hàm cleanup.
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  // Đồng hồ thời gian buổi phỏng vấn.
  useEffect(() => {
    if (stage !== "chat") return;
    const t0 = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(id);
  }, [stage]);

  async function call(action: "chat" | "report", msgs: Turn[]) {
    const res = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, lang, track, level, style, total, messages: msgs, context: plan.current }),
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
      const r: Report = (await call("report", msgs)).report;
      const date = today();
      const weak = r.questions
        .filter((q) => q.score < WEAK)
        .map((q) => ({ ...q, id: crypto.randomUUID(), date, track, level, style, project }));
      updateProgress((p) => logInterview(p, { date, track, level, style, overall: r.overall }, weak));
      setReport(r);
      setStage("report");
    });

  function start() {
    // Không có kế hoạch từ Deep-dive / câu yếu thì dùng câu tự nhập; nhiều hơn số câu của buổi thì bốc ngẫu nhiên.
    const picked = sample(mineList, total);
    plan.current =
      context ??
      (picked.length ? `Questions the candidate wrote and wants to be asked:\n${picked.join("\n")}`.slice(0, MAX_CONTEXT) : undefined);
    setMessages([]);
    setReport(null);
    setCode("");
    setSentCode("");
    setElapsed(0);
    setStage("chat");
    nextQuestion([]);
  }

  function send() {
    const answer = input.trim();
    if ((!answer && !codePending) || busy) return;
    rec.current?.stop();
    const fence = "```";
    const text = codePending ? `${answer}\n\n${fence}${codeLang[0]}\n${code.trimEnd()}\n${fence}` : answer;
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
    <div className="soft flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-(--c)" style={red}>
      <span className="flex-1">{error}</span>
      {stage !== "setup" && (
        <button className="btn-ghost h-8" onClick={() => retry.current()}>
          <Icon name="rotate" size={14} />
        </button>
      )}
    </div>
  );
  const sessionTags = (
    <>
      <span className="tagc px-3 py-1 text-[13px]" style={hue(trackColor[track])}>
        <Icon name={trackIcon[track]} size={14} /> {trackNames[track]}
      </span>
      <span className="tagc px-3 py-1 text-[13px]" style={hue(levelColor[level])}>{levelNames[level]}</span>
      <span className="tagc px-3 py-1 text-[13px]" style={violet}>{t.styles[style]}</span>
    </>
  );

  if (stage === "setup")
    return (
      <>
        <header className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[image:var(--grad)] text-white shadow-[0_10px_24px_-10px_#6d28d9]">
            <Icon name="bot" size={28} />
          </span>
          <div>
            <h1 className="text-[28px] font-bold tracking-tight">{t.title}</h1>
            <p className="text-muted">{t.subtitle}</p>
          </div>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="card divide-y divide-line p-0">
            <Section icon="target" title={t.track}>
              <div className="grid gap-3 sm:grid-cols-3">
                {tracks.map((tr) => (
                  <Option key={tr} on={track === tr} color={trackColor[tr]} onClick={() => setTrack(tr)}>
                    <span className={`chipi ${track === tr ? "solid" : ""}`}><Icon name={trackIcon[tr]} /></span>
                    <span className="flex-1 font-semibold">{trackNames[tr]}</span>
                  </Option>
                ))}
              </div>
            </Section>
            <Section icon="bars" title={t.level}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {levels.map((l) => (
                  <Option key={l} on={level === l} color={levelColor[l]} onClick={() => setLevel(l)} plain>
                    <span className="flex-1 text-center font-semibold">{levelNames[l]}</span>
                  </Option>
                ))}
              </div>
            </Section>
            <Section icon="sliders" title={t.style} hint={t.styleHint}>
              <div className="grid gap-3 sm:grid-cols-3">
                {styles.map((s) => (
                  <Option key={s} on={style === s} color={styleLook[s].color} onClick={() => setStyle(s)} big>
                    <span className={`chipi ${style === s ? "solid" : ""}`}><Icon name={styleLook[s].icon} /></span>
                    <span className="text-lg font-bold">{t.styles[s]}</span>
                    <span className="text-[13px] leading-snug text-muted">{t.styleDesc[s]}</span>
                  </Option>
                ))}
              </div>
            </Section>
            <Section icon="clock" title={t.countLabel}>
              <div className="grid grid-cols-3 gap-3">
                {([3, 5, 8] as const).map((n) => (
                  <Option key={n} on={total === n} color={["#7c3aed", "#4f46e5"]} onClick={() => setTotal(n)} plain>
                    <span className="flex-1 text-center font-medium">
                      {fmt(t.countOpt, { n })} &nbsp; {fmt(t.minutes, { n: counts[n] })}
                    </span>
                  </Option>
                ))}
              </div>
            </Section>
            {!context && (
              <Section icon="list" title={t.myQuestions} hint={t.myQuestionsHint}>
                <textarea
                  className="field min-h-28 resize-y"
                  placeholder={t.myQuestionsPlaceholder}
                  value={mine}
                  onChange={(e) => updateProgress((p) => ({ ...p, myQuestions: e.target.value || undefined }))}
                />
                {mineList.length > total && (
                  <p className="text-sm text-muted">{fmt(t.myQuestionsMore, { n: mineList.length, total })}</p>
                )}
              </Section>
            )}
          </div>

          <div className="flex flex-col gap-5 lg:sticky lg:top-20">
            <div className="card overflow-hidden p-0">
              <div className="vivid g-hero p-5">
                <div className="flex items-center gap-2 text-sm text-white/92">
                  <Icon name="star" size={15} className="fill-white" /> {t.yourSession}
                </div>
                <div className="mt-1 text-2xl font-extrabold tracking-tight">{trackNames[track]} · {levelNames[level]}</div>
                <div className="text-sm text-white/92">
                  {t.styles[style]} · {fmt(t.countOpt, { n: total })} {fmt(t.minutes, { n: counts[total] })}
                </div>
              </div>
              <dl className="flex flex-col gap-3.5 p-5 text-[15px]">
                <Row icon={trackIcon[track]} label={t.track} value={trackNames[track]} color={trackColor[track][0]} />
                <Row icon="bars" label={t.level} value={levelNames[level]} color={levelColor[level][0]} />
                <Row icon="sliders" label={t.style} value={t.styles[style]} color={styleLook[style].color[0]} />
                <Row icon="clock" label={t.duration} value={`${fmt(t.countOpt, { n: total })} ${fmt(t.minutes, { n: counts[total] })}`} />
              </dl>
              <div className="px-5 pb-5">
                <button className="btn h-12 w-full text-base" onClick={start}>
                  <Icon name="play" /> {t.start}
                </button>
              </div>
            </div>
            {errorBox}

            <div className="card flex flex-col gap-3">
              {(["bot", "mic", "target"] as const).map((ic, i) => (
                <div key={ic} className="flex items-center gap-3 text-sm text-muted">
                  <span className="chipi" style={hue([["#1d4ed8", "#6d28d9", "#0e7490"][i], "#4f46e5"])}><Icon name={ic} /></span>
                  {t.features[i]}
                </div>
              ))}
              <div className="mt-2 flex flex-col items-center gap-2 rounded-xl border border-line bg-panel2 px-4 py-5 text-center">
                <div className="flex items-center gap-3">
                  <Wave />
                  <span className="grid size-16 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#818cf8,#4f46e5)] text-white shadow-[0_0_30px_rgb(99_102_241/0.45)]">
                    <Icon name="mic" size={28} />
                  </span>
                  <Wave />
                </div>
                <b className="mt-2 text-sm">{t.ready}</b>
                <span className="text-xs text-muted">{t.readySub}</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );

  const weakCount = report?.questions.filter((q) => q.score < WEAK).length ?? 0;
  if (stage === "report" && report)
    return (
      <>
        <header className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <h1 className="text-[28px] font-bold tracking-tight">{t.reportTitle}</h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sessionTags}
              <span className="tag">{fmt(t.countOpt, { n: report.questions.length })} · {mmss(elapsed)}</span>
            </div>
          </div>
          <button className="btn h-11" onClick={() => setStage("setup")}>
            <Icon name="plus" /> {t.again}
          </button>
        </header>

        <div className="grid gap-5 md:grid-cols-[280px_minmax(0,1fr)]">
          <div className="vivid g-hero flex flex-col items-center justify-center gap-3 rounded-2xl p-6">
            <div
              className="relative grid size-40 place-items-center rounded-full"
              style={{ background: `conic-gradient(#fff 0 ${report.overall * 10}%, rgb(255 255 255 / 0.22) 0)` }}
            >
              <div className="grid size-[136px] place-items-center rounded-full bg-[#5b21b6]">
                <div className="text-center">
                  <b className="text-[42px] font-extrabold leading-none tracking-tighter">{report.overall.toFixed(1)}</b>
                  <div className="text-sm text-white/90">/ 10</div>
                </div>
              </div>
            </div>
          </div>
          <div className="card flex flex-col gap-4">
            <p className="leading-relaxed text-[#334155]">{report.summary}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {(Object.keys(t.criteria) as (keyof Report["criteria"])[]).map((k, i) => (
                <div key={k} className="tint flex flex-col gap-2 rounded-xl px-3.5 py-3" style={hue([["#1d4ed8", "#047857", "#b45309"][i], "#4f46e5"])}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="chipi sm"><Icon name={(["brain", "target", "chat"] as const)[i]} size={14} /></span>
                    <span className="flex-1 font-semibold leading-tight">{t.criteria[k]}</span>
                    <b className="text-lg font-extrabold text-(--c)">{report.criteria[k].toFixed(1)}</b>
                  </div>
                  <div className="bar">
                    <span style={{ width: `${report.criteria[k] * 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {([[t.strengths, report.strengths, levelColor.intern, "check"], [t.improvements, report.improvements, levelColor.mid, "alert"]] as const).map(
                ([title, items, color, icon]) => (
                  <div key={title} className="soft rounded-xl px-4 py-3" style={hue(color)}>
                    <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-(--c)">{title}</h2>
                    {items.map((s, i) => (
                      <div key={i} className="flex gap-2 py-0.5 text-sm text-[#334155]">
                        <Icon name={icon} size={15} strokeWidth={2.4} className="mt-0.5 shrink-0 text-(--c)" /> {s}
                      </div>
                    ))}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="card-h">
            <span className="chipi sm"><Icon name="chat" size={15} /></span>
            <h2 className="font-semibold">{t.perQuestion}</h2>
            {weakCount > 0 && (
              <Link href={`/${lang}/weak`} className="ml-auto flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                {fmt(t.weakAdded, { n: weakCount })} <Icon name="chev" size={14} />
              </Link>
            )}
          </div>
          {report.questions.map((q, i) => (
            <details key={i} className="group border-b border-line last:border-0">
              <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-3.5">
                <span className="soft grid h-8 w-12 shrink-0 place-items-center rounded-lg border-0! text-sm font-extrabold text-(--c)" style={scoreHue(q.score)}>
                  {q.score.toFixed(1)}
                </span>
                <span className="flex-1 font-medium">{q.question}</span>
                {q.related ? (
                  <Link href={`/${lang}/questions/${q.related}`} className="tagc shrink-0 hover:underline" style={q.score < WEAK ? red : violet}>
                    <Icon name={q.score < WEAK ? "rotate" : "book"} size={13} /> {q.score < WEAK ? t.inReview : t.inBank}
                  </Link>
                ) : (
                  q.score < WEAK && <span className="tagc shrink-0" style={red}><Icon name="bookmark" size={13} /> {t.savedWeak}</span>
                )}
                <Icon name="chev" className="text-subtle transition group-open:rotate-90" />
              </summary>
              <div className="grid gap-3.5 px-5 pb-5 md:grid-cols-2 md:pl-21">
                <div className="soft rounded-xl px-4 py-3 text-sm leading-relaxed text-[#334155]" style={red}>{q.feedback}</div>
                <div className="soft rounded-xl px-4 py-3 text-sm leading-relaxed text-[#334155]" style={green}>
                  <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-(--c)">{t.betterAnswer}</h4>
                  {q.betterAnswer}
                </div>
              </div>
            </details>
          ))}
        </div>
      </>
    );

  const lines = Math.max(code.split("\n").length, 16);
  // Phòng phỏng vấn phủ kín vùng nội dung (cạnh sidebar), dùng chung cho trang Interview và Project.
  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-bg md:left-59">
      <header className="flex h-16 shrink-0 flex-wrap items-center gap-3 border-b border-line bg-panel px-6">
        {sessionTags}
        <div className="ml-3 flex gap-1.5">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`h-1.5 w-9 rounded-full ${i < asked ? "bg-[image:var(--grad)]" : "bg-line2"}`} />
          ))}
        </div>
        <span className="text-sm font-semibold">{fmt(t.qOf, { n: Math.max(1, Math.min(asked, total)), total })}</span>
        <span className="flex items-center gap-1.5 text-sm text-muted">
          <Icon name="clock" size={15} /> {mmss(elapsed)}
        </span>
        <button className="btn ml-auto" disabled={!!busy || !messages.some((m) => m.role === "user")} onClick={() => grade(messages)}>
          {t.end}
        </button>
      </header>

      <div className="flex min-h-0 flex-1 gap-4 p-4 max-lg:flex-col">
        <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-line bg-panel">
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-8 py-6 *:shrink-0">
            {messages.map((m, i) =>
              m.role === "model" ? (
                <div key={i} className="flex max-w-[680px] gap-3.5">
                  <AiAvatar />
                  <div className="min-w-0">
                    <div className="mb-1.5 text-sm text-subtle">
                      <b className="font-semibold text-fg">{t.interviewer}</b> · {fmt(t.question, { n: messages.slice(0, i + 1).filter((x) => x.role === "model").length })}
                    </div>
                    <div className="rounded-2xl rounded-tl-md border border-line bg-panel2 px-4 py-3 leading-relaxed">{renderText(m.text, false, t.codeLines)}</div>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex max-w-[720px] flex-col items-end self-end">
                  <div className="mb-1 text-sm text-muted">{t.you}</div>
                  <div className="vivid g-grad flex gap-3 rounded-2xl rounded-tr-md px-4 py-3 leading-relaxed">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/20">
                      <Icon name="bot" size={18} />
                    </span>
                    <div className="min-w-0">{renderText(m.text, true, t.codeLines)}</div>
                  </div>
                </div>
              ),
            )}
            {busy && (
              <div className="flex items-center gap-3.5">
                <AiAvatar />
                <div className="flex items-center gap-1.5 rounded-full border border-line bg-panel2 px-4 py-3" title={busy === "thinking" ? t.thinking : t.grading}>
                  {[1, 0.6, 0.3].map((o) => (
                    <i key={o} className="size-2 animate-pulse rounded-full bg-brand" style={{ opacity: o }} />
                  ))}
                </div>
                {busy === "grading" && <span className="text-sm text-muted">{t.grading}</span>}
              </div>
            )}
            <div ref={bottom} />
          </div>

          <div className="flex flex-col gap-3 px-6 pb-5">
            {errorBox}
            <div className="gborder flex flex-col gap-2 rounded-2xl p-3 pl-4">
              <textarea
                className="min-h-14 resize-none bg-transparent text-[15px] outline-none placeholder:text-subtle"
                placeholder={t.placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && send()}
                disabled={!!busy || asked === 0}
                maxLength={3500}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMic}
                  disabled={!!busy}
                  className="flex cursor-pointer items-center gap-2 rounded-full bg-hover pr-3 text-sm text-red-600 disabled:opacity-50"
                >
                  <span className={`grid size-9 place-items-center rounded-full text-white ${listening ? "shadow-[0_0_0_5px_rgb(239_68_68/0.2)]" : ""}`} style={{ background: "var(--g-red)" }}>
                    <Icon name="mic" size={17} />
                  </span>
                  {listening ? t.listening : t.voice}
                </button>
                <button
                  onClick={() => editor.current?.focus()}
                  className={`tagc cursor-pointer px-3 py-1.5 text-[13px] ${codePending ? "" : "opacity-60"}`}
                  style={hue(["#0e7490", "#0e7490"])}
                >
                  <Icon name="code" size={14} /> {t.attachCode}
                </button>
                <button className="btn ml-auto h-10 px-5" onClick={send} disabled={!!busy || asked === 0 || (!input.trim() && !codePending)}>
                  <Icon name="send" /> {t.send}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col rounded-2xl bg-code text-[#e2e8f0] lg:w-[480px]">
          <div className="flex items-center gap-2.5 border-b border-white/8 px-4 py-3">
            <span className="chipi solid sm" style={hue(["#7c3aed", "#4f46e5"])}><Icon name="code" size={14} /></span>
            <span className="rounded-lg bg-white/5 px-2.5 py-1 font-mono text-sm">solution.{codeLang[1]}</span>
            <label className="relative ml-auto flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 text-sm text-[#94a3b8]">
              {codeLang[0]} <Icon name="down" size={14} />
              <select
                className="absolute inset-0 cursor-pointer bg-code opacity-0"
                value={codeLang[0]}
                onChange={(e) => setCodeLang(codeLangs.find(([l]) => l === e.target.value)!)}
              >
                {codeLangs.map(([l]) => <option key={l}>{l}</option>)}
              </select>
            </label>
          </div>
          <div className="flex min-h-72 flex-1 overflow-auto font-mono text-[13px] leading-7">
            <div className="select-none py-4 pl-3 pr-4 text-right text-[#475569]">
              {Array.from({ length: lines }, (_, i) => <div key={i}>{i + 1}</div>)}
            </div>
            <textarea
              ref={editor}
              wrap="off"
              className="min-h-full flex-1 resize-none overflow-hidden bg-transparent py-4 pr-4 text-[#e2e8f0] outline-none [field-sizing:content] placeholder:text-[#64748b]"
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
          </div>
          <div className="flex items-center gap-2 border-t border-white/8 px-4 py-3 text-xs text-[#94a3b8]">
            {sentCode && code === sentCode && (
              <span className="flex items-center gap-1.5 text-emerald-300">
                <span className="grid size-5 place-items-center rounded-full bg-emerald-500/20"><Icon name="check" size={12} strokeWidth={3} /></span>
                {t.codeSent}
              </span>
            )}
            <span className="ml-auto rounded-lg border border-white/10 px-2.5 py-1">{t.tabIndent}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const AiAvatar = () => (
  <span className="vivid g-ocean grid size-11 shrink-0 place-items-center rounded-full">
    <Icon name="spark" size={20} />
  </span>
);

function Section({ icon, title, hint, children }: { icon: IconName; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3.5 p-5">
      <h2 className="flex items-baseline gap-3 text-lg font-semibold">
        <Icon name={icon} size={20} className="self-center text-brand" />
        {title}
        {hint && <span className="text-sm font-normal text-subtle">{hint}</span>}
      </h2>
      {children}
    </section>
  );
}

/** Ô chọn: chưa chọn = ô xám nhạt, đang chọn = nhuốm màu --c + viền + dấu tích. */
function Option({ on, color, onClick, big, plain, children }: { on: boolean; color: [string, string]; onClick: () => void; big?: boolean; plain?: boolean; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={hue(color) as CSSProperties}
      className={`relative flex cursor-pointer gap-3 rounded-xl px-3.5 text-left ${big ? "flex-col items-start py-4" : "h-14 items-center"} ${
        on ? "g-hue" : plain ? "border border-line2 bg-panel text-muted hover:border-subtle" : "tint hover:border-line2"
      }`}
    >
      {children}
      {on && (
        <span className={`grid size-5 place-items-center rounded-full bg-(--c) text-white ${big || plain ? "absolute right-3 top-3" : ""} ${plain ? "top-1/2! -translate-y-1/2" : ""}`}>
          <Icon name="check" size={12} strokeWidth={3.2} />
        </span>
      )}
    </button>
  );
}

function Row({ icon, label, value, color }: { icon: IconName; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon name={icon} size={20} className="text-subtle" />
      <dt className="text-muted">{label}</dt>
      <dd className="ml-auto font-semibold" style={{ color }}>{value}</dd>
    </div>
  );
}

const Wave = () => (
  <span className="flex items-center gap-[3px]">
    {[6, 14, 22, 12, 26, 16, 8].map((h, i) => (
      <i key={i} className="w-[3px] rounded-full bg-indigo-400" style={{ height: h }} />
    ))}
  </span>
);
