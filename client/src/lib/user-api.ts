import { User } from "./store";

// 管理対象のユーザーファイルは手動で追加・更新する
const USER_FILES = ["/users/001_me.md", "/users/002_gemini.md"] as const;

type Frontmatter = {
  id?: number;
  name?: string;
  personality?: string;
};

const parseFrontmatter = (md: string): Frontmatter => {
  const match = md.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const lines = match[1].split("\n");
  const data: Frontmatter = {};

  for (const line of lines) {
    const [rawKey, ...rawValParts] = line.split(":");
    if (!rawKey || rawValParts.length === 0) continue;
    const key = rawKey.trim();
    const rawVal = rawValParts.join(":").trim().replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, "");

    if (key === "id") {
      const num = Number(rawVal);
      if (Number.isFinite(num)) data.id = num;
    } else if (key === "name") {
      data.name = rawVal;
    } else if (key === "personality") {
      data.personality = rawVal;
    }
  }
  return data;
};

const normalizeUser = (fm: Frontmatter): User | null => {
  const name = fm.name?.trim();
  if (!name) return null;

  return {
    id: name, // frontmatterの name を識別子として利用
    name,
    personality: fm.personality ?? "",
  };
};

export const fetchUsers = async (): Promise<User[]> => {
  const results = await Promise.all(
    USER_FILES.map(async (path) => {
      try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
        const text = await res.text();
        const fm = parseFrontmatter(text);
        return normalizeUser(fm);
      } catch (e) {
        console.error(`Failed to load user file: ${path}`, e);
        return null;
      }
    }),
  );

  const normalized = results.filter((u): u is User => Boolean(u));

  // 最低限のフェイルセーフ
  if (normalized.length === 0) {
    return [
      { id: "me", name: "me", personality: "User" },
      { id: "gemini", name: "gemini", personality: "AI Assistant" },
    ];
  }

  return normalized;
};
