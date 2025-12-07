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
  const entries = Object.values(modules) as string[];
  const parsed = entries
    .map(parseFrontmatter)
    .map(normalizeUser)
    .filter((u): u is User => Boolean(u));

  if (parsed.length === 0) {
    return [
      { id: "me", name: "me", personality: "User" },
      { id: "gemini", name: "gemini", personality: "AI Assistant" },
    ];
  }

  return parsed;
};
