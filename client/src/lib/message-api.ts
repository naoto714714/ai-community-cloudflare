import { Message } from "./store";

type MessagePayload = {
  channel_id: string;
  user_id: string;
  content: string;
};

const toTimestamp = (value: unknown): Date => {
  const numeric = typeof value === "string" ? Number(value) : (value as number);
  if (Number.isFinite(numeric)) {
    // APIが秒で返す想定。ミリ秒が渡っても問題ないように補正する。
    const millis = numeric < 1e12 ? numeric * 1000 : numeric;
    const date = new Date(millis);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return new Date();
};

export const normalizeMessage = (m: unknown): Message => {
  const record = m && typeof m === "object" ? (m as Record<string, unknown>) : {};
  const fallbackId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

  return {
    id: String(record.id ?? fallbackId),
    text: String(record.content ?? ""),
    senderId: String(record.user_id ?? "unknown"),
    channelId: String(record.channel_id ?? ""),
    timestamp: toTimestamp(record.created_at),
  };
};

export async function fetchMessagesByChannel(channelId: string, signal?: AbortSignal): Promise<Message[]> {
  if (!channelId) return [];

  const res = await fetch(`/messages?channel_id=${encodeURIComponent(channelId)}`, { signal });
  if (!res.ok) throw new Error(`Fetch messages failed: ${res.status}`);

  const data = await res.json();
  return Array.isArray(data) ? data.map(normalizeMessage) : [];
}

export async function createMessage(payload: MessagePayload): Promise<Message | null> {
  const res = await fetch("/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Create message failed: ${res.status}`);

  const created = await res.json();
  return created ? normalizeMessage(created) : null;
}
