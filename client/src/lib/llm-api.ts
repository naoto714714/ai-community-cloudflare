type LlmRequest = {
  user_prompt: string;
  system_prompt: string;
};

export type LlmResponse = {
  reply: string;
};

export async function requestLlm(payload: LlmRequest, signal?: AbortSignal): Promise<LlmResponse | null> {
  const res = await fetch("/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) throw new Error(`LLM request failed: ${res.status}`);

  const data = await res.json();
  return data?.reply ? { reply: String(data.reply) } : null;
}
