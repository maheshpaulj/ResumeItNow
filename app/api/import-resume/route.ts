import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { openRouterChat, parseJsonResponse } from "@/lib/openrouter";

export const maxDuration = 60;

const EXTRACTION_PROMPT = `You convert raw resume text (from a resume PDF or a LinkedIn profile page) into structured JSON.

Return ONLY a JSON object with exactly these keys:
{
  "personalDetails": { "fullName": "", "email": "", "phone": "", "linkedin": "", "github": "", "website": "", "location": "" },
  "jobTitle": "",
  "objective": "",
  "workExperience": [{ "jobTitle": "", "companyName": "", "location": "", "startDate": "", "endDate": "", "description": "" }],
  "education": [{ "degree": "", "institution": "", "location": "", "startDate": "", "endDate": "", "gpa": "", "description": "" }],
  "skills": [{ "skillType": "group", "category": "", "skills": "" }],
  "projects": [{ "projectName": "", "description": "", "link": "" }],
  "languages": [{ "language": "", "proficiency": "" }],
  "certifications": [{ "certificationName": "", "issuingOrganization": "", "issueDate": "" }],
  "customSections": [{ "sectionTitle": "", "content": "" }]
}

Rules:
- Dates as short month + year, e.g. "Jan 2021"; use "Present" for current roles.
- Descriptions as markdown bullet lines starting with "- "; bold key metrics with **.
- Group skills into categories (e.g. "Languages", "Frameworks") with comma-separated skills.
- "objective" is the professional summary paragraph if present.
- Anything that doesn't fit (awards, volunteering…) goes into customSections.
- Use empty strings/arrays for missing data. Never invent facts.`;

async function extractResume(text: string) {
  const content = await openRouterChat(
    [
      { role: "system", content: EXTRACTION_PROMPT },
      { role: "user", content: text.slice(0, 12000) },
    ],
    { jsonMode: true }
  );
  return parseJsonResponse<Record<string, unknown>>(content);
}

/** Strip HTML to readable text. */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  // ---- LinkedIn / URL import (JSON body) ----
  if (contentType.includes("application/json")) {
    try {
      const { url } = await req.json();
      if (!url || typeof url !== "string" || !/^https?:\/\//i.test(url)) {
        return NextResponse.json({ error: "Enter a valid profile URL" }, { status: 400 });
      }

      let res: Response;
      try {
        res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
            Accept: "text/html",
          },
          redirect: "follow",
        });
      } catch {
        return NextResponse.json({ error: "Could not reach that URL" }, { status: 502 });
      }

      const html = await res.text();
      const text = htmlToText(html);

      // LinkedIn serves an auth wall to bots — detect it and guide the user.
      const looksBlocked =
        text.length < 600 ||
        /sign in|join now|log in to linkedin|authwall|create your free account/i.test(
          text.slice(0, 1500)
        );
      if (!res.ok || looksBlocked) {
        return NextResponse.json(
          {
            error:
              "LinkedIn blocks automated profile reads. Open your profile → More → Save to PDF, then use the Resume PDF tab to import it.",
          },
          { status: 422 }
        );
      }

      const resume = await extractResume(text);
      return NextResponse.json({ resume });
    } catch (error) {
      console.error("Error importing from URL:", error);
      return NextResponse.json(
        { error: "Failed to import from that URL. Please try the PDF option." },
        { status: 500 }
      );
    }
  }

  // ---- PDF import (multipart form) ----
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text?.trim();

    if (!text) {
      return NextResponse.json(
        { error: "Could not read any text from that PDF" },
        { status: 422 }
      );
    }

    const resume = await extractResume(text);
    return NextResponse.json({ resume });
  } catch (error) {
    console.error("Error importing resume:", error);
    return NextResponse.json(
      { error: "Failed to import resume. Please try again." },
      { status: 500 }
    );
  }
}
