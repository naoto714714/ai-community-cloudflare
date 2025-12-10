import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

const GEMINI_MODEL = "gemini-2.5-flash";
const GPT_MODEL = "gpt-5-mini";

type LlmPayload = {
  user_prompt: string;
  system_prompt: string;
};

async function callGemini({ user_prompt, system_prompt, apiKey }: LlmPayload & { apiKey: string }) {
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: user_prompt,
    config: {
      systemInstruction: system_prompt,
    },
  });

  return response.text ?? "";
}

async function callGpt({ user_prompt, system_prompt, apiKey }: LlmPayload & { apiKey: string }) {
  const client = new OpenAI({ apiKey });

  const response = await client.responses.create({
    model: GPT_MODEL,
    instructions: system_prompt,
    input: user_prompt,
  });

  return response.output_text;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body: { user_prompt?: string; system_prompt?: string };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const user_prompt = body.user_prompt?.trim();
  const system_prompt = body.system_prompt?.trim();

  if (!user_prompt) {
    return new Response("user_prompt is required", { status: 400 });
  }

  if (!system_prompt) {
    return new Response("system_prompt is required", { status: 400 });
  }

  const hasGptKey = Boolean(env.GPT_API_KEY);
  const hasGeminiKey = Boolean(env.GEMINI_API_KEY);

  if (!hasGptKey && !hasGeminiKey) {
    console.error("No LLM API keys set (GPT_API_KEY or GEMINI_API_KEY)");
    return new Response("Server configuration error", { status: 500 });
  }

  try {
    const provider = hasGptKey ? "gpt" : "gemini";

    console.log("[LLM] request", {
      provider,
      system_prompt: system_prompt?.slice(0, 5000),
      user_prompt: user_prompt?.slice(0, 5000),
    });

    const willUseGpt = hasGptKey;

    const text = willUseGpt
      ? await callGpt({ user_prompt, system_prompt, apiKey: env.GPT_API_KEY })
      : await callGemini({ user_prompt, system_prompt, apiKey: env.GEMINI_API_KEY });

    return new Response(
      JSON.stringify({
        reply: text,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("LLM API error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
}
