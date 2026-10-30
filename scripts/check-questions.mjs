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
  items.forEach((q, i) => {
    const at = `${file}[${i}] ${q?.id ?? ""}`;
    const err = (m) => errors.push(`${at}: ${m}`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(q.id ?? "") || !q.id.startsWith(`${track}-`)) err(`id phải dạng kebab-case và bắt đầu bằng "${track}-"`);
    if (ids.has(q.id)) err("id bị trùng");
    ids.add(q.id);
    if (!levels.includes(q.level)) err(`level phải là một trong ${levels.join(", ")}`);
    else byLevel[q.level]++;
    if (!isText(q.topic)) err("thiếu topic");
    if (!isLocalized(q.q)) err(`q cần đủ ${locales.join(", ")}`);
    if (!isLocalized(q.a)) err(`a cần đủ ${locales.join(", ")}`);
    if (q.code !== undefined && !isText(q.code)) err("code phải là chuỗi");
    if (q.tip !== undefined && !isLocalized(q.tip)) err("tip cần đủ vi, en");
    if (q.followUps !== undefined && !(Array.isArray(q.followUps) && q.followUps.every(isLocalized))) err("followUps phải là mảng {vi, en}");
    if (q.source !== undefined && !/^https:\/\/\S+$/.test(q.source)) err("source phải là URL https");
    const extra = Object.keys(q).filter((k) => !["id", "level", "topic", "q", "a", "code", "tip", "followUps", "source"].includes(k));
    if (extra.length) err(`trường lạ: ${extra.join(", ")}`);
  });
  console.log(`${track.padEnd(14)} ${String(items.length).padStart(3)}  ${levels.map((l) => `${l}:${byLevel[l]}`).join(" ")}`);
}

console.log(`tổng           ${String(ids.size).padStart(3)}`);
if (errors.length) {
  console.error(`\n${errors.length} lỗi:\n` + errors.join("\n"));
  process.exit(1);
}
