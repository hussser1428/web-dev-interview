# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@web/AGENTS.md

## Layout

- `IDEA.md` — product vision (Vietnamese): question bank, AI mock interview, project deep-dive, dashboard. `PLAN.md` — current phase status.
- `mockups/v2/index-light.html?s=dashboard|bank|setup|room|report` — **current** target UI (light theme, Inter). Palette tokens in `globals.css` `@theme` mirror its `:root`. New screens should match it. `mockups/v2/index.html` + PNGs are the dark variant, `mockups/index.html` the old v1 — reference only.
- `web/` — the app (Next.js 16, React 19, Tailwind 4, TypeScript). All commands run from `web/`.

## Commands (in `web/`)

```bash
npm run dev          # http://localhost:3000
npm run build
npm run lint
npm run check:data   # validates src/data/questions/*.json (ids, levels, vi+en present, no unknown fields)
npm test             # scripts/test-srs.ts + scripts/test-glossary.ts via node --experimental-strip-types — plain node:assert, no test framework
```

Run one test file directly with `node --experimental-strip-types --no-warnings scripts/test-srs.ts` (or `test-glossary.ts`). Run `check:data` after any edit to question or glossary JSON.

AI interview needs `GEMINI_API_KEY` in `web/.env.local` (see `.env.example`; optional `GEMINI_MODEL`, default `gemini-flash-latest`).

## Next.js 16 specifics used here

Read `web/node_modules/next/dist/docs/` before using unfamiliar APIs — this version differs from older Next.js:
- `src/proxy.ts` (not `middleware.ts`) redirects locale-less URLs to `/vi/...` or `/en/...` via `lang` cookie → `Accept-Language` → default `vi`. Excludes `/api`.
- `next.config.ts` enables `cacheComponents` and `partialPrefetching`; Tailwind is wired through a Turbopack loader rule, not PostCSS.
- `[lang]` is a root param: server code reads it with `getLocale()` from `src/i18n.ts` (uses `next/root-params`), not via `params`. `app/[lang]/layout.tsx` is the root layout (owns `<html>`).
- Typed route helpers `PageProps<"/[lang]/...">` / `LayoutProps<...>` are globals.
- Client components using `useSearchParams` must be wrapped in `<Suspense>`.

## Architecture

**No database, no auth.** Content is static JSON; user progress lives in `localStorage`.

- **Content**: `src/data/questions/<track>.json`, one file per track. **Array order = learning-roadmap order**; topics are grouped by first appearance (`roadmap()` in `src/lib/questions.ts`). Each question is bilingual (`q`, `a`, optional `tip`, `followUps` as `{vi, en}`). Schema and how to add questions are in `web/README.md`. `src/lib/questions.ts` is `server-only` and statically imports every track file — adding a track means updating `tracks` in `src/lib/catalog.ts`, the import map in `questions.ts`, `trackColor` (hex pair), `trackIcon` in `src/components/icon.tsx`, and `tracks.*` in both dictionaries. `check-questions.mjs` regex-parses `tracks`/`levels` out of `catalog.ts`, so keep those as single-line array literals.
- **Server → client boundary**: server pages pick the locale and send slim `QuestionItem`s (`toItem()`) plus the relevant dictionary slice (`t.questions`, etc.) as props. Client components never import question JSON or `i18n.ts`.
- **i18n**: `src/locales.ts` (locale list, `pick()` fallback to en→vi, `fmt()` for `{var}` interpolation; safe for server/client/proxy). `src/i18n.ts` loads `src/dictionaries/<lang>.json`; `vi.json` defines the `Dict` type, so every dictionary must have the same keys. Steps to add a language are in `web/README.md`.
- **Glossary**: `src/data/glossary.json` (`term`, `match` forms, `def`/`full`/`example` as `{vi,en}`, optional `see` = question id that explains it, `related`, `tracks` to limit ambiguous words). `src/lib/glossary-match.ts` is the pure matcher (all-caps forms match case-sensitively, longest form wins, Unicode word boundaries, first occurrence per title/answer only; tested by `scripts/test-glossary.ts`). `src/lib/glossary.ts` (server-only) annotates question title/answer into `Seg[]` for `<Rich>` (`src/components/rich-text.tsx`, Popover API popups) and builds `/[lang]/glossary` data (where each term appears). "Understood" state is `Progress.terms`.
- **Progress / spaced repetition**: `src/lib/srs.ts` is pure logic (dates as local `YYYY-MM-DD` strings, Leitner-style intervals: hard=1 day, medium ×1.5, easy ×2.5, streaks, flashcard queue) — tested by `scripts/test-srs.ts`. `src/lib/progress.ts` is the client store (`useSyncExternalStore` over localStorage key `devinterview:progress:v1`). `useProgress()` returns `null` on the server/during hydration — handle `null` to avoid hydration mismatches. Mutate only via `updateProgress(p => srsFn(p, ...))`.
- **AI interview (Beta)**: every model call goes through `ask()` in `src/lib/ai.ts` (Gemini via `@google/genai`); swapping providers should only touch that function. `src/app/api/interview/route.ts` validates the body (`action: "chat" | "report"`, capped question count/text length), builds interviewer/grader prompts, and for reports requests JSON matching `reportSchema` in `src/lib/report.ts` (schema + `Report` type shared with the UI). An optional `context` string (≤ `MAX_CONTEXT`) is an interview plan: a project deep-dive, or a retry of a weak answer. Grading attaches `related` (a bank id, validated server-side); `logInterview()` in `srs.ts` stores the session plus every answer scored < `WEAK` as `Progress.weak` (shown at `/[lang]/weak`) and puts matched bank questions into today's review. Code from the room's editor is appended to the user turn as a fenced block (no separate field); `renderText()` in `interview-room.tsx` renders fences as `<pre>`.
- **Project Deep-dive**: `src/app/api/project/route.ts` takes `{lang, repo?, cv?}` (cv = base64 PDF, passed to `ask()` as an attachment). `src/lib/github.ts` reads a public repo via GitHub API (`HEAD` tree) + raw.githubusercontent, picks files heuristically and prefixes line numbers so the AI can cite `file`/`lines`. Result type/schema in `src/lib/project.ts`; the client keeps only the last analysis in localStorage (`devinterview:project:v1`) and reuses `InterviewRoom` with `context` for practice. Optional `GITHUB_TOKEN` env raises the GitHub rate limit.

## Conventions

- Code comments and user-facing docs are in Vietnamese; keep that.
- Deliberate shortcuts are marked with `// ponytail:` comments naming the limit and upgrade path (e.g. localStorage → DB, Leitner → SM-2/FSRS).
- Track/level colors are hex pairs in `catalog.ts`, applied as CSS vars via `style={hue(...)}` and consumed by `.tagc`/`.chipi`/`.tint`/`.g-hue` in `globals.css` (so no dynamic Tailwind class names). Light theme: text is `text-fg` (not `text-white`); gradient `.vivid` + `g-warm|g-teal|g-ocean|g-berry|g-grad|g-hero` only for stat cards / one hero per screen; tinted boxes use `.soft` + `hue(...)`; code blocks stay dark (`bg-code`). Icons: `<Icon name=…>` in `src/components/icon.tsx` (Lucide paths, no icon dependency).
- Question answers must be original writing, not copied verbatim from copyrighted sources.
