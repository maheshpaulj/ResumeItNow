"use client";
import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ModernTemplate } from '@/components/resume/templates/Modern';
import { MinimalTemplate } from '@/components/resume/templates/Minimal';
import { ProfessionalTemplate } from '@/components/resume/templates/Professional';
import { CompactTemplate } from '@/components/resume/templates/Compact';
import { SidebarTemplate } from '@/components/resume/templates/Sidebar';
import { RESUME_FONTS_HREF } from '@/lib/fonts';
import { paginate, applyManualBreaks } from '@/lib/paginate';

const TEMPLATES = {
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  professional: ProfessionalTemplate,
  compact: CompactTemplate,
  sidebar: SidebarTemplate,
} as const;

type TemplateKey = keyof typeof TEMPLATES;

const DownloadContent = () => {
  const searchParams = useSearchParams();
  const [resumeData, setResumeData] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey | null>(null);
  const [accentColor, setAccentColor] = useState<string | undefined>(undefined);
  const [fontFamily, setFontFamily] = useState<string | undefined>(searchParams.get('fontFamily') || undefined);
  const [sectionOrder, setSectionOrder] = useState<string[] | undefined>(undefined);
  const [showIcons, setShowIcons] = useState<boolean>(false);
  const [showPhoto, setShowPhoto] = useState<boolean>(false);
  const [margins, setMargins] = useState<string | undefined>(undefined);
  const [customMargins, setCustomMargins] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [pageFormat, setPageFormat] = useState<string>('a4');
  const [pageBreaks, setPageBreaks] = useState<string[]>([]);

  const resolvedMargins = useMemo(() => {
    if (margins === 'narrow') {
      return { top: 24, bottom: 24, left: 20, right: 20 };
    }
    if (margins === 'normal') {
      return { top: 36, bottom: 36, left: 32, right: 32 };
    }
    const top = Number(customMargins?.top);
    const bottom = Number(customMargins?.bottom);
    const left = Number(customMargins?.left);
    const right = Number(customMargins?.right);
    return {
      top: isNaN(top) ? 36 : top,
      bottom: isNaN(bottom) ? 36 : bottom,
      left: isNaN(left) ? 32 : left,
      right: isNaN(right) ? 32 : right,
    };
  }, [margins, customMargins]);

  // Templates render their own margins as padding — identical to the editor
  // canvas — and the PDF prints with ZERO Puppeteer margins. Page breaks are
  // then produced by the same push-mode margin spacers the editor uses, so the
  // exported pages are the editor pages by construction.
  const templateMargins = resolvedMargins;

  useEffect(() => {
    const toBool = (v: unknown) => v === true || v === 'true';
    // Puppeteer injects the full payload as a global (avoids URL-length limits
    // for large fields like a base64 profile photo). Fall back to query params.
    const injected = (window as unknown as { __RESUME_PAYLOAD__?: Record<string, unknown> })
      .__RESUME_PAYLOAD__;

    const parse = (v: unknown) => {
      if (typeof v === 'string') {
        try {
          return JSON.parse(v);
        } catch {
          return undefined;
        }
      }
      return v;
    };

    const src = injected ?? {
      data: searchParams.get('data'),
      template: searchParams.get('template'),
      accentColor: searchParams.get('accentColor'),
      fontFamily: searchParams.get('fontFamily'),
      sectionOrder: searchParams.get('sectionOrder'),
      showIcons: searchParams.get('showIcons'),
      showPhoto: searchParams.get('showPhoto'),
      margins: searchParams.get('margins'),
      customMargins: searchParams.get('customMargins'),
      pageFormat: searchParams.get('pageFormat'),
      pageBreaks: searchParams.get('pageBreaks'),
    };

    const template = src.template as string | null;
    const data = parse(src.data);

    if (data && template && template in TEMPLATES) {
      try {
        setResumeData(data);
        setSelectedTemplate(template as TemplateKey);
        setAccentColor((src.accentColor as string) || undefined);
        setFontFamily((src.fontFamily as string) || undefined);
        setSectionOrder(parse(src.sectionOrder));
        setShowIcons(toBool(src.showIcons));
        setShowPhoto(toBool(src.showPhoto));
        setMargins((src.margins as string) || undefined);
        setCustomMargins(parse(src.customMargins) || null);
        setPageFormat((src.pageFormat as string) === 'letter' ? 'letter' : 'a4');
        const pb = parse(src.pageBreaks);
        setPageBreaks(Array.isArray(pb) ? pb : []);
      } catch (error) {
        console.error('Error parsing resume payload:', error);
      }
    }
  }, [searchParams]);

  // Once rendered and fonts are ready, force page breaks at the exact same block
  // boundaries the editor computes, then flag Puppeteer that we're paginated.
  useEffect(() => {
    if (!resumeData || !selectedTemplate) return;
    let cancelled = false;
    const win = window as unknown as { __PAGINATED__?: boolean };
    win.__PAGINATED__ = false;

    const run = async () => {
      try {
        await (document.fonts?.ready ?? Promise.resolve());
      } catch {
        /* ignore */
      }
      // let layout settle after fonts swap in
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (cancelled) return;

      const content = document.getElementById('resume-content');
      if (content) {
        // Mirror the editor's geometry exactly: the template renders its own
        // top padding (so the first block starts at the same offset as the
        // editor canvas), pages hold `pageH - margins` of content, and the gap
        // between pages is the two margins meeting at the sheet boundary. The
        // PDF prints with ZERO margins, so page k spans [k·pageH, (k+1)·pageH)
        // and the filler spacers land every block on the same page as the
        // editor shows — by construction, not by trusting Chrome's paginator.
        const pageH = pageFormat === 'letter' ? 1056 : 1123;
        const marginY = resolvedMargins.top + resolvedMargins.bottom;
        applyManualBreaks(content, pageBreaks);
        paginate(content, {
          contentPerPage: pageH - marginY,
          gap: marginY,
          mode: 'filler',
        });
      }
      win.__PAGINATED__ = true;
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [resumeData, selectedTemplate, pageFormat, resolvedMargins, pageBreaks]);

  if (!resumeData || !selectedTemplate) {
    return (
      <div className="bg-white">
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={RESUME_FONTS_HREF} />
        <div>Loading...</div>
      </div>
    );
  }

  const TemplateComponent = TEMPLATES[selectedTemplate];

  return (
    <div className="bg-white">
      {/* Load the identical font set the editor uses so the export matches 1:1. */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={RESUME_FONTS_HREF} />
      {/* Pagination is fully controlled by the filler spacers: zero @page
          margins and no native break opinions — Chrome must never move a
          block on its own or it diverges from the editor. */}
      <style dangerouslySetInnerHTML={{ __html: `
        html, body { margin: 0; padding: 0; }
        @media print {
          @page { size: auto; margin: 0; }
          #resume-content .break-inside-avoid,
          #resume-content [data-rb="header"],
          #resume-content [data-rb="entry-header"] {
            break-inside: auto !important;
            page-break-inside: auto !important;
          }
        }
      `}} />
      <div id="resume-content">
        <TemplateComponent
          resumeData={resumeData}
          isEditing={false}
          updateField={() => {}}
          accentColor={accentColor}
          fontFamily={fontFamily}
          sectionOrder={sectionOrder}
          showIcons={showIcons}
          showPhoto={showPhoto}
          customMargins={templateMargins}
          isPrint={true}
        />
      </div>
    </div>
  );
};

const DownloadPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <DownloadContent />
  </Suspense>
);

export default DownloadPage;
