import { Channel } from "./store";

const toMembers = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const normalizeChannel = (c: unknown): Channel => {
  const record = c && typeof c === "object" ? (c as Record<string, unknown>) : {};
  return {
    id: String(record.id ?? crypto.randomUUID?.() ?? Date.now()),
    name: String(record.channel_id ?? record.name ?? ""),
    description: String(record.description ?? ""),
    members: toMembers(record.members),
  };
};

export async function fetchChannels(signal?: AbortSignal): Promise<Channel[]> {
  const res = await fetch("/channels", { signal });
  if (!res.ok) throw new Error(`Fetch channels failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data.map(normalizeChannel) : [];
}

type ChannelPayload = {
  channel_id: string;
  description?: string;
  members?: string[];
};

export async function createChannel(payload: ChannelPayload): Promise<Channel | null> {
  const res = await fetch("/channels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Create channel failed: ${res.status}`);
  const created = await res.json();
  return created ? normalizeChannel(created) : null;
}

export async function updateChannel(payload: ChannelPayload): Promise<Channel | null> {
  const res = await fetch("/channels", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Update channel failed: ${res.status}`);
  const updated = await res.json();
  return updated ? normalizeChannel(updated) : null;
}
