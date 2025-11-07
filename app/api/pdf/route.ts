import { NextResponse, type NextRequest } from "next/server";
import puppeteer, { type Browser } from "puppeteer";
import puppeteerCore, { type Browser as BrowserCore } from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    if (!searchParams.toString()) {
        return NextResponse.json(
            { message: "No query parameters provided" },
            { status: 400 }
        );
    }

    try {
        let browser: Browser | BrowserCore;
        if (
            process.env.NODE_ENV === "production" ||
            process.env.VERCEL_ENV === "production"
        ) {
            const executablePath = await chromium.executablePath(
                "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar"
            );
            browser = await puppeteerCore.launch({
                executablePath,
                args: chromium.args,
                headless: chromium.headless,
                defaultViewport: chromium.defaultViewport,
            });
        } else {
            console.log("Launching Puppeteer in development mode");
            browser = await puppeteer.launch({
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });
        }

        const page = await browser.newPage();

        const url = new URL(`${process.env.BASE_URL}/resume/download`);
        url.search = searchParams.toString();

        await page.goto(url.toString(), { waitUntil: "networkidle0" });
        await page.waitForSelector("#resume-content", {
            visible: true,
            timeout: 30000,
        });

        const pdf = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "20px",
                right: "10px",
                bottom: "20px",
                left: "10px",
            },
        });

        await browser.close();

        // Converts Uint8Array to buffer for NextResponse
        const buffer = Buffer.from(pdf);

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename=resume.pdf`,
            },
        });
    } catch (error) {
        console.error("PDF generation error:", error);
        return NextResponse.json(
            { message: "Error generating PDF" },
            { status: 500 }
        );
    }
}
