import "server-only";

// Đọc repo GitHub công khai thành 1 đoạn văn bản cho AI: cây thư mục + nội dung các file quan trọng (có số dòng).
// message của RepoError là mã lỗi để giao diện dịch.
export class RepoError extends Error {}

const SKIP = /(^|\/)(node_modules|vendor|dist|build|out|\.next|coverage|__pycache__|target|bin|obj|public|assets|static|migrations?)\/|\.min\.|\.lock$|-lock\./i;
const TEST = /(^|\/)(tests?|__tests__|spec)\/|\.(test|spec)\./i;
const KEY = /(^|\/)(readme\.md|package\.json|requirements\.txt|pyproject\.toml|go\.mod|pom\.xml|build\.gradle(\.kts)?|cargo\.toml|composer\.json|gemfile|pubspec\.yaml|dockerfile|docker-compose\.ya?ml|\.env\.example|schema\.prisma)$/i;
const CODE = /\.(ts|tsx|js|jsx|mjs|py|go|java|kt|rb|php|cs|rs|swift|dart|vue|svelte|sql|prisma|graphql)$/i;

const FILE_MAX = 12_000; // ký tự / file
const TOTAL_MAX = 150_000;
const TREE_MAX = 500;

type Entry = { path: string; type: string; size?: number };

export function parseRepo(input: string) {
  const m =
    input.trim().match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#].*)?$/i) ??
    input.trim().match(/^([\w.-]+)\/([\w.-]+)$/);
  return m && `${m[1]}/${m[2]}`;
}

async function gh(path: string) {
  const res = await fetch(`https://api.github.com/repos/${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "devinterview",
      // Không có token: 60 lượt/giờ mỗi IP (mỗi lần phân tích tốn 2 lượt).
      ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 404) throw new RepoError("repo_not_found");
  if (res.status === 403 || res.status === 429) throw new RepoError("github_rate_limit");
  if (!res.ok) throw new RepoError(`GitHub ${res.status}`);
  return res.json();
}

export async function readRepo(url: string) {
  const repo = parseRepo(url);
  if (!repo) throw new RepoError("bad_repo_url");
  const info = await gh(repo);
  const { tree } = (await gh(`${repo}/git/trees/HEAD?recursive=1`)) as { tree: Entry[] };
  const blobs = tree.filter((e) => e.type === "blob" && !SKIP.test(e.path));

  // ponytail: chọn file bằng heuristic (file cấu hình nông nhất + file code lớn nhất); nâng cấp: cho AI chọn file từ cây thư mục ở bước 1.
  const depth = (e: Entry) => e.path.split("/").length;
  const key = blobs.filter((e) => KEY.test(e.path)).sort((a, b) => depth(a) - depth(b)).slice(0, 8);
  const code = blobs
    .filter((e) => CODE.test(e.path) && !TEST.test(e.path) && !KEY.test(e.path) && (e.size ?? 0) < 60_000)
    .sort((a, b) => (b.size ?? 0) - (a.size ?? 0));
  const picked: Entry[] = [];
  let total = 0;
  for (const e of [...key, ...code]) {
    if (total >= TOTAL_MAX || picked.length >= 30) break;
    picked.push(e);
    total += Math.min(e.size ?? 0, FILE_MAX);
  }

  const files = await Promise.all(
    picked.map(async (e) => {
      const path = e.path.split("/").map(encodeURIComponent).join("/");
      const res = await fetch(`https://raw.githubusercontent.com/${repo}/HEAD/${path}`, {
        signal: AbortSignal.timeout(15_000),
      }).catch(() => null);
      if (!res?.ok) return "";
      let text = await res.text();
      if (text.length > FILE_MAX) text = `${text.slice(0, FILE_MAX)}\n… (truncated)`;
      const numbered = text.split("\n").map((l, i) => `${i + 1}| ${l}`).join("\n");
      return `<file path="${e.path}">\n${numbered}\n</file>`;
    }),
  );

  const text = [
    `Repository: ${info.full_name}`,
    `Description: ${info.description ?? ""}`,
    `Main language: ${info.language ?? "?"}`,
    `File tree (${blobs.length} files${blobs.length > TREE_MAX ? `, first ${TREE_MAX}` : ""}):\n${blobs.slice(0, TREE_MAX).map((e) => e.path).join("\n")}`,
    ...files.filter(Boolean),
  ].join("\n\n");
  return { url: info.html_url as string, files: blobs.length, text };
}
