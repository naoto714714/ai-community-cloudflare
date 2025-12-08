import YAML from "yaml";
import { User } from "./store";

// ユーザーファイルを列挙
const modules = import.meta.glob("../users/*.md", { eager: true, as: "raw" });

type Frontmatter = {
  name?: string;
  personality?: string;
};

type ParsedUser = {
  frontmatter: Frontmatter;
  profile: string;
};

const parseMarkdownUser = (md: string): ParsedUser => {
  const match = md.match(/^---\n([\s\S]*?)\n---/);
  const frontmatterBlock = match?.[0] ?? "";

  let frontmatter: Frontmatter = {};
  if (match) {
    try {
      const parsed = YAML.parse(match[1]);
      frontmatter = parsed && typeof parsed === "object" ? (parsed as Frontmatter) : {};
    } catch (e) {
      console.error("Failed to parse frontmatter", e);
    }
  }

  const profile = md.replace(frontmatterBlock, "").trim();

  return { frontmatter, profile };
};

const normalizeUser = ({ frontmatter, profile }: ParsedUser): User | null => {
  const name = frontmatter.name?.trim();
  if (!name) return null;

  return {
    id: name, // frontmatter の name を識別子として利用
    name,
    personality: frontmatter.personality ?? "",
    profile,
  };
};

export const fetchUsers = async (): Promise<User[]> => {
  // import.meta.glob の列挙順は未保証。ファイルパスでソートして安定化。
  const entries = (Object.entries(modules) as [string, string][]).sort(([a], [b]) => a.localeCompare(b));
  const seen = new Set<string>();
  const unique: User[] = [];

  for (const [path, raw] of entries) {
    const user = normalizeUser(parseMarkdownUser(raw));
    if (!user) continue;

    if (seen.has(user.id)) {
      console.warn(`Duplicate user name detected: "${user.id}" in ${path}. Skipped.`);
      continue;
    }

    seen.add(user.id);
    unique.push(user);
  }

  return unique;
};
