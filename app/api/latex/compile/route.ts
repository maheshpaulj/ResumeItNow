import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Pure JavaScript helper to pack a single file into a spec-compliant ustar tarball
function packTar(filename: string, content: string): Buffer {
  const header = Buffer.alloc(512);
  
  // Filename (100 bytes)
  header.write(filename, 0, "ascii");
  
  // Mode (8 bytes)
  header.write("0000644\0", 100, "ascii");
  
  // UID (8 bytes) / GID (8 bytes)
  header.write("0000000\0", 108, "ascii");
  header.write("0000000\0", 116, "ascii");
  
  // File size (12 bytes octal, space terminated)
  const size = Buffer.byteLength(content, "utf-8");
  const sizeStr = size.toString(8).padStart(11, "0") + " ";
  header.write(sizeStr, 124, "ascii");
  
  // Mtime (12 bytes octal)
  const mtimeStr = Math.floor(Date.now() / 1000).toString(8).padStart(11, "0") + " ";
  header.write(mtimeStr, 136, "ascii");
  
  // Typeflag '0' (Normal file)
  header.write("0", 156, "ascii");
  
  // Magic 'ustar'
  header.write("ustar\0", 257, "ascii");
  header.write("00", 263, "ascii");
  
  // Checksum calculation (sum of all bytes with checksum field filled with spaces)
  header.write("        ", 148, "ascii");
  let checksum = 0;
  for (let i = 0; i < 512; i++) {
    checksum += header[i];
  }
  const checksumStr = checksum.toString(8).padStart(6, "0") + "\0 ";
  header.write(checksumStr, 148, "ascii");

  // File content buffer
  const contentBuf = Buffer.from(content, "utf-8");
  const contentPadding = Buffer.alloc((512 - (contentBuf.length % 512)) % 512);
  
  // End of archive (two 512-byte blocks of zeroes)
  const eoa = Buffer.alloc(1024);

  return Buffer.concat([header, contentBuf, contentPadding, eoa]);
}

// Docs pasted from AI tools/Overleaf often need a Unicode engine; pick it up
// automatically so "paste anything" compiles without the user knowing engines.
function detectEngine(latex: string): "pdflatex" | "xelatex" | "lualatex" {
  if (/\\usepackage(\[[^\]]*\])?\{[^}]*\bluacode\b[^}]*\}|\\directlua/.test(latex)) return "lualatex";
  if (/\\usepackage(\[[^\]]*\])?\{[^}]*\b(fontspec|unicode-math|polyglossia)\b[^}]*\}|\\setmainfont|\\setsansfont/.test(latex)) {
    return "xelatex";
  }
  return "pdflatex";
}

// latexonline.cc's TeX Live is missing a few packages that AI-generated
// resumes use constantly. Rather than hard-failing the compile, swap them for
// a graceful equivalent: icon commands degrade to nothing, missing fonts fall
// back to a close available one.
const FA_ICON_COMMANDS = [
  "faEnvelope", "faEnvelopeOpen", "faPhone", "faPhoneAlt", "faMobile", "faMobileAlt",
  "faMapMarker", "faMapMarkerAlt", "faLocationDot", "faHome", "faBuilding",
  "faLinkedin", "faLinkedinIn", "faGithub", "faGithubSquare", "faGitlab",
  "faGlobe", "faLink", "faExternalLinkAlt", "faAt", "faTwitter", "faXTwitter",
  "faStackOverflow", "faMedium", "faKaggle", "faOrcid",
  "faBriefcase", "faGraduationCap", "faUniversity", "faSchool", "faBook",
  "faCode", "faLaptopCode", "faTerminal", "faDatabase", "faServer", "faCogs",
  "faTools", "faWrench", "faFlask", "faChartLine", "faProjectDiagram",
  "faCalendar", "faCalendarAlt", "faStar", "faTrophy", "faAward", "faCertificate",
  "faMedal", "faLanguage", "faUser", "faUsers", "faPen", "faCircle", "faCaretRight",
];
// Single line on purpose: replacing one \usepackage line with one shim line
// keeps every later line number intact, so compile-error markers stay accurate.
const FONTAWESOME_SHIM =
  "\\providecommand{\\faIcon}[2][]{} " +
  FA_ICON_COMMANDS.map((c) => `\\providecommand{\\${c}}{}`).join(" ") +
  " % fontawesome unavailable here; icons degrade gracefully";

