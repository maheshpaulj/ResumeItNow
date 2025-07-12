"use client";
import { useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import type { TemplateProps } from './types';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Linkedin, Github, Link2, Building2, GraduationCap, Globe } from 'lucide-react';

export function MinimalTemplate({
  resumeData,
  isEditing,
  updateField,
  accentColor = '#000000',
  fontFamily = 'DM Sans',
  sectionOrder = [
    'objective',
    'workExperience',
    'projects',
    'education',
    'skills',
    'certifications',
    'languages',
    'customSections',
  ],
  showIcons,
}: TemplateProps & {
  accentColor?: string;
  fontFamily?: string;
  sectionOrder?: string[];
  showIcons?: boolean;
}) {
  // Memoize accentColor to avoid recalculation
  const colors = useMemo(() => ({
    accent: accentColor,
  }), [accentColor]);

  const renderMarkdown = (text: string): string => {
    if (!text) return '';
    return text
      .split('\n')
      .map((line, index) => {
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        if (line.trim().startsWith('- ') && index === 0) {
          line = `• ${line.substring(2)}`;
        } else if (line.trim().startsWith('- ') && index > 0) {
          line = `<br/>• ${line.substring(2)}`;
        }
        return line;
      })
      .join('\n');
  };

  const renderInput = useCallback(
    ({
      value,
      onChange,
      multiline = false,
      className = '',
      type = '',
      ariaLabel = '',
      textColor = 'text-gray-600',
      inlineStyle = {},
    }: {
      value: string;
      onChange: (value: string) => void;
      multiline?: boolean;
      className?: string;
      type?: string;
      ariaLabel?: string;
      textColor?: string;
      inlineStyle?: React.CSSProperties;
    }) => {
      if (!isEditing) {
        if (type === 'link') {
          return (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className={`hover:underline ${textColor} ${className}`}
              style={inlineStyle}
              aria-label={ariaLabel}
            >
              {value}
            </a>
          );
        }
        if (type === 'mail') {
          return (
            <a
              href={`mailto:${value}`}
              className={`hover:underline ${textColor} ${className}`}
              style={inlineStyle}
              aria-label={ariaLabel}
            >
              {value}
            </a>
          );
        }
        if (type === 'phone') {
          return (
            <a
              href={`tel:${value}`}
              className={`hover:underline ${textColor} ${className}`}
              style={inlineStyle}
              aria-label={ariaLabel}
            >
              {value}
            </a>
          );
        }
        return (
          <div
            className={`${textColor} ${className}`}
            style={inlineStyle}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
          />
        );
      }

      if (multiline) {
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full min-h-[60px] ${textColor} ${className}`}
            style={inlineStyle}
            aria-label={ariaLabel}
          />
        );
      }

      return (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`focus-visible:ring-2 ${textColor} ${className}`}
          style={inlineStyle}
          aria-label={ariaLabel}
        />
      );
    },
    [isEditing]
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <div
      className="text-lg text-black font-semibold mb-2 pb-1 border-b-2 border-gray-800 break-inside-avoid"
    >
      <h2>{title}</h2>
    </div>
  );

  const hasContent = (section: unknown): boolean => {
    if (!section) return false;
    if (Array.isArray(section)) return section.length > 0;
    if (typeof section === 'object' && section !== null) {
      return Object.values(section).some((value) =>
        typeof value === 'string' ? value.trim() !== '' : Boolean(value)
      );
    }
    return typeof section === 'string' ? section.trim() !== '' : Boolean(section);
  };

  return (
    <div className="w-full mx-auto bg-white px-6 py-4" style={{ fontFamily }}>
      {/* Personal Details Section */}
      <div className="mb-6 break-inside-avoid">
        <div className="text-3xl font-bold text-center">
          {renderInput({
            value: resumeData.personalDetails.fullName,
            onChange: (value) => updateField('personalDetails', null, 'fullName', value),
            className: 'text-center',
            textColor: 'text-black',
            ariaLabel: 'Full name',
          })}
        </div>
        <div className="mb-2">
          {renderInput({
            value: resumeData.jobTitle,
            onChange: (value) => updateField('jobTitle', null, 'jobTitle', value),
            className: 'text-center',
            inlineStyle: { color: colors.accent }, // Direct accentColor for job title
            ariaLabel: 'Job Title',
          })}
        </div>
        <div className="text-center text-sm space-x-3">
          {resumeData.personalDetails.email && (
            <span className="inline-flex items-center gap-1">
              {showIcons && <Mail className="w-4 h-4" style={{ color: colors.accent }} />}
              {renderInput({
                value: resumeData.personalDetails.email,
                onChange: (value) => updateField('personalDetails', null, 'email', value),
                className: 'inline-block',
                type: 'mail',
                textColor: 'text-gray-600',
                ariaLabel: 'Email address',
              })}
            </span>
          )}
          {resumeData.personalDetails.phone && (
            <span className="inline-flex items-center gap-1">
              {showIcons && <Phone className="w-4 h-4" style={{ color: colors.accent }} />}
              {renderInput({
                value: resumeData.personalDetails.phone,
                onChange: (value) => updateField('personalDetails', null, 'phone', value),
                className: 'inline-block',
                type: 'phone',
                textColor: 'text-gray-600',
                ariaLabel: 'Phone number',
              })}
            </span>
          )}
          {resumeData.personalDetails.location && (
            <span className="inline-flex items-center gap-1">
              {showIcons && <MapPin className="w-4 h-4" style={{ color: colors.accent }} />}
              {renderInput({
                value: resumeData.personalDetails.location,
                onChange: (value) => updateField('personalDetails', null, 'location', value),
                className: 'inline-block',
                textColor: 'text-gray-600',
                ariaLabel: 'Location',
              })}
            </span>
          )}
        </div>
        <div className="text-center mt-1 space-x-3">
          {resumeData.personalDetails.linkedin && (
            <span className="inline-flex items-center gap-1">
              {showIcons && <Linkedin className="w-4 h-4" style={{ color: colors.accent }} />}
              {renderInput({
                value: resumeData.personalDetails.linkedin,
                onChange: (value) => updateField('personalDetails', null, 'linkedin', value),
                className: 'inline-block text-sm',
                type: 'link',
                textColor: 'text-gray-600',
                ariaLabel: 'LinkedIn profile',
              })}
            </span>
          )}
          {resumeData.personalDetails.github && (
            <span className="inline-flex items-center gap-1">
              {showIcons && <Github className="w-4 h-4" style={{ color: colors.accent }} />}
              {renderInput({
                value: resumeData.personalDetails.github,
                onChange: (value) => updateField('personalDetails', null, 'github', value),
                className: 'inline-block text-sm',
                type: 'link',
                textColor: 'text-gray-600',
                ariaLabel: 'GitHub profile',
              })}
            </span>
          )}
          {resumeData.personalDetails.website && (
            <span className="inline-flex items-center gap-1">
              {showIcons && <Globe className="w-4 h-4" style={{ color: colors.accent }} />}
              {renderInput({
                value: resumeData.personalDetails.website,
                onChange: (value) => updateField('personalDetails', null, 'website', value),
                className: 'inline-block text-sm',
                type: 'link',
                textColor: 'text-gray-600',
                ariaLabel: 'Website',
              })}
            </span>
          )}
        </div>
      </div>

      {/* Render sections based on sectionOrder */}
      {sectionOrder.map((section) => (
        <div key={section} className="mb-4">
          {section === 'objective' && hasContent(resumeData.objective) && (
            <div>
              <SectionHeader title="Professional Summary" />
              {renderInput({
                value: resumeData.objective,
                onChange: (value) => updateField('objective', null, 'objective', value),
                multiline: true,
                className: 'text-sm leading-relaxed text-justify',
                textColor: 'text-gray-700',
                ariaLabel: 'Professional summary',
              })}
            </div>
          )}

          {section === 'workExperience' && hasContent(resumeData.workExperience) && (
            <div>
              <SectionHeader title="Work Experience" />
              <div className="space-y-3">
                {resumeData.workExperience.map((experience, idx) => (
                  <div
                    key={idx}
                    className="break-inside-avoid pb-3 last:pb-0"
                    style={{
                      borderBottom:
                        idx !== resumeData.workExperience.length - 1
                          ? `1px dashed ${colors.accent}`
                          : 'none',
                    }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1">
                        {renderInput({
                          value: experience.jobTitle,
                          onChange: (value) =>
                            updateField('workExperience', idx, 'jobTitle', value),
                          className: 'font-semibold',
                          textColor: 'text-gray-800',
                          ariaLabel: 'Job title',
                        })}
                      </div>
                      <div className="text-sm flex items-center gap-1 text-gray-600">
                        {renderInput({
                          value: experience.startDate,
                          onChange: (value) =>
                            updateField('workExperience', idx, 'startDate', value),
                          textColor: 'text-gray-600',
                          ariaLabel: 'Start date',
                        })}
                        <span>-</span>
                        {renderInput({
                          value: experience.endDate,
                          onChange: (value) =>
                            updateField('workExperience', idx, 'endDate', value),
                          textColor: 'text-gray-600',
                          ariaLabel: 'End date',
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <div className="flex items-center gap-1">
                          {showIcons && <Building2 className="w-4 h-4" style={{ color: colors.accent }} />}
                          {renderInput({
                            value: experience.companyName,
                            onChange: (value) =>
                              updateField('workExperience', idx, 'companyName', value),
                            className: 'font-medium text-sm',
                            inlineStyle: { color: colors.accent }, // Direct accentColor
                            ariaLabel: 'Company name',
                          })}
                        </div>
                        {experience.location && (
                          <div className="flex items-center gap-1">
                            {showIcons && <MapPin className="w-4 h-4" style={{ color: colors.accent }} />}
                            {renderInput({
                              value: experience.location,
                              onChange: (value) =>
                                updateField('workExperience', idx, 'location', value),
                              className: 'text-xs',
                              inlineStyle: { color: colors.accent },
                              ariaLabel: 'Location',
                            })}
                          </div>
                        )}
                      </div>
                      {renderInput({
                        value: experience.description,
                        onChange: (value) =>
                          updateField('workExperience', idx, 'description', value),
                        multiline: true,
                        className: 'text-sm ml-5 text-justify',
                        textColor: 'text-gray-600',
                        ariaLabel: 'Job description',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'projects' && hasContent(resumeData.projects) && (
            <div>
              <SectionHeader title="Projects" />
              <div className="space-y-3">
                {resumeData.projects.map((project, idx) => (
                  <div
                    key={idx}
                    className="break-inside-avoid pb-3 last:pb-0"
                    style={{
                      borderBottom:
                        idx !== resumeData.projects.length - 1
                          ? `1px dashed ${colors.accent}`
                          : 'none',
                    }}
                  >
                    <div className="flex flex-col items-start mb-1">
                      {renderInput({
                        value: project.projectName,
                        onChange: (value) =>
                          updateField('projects', idx, 'projectName', value),
                        className: 'font-semibold',
                        textColor: 'text-gray-800',
                        ariaLabel: 'Project name',
                      })}
                      {project.link && (
                        <div className="flex items-center gap-1">
                          {showIcons && <Link2 className="w-4 h-4" style={{ color: colors.accent }} />}
                          {renderInput({
                            value: project.link,
                            onChange: (value) => updateField('projects', idx, 'link', value),
                            className: 'text-sm',
                            type: 'link',
                            textColor: 'text-gray-600',
                            inlineStyle: { color: colors.accent },
                            ariaLabel: 'Project link',
                          })}
                        </div>
                      )}
                    </div>
                    {renderInput({
                      value: project.description,
                      onChange: (value) =>
                        updateField('projects', idx, 'description', value),
                      multiline: true,
                      className: 'text-sm ml-5 text-justify',
                      textColor: 'text-gray-600',
                      ariaLabel: 'Project description',
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'education' && hasContent(resumeData.education) && (
            <div>
              <SectionHeader title="Education" />
              <div className="space-y-3">
                {resumeData.education.map((edu, idx) => (
                  <div key={idx} className="break-inside-avoid pb-3 last:pb-0">
                    <div className="flex justify-between items-start">
                      {renderInput({
                        value: edu.degree,
                        onChange: (value) => updateField('education', idx, 'degree', value),
                        className: 'font-semibold',
                        textColor: 'text-gray-800',
                        ariaLabel: 'Degree',
                      })}
                      <div className="text-sm flex items-center gap-1 text-gray-600">
                        {renderInput({
                          value: edu.startDate,
                          onChange: (value) =>
                            updateField('education', idx, 'startDate', value),
                          textColor: 'text-gray-600',
                          ariaLabel: 'Start date',
                        })}
                        {edu.startDate && <span>-</span>}
                        {renderInput({
                          value: edu.endDate,
                          onChange: (value) =>
                            updateField('education', idx, 'endDate', value),
                          textColor: 'text-gray-600',
                          ariaLabel: 'End date',
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {showIcons && <GraduationCap className="w-4 h-4" style={{ color: colors.accent }} />}
                      <div className="flex items-center gap-1">
                        {renderInput({
                          value: edu.institution,
                          onChange: (value) =>
                            updateField('education', idx, 'institution', value),
                          className: 'font-medium text-sm',
                          inlineStyle: { color: colors.accent }, // Direct accentColor
                          ariaLabel: 'Institution',
                        })}
                        {edu.location && (
                          <div className="flex items-center gap-1">
                            {showIcons && <MapPin className="w-4 h-4" style={{ color: colors.accent }} />}
                            {renderInput({
                              value: edu.location,
                              onChange: (value) =>
                                updateField('education', idx, 'location', value),
                              className: 'text-xs',
                              inlineStyle: { color: colors.accent },
                              ariaLabel: 'Location',
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    {edu.description && (
                      <div className="text-sm">
                        {renderInput({
                          value: edu.description,
                          onChange: (value) =>
                            updateField('education', idx, 'description', value),
                          className: 'inline-block',
                          textColor: 'text-gray-600',
                          ariaLabel: 'Education description',
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'skills' && hasContent(resumeData.skills) && (
            <div>
              <SectionHeader title="Skills" />
              <div className="space-y-1">
                {resumeData.skills.map((skill, idx) => (
                  <div key={idx} className="break-inside-avoid">
                    {skill.skillType === 'individual' ? (
                      renderInput({
                        value: skill.skill,
                        onChange: (value) => updateField('skills', idx, 'skill', value),
                        className: 'text-sm font-semibold',
                        textColor: 'text-gray-800',
                        ariaLabel: 'Skill',
                      })
                    ) : (
                      <div className="flex items-start">
                        {renderInput({
                          value: skill.category,
                          onChange: (value) =>
                            updateField('skills', idx, 'category', value),
                          className: 'text-sm font-semibold',
                          textColor: 'text-gray-800',
                          ariaLabel: 'Skill category',
                        })}
                        <span className="mx-2 text-sm font-semibold text-gray-800">:</span>
                        {renderInput({
                          value: skill.skills,
                          onChange: (value) =>
                            updateField('skills', idx, 'skills', value),
                          className: 'text-sm',
                          textColor: 'text-gray-700',
                          ariaLabel: 'Skills',
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'certifications' && hasContent(resumeData.certifications) && (
            <div>
              <SectionHeader title="Certifications" />
              <div className="space-y-2">
                {resumeData.certifications.map((cert, idx) => (
                  <div key={idx} className="break-inside-avoid">
                    <div className="flex justify-between items-start">
                      {renderInput({
                        value: cert.certificationName,
                        onChange: (value) =>
                          updateField('certifications', idx, 'certificationName', value),
                        className: 'font-bold text-sm',
                        textColor: 'text-gray-800',
                        ariaLabel: 'Certification name',
                      })}
                      <div className="flex items-center gap-1">
                        {renderInput({
                          value: cert.issueDate,
                          onChange: (value) =>
                            updateField('certifications', idx, 'issueDate', value),
                          className: 'text-sm',
                          textColor: 'text-gray-600',
                          ariaLabel: 'Certification date',
                        })}
                      </div>
                    </div>
                    {renderInput({
                      value: cert.issuingOrganization,
                      onChange: (value) =>
                        updateField('certifications', idx, 'issuingOrganization', value),
                      className: 'text-sm',
                      inlineStyle: { color: colors.accent }, // Direct accentColor
                      ariaLabel: 'Issuing organization',
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'languages' && hasContent(resumeData.languages) && (
            <div>
              <SectionHeader title="Languages" />
              <div className="space-y-1">
                {resumeData.languages.map((language, idx) => (
                  <div key={idx} className="break-inside-avoid text-sm flex items-center gap-2">
                    {renderInput({
                      value: language.language,
                      onChange: (value) =>
                        updateField('languages', idx, 'language', value),
                      className: 'font-medium',
                      textColor: 'text-gray-800',
                      ariaLabel: 'Language name',
                    })}
                    <span className="text-gray-600">-</span>
                    {renderInput({
                      value: language.proficiency,
                      onChange: (value) =>
                        updateField('languages', idx, 'proficiency', value),
                      textColor: 'text-gray-600',
                      ariaLabel: 'Language proficiency',
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'customSections' && hasContent(resumeData.customSections) && (
            <div>
              {resumeData.customSections.map((custom, idx) => (
                <div key={idx} className="break-inside-avoid mb-4 last:mb-0">
                  <SectionHeader title={custom.sectionTitle} />
                  {renderInput({
                    value: custom.content,
                    onChange: (value) =>
                      updateField('customSections', idx, 'content', value),
                    multiline: true,
                    className: 'text-sm',
                    textColor: 'text-gray-600',
                    ariaLabel: `${custom.sectionTitle} content`,
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}