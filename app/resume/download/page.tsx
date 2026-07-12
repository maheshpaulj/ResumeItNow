"use client";
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ModernTemplate } from '@/components/resume/templates/Modern';
import { MinimalTemplate } from '@/components/resume/templates/Minimal';
import { ProfessionalTemplate } from '@/components/resume/templates/Professional';
import { CompactTemplate } from '@/components/resume/templates/Compact';
import { SidebarTemplate } from '@/components/resume/templates/Sidebar';

const TEMPLATES = {
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  professional: ProfessionalTemplate,
  compact: CompactTemplate,
  sidebar: SidebarTemplate,
} as const;

type TemplateKey = keyof typeof TEMPLATES;

// Fonts that need to be fetched from Google Fonts (the rest are system fonts)
const GOOGLE_FONTS: Record<string, string> = {
  'DM Sans': 'DM+Sans:wght@400;500;600;700',
  Roboto: 'Roboto:wght@400;500;700',
  Lato: 'Lato:wght@400;700',
  'Open Sans': 'Open+Sans:wght@400;600;700',
  Montserrat: 'Montserrat:wght@400;500;600;700',
};

const DownloadContent = () => {
  const searchParams = useSearchParams();
  const [resumeData, setResumeData] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey | null>(null);
  const [accentColor, setAccentColor] = useState<string | undefined>(undefined);
  const [fontFamily, setFontFamily] = useState<string | undefined>(undefined);
  const [sectionOrder, setSectionOrder] = useState<string[] | undefined>(undefined);
  const [showIcons, setShowIcons] = useState<boolean>(false);
  const [showPhoto, setShowPhoto] = useState<boolean>(false);

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
      } catch (error) {
        console.error('Error parsing resume payload:', error);
      }
    }
  }, [searchParams]);

  if (!resumeData || !selectedTemplate) {
    return <div>Loading...</div>;
  }

  const TemplateComponent = TEMPLATES[selectedTemplate];
  const googleFont = fontFamily && GOOGLE_FONTS[fontFamily];

  return (
    <div className="bg-white">
      {googleFont && (
        // React hoists these into <head>; puppeteer waits for fonts to load
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${googleFont}&display=swap`}
        />
      )}
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
