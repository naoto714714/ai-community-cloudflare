import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = "gemini-2.5-flash";

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
    const geminiResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: user_prompt,
      config: {
        systemInstruction: system_prompt,
      },
    });

    const text = geminiResponse.text ?? "";

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
    console.error("Gemini API error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
}
