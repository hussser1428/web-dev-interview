// Kiểm tra src/data/questions/*.json. Chạy: npm run check:data
import { readFileSync } from "node:fs";

const root = new URL("../src/", import.meta.url);
const catalog = readFileSync(new URL("lib/catalog.ts", root), "utf8");
const list = (name) => JSON.parse(catalog.match(new RegExp(`${name} = (\\[.*?\\])`))[1]);
const tracks = list("tracks");
const levels = list("levels");
const locales = ["vi", "en"];

const errors = [];
const ids = new Set();
const isText = (v) => typeof v === "string" && v.trim().length > 0;
const isLocalized = (v) => v && typeof v === "object" && locales.every((l) => isText(v[l]));

for (const track of tracks) {
  const file = `data/questions/${track}.json`;
  let items;
  try {
    items = JSON.parse(readFileSync(new URL(file, root), "utf8"));
  } catch (e) {
    errors.push(`${file}: ${e.message}`);
    continue;
  }
  const byLevel = Object.fromEntries(levels.map((l) => [l, 0]));
  let examples = 0;
  items.forEach((q, i) => {
    const at = `${file}[${i}] ${q?.id ?? ""}`;
    const err = (m) => errors.push(`${at}: ${m}`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(q.id ?? "") || !q.id.startsWith(`${track}-`)) err(`id phải dạng kebab-case và bắt đầu bằng "${track}-"`);
    if (ids.has(q.id)) err("id bị trùng");
    ids.add(q.id);
    if (!levels.includes(q.level)) err(`level phải là một trong ${levels.join(", ")}`);
    else byLevel[q.level]++;
    if (q.example) examples++;
    if (!isText(q.topic)) err("thiếu topic");
    if (!isLocalized(q.q)) err(`q cần đủ ${locales.join(", ")}`);
    if (!isLocalized(q.a)) err(`a cần đủ ${locales.join(", ")}`);
    if (q.code !== undefined && !isText(q.code)) err("code phải là chuỗi");
    if (q.tip !== undefined && !isLocalized(q.tip)) err("tip cần đủ vi, en");
    if (q.example !== undefined && !isLocalized(q.example)) err("example cần đủ vi, en");
    if (q.followUps !== undefined && !(Array.isArray(q.followUps) && q.followUps.every(isLocalized))) err("followUps phải là mảng {vi, en}");
    if (q.source !== undefined && !/^https:\/\/\S+$/.test(q.source)) err("source phải là URL https");
    const extra = Object.keys(q).filter((k) => !["id", "level", "topic", "q", "a", "example", "code", "tip", "followUps", "source"].includes(k));
    if (extra.length) err(`trường lạ: ${extra.join(", ")}`);
  });
  console.log(`${track.padEnd(14)} ${String(items.length).padStart(3)}  ${levels.map((l) => `${l}:${byLevel[l]}`).join(" ")}  ví dụ:${examples}/${items.length}`);
}

console.log(`tổng           ${String(ids.size).padStart(3)}`);

// Thuật ngữ: src/data/glossary.json
const glossary = JSON.parse(readFileSync(new URL("data/glossary.json", root), "utf8"));
const termIds = new Set(glossary.map((g) => g.id));
const forms = new Map();
const seenTerms = new Set();
glossary.forEach((g, i) => {
  const err = (m) => errors.push(`data/glossary.json[${i}] ${g?.id ?? ""}: ${m}`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(g.id ?? "")) err("id phải dạng kebab-case");
  if (seenTerms.has(g.id)) err("id bị trùng");
  seenTerms.add(g.id);
  if (!isText(g.term)) err("thiếu term");
  if (!Array.isArray(g.match) || !g.match.length || !g.match.every(isText)) err("match phải là mảng chuỗi");
  for (const f of g.match ?? []) {
    const k = f.toLowerCase();
    if (forms.has(k) && forms.get(k) !== g.id) err(`"${f}" đã thuộc thuật ngữ ${forms.get(k)}`);
    forms.set(k, g.id);
  }
  if (!isLocalized(g.def)) err("def cần đủ vi, en");
  for (const k of ["full", "example"]) if (g[k] !== undefined && !isLocalized(g[k])) err(`${k} cần đủ vi, en`);
  if (g.see !== undefined && !ids.has(g.see)) err(`see "${g.see}" không phải id câu hỏi`);
  for (const r of g.related ?? []) if (!termIds.has(r) || r === g.id) err(`related "${r}" không hợp lệ`);
  for (const tr of g.tracks ?? []) if (!tracks.includes(tr)) err(`tracks có mảng lạ "${tr}"`);
  const extra = Object.keys(g).filter((k) => !["id", "term", "full", "match", "def", "example", "see", "related", "tracks"].includes(k));
  if (extra.length) err(`trường lạ: ${extra.join(", ")}`);
});
console.log(`thuật ngữ      ${String(glossary.length).padStart(3)}`);
if (errors.length) {
  console.error(`\n${errors.length} lỗi:\n` + errors.join("\n"));
  process.exit(1);
}
