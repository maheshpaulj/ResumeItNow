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

  // Puppeteer's page.pdf() margin option already reserves top/bottom space on
  // EVERY physical page. If the template also applies its own top/bottom CSS
  // padding, that only lands once at the very start/end of the continuous DOM
  // flow (native page breaks don't repeat element padding) — page 1 ends up
  // double-margined while interior pages get none. Sidebar prints edge-to-edge
  // (0 print margin) so it must keep managing its own top/bottom padding.
  const templateMargins = useMemo(
    () =>
      selectedTemplate === 'sidebar'
        ? resolvedMargins
        : { ...resolvedMargins, top: 0, bottom: 0 },
    [resolvedMargins, selectedTemplate]
  );

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
        const pageH = pageFormat === 'letter' ? 1056 : 1123;
        // Sidebar prints edge-to-edge (0 print margin); others reserve top+bottom.
        const contentPerPage =
          selectedTemplate === 'sidebar'
            ? pageH
            : pageH - resolvedMargins.top - resolvedMargins.bottom;
        applyManualBreaks(content, pageBreaks);
        paginate(content, { contentPerPage, gap: 0, mode: 'break' });
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
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: auto;
            margin-top: ${selectedTemplate === 'sidebar' ? 0 : resolvedMargins.top}px;
            margin-bottom: ${selectedTemplate === 'sidebar' ? 0 : resolvedMargins.bottom}px;
            margin-left: 0px;
            margin-right: 0px;
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
