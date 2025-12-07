import YAML from "yaml";
import { User } from "./store";

// ユーザーファイルを列挙
const modules = import.meta.glob("../users/*.md", { eager: true, as: "raw" });

type Frontmatter = {
  name?: string;
  personality?: string;
};

const parseFrontmatter = (md: string): Frontmatter => {
  const match = md.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  try {
    const parsed = YAML.parse(match[1]);
    return parsed && typeof parsed === "object" ? (parsed as Frontmatter) : {};
  } catch (e) {
    console.error("Failed to parse frontmatter", e);
    return {};
  }
};

const normalizeUser = (fm: Frontmatter): User | null => {
  const name = fm.name?.trim();
  if (!name) return null;

  return {
    id: name, // frontmatter の name を識別子として利用
    name,
    personality: fm.personality ?? "",
  };
};

export const fetchUsers = async (): Promise<User[]> => {
  // import.meta.glob の列挙順は未保証。ファイルパスでソートして安定化。
  const entries = (Object.entries(modules) as [string, string][])
    .sort(([a], [b]) => a.localeCompare(b));
  const seen = new Set<string>();
  const unique: User[] = [];

  for (const [path, raw] of entries) {
    const user = normalizeUser(parseFrontmatter(raw));
    if (!user) continue;

    if (seen.has(user.id)) {
      console.warn(`Duplicate user name detected: "${user.id}" in ${path}. Skipped.`);
      continue;
    }

    seen.add(user.id);
    unique.push(user);
  }

  if (unique.length === 0) {
    return [
      { id: "me", name: "me", personality: "User" },
      { id: "gemini", name: "gemini", personality: "AI Assistant" },
    ];
  }

  return unique;
};
