'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Minus, Plus } from 'lucide-react';

// Overleaf-style PDF preview: pages rendered to canvases with pdf.js instead
// of an <iframe> — iframe PDF viewing is blocked or blank in several browsers
// and can't be styled. All rendering happens client-side from the compiled
// PDF's bytes.

type PdfJs = typeof import('pdfjs-dist');

let pdfjsPromise: Promise<PdfJs> | null = null;
function loadPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

interface PdfJsPreviewProps {
  /** Raw bytes of the compiled PDF; re-renders whenever this changes. */
  data: ArrayBuffer | null;
}

export default function PdfJsPreview({ data }: PdfJsPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [rendering, setRendering] = useState(false);
  const renderSeq = useRef(0);

  useEffect(() => {
    if (!data) return;
    const seq = ++renderSeq.current;
    let cancelled = false;
    setRendering(true);

    (async () => {
      const pdfjs = await loadPdfJs();
      // pdf.js transfers the buffer to its worker — hand it a copy so the
      // caller's buffer stays usable (e.g. for the next zoom re-render).
      const doc = await pdfjs.getDocument({ data: data.slice(0) }).promise;
      if (cancelled || seq !== renderSeq.current) return;
      setPageCount(doc.numPages);

      const host = pagesRef.current;
      const width = containerRef.current?.clientWidth ?? 640;
      if (!host) return;
      const frag = document.createDocumentFragment();

      for (let n = 1; n <= doc.numPages; n += 1) {
        const page = await doc.getPage(n);
        if (cancelled || seq !== renderSeq.current) return;
        const base = page.getViewport({ scale: 1 });
        const scale = ((width - 32) * zoom) / base.width;
        const viewport = page.getViewport({ scale });
        const ratio = window.devicePixelRatio || 1;

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        canvas.className = 'mx-auto mb-4 bg-white shadow-md rounded-[2px]';
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        ctx.scale(ratio, ratio);
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        if (cancelled || seq !== renderSeq.current) return;
        frag.appendChild(canvas);
      }

      host.replaceChildren(frag);
      setRendering(false);
    })().catch((err) => {
      if (!cancelled) {
        console.error('PDF preview render failed:', err);
        setRendering(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [data, zoom]);

  return (
    <div ref={containerRef} className="relative flex h-full min-h-0 flex-col">
      {/* zoom controls */}
      <div className="absolute right-3 top-2 z-10 flex items-center gap-1 rounded-md border border-border bg-card/95 px-1 py-0.5 shadow-sm">
        <button
          type="button"
          aria-label="Zoom out"
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-10 text-center text-[11px] tabular-nums text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          aria-label="Zoom in"
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => setZoom((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100))}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        {pageCount > 0 && (
          <span className="border-l border-border pl-1.5 pr-0.5 text-[11px] text-muted-foreground">
            {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          </span>
        )}
      </div>

      {rendering && (
        <div className="absolute left-3 top-2 z-10 flex items-center gap-1.5 rounded-md bg-card/95 px-2 py-1 text-[11px] text-muted-foreground shadow-sm">
          <Loader2 className="h-3 w-3 animate-spin" /> rendering…
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto bg-muted/40 px-4 pt-10 pb-4">
        <div ref={pagesRef} />
      </div>
    </div>
  );
}