const PACKAGE_SHIMS: Record<string, string> = {
  fontawesome5: FONTAWESOME_SHIM,
  fontawesome: FONTAWESOME_SHIM,
  montserrat: "\\usepackage[default]{raleway}", // closest available geometric sans
};

function shimMissingPackages(src: string): string {
  return src.replace(/\\usepackage(\[[^\]]*\])?\{([^}]*)\}/g, (full, opts, pkgs) => {
    const list = (pkgs as string).split(",").map((s) => s.trim());
    if (!list.some((p) => p in PACKAGE_SHIMS)) return full;
    const kept = list.filter((p) => !(p in PACKAGE_SHIMS));
    const shims = list.filter((p) => p in PACKAGE_SHIMS).map((p) => PACKAGE_SHIMS[p]);
    const keptLine = kept.length ? `\\usepackage${opts || ""}{${kept.join(",")}}\n` : "";
    return keptLine + shims.join("\n");
  });
}

// Pull the useful parts out of a TeX log so the editor can mark exact lines.
// latexonline emits file-line-error format ("...main.tex:12: error: msg");
// classic logs use "! msg" followed by an "l.12" pointer — handle both.
function parseTexLog(log: string): { line: number | null; message: string }[] {
  const errors: { line: number | null; message: string }[] = [];
  const lines = log.split(/\r?\n/);
  for (let i = 0; i < lines.length && errors.length < 20; i += 1) {
    const fle = lines[i].match(/^.*?\.tex:(\d+):\s*(?:error:\s*)?(.+)$/i);
    if (fle) {
      errors.push({ line: parseInt(fle[1], 10), message: fle[2].trim() });
      continue;
    }
    if (!lines[i].startsWith("!")) continue;
    const message = lines[i].replace(/^!\s*/, "").trim();
    let lineNo: number | null = null;
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j += 1) {
      const m = lines[j].match(/^l\.(\d+)/);
      if (m) { lineNo = parseInt(m[1], 10); break; }
    }
    if (message) errors.push({ line: lineNo, message });
  }
  return errors;
}

export async function POST(request: NextRequest) {
  try {
    const { latex } = await request.json();
    if (!latex) {
      return NextResponse.json({ message: "No LaTeX content provided" }, { status: 400 });
    }
    if (!/\\documentclass/.test(latex)) {
      return NextResponse.json(
        {
          message: "Not a complete LaTeX document",
          details: "The source has no \\documentclass. Paste a full document (starting with \\documentclass{...} and containing \\begin{document} ... \\end{document}).",
          errors: [{ line: 1, message: "Missing \\documentclass — paste a complete LaTeX document." }],
        },
        { status: 422 }
      );
    }

    // Pack the raw LaTeX file into a ustar tarball
    const source = shimMissingPackages(latex);
    const tarBuffer = packTar("main.tex", source);

    // Create standard multipart form data
    const formData = new FormData();
    const blob = new Blob([tarBuffer], { type: "application/x-tar" });
    formData.append("file", blob, "project.tar");

    // Send POST to /data endpoint on latexonline.cc (full TeX Live install)
    const engine = detectEngine(latex);
    const response = await fetch(
      `https://latexonline.cc/data?target=main.tex&command=${engine}`,
      { method: "POST", body: formData }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          message: "LaTeX compilation failed",
          details: errorText,
          errors: parseTexLog(errorText),
        },
        { status: response.status }
      );
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=resume.pdf",
      },
    });
  } catch (error) {
    console.error("LaTeX compilation proxy error:", error);
    return NextResponse.json(
      {
        message: "Internal server error during compilation",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
