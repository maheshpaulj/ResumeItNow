"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ModernTemplate } from '@/components/resume/templates/Modern';
import { MinimalTemplate } from '@/components/resume/templates/Minimal';
import { ProfessionalTemplate } from '@/components/resume/templates/Professional';
import { OldModernTemplate } from '@/components/resume/templates/Modern-old';

const TEMPLATES = {
  modern: ModernTemplate,
  modern_old: OldModernTemplate,
  minimal: MinimalTemplate,
  professional: ProfessionalTemplate,
} as const;

type TemplateKey = keyof typeof TEMPLATES;

const DownloadPage = () => {
  const searchParams = useSearchParams();
  const [resumeData, setResumeData] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey | null>(null);
  const [accentColor, setAccentColor] = useState<string | undefined>(undefined);
  const [fontFamily, setFontFamily] = useState<string | undefined>(undefined);
  const [sectionOrder, setSectionOrder] = useState<string[] | undefined>(undefined);
  const [showIcons, setShowIcons] = useState<string | undefined>(undefined)

  useEffect(() => {
    const data = searchParams.get('data');
    const template = searchParams.get('template');
    const color = searchParams.get('accentColor');
    const font = searchParams.get('fontFamily');
    const order = searchParams.get('sectionOrder');
    const showIcons = searchParams.get('showIcons');

    if (Array.isArray(data) || Array.isArray(template) || Array.isArray(color) || Array.isArray(font) || Array.isArray(order)) {
      console.error('Invalid query parameters');
      return;
    }

    if (data && template && template in TEMPLATES) {
      try {
        setResumeData(JSON.parse(data));
        setSelectedTemplate(template as TemplateKey);
        setAccentColor(color || undefined); // Use undefined to fall back to template default
        setFontFamily(font || undefined);   // Use undefined to fall back to template default
        if (order) {
          setSectionOrder(JSON.parse(order)); // Expecting a JSON string like `["education", "skills", ...]`
        } else {
          setSectionOrder(undefined); // Use undefined to fall back to template default
        }
        setShowIcons(showIcons || undefined); // Use undefined to fall back to template default
      } catch (error) {
        console.error('Error parsing query parameters:', error);
      }
    }
  }, [searchParams]);

  if (!resumeData || !selectedTemplate) {
    return <div>Loading...</div>;
  }
  
  const TemplateComponent = TEMPLATES[selectedTemplate];

  return (
    <div className="">
      <div id="resume-content">
        <TemplateComponent
          resumeData={resumeData}
          isEditing={false}
          updateField={() => {}}
          accentColor={accentColor}    // Pass accentColor from query params
          fontFamily={fontFamily}      // Pass fontFamily from query params
          sectionOrder={sectionOrder}  // Pass sectionOrder from query params
          showIcons={showIcons == 'true' ? true : false}
        />
      </div>
    </div>
  );
};

export default DownloadPage;