// Shared OpenRouter client. Uses the `openrouter/free` auto-router first, then
// falls back to models from the live free-model list, so the feature keeps
// working as OpenRouter rotates which models are free.

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODELS_URL = "https://openrouter.ai/api/v1/models";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

let freeModelsCache: { models: string[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000;

async function getFreeModels(): Promise<string[]> {
  if (freeModelsCache && Date.now() - freeModelsCache.fetchedAt < CACHE_TTL_MS) {
    return freeModelsCache.models;
  }
  try {
    const res = await fetch(MODELS_URL);
    if (!res.ok) return freeModelsCache?.models ?? [];
    const data = await res.json();
    const models: string[] = (data.data ?? [])
      .filter(
        (m: { id: string; pricing?: { prompt?: string; completion?: string } }) =>
          m.pricing?.prompt === "0" &&
          m.pricing?.completion === "0" &&
          m.id.endsWith(":free") &&
          // skip non-general-purpose models (safety classifiers, vision, audio)
          !/safety|-vl|audio|clip/i.test(m.id)
      )
      .map((m: { id: string }) => m.id);
    freeModelsCache = { models, fetchedAt: Date.now() };
    return models;
  } catch {
    return freeModelsCache?.models ?? [];
  }
}

export async function openRouterChat(
  messages: ChatMessage[],
  options: { jsonMode?: boolean } = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not defined in environment variables");
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "X-Title": "ResumeItNow - Free Open Source Resume Builder",
  };
  if (process.env.NEXT_PUBLIC_URL) {
    headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_URL;
  }

  const tryModel = async (model: string): Promise<string | Error> => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages,
          ...(options.jsonMode ? { response_format: { type: "json_object" } } : {}),
        }),
      });
      if (!response.ok) {
        return new Error(`OpenRouter (${model}) responded with status ${response.status}`);
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (typeof content === "string" && content.trim() !== "") {
        return content;
      }
      return new Error(`OpenRouter (${model}) returned an empty response`);
    } catch (error) {
      return error instanceof Error ? error : new Error(String(error));
    }
  };

  // The auto-router picks an available free model on OpenRouter's side.
  let result = await tryModel("openrouter/free");
  if (typeof result === "string") return result;
  let lastError: Error = result;

  for (const model of (await getFreeModels()).slice(0, 4)) {
    result = await tryModel(model);
    if (typeof result === "string") return result;
    lastError = result;
  }

  throw lastError;
}

// Models sometimes wrap JSON in markdown fences; strip them before parsing.
export function parseJsonResponse<T>(content: string): T {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "");
  return JSON.parse(cleaned) as T;
}
