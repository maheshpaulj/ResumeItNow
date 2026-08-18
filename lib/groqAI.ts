/**
 * Groq AI chat helper — primary LLM backend for auto-fit.
 *
 * Groq's free tier offers blazing-fast inference (30 RPM, 14 400 RPD) on
 * Llama-3 8B Instruct, which is more than enough for a single-call
 * layout-advisor task that returns ~200 tokens of JSON.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Llama-3.3 70B is the strongest free model on Groq; fall back to 8B.
const MODELS = [
  "llama-3.3-70b-versatile",
  "llama3-8b-8192",
] as const;

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function groqChat(
  messages: GroqMessage[],
  options: { jsonMode?: boolean } = {}
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  for (const model of MODELS) {
    try {
      const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: 1024,
          ...(options.jsonMode
            ? { response_format: { type: "json_object" } }
            : {}),
        }),
      });

      if (!res.ok) {
        console.warn(`Groq ${model} returned ${res.status}, trying next…`);
        continue;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (typeof content === "string" && content.trim()) return content;
    } catch (err) {
      console.warn(`Groq ${model} threw:`, err);
    }
  }
  throw new Error("All Groq models failed");
}
