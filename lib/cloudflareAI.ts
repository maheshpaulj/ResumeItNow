/**
 * Cloudflare Workers AI chat helper — fallback LLM backend for auto-fit.
 *
 * Uses the REST API:
 *   POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/{MODEL}
 *
 * The account ID is auto-discovered from the /accounts endpoint on first use.
 */

const CF_BASE = "https://api.cloudflare.com/client/v4";
const MODEL = "@cf/meta/llama-3.1-8b-instruct";

let cachedAccountId: string | null = null;

async function getAccountId(apiKey: string): Promise<string> {
  if (cachedAccountId) return cachedAccountId;

  // If the user supplied an explicit account ID, use it directly.
  if (process.env.CLOUDFLARE_ACCOUNT_ID) {
    cachedAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    return cachedAccountId;
  }

  // Auto-discover from /accounts.
  const res = await fetch(`${CF_BASE}/accounts`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Cloudflare /accounts returned ${res.status}`);
  const data = await res.json();
  const id = data?.result?.[0]?.id;
  if (!id) throw new Error("No Cloudflare account found for this API token");
  cachedAccountId = id as string;
  return cachedAccountId;
}

export interface CfMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function cloudflareChat(
  messages: CfMessage[]
): Promise<string> {
  const apiKey = process.env.CLOUDFLARE_API_KEY;
  if (!apiKey) throw new Error("CLOUDFLARE_API_KEY is not set");

  const accountId = await getAccountId(apiKey);

  const res = await fetch(
    `${CF_BASE}/accounts/${accountId}/ai/run/${MODEL}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    }
  );

  if (!res.ok) {
    throw new Error(`Cloudflare AI returned ${res.status}`);
  }

  const data = await res.json();
  const content = data?.result?.response;
  if (typeof content === "string" && content.trim()) return content;
  throw new Error("Cloudflare AI returned empty response");
}
