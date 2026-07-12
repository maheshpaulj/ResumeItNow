// app/api/ats-check/route.ts
import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { openRouterChat, parseJsonResponse } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const resumeFile = formData.get("resume") as File;
    const jobDescription = formData.get("jobDescription") as string | null;

    if (!resumeFile) {
      return NextResponse.json({ error: "No resume uploaded" }, { status: 400 });
    }

    // Extract text from PDF
    const pdfBuffer = Buffer.from(await resumeFile.arrayBuffer());
    const pdfData = await pdfParse(pdfBuffer);
    const resumeText = pdfData.text;
    console.log("Extracted PDF text:", resumeText); // Debug log

    // Call OpenRouter AI for ATS analysis
    const atsResult = await analyzeWithOpenRouter(resumeText, jobDescription);

    return NextResponse.json(atsResult);
  } catch (error) {
    console.error("Error in ATS check:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function analyzeWithOpenRouter(resumeText: string, jobDescription: string | null) {
  const prompt = jobDescription
    ? `Analyze this resume text and job description for ATS compatibility. Extract relevant keywords maximum of 10, calculate an ATS score (0-100), and provide suggestions for improvement. Resume: "${resumeText}". Job Description: "${jobDescription}". Return the response in JSON format with keys: score (number), keywords (array of strings, only important ones), suggestions (array of strings).`
    : `Analyze this resume text for general ATS compatibility. Extract relevant keywords maximum of 10, calculate an ATS score (0-100), and provide suggestions for improvement. Resume: "${resumeText}". Return the response in JSON format with keys: score (number), keywords (array of strings, only important ones), suggestions (array of strings).`;

  const content = await openRouterChat([{ role: "user", content: prompt }], { jsonMode: true });
  const result = parseJsonResponse<{ score: number; keywords: string[]; suggestions: string[] }>(content);

  return {
    score: result.score,
    keywords: result.keywords,
    suggestions: result.suggestions,
  };
}