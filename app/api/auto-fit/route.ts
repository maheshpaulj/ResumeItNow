import { NextRequest, NextResponse } from "next/server";
import { groqChat } from "@/lib/groqAI";
import { cloudflareChat } from "@/lib/cloudflareAI";
import { parseJsonResponse } from "@/lib/openrouter";
import crypto from "crypto";

export const maxDuration = 30;

/* ────────────────────────────────── types ─────────────────────────────────── */

interface AutoFitResult {
  template: string;
  hideSections: string[];
  margins: "normal" | "narrow";
  lineHeightScale: number;
}

/* ────────────────────────────────── cache ─────────────────────────────────── */

const resultCache = new Map<string, { result: AutoFitResult; at: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 min

/* ──────────────────────────────── rate limit ──────────────────────────────── */

const lastCall = new Map<string, number>();
const RATE_LIMIT_MS = 15_000; // 15 s per session

/* ─────────────────────────────── heuristic ────────────────────────────────── */

const VALID_TEMPLATES = ["modern", "minimal", "professional", "compact", "sidebar"];
const SECTION_KEYS = [
  "objective", "workExperience", "projects", "education",
  "skills", "certifications", "languages", "customSections",
];

/**
 * Deterministic fallback: no LLM needed.
 * Chooses the most space-efficient template and hides empty sections.
 */
function heuristicFit(data: Record<string, unknown>): AutoFitResult {
  const hideSections: string[] = [];
  for (const key of SECTION_KEYS) {
    const v = data[key];
    if (v === undefined || v === null || v === "") {
      hideSections.push(key);
    } else if (Array.isArray(v) && v.length === 0) {
      hideSections.push(key);
    } else if (
      Array.isArray(v) &&
      v.every(
        (item) =>
          typeof item === "object" &&
          item !== null &&
          Object.values(item).every((f) => f === "" || f === undefined || f === null)
      )
    ) {
      hideSections.push(key);
    }
  }

  // Count how "full" the resume is — more content → compact template
  const workCount = Array.isArray(data.workExperience) ? data.workExperience.length : 0;
  const projCount = Array.isArray(data.projects) ? data.projects.length : 0;
  const eduCount = Array.isArray(data.education) ? data.education.length : 0;
  const totalEntries = workCount + projCount + eduCount;

  let template = "modern";
  if (totalEntries >= 6) {
    template = "compact";
  } else if (totalEntries >= 4) {
    template = "minimal";
  }

  return {
    template,
    hideSections,
    margins: totalEntries >= 5 ? "narrow" : "normal",
    lineHeightScale: totalEntries >= 5 ? 0.88 : 0.92,
  };
}

/* ──────────────────────────────── LLM prompt ─────────────────────────────── */

function buildPrompt(resumeJson: string, currentTemplate: string, currentMargins: string, pageCount: number): string {
  return `You are a resume layout advisor. Your ONLY job is to choose the best visual layout settings so the resume fits on exactly ONE page.

CURRENT STATE:
- Template: "${currentTemplate}"
- Margins: "${currentMargins}"
- Resume currently renders as ${pageCount} page(s).

AVAILABLE TEMPLATES (pick one):
- "compact": Dense layout, small font, tight spacing. Best for content-heavy resumes.
- "minimal": Clean, generous whitespace, left-aligned. Good for moderate content.
- "modern": Bold headers with colored rules. Slightly more spacing.
- "professional": Classic centered layout. Moderate spacing.
- "sidebar": Two-column (34%/66% split). Great when skills/certs/languages lists are long.

RULES:
1. Do NOT change, rewrite, or summarize any text content. Only choose layout settings.
2. Analyze the resume content below and decide which template + settings will fit everything on 1 page.
3. Hide sections that are completely empty (all fields blank).
4. If the resume is already short enough, keep current template.
5. Prefer "compact" for very dense resumes (6+ entries total across work, projects, education).
6. Prefer "sidebar" when there are many short list-type sections (skills, languages, certs) — the two-column layout saves vertical space.

Return ONLY a JSON object (no markdown fences, no explanation):
{
  "template": "<template-id>",
  "hideSections": ["sectionKey1", "sectionKey2"],
  "margins": "narrow" or "normal",
  "lineHeightScale": 0.85 to 1.0
}

Valid section keys to hide: objective, workExperience, projects, education, skills, certifications, languages, customSections.
Only hide sections that are genuinely empty in the data below.

RESUME DATA:
${resumeJson}`;
}

/* ──────────────────────────────────── POST ────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeData, currentTemplate, currentMargins, pageCount } = body;

    if (!resumeData || typeof resumeData !== "object") {
      return NextResponse.json({ error: "Missing resumeData" }, { status: 400 });
    }

    /* ── rate limit ── */
    const sessionKey =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "anon";
    const now = Date.now();
    const last = lastCall.get(sessionKey) || 0;
    if (now - last < RATE_LIMIT_MS) {
      return NextResponse.json(
        { error: "Please wait a few seconds before trying again." },
        { status: 429 }
      );
    }
    lastCall.set(sessionKey, now);

    /* ── cache check ── */
    const resumeStr = JSON.stringify(resumeData).slice(0, 8000);
    const hash = crypto.createHash("sha256").update(resumeStr).digest("hex");
    const cached = resultCache.get(hash);
    if (cached && now - cached.at < CACHE_TTL) {
      return NextResponse.json({ result: cached.result, source: "cache" });
    }

    /* ── LLM call ── */
    const prompt = buildPrompt(resumeStr, currentTemplate || "modern", currentMargins || "normal", pageCount || 2);

    let raw: string | null = null;
    let source = "groq";

    // 1. Try Groq (fast + free)
    try {
      raw = await groqChat(
        [
          { role: "system", content: "You are a resume layout advisor. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        { jsonMode: true }
      );
    } catch (err) {
      console.warn("Groq failed, falling back to Cloudflare:", err);
    }

    // 2. Try Cloudflare Workers AI
    if (!raw) {
      try {
        raw = await cloudflareChat([
          { role: "system", content: "You are a resume layout advisor. Return only valid JSON, no markdown fences." },
          { role: "user", content: prompt },
        ]);
        source = "cloudflare";
      } catch (err) {
        console.warn("Cloudflare AI failed, using heuristic:", err);
      }
    }

    // 3. Heuristic fallback
    if (!raw) {
      const result = heuristicFit(resumeData);
      resultCache.set(hash, { result, at: now });
      return NextResponse.json({ result, source: "heuristic" });
    }

    /* ── parse & validate ── */
    let parsed: AutoFitResult;
    try {
      parsed = parseJsonResponse<AutoFitResult>(raw);
    } catch {
      console.warn("LLM returned invalid JSON, using heuristic. Raw:", raw);
      const result = heuristicFit(resumeData);
      resultCache.set(hash, { result, at: now });
      return NextResponse.json({ result, source: "heuristic" });
    }

    // Validate fields
    const result: AutoFitResult = {
      template: VALID_TEMPLATES.includes(parsed.template) ? parsed.template : (currentTemplate || "compact"),
      hideSections: Array.isArray(parsed.hideSections)
        ? parsed.hideSections.filter((s) => SECTION_KEYS.includes(s))
        : [],
      margins: parsed.margins === "narrow" ? "narrow" : "normal",
      lineHeightScale:
        typeof parsed.lineHeightScale === "number"
          ? Math.max(0.8, Math.min(1, parsed.lineHeightScale))
          : 0.92,
    };

    resultCache.set(hash, { result, at: now });
    return NextResponse.json({ result, source });
  } catch (error) {
    console.error("Auto-fit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Auto-fit failed" },
      { status: 500 }
    );
  }
}
