type GeminiRequest = {
  user_prompt: string;
  system_prompt: string;
};

export type GeminiResponse = {
  reply: string;
};

export async function requestGemini(payload: GeminiRequest, signal?: AbortSignal): Promise<GeminiResponse | null> {
  const res = await fetch("/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) throw new Error(`Gemini request failed: ${res.status}`);

  const data = await res.json();
  return data?.reply ? { reply: String(data.reply) } : null;
}
