"use client";

import { useMemo, useState, useSyncExternalStore, type ComponentProps } from "react";
import type { Dict } from "@/i18n";
import { categories, MAX_CONTEXT, type Category, type Project, type ProjectQuestion } from "@/lib/project";
import { fmt, type Locale } from "@/locales";
import InterviewRoom from "../interview/interview-room";

type Props = {
  lang: Locale;
  t: Dict["project"];
  ratings: Dict["ratings"];
  room: Pick<ComponentProps<typeof InterviewRoom>, "t" | "trackNames" | "levelNames">;
};

// ponytail: chỉ nhớ 1 project gần nhất trong localStorage; nhiều project / đồng bộ máy khác thì cần database.
const KEY = "devinterview:project:v1";
const MAX_CV_BYTES = 3_000_000;

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

function save(p: Project) {
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new StorageEvent("storage")); // báo cho chính tab này
}

const toBase64 = (f: File) =>
  new Promise<string>((ok, fail) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(",")[1]);
    r.onerror = fail;
    r.readAsDataURL(f);
  });

/** Tóm tắt project + câu hỏi dự kiến gửi cho người phỏng vấn AI; câu được chọn đứng đầu. */
function context(p: Project, first?: ProjectQuestion) {
  const qs = first ? [first, ...p.questions.filter((q) => q !== first)] : p.questions;
  return [
    `${p.name}: ${p.summary}`,
    `Stack: ${p.stack.join(", ")}`,
    "Findings:",
    ...p.findings.map((f) => `- [${f.kind}] ${f.text}`),
    "Planned questions:",
    ...qs.map((q, i) => `${i + 1}. ${q.question}${q.file ? ` (${q.file} ${q.lines})` : ""}`),
  ]
    .join("\n")
    .slice(0, MAX_CONTEXT);
}

const kindColor = {
  strength: "border-green-200 bg-green-50 text-green-700",
  likely: "border-amber-200 bg-amber-50 text-amber-700",
  risk: "border-red-200 bg-red-50 text-red-700",
};
const diffColor = {
  easy: "",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  hard: "border-red-200 bg-red-50 text-red-700",
};

export default function DeepDive({ lang, t, ratings, room }: Props) {
  const raw = useSyncExternalStore(subscribe, () => localStorage.getItem(KEY), () => null);
  const project = useMemo<Project | null>(() => {
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [raw]);
  const [repo, setRepo] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Category | "all">("all");
  const [practice, setPractice] = useState<ProjectQuestion | "all" | null>(null);

  function pickCv(f?: File) {
    setError("");
    if (f && f.size > MAX_CV_BYTES) return setError(t.tooBig);
    setCv(f ?? null);
  }

  async function analyze() {
    if (busy) return;
    if (!repo.trim() && !cv) return setError(t.needInput);
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, repo: repo.trim(), cv: cv ? await toBase64(cv) : "" }),
      });
      const data = await res.json().catch(() => ({ error: res.statusText }));
      if (!res.ok) throw new Error(t.errors[data.error as keyof typeof t.errors] ?? fmt(t.error, { msg: data.error }));
      save(data.project);
      setFilter("all");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (project && practice)
    return (
      <>
        <button className="btn-ghost self-start" onClick={() => setPractice(null)}>
          {t.back}
        </button>
        <InterviewRoom
          lang={lang}
          {...room}
          initialTrack={project.track}
          initialLevel="junior"
          context={context(project, practice === "all" ? undefined : practice)}
          project={project.name}
        />
      </>
    );

  const present = categories.filter((c) => project?.questions.some((q) => q.category === c));
  const shown = project?.questions.filter((q) => filter === "all" || q.category === filter) ?? [];

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="mt-0.5 text-sm text-muted">{t.subtitle}</p>
      </div>

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <input
          className="field min-w-64 flex-1"
          type="url"
          placeholder={`🔗  ${t.repo}`}
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && analyze()}
        />
        <span className="text-sm text-muted">{t.or}</span>
        <label className="btn-ghost max-w-64">
          <span className="truncate">{cv ? `📄 ${cv.name}` : t.cv}</span>
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => pickCv(e.target.files?.[0])} />
        </label>
        <button className="btn" onClick={analyze} disabled={busy}>
          {t.analyze}
        </button>
      </div>

      {busy && <p className="text-sm text-muted">● ● ● {t.analyzing}</p>}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!project ? (
        !busy && <div className="card text-muted">{t.empty}</div>
      ) : (
        <div className="grid items-start gap-5 md:grid-cols-[340px_minmax(0,1fr)]">
          <div className="flex flex-col gap-5">
            <div className="card">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">
                  📦{" "}
                  {project.repo ? (
                    <a href={project.repo} target="_blank" rel="noreferrer" className="hover:underline">
                      {project.name}
                    </a>
                  ) : (
                    project.name
                  )}
                </h2>
                <span className="tag ml-auto border-green-200 bg-green-50 text-green-700">{t.analyzed}</span>
              </div>
              <p className="mt-2 text-sm text-muted">
                {project.summary}
                {project.files ? ` · ${fmt(t.files, { n: project.files })}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {project.stack.map((s) => (
                  <span key={s} className="tag border-brand-line bg-brand-soft text-brand">{s}</span>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="mb-3 font-semibold">{t.findings}</h2>
              <ul className="space-y-3 text-sm">
                {project.findings.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className={`tag ${kindColor[f.kind]}`}>{t.kinds[f.kind]}</span>
                    {f.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="mr-auto font-semibold">{fmt(t.questions, { n: project.questions.length })}</h2>
              {(["all", ...present] as const).map((c) => (
                <button
                  key={c}
                  className={`${filter === c ? "btn" : "btn-ghost"} px-3 py-1.5 font-normal`}
                  onClick={() => setFilter(c)}
                >
                  {c === "all" ? t.all : t.categories[c]}
                </button>
              ))}
            </div>

            <div className="mt-2 flex flex-col divide-y divide-line">
              {shown.map((q) => (
                <details key={q.question} className="py-3">
                  <summary className="flex cursor-pointer list-none items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{q.question}</div>
                      <div className="mt-1 text-xs text-muted">
                        {t.categories[q.category]}
                        {q.file && <> · <code className="font-mono">{q.file}</code></>}
                        {q.lines && ` · ${fmt(t.lines, { n: q.lines })}`}
                      </div>
                    </div>
                    <span className={`tag ${diffColor[q.difficulty]}`}>{ratings[q.difficulty]}</span>
                    <button
                      className="btn-ghost px-3 py-1.5"
                      onClick={(e) => {
                        e.preventDefault();
                        setPractice(q);
                      }}
                    >
                      {t.practice}
                    </button>
                  </summary>
                  <div className="mt-2 text-sm">
                    <div className="mb-1 text-xs uppercase tracking-wide text-brand2">{t.points}</div>
                    <ul className="list-disc space-y-1 pl-5 text-muted">
                      {q.points.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                </details>
              ))}
            </div>

            <button className="btn mt-4" onClick={() => setPractice("all")}>
              {t.interviewAll}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
