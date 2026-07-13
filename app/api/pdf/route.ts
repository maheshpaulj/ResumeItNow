import { NextResponse, type NextRequest } from "next/server";
import puppeteer, { type Browser } from "puppeteer";
import puppeteerCore, { type Browser as BrowserCore } from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface PdfPayload {
    data?: unknown;
    template?: string;
    accentColor?: string;
    fontFamily?: string;
    sectionOrder?: unknown;
    showIcons?: string | boolean;
    showPhoto?: string | boolean;
    pageFormat?: string;
    margins?: 'normal' | 'narrow' | 'custom';
    customMargins?: { top: number; bottom: number; left: number; right: number };
}

async function launch(): Promise<Browser | BrowserCore> {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
        const executablePath = await chromium.executablePath(
            "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar"
        );
        return puppeteerCore.launch({
            executablePath,
            args: chromium.args,
            headless: true,
        });
    }
    // "shell" headless is fully windowless (new-headless can flash a window on Windows)
    return puppeteer.launch({
        headless: "shell",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
}

async function renderPdf(payload: PdfPayload) {
    const browser = await launch();
    let pageError: Error | null = null;
    try {
        const page = await browser.newPage();

        const pageFormat = payload.pageFormat === "letter" ? "letter" : "a4";
        const width = pageFormat === "letter" ? 816 : 794;
        const height = pageFormat === "letter" ? 1056 : 1123;
        await page.setViewport({ width, height, deviceScaleFactor: 1 });

        // Redirect page logs and errors to terminal for debugging
        page.on('console', msg => console.log('PUPPETEER PAGE LOG:', msg.text()));
        page.on('pageerror', (err: any) => {
            console.error('PUPPETEER PAGE ERROR:', err?.message || err, err?.stack);
            pageError = new Error(`Page error inside Puppeteer: ${err?.message || err}\n${err?.stack || ''}`);
        });

        // Inject the resume payload as a page global so we never hit URL-length
        // limits — a profile photo (base64 data URL) can be tens of KB.
        await page.evaluateOnNewDocument((p) => {
            (window as unknown as { __RESUME_PAYLOAD__?: unknown }).__RESUME_PAYLOAD__ = p;
        }, payload as Record<string, unknown>);

        const fontParam = payload.fontFamily ? `?fontFamily=${encodeURIComponent(payload.fontFamily)}` : '';
        await page.goto(`${process.env.BASE_URL}/resume/download${fontParam}`, {
            waitUntil: "networkidle0",
        });

        if (pageError) throw pageError;

        await page.waitForSelector("#resume-content", { visible: true, timeout: 30000 });
        
        if (pageError) throw pageError;

        await page.evaluateHandle("document.fonts.ready");

        let topMargin = '36px';
        let bottomMargin = '36px';
        if (payload.margins === 'narrow') {
            topMargin = '24px';
            bottomMargin = '24px';
        } else if (payload.margins === 'custom' && payload.customMargins) {
            const topVal = Number(payload.customMargins.top);
            const bottomVal = Number(payload.customMargins.bottom);
            topMargin = `${isNaN(topVal) ? 36 : topVal}px`;
            bottomMargin = `${isNaN(bottomVal) ? 36 : bottomVal}px`;
        }

        const pdf = await page.pdf({
            format: pageFormat,
            printBackground: true,
            margin: payload.template === 'sidebar' 
                ? { top: "0px", right: "0px", bottom: "0px", left: "0px" }
                : { top: topMargin, right: "0px", bottom: bottomMargin, left: "0px" },
        });
        return Buffer.from(pdf);
    } finally {
        await browser.close();
    }
}

function pdfResponse(buffer: Buffer) {
    return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume.pdf`,
        },
    });
}

export async function POST(request: NextRequest) {
    try {
        const payload = (await request.json()) as PdfPayload;
        if (!payload?.data) {
            return NextResponse.json({ message: "No resume data provided" }, { status: 400 });
        }
        return pdfResponse(await renderPdf(payload));
    } catch (error: any) {
        console.error("PDF generation error:", error);
        return NextResponse.json({ 
            message: "Error generating PDF", 
            error: error?.message || String(error),
            stack: error?.stack || null
        }, { status: 500 });
    }
}

// Kept for backward compatibility (small resumes via query string).
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    if (!searchParams.toString()) {
        return NextResponse.json({ message: "No query parameters provided" }, { status: 400 });
    }
    try {
        const payload: PdfPayload = {
            data: searchParams.get("data") ? JSON.parse(searchParams.get("data")!) : undefined,
            template: searchParams.get("template") || undefined,
            accentColor: searchParams.get("accentColor") || undefined,
            fontFamily: searchParams.get("fontFamily") || undefined,
            sectionOrder: searchParams.get("sectionOrder")
                ? JSON.parse(searchParams.get("sectionOrder")!)
                : undefined,
            showIcons: searchParams.get("showIcons") || undefined,
            showPhoto: searchParams.get("showPhoto") || undefined,
            pageFormat: searchParams.get("pageFormat") || undefined,
        };
        return pdfResponse(await renderPdf(payload));
    } catch (error) {
        console.error("PDF generation error:", error);
        return NextResponse.json({ message: "Error generating PDF" }, { status: 500 });
    }
}
