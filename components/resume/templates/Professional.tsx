"use client";
import { useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import type { TemplateProps } from './types';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Linkedin, Github, Link2, Building2, GraduationCap, Globe } from 'lucide-react';

export function ProfessionalTemplate({
  resumeData,
  isEditing,
  updateField,
  accentColor = '#000000', // Default black for professional feel
  fontFamily = 'Domine', // Default font family
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
  // Memoize accentColor directly
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
      className="flex items-center gap-2 text-lg text-black font-semibold mb-3 border-b-2 border-gray-800" // Black title, dark gray border
    >
      <h2 className="text-center w-full">{title}</h2>
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
    <div className={`w-full mx-auto bg-white px-6 py-4`} style={{ fontFamily }}>
      {/* Personal Details Section */}
      <div className="mb-8 break-inside-avoid">
        <div className="flex justify-between w-full">
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold">
              {renderInput({
                value: resumeData.personalDetails.fullName,
                onChange: (value) => updateField('personalDetails', null, 'fullName', value),
                className: 'text-left',
                textColor: 'text-black', // Matches MinimalTemplate
                ariaLabel: 'Full name',
              })}
            </h1>
            <p>
              {renderInput({
                value: resumeData.jobTitle,
                onChange: (value) => updateField('jobTitle', null, 'jobTitle', value),
                className: 'text-left',
                inlineStyle: { color: colors.accent }, // Accent color per MinimalTemplate
                ariaLabel: 'Job Title',
              })}
            </p>
          </div>
          <div className="text-right text-sm">
            {resumeData.personalDetails.email && (
              <div className="flex items-center gap-1 justify-end">
                {showIcons && <Mail className="w-4 h-4" style={{ color: colors.accent }} />}
                {renderInput({
                  value: resumeData.personalDetails.email,
                  onChange: (value) => updateField('personalDetails', null, 'email', value),
                  className: 'inline-block',
                  type: 'mail',
                  textColor: 'text-gray-600',
                  ariaLabel: 'Email address',
                })}
              </div>
            )}
            {resumeData.personalDetails.phone && (
              <div className="flex items-center gap-1 justify-end">
                {showIcons && <Phone className="w-4 h-4" style={{ color: colors.accent }} />}
                {renderInput({
                  value: resumeData.personalDetails.phone,
                  onChange: (value) => updateField('personalDetails', null, 'phone', value),
                  className: 'inline-block',
                  type: 'phone',
                  textColor: 'text-gray-600',
                  ariaLabel: 'Phone number',
                })}
              </div>
            )}
            {resumeData.personalDetails.location && (
              <div className="flex items-center gap-1 justify-end">
                {showIcons && <MapPin className="w-4 h-4" style={{ color: colors.accent }} />}
                {renderInput({
                  value: resumeData.personalDetails.location,
                  onChange: (value) => updateField('personalDetails', null, 'location', value),
                  className: 'inline-block',
                  textColor: 'text-gray-600',
                  ariaLabel: 'Location',
                })}
              </div>
            )}
            {resumeData.personalDetails.linkedin && (
              <div className="flex items-center gap-1 justify-end">
                {showIcons && <Linkedin className="w-4 h-4" style={{ color: colors.accent }} />}
                {renderInput({
                  value: resumeData.personalDetails.linkedin,
                  onChange: (value) => updateField('personalDetails', null, 'linkedin', value),
                  className: 'inline-block text-sm',
                  type: 'link',
                  textColor: 'text-gray-600',
                  ariaLabel: 'LinkedIn profile',
                })}
              </div>
            )}
            {resumeData.personalDetails.github && (
              <div className="flex items-center gap-1 justify-end">
                {showIcons && <Github className="w-4 h-4" style={{ color: colors.accent }} />}
                {renderInput({
                  value: resumeData.personalDetails.github,
                  onChange: (value) => updateField('personalDetails', null, 'github', value),
                  className: 'inline-block text-sm',
                  type: 'link',
                  textColor: 'text-gray-600',
                  ariaLabel: 'GitHub profile',
                })}
              </div>
            )}
            {resumeData.personalDetails.website && (
              <div className="flex items-center gap-1 justify-end">
                {showIcons && <Globe className="w-4 h-4" style={{ color: colors.accent }} />}
                {renderInput({
                  value: resumeData.personalDetails.website,
                  onChange: (value) => updateField('personalDetails', null, 'website', value),
                  className: 'inline-block text-sm',
                  type: 'link',
                  textColor: 'text-gray-600',
                  ariaLabel: 'Website',
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render sections based on sectionOrder */}
      {sectionOrder.map((section) => (
        <div key={section} className="break-inside-avoid mb-6">
          {section === 'objective' && hasContent(resumeData.objective) && (
            <div className="break-inside-avoid">
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
            <div className="break-inside-avoid">
              <SectionHeader title="Work Experience" />
              {resumeData.workExperience.map((experience, index) => (
                <div
                  key={index}
                  className={`pb-4 break-inside-avoid ${
                    index !== resumeData.workExperience.length - 1 ? 'mb-4 border-b-2 border-dashed border-gray-800' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      {renderInput({
                        value: experience.jobTitle,
                        onChange: (value) => updateField('workExperience', index, 'jobTitle', value),
                        className: 'font-semibold',
                        textColor: 'text-gray-800',
                        ariaLabel: 'Job title',
                      })}
                    </div>
                    <div className="text-xs italic flex items-center gap-1">
                      {renderInput({
                        value: experience.startDate,
                        onChange: (value) => updateField('workExperience', index, 'startDate', value),
                        textColor: 'text-gray-600',
                        ariaLabel: 'Start date',
                      })}
                      <span>-</span>
                      {renderInput({
                        value: experience.endDate,
                        onChange: (value) => updateField('workExperience', index, 'endDate', value),
                        textColor: 'text-gray-600',
                        ariaLabel: 'End date',
                      })}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    {experience.location ? (
                      <div className="flex items-center gap-1 mb-1">
                        {showIcons && <Building2 className="w-4 h-4" style={{ color: colors.accent }} />}
                        <div className="flex items-center gap-1">
                          {renderInput({
                            value: experience.companyName,
                            onChange: (value) => updateField('workExperience', index, 'companyName', value),
                            className: 'font-medium text-sm',
                            inlineStyle: { color: colors.accent },
                            ariaLabel: 'Company name',
                          })}
                          <div className="flex items-center">
                            {showIcons && <MapPin className="w-4 h-4" style={{ color: colors.accent }} />}
                            {renderInput({
                              value: experience.location,
                              onChange: (value) => updateField('workExperience', index, 'location', value),
                              className: 'text-xs',
                              inlineStyle: { color: colors.accent },
                              ariaLabel: 'Location',
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 mb-1">
                        {showIcons && <Building2 className="w-4 h-4" style={{ color: colors.accent }} />}
                        {renderInput({
                          value: experience.companyName,
                          onChange: (value) => updateField('workExperience', index, 'companyName', value),
                          className: 'font-medium text-sm',
                          inlineStyle: { color: colors.accent },
                          ariaLabel: 'Company name',
                        })}
                      </div>
                    )}
                    {renderInput({
                      value: experience.description,
                      onChange: (value) => updateField('workExperience', index, 'description', value),
                      multiline: true,
                      className: 'text-sm ml-4 text-justify',
                      textColor: 'text-gray-600',
                      ariaLabel: 'Job description',
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'projects' && hasContent(resumeData.projects) && (
            <div className="break-inside-avoid">
              <SectionHeader title="Projects" />
              {resumeData.projects.map((project, index) => (
                <div
                  key={index}
                  className={`pb-4 break-inside-avoid ${
                    index !== resumeData.projects.length - 1 ? 'mb-4 border-b-2 border-dashed border-gray-800' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    {renderInput({
                      value: project.projectName,
                      onChange: (value) => updateField('projects', index, 'projectName', value),
                      className: 'font-semibold',
                      textColor: 'text-gray-800',
                      ariaLabel: 'Project name',
                    })}
                    {project.link && (
                      <div className="flex items-center gap-1">
                        {showIcons && <Link2 className="w-4 h-4" style={{ color: colors.accent }} />}
                        {renderInput({
                          value: project.link,
                          onChange: (value) => updateField('projects', index, 'link', value),
                          className: 'text-xs italic',
                          type: 'link',
                          textColor: 'text-gray-600',
                          ariaLabel: 'Project link',
                        })}
                      </div>
                    )}
                  </div>
                  {renderInput({
                    value: project.description,
                    onChange: (value) => updateField('projects', index, 'description', value),
                    multiline: true,
                    className: 'text-sm ml-4 text-justify',
                    textColor: 'text-gray-600',
                    ariaLabel: 'Project description',
                  })}
                </div>
              ))}
            </div>
          )}

          {section === 'education' && hasContent(resumeData.education) && (
            <div className="break-inside-avoid">
              <SectionHeader title="Education" />
              {resumeData.education.map((edu, index) => (
                <div key={index} className="mb-4 last:mb-0 break-inside-avoid">
                  <div className="flex justify-between items-start">
                    {renderInput({
                      value: edu.degree,
                      onChange: (value) => updateField('education', index, 'degree', value),
                      className: 'font-semibold',
                      textColor: 'text-gray-800',
                      ariaLabel: 'Degree',
                    })}
                    <div className="text-xs italic flex items-center gap-1">
                      {renderInput({
                        value: edu.startDate,
                        onChange: (value) => updateField('education', index, 'startDate', value),
                        textColor: 'text-gray-600',
                        ariaLabel: 'Start date',
                      })}
                      {edu.startDate && <span>-</span>}
                      {renderInput({
                        value: edu.endDate,
                        onChange: (value) => updateField('education', index, 'endDate', value),
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
                        onChange: (value) => updateField('education', index, 'institution', value),
                        className: 'font-medium text-sm',
                        inlineStyle: { color: colors.accent },
                        ariaLabel: 'Institution',
                      })}
                      {edu.location && (
                        <div className="flex items-center">
                          {showIcons && <MapPin className="w-4 h-4" style={{ color: colors.accent }} />}
                          {renderInput({
                            value: edu.location,
                            onChange: (value) => updateField('education', index, 'location', value),
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
                        onChange: (value) => updateField('education', index, 'description', value),
                        className: 'inline-block',
                        textColor: 'text-gray-600',
                        ariaLabel: 'Education description',
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {section === 'skills' && hasContent(resumeData.skills) && (
            <div className="break-inside-avoid">
              <SectionHeader title="Skills" />
              <div className="space-y-2">
                {resumeData.skills.map((skill, index) => (
                  <div key={index} className="flex items-start break-inside-avoid">
                    {skill.skillType === 'individual' ? (
                      renderInput({
                        value: skill.skill,
                        onChange: (value) => updateField('skills', index, 'skill', value),
                        className: 'text-sm font-semibold',
                        textColor: 'text-gray-800',
                        ariaLabel: 'Skill',
                      })
                    ) : (
                      <>
                        {renderInput({
                          value: skill.category,
                          onChange: (value) => updateField('skills', index, 'category', value),
                          className: 'text-sm font-semibold',
                          textColor: 'text-gray-800',
                          ariaLabel: 'Skill category',
                        })}
                        <span className="mx-2 text-sm font-semibold text-gray-800">:</span>
                        {renderInput({
                          value: skill.skills,
                          onChange: (value) => updateField('skills', index, 'skills', value),
                          className: 'text-sm',
                          textColor: 'text-gray-700',
                          ariaLabel: 'Skills',
                        })}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'certifications' && hasContent(resumeData.certifications) && (
            <div className="break-inside-avoid">
              <SectionHeader title="Certifications" />
              {resumeData.certifications.map((cert, index) => (
                <div key={index} className="mb-3 last:mb-0 break-inside-avoid">
                  <div className="flex justify-between items-start">
                    {renderInput({
                      value: cert.certificationName,
                      onChange: (value) => updateField('certifications', index, 'certificationName', value),
                      className: 'font-medium text-sm',
                      textColor: 'text-gray-800',
                      ariaLabel: 'Certification name',
                    })}
                    <div className="flex items-center gap-1">
                      {renderInput({
                        value: cert.issueDate,
                        onChange: (value) => updateField('certifications', index, 'issueDate', value),
                        className: 'text-xs italic',
                        textColor: 'text-gray-600',
                        ariaLabel: 'Certification date',
                      })}
                    </div>
                  </div>
                  <div>
                    {renderInput({
                      value: cert.issuingOrganization,
                      onChange: (value) => updateField('certifications', index, 'issuingOrganization', value),
                      className: 'text-sm',
                      inlineStyle: { color: colors.accent },
                      ariaLabel: 'Issuing organization',
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'languages' && hasContent(resumeData.languages) && (
            <div className="break-inside-avoid">
              <SectionHeader title="Languages" />
              <div className="flex flex-col space-y-2">
                {resumeData.languages.map((language, index) => (
                  <div key={index} className="text-sm flex items-center gap-2 p-1 rounded-md break-inside-avoid">
                    {renderInput({
                      value: language.language,
                      onChange: (value) => updateField('languages', index, 'language', value),
                      className: 'font-medium',
                      textColor: 'text-gray-800',
                      ariaLabel: 'Language name',
                    })}
                    <span className="text-gray-600">-</span>
                    {renderInput({
                      value: language.proficiency,
                      onChange: (value) => updateField('languages', index, 'proficiency', value),
                      textColor: 'text-gray-600',
                      ariaLabel: 'Language proficiency',
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'customSections' && hasContent(resumeData.customSections) && (
            <div className="break-inside-avoid">
              {resumeData.customSections.map((custom, idx) => (
                <div key={idx} className="mb-4 break-inside-avoid">
                  <SectionHeader title={custom.sectionTitle} />
                  {renderInput({
                    value: custom.content,
                    onChange: (value) => updateField('customSections', idx, 'content', value),
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