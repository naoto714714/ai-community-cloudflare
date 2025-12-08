import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gemini-2.5-flash"; // 現状はGeminiを利用。今後他モデルにも差し替え可。

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

  const isDisabled = String(env.DISABLE_GEMINI_API ?? "").toLowerCase() === "true";
  if (isDisabled) {
    return new Response(
      JSON.stringify({
        reply: "",
        disabled: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (!env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set in env");
    return new Response("Server configuration error", { status: 500 });
  }

  const ai = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
  });

  try {
    console.log("[LLM] request", {
      system_prompt: system_prompt?.slice(0, 5000),
      user_prompt: user_prompt?.slice(0, 5000),
    });

    const modelResponse = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: user_prompt,
      config: {
        systemInstruction: system_prompt,
      },
    });

    const text = modelResponse.text ?? "";

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
