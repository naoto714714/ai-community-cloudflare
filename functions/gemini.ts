// functions/gemini.ts
import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `
日本語で回答してください。
`;

const DEFAULT_USER_PROMPT = "こんにちは";
const DEFAULT_INTERVAL_SECONDS = 10;

const getIntervalSeconds = (env: Record<string, unknown>) => {
  const raw =
    env.AUTO_CHAT_INTERVAL_SECONDS ??
    env.GEMINI_AUTO_CHAT_INTERVAL_SECONDS;
  const parsed = Number(raw);

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return DEFAULT_INTERVAL_SECONDS;
};

export async function onRequestGet(context) {
  const intervalSeconds = getIntervalSeconds(context.env);

  return new Response(JSON.stringify({ intervalSeconds }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body: { user_prompt?: string; channel_id?: string };
  try {
    body = await request.json();
  } catch (e) {
    return new Response("Invalid JSON", { status: 400 });
  }

  const channel_id = body.channel_id?.trim();
  const user_prompt = (body.user_prompt ?? DEFAULT_USER_PROMPT).trim();

  if (!user_prompt) {
    return new Response("user_prompt is required", { status: 400 });
  }

  if (!env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set in env");
    return new Response("Server configuration error", { status: 500 });
  }

  const ai = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
  });

  try {
    const geminiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: user_prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    const text = geminiResponse.text ?? "";

    return new Response(
      JSON.stringify({
        reply: text,
        channel_id: channel_id ?? null,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Gemini API error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
}
