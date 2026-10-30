// Chạy: npm test
import assert from "node:assert/strict";
import { annotate, makeMatcher, termIds } from "../src/lib/glossary-match.ts";

const m = makeMatcher([
  { id: "slo", match: ["SLO", "SLOs"], see: "devops-sre" },
  { id: "lb", match: ["load balancer"] },
  { id: "load", match: ["load"] },
  { id: "cicd", match: ["CI/CD"] },
  { id: "pod", match: ["pod"], tracks: ["devops"] },
]);
const ctx = (track: "devops" | "backend" = "devops", questionId?: string) => ({ track, questionId, seen: new Set<string>() });

// Cụm dài thắng cụm ngắn; chữ hoa toàn bộ chỉ khớp đúng chữ hoa; ký tự đặc biệt được escape.
assert.deepEqual(annotate("Qua load balancer rồi tới CI/CD", m, ctx()), [
  "Qua ", { t: "load balancer", g: "lb" }, " rồi tới ", { t: "CI/CD", g: "cicd" },
]);
assert.deepEqual(annotate("slo viết thường không phải SLO", m, ctx()), ["slo viết thường không phải ", { t: "SLO", g: "slo" }]);

// Ranh giới từ tính cả chữ có dấu: "podcast", "Loadđ" không khớp; dấu câu bên cạnh vẫn khớp.
assert.deepEqual(annotate("podcast", m, ctx()), ["podcast"]);
assert.deepEqual(annotate("(SLO).", m, ctx()), ["(", { t: "SLO", g: "slo" }, ")."]);
assert.deepEqual(annotate("Loadđ", m, ctx()), ["Loadđ"]);
// Dính dấu chấm với chữ là tên file/thuộc tính: "load.html", "x.load" không khớp; cuối câu "load." vẫn khớp.
assert.deepEqual(annotate("load.html x.load", m, ctx()), ["load.html x.load"]);
assert.deepEqual(annotate("Hết load.", m, ctx()), ["Hết ", { t: "load", g: "load" }, "."]);

// Chỉ đánh dấu lần đầu, seen dùng chung giữa các đoạn của cùng một đáp án.
const c = ctx();
assert.equal(termIds(annotate("SLO và SLOs", m, c)).length, 1);
assert.deepEqual(annotate("lại SLO", m, c), ["lại SLO"]);

// Giới hạn theo mảng; câu đang xem là nơi giải thích (see) thì đánh dấu self.
assert.deepEqual(annotate("một pod", m, ctx("backend")), ["một pod"]);
assert.deepEqual(annotate("SLO", m, ctx("devops", "devops-sre")), [{ t: "SLO", g: "slo", self: true }]);
assert.deepEqual(annotate("", m, ctx()), []);

console.log("glossary: ok");
