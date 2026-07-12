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

export async function POST(request: NextRequest) {
  try {
    const { latex } = await request.json();
    if (!latex) {
      return NextResponse.json({ message: "No LaTeX content provided" }, { status: 400 });
    }

    // Pack the raw LaTeX file into a ustar tarball
    const tarBuffer = packTar("main.tex", latex);

    // Create standard multipart form data
    const formData = new FormData();
    const blob = new Blob([tarBuffer], { type: "application/x-tar" });
    formData.append("file", blob, "project.tar");

    // Send POST to /data endpoint on latexonline.cc
    const response = await fetch("https://latexonline.cc/data?target=main.tex", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { message: "LaTeX compilation failed", details: errorText },
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
  } catch (error: any) {
    console.error("LaTeX compilation proxy error:", error);
    return NextResponse.json(
      { message: "Internal server error during compilation", details: error?.message },
      { status: 500 }
    );
  }
}
