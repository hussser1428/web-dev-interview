// Chạy: npm run test
import assert from "node:assert/strict";
import { addDays, buildQueue, daysBetween, emptyProgress, isDue, logInterview, migrate, nextInterval, rate, streak, bestStreak, toggleSave, toggleWeak } from "../src/lib/srs.ts";

assert.equal(addDays("2026-02-28", 1), "2026-03-01");
assert.equal(addDays("2026-01-01", -1), "2025-12-31");
assert.equal(daysBetween("2026-10-25", "2026-11-06"), 12);

// Khó luôn quay lại sau 1 ngày; vừa/dễ giãn dần.
assert.equal(nextInterval(undefined, 1), 1);
assert.equal(nextInterval(10, 1), 1);
assert.equal(nextInterval(undefined, 2), 2);
assert.equal(nextInterval(4, 2), 6);
assert.equal(nextInterval(undefined, 3), 4);
assert.equal(nextInterval(4, 3), 10);

let p = rate(emptyProgress, "a", 3, "2026-10-25");
assert.deepEqual(p.q.a, { rating: 3, interval: 4, due: "2026-10-29" });
assert.equal(p.days["2026-10-25"], 1);
assert.equal(p.last, "a");
assert.equal(isDue(p.q.a, "2026-10-28"), false);
assert.equal(isDue(p.q.a, "2026-10-29"), true);
p = rate(p, "a", 3, "2026-10-29");
assert.equal(p.q.a.interval, 10);

p = toggleSave(p, "b");
assert.equal(p.q.b.saved, true);
assert.equal(toggleSave(p, "b").q.b.saved, false);
assert.equal(emptyProgress.q.b, undefined, "không được sửa object gốc");

// Chuỗi ngày: hôm nay chưa học vẫn giữ chuỗi tới hôm qua; đứt 1 ngày là mất.
const days = { "2026-10-22": 1, "2026-10-23": 2, "2026-10-24": 1 };
assert.equal(streak(days, "2026-10-24"), 3);
assert.equal(streak(days, "2026-10-25"), 3);
assert.equal(streak(days, "2026-10-26"), 0);
assert.equal(bestStreak({ ...days, "2026-10-01": 1, "2026-10-26": 1, "2026-10-27": 1 }), 3);
assert.equal(bestStreak({}), 0);

// Hàng đợi: thẻ đến hạn (hạn sớm trước) rồi thẻ mới, cắt theo max.
const q = { ...emptyProgress, q: { x: { rating: 2 as const, due: "2026-10-20" }, y: { rating: 1 as const, due: "2026-10-18" }, z: { rating: 3 as const, due: "2026-12-01" } } };
assert.deepEqual(buildQueue(["n1", "x", "y", "z", "n2"], q, 10, "2026-10-25"), ["y", "x", "n1", "n2"]);
assert.deepEqual(buildQueue(["n1", "x", "y", "z", "n2"], q, 3, "2026-10-25"), ["y", "x", "n1"]);

console.log("srs: ok");

// Phỏng vấn AI: mọi câu yếu vào danh sách; câu khớp ngân hàng đến hạn ngay hôm đó, giữ cờ đã lưu.
const log = { date: "2026-10-30", track: "backend" as const, level: "junior" as const, style: "product" as const, overall: 6.5 };
const w = (question: string, related?: string) => ({ ...log, id: question, question, score: 2, feedback: "", betterAnswer: "", related });
let iv = logInterview({ ...emptyProgress, q: { a: { saved: true, rating: 3, interval: 10, due: "2026-12-01" } } }, log, [w("A", "a"), w("B", "b"), { ...w("Repo?"), project: "shop" }]);
assert.deepEqual(iv.q.a, { saved: true, rating: 1, interval: 1, due: "2026-10-30" });
assert.equal(isDue(iv.q.b, "2026-10-30"), true);
assert.equal(Object.keys(iv.q).length, 2, "câu không khớp ngân hàng không tạo thẻ");
assert.deepEqual(iv.weak?.map((x) => x.question), ["A", "B", "Repo?"]);
assert.equal(toggleWeak(iv, "B").weak?.[1].done, true);
assert.equal(toggleWeak(toggleWeak(iv, "B"), "B").weak?.[1].done, false);
assert.equal(iv.weak?.[1].done, undefined, "không được sửa object gốc");

// Câu yếu cũ chưa có id: gán id cố định để chọn / đánh dấu "Đã nắm" được.
const old = { ...emptyProgress, weak: [{ ...w("X"), id: "" }, w("Y"), { ...w("Z"), id: "" }] };
assert.deepEqual(migrate(old).weak?.map((x) => x.id), ["old-0", "Y", "old-2"]);
assert.equal(migrate(iv), iv, "dữ liệu mới giữ nguyên");
assert.equal(toggleWeak(migrate(old), "old-2").weak?.[2].done, true);
assert.equal(iv.interviews?.length, 1);
for (let i = 0; i < 40; i++) iv = logInterview(iv, { ...log, overall: i }, [w(`Q${i}`), w(`R${i}`)]);
assert.equal(iv.interviews?.length, 30);
assert.equal(iv.interviews?.at(-1)?.overall, 39);
assert.equal(iv.weak?.length, 83);
for (let i = 0; i < 20; i++) iv = logInterview(iv, log, [w(`S${i}`)]);
assert.equal(iv.weak?.length, 100);
assert.equal(iv.weak?.at(-1)?.question, "S19");
