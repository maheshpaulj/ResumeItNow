"use client";
import { useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import type { TemplateProps } from './types';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Linkedin, Github, Link2, Building2, Building, GraduationCap, Globe } from 'lucide-react';
import { lightenColor } from '@/lib/utils';

export function ModernTemplate({
  resumeData,
  isEditing,
  updateField,
  accentColor = '#0E7490', // Default cyan-700 for modern feel
  fontFamily = 'Montserrat', // Default font family
  sectionOrder = [
    'objective',
    'workExperience',
    'projects',
    'education',
    'skills',
    'certifications',
    'languages',
  ],
  showIcons
}: TemplateProps & {
  accentColor?: string;
  fontFamily?: string;
  sectionOrder?: string[];
  showIcons?: boolean;
}) {
  // Memoize derived colors to avoid recalculation
  const colors = useMemo(() => ({
    sectionTitle: accentColor,
    subheading: lightenColor(accentColor, 20),
    tertiary: lightenColor(accentColor, 40),
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
    <div className="flex items-center gap-2 text-nowrap text-lg font-semibold mb-3 pb-1">
      <h2 style={{ color: colors.sectionTitle }}>{title}</h2>
      <div className="w-full h-1 mt-1" style={{ backgroundColor: colors.sectionTitle }}></div>
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
        <div className="flex items-center space-x-2">
          <h1 className="text-4xl font-bold">
            {renderInput({
              value: resumeData.personalDetails.fullName,
              onChange: (value) => updateField('personalDetails', null, 'fullName', value),
              className: 'text-left',
              inlineStyle: { color: colors.sectionTitle },
              ariaLabel: 'Full name',
            })}
          </h1>
          <p>
            {renderInput({
              value: resumeData.jobTitle,
              onChange: (value) => updateField('jobTitle', null, 'jobTitle', value),
              className: 'text-left',
              inlineStyle: { color: colors.subheading },
              ariaLabel: 'Job Title',
            })}
          </p>
        </div>
        <div className="text-left text-sm space-x-4" style={{ color: colors.tertiary }}>
          {resumeData.personalDetails.email && (
            <span className="inline-flex items-center gap-1">
              {showIcons && <Mail className="w-4 h-4" style={{ color: colors.tertiary }} />}
              {renderInput({
                value: resumeData.personalDetails.email,
                onChange: (value) => updateField('personalDetails', null, 'email', value),
                className: 'inline-block',
                type: 'mail',
                inlineStyle: { color: colors.tertiary },
                ariaLabel: 'Email address',
              })}
            </span>
          )}
          {resumeData.personalDetails.phone && (
            <span className="inline-flex items-center gap-1">
              {showIcons && <Phone className="w-4 h-4" style={{ color: colors.tertiary }} />}
              {renderInput({
                value: resumeData.personalDetails.phone,
                onChange: (value) => updateField('personalDetails', null, 'phone', value),
                className: 'inline-block',
                type: 'phone',
                inlineStyle: { color: colors.tertiary },
                ariaLabel: 'Phone number',
              })}
            </span>
          )}
          {resumeData.personalDetails.location && (
            <span className="inline-flex items-center gap-1">
              {showIcons && <MapPin className="w-4 h-4" style={{ color: colors.tertiary }} />}
              {renderInput({
                value: resumeData.personalDetails.location,
                onChange: (value) => updateField('personalDetails', null, 'location', value),
                className: 'inline-block',
                inlineStyle: { color: colors.tertiary },
                ariaLabel: 'Location',
              })}
            </span>
          )}
        </div>
        <div className="text-left mt-2 space-x-4">
          {resumeData.personalDetails.linkedin && (
            <span className="inline-flex items-center gap-1">
              {showIcons && <Linkedin className="w-4 h-4" style={{ color: colors.tertiary }} />}
              {renderInput({
                value: resumeData.personalDetails.linkedin,
                onChange: (value) => updateField('personalDetails', null, 'linkedin', value),
                className: 'inline-block text-sm',
                type: 'link',
                inlineStyle: { color: colors.tertiary },
                ariaLabel: 'LinkedIn profile',
              })}
            </span>
          )}
          {resumeData.personalDetails.github && (
            <span className="inline-flex items-center gap-1">
              {showIcons && <Github className="w-4 h-4" style={{ color: colors.tertiary }} />}
              {renderInput({
                value: resumeData.personalDetails.github,
                onChange: (value) => updateField('personalDetails', null, 'github', value),
                className: 'inline-block text-sm',
                type: 'link',
                inlineStyle: { color: colors.tertiary },
                ariaLabel: 'GitHub profile',
              })}
            </span>
          )}
          {resumeData.personalDetails.website && (
            <span className="inline-flex items-center gap-1">
              {showIcons && <Globe className="w-4 h-4" style={{ color: colors.tertiary }} />}
              {renderInput({
                value: resumeData.personalDetails.website,
                onChange: (value) => updateField('personalDetails', null, 'website', value),
                className: 'inline-block text-sm',
                type: 'link',
                inlineStyle: { color: colors.tertiary },
                ariaLabel: 'Website',
              })}
            </span>
          )}
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
            <div className="break-inside-avoid flex-1">
              <SectionHeader title="Work Experience" />
              {resumeData.workExperience.map((experience, index) => (
                <div
                  key={index}
                  className={`pb-4 break-inside-avoid ${
                    index !== resumeData.workExperience.length - 1 ? 'mb-4 border-b border-dashed' : ''
                  }`}
                  style={{ borderColor: index !== resumeData.workExperience.length - 1 ? colors.sectionTitle : 'transparent' }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      {renderInput({
                        value: experience.jobTitle,
                        onChange: (value) => updateField('workExperience', index, 'jobTitle', value),
                        className: 'font-semibold',
                        inlineStyle: { color: colors.subheading },
                        ariaLabel: 'Job title',
                      })}
                    </div>
                    <div className="text-sm flex items-center gap-1" style={{ color: colors.tertiary }}>
                      {renderInput({
                        value: experience.startDate,
                        onChange: (value) => updateField('workExperience', index, 'startDate', value),
                        inlineStyle: { color: colors.tertiary },
                        ariaLabel: 'Start date',
                      })}
                      <span>-</span>
                      {renderInput({
                        value: experience.endDate,
                        onChange: (value) => updateField('workExperience', index, 'endDate', value),
                        inlineStyle: { color: colors.tertiary },
                        ariaLabel: 'End date',
                      })}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    {experience.location ? (
                      <div className="flex items-center gap-1 mb-1">
                        {showIcons && <Building2 className="w-4 h-4" style={{ color: colors.tertiary }} />}
                        <div className="flex items-center gap-1">
                          {renderInput({
                            value: experience.companyName,
                            onChange: (value) => updateField('workExperience', index, 'companyName', value),
                            className: 'font-medium text-sm',
                            inlineStyle: { color: colors.subheading },
                            ariaLabel: 'Company name',
                          })}
                          <div className="flex items-center">
                            {showIcons && <MapPin className="w-4 h-4" style={{ color: colors.tertiary }} />}
                            {renderInput({
                              value: experience.location,
                              onChange: (value) => updateField('workExperience', index, 'location', value),
                              className: 'text-xs',
                              inlineStyle: { color: colors.tertiary },
                              ariaLabel: 'Location',
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 mb-1">
                        {showIcons && <Building2 className="w-4 h-4" style={{ color: colors.tertiary }} />}
                        {renderInput({
                          value: experience.companyName,
                          onChange: (value) => updateField('workExperience', index, 'companyName', value),
                          className: 'font-medium text-sm',
                          inlineStyle: { color: colors.subheading },
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
                    index !== resumeData.projects.length - 1 ? 'mb-4 border-b border-dashed' : ''
                  }`}
                  style={{ borderColor: index !== resumeData.projects.length - 1 ? colors.sectionTitle : 'transparent' }}
                >
                  <div className="flex flex-col items-start mb-1">
                    {renderInput({
                      value: project.projectName,
                      onChange: (value) => updateField('projects', index, 'projectName', value),
                      className: 'font-semibold',
                      inlineStyle: { color: colors.subheading },
                      ariaLabel: 'Project name',
                    })}
                    {project.link && (
                      <div className="flex items-center gap-1">
                        {showIcons && <Link2 className="w-4 h-4" style={{ color: colors.tertiary }} />}
                        {renderInput({
                          value: project.link,
                          onChange: (value) => updateField('projects', index, 'link', value),
                          className: 'text-sm italic',
                          type: 'link',
                          inlineStyle: { color: colors.tertiary },
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
                      inlineStyle: { color: colors.subheading },
                      ariaLabel: 'Degree',
                    })}
                    <div className="text-sm flex items-center gap-1" style={{ color: colors.tertiary }}>
                      {renderInput({
                        value: edu.startDate,
                        onChange: (value) => updateField('education', index, 'startDate', value),
                        inlineStyle: { color: colors.tertiary },
                        ariaLabel: 'Start date',
                      })}
                      {edu.startDate && <span>-</span>}
                      {renderInput({
                        value: edu.endDate,
                        onChange: (value) => updateField('education', index, 'endDate', value),
                        inlineStyle: { color: colors.tertiary },
                        ariaLabel: 'End date',
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {showIcons && <GraduationCap className="w-4 h-4" style={{ color: colors.tertiary }} />}
                    <div className="flex items-center gap-1">
                      {renderInput({
                        value: edu.institution,
                        onChange: (value) => updateField('education', index, 'institution', value),
                        className: 'font-medium text-sm',
                        inlineStyle: { color: colors.subheading },
                        ariaLabel: 'Institution',
                      })}
                      {edu.location && (
                        <div className="flex items-center">
                          {showIcons && <MapPin className="w-4 h-4" style={{ color: colors.tertiary }} />}
                          {renderInput({
                            value: edu.location,
                            onChange: (value) => updateField('education', index, 'location', value),
                            className: 'font-light text-xs',
                            inlineStyle: { color: colors.tertiary },
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
                        inlineStyle: { color: colors.subheading },
                        ariaLabel: 'Skill',
                      })
                    ) : (
                      <>
                        {renderInput({
                          value: skill.category,
                          onChange: (value) => updateField('skills', index, 'category', value),
                          className: 'text-sm font-semibold',
                          inlineStyle: { color: colors.subheading },
                          ariaLabel: 'Skill category',
                        })}
                        <span className="mx-2 text-sm font-semibold" style={{ color: colors.subheading }}>
                          :
                        </span>
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
                      inlineStyle: { color: colors.tertiary },
                      ariaLabel: 'Certification name',
                    })}
                    <div className="flex items-center gap-1">
                      {renderInput({
                        value: cert.issueDate,
                        onChange: (value) => updateField('certifications', index, 'issueDate', value),
                        className: 'text-sm',
                        inlineStyle: { color: colors.tertiary },
                        ariaLabel: 'Certification date',
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {showIcons && <Building className="w-4 h-4" style={{ color: colors.sectionTitle }} />}
                    {renderInput({
                      value: cert.issuingOrganization,
                      onChange: (value) => updateField('certifications', index, 'issuingOrganization', value),
                      className: 'text-sm',
                      inlineStyle: { color: colors.sectionTitle },
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
              <div className="flex flex-col">
                {resumeData.languages.map((language, index) => (
                  <div key={index} className="text-sm flex items-center gap-2 p-1 text-nowrap rounded-md break-inside-avoid">
                    {renderInput({
                      value: language.language,
                      onChange: (value) => updateField('languages', index, 'language', value),
                      className: 'font-medium',
                      inlineStyle: { color: colors.subheading },
                      ariaLabel: 'Language name',
                    })}
                    <span style={{ color: colors.tertiary }}>-</span>
                    {renderInput({
                      value: language.proficiency,
                      onChange: (value) => updateField('languages', index, 'proficiency', value),
                      inlineStyle: { color: colors.tertiary },
                      ariaLabel: 'Language proficiency',
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}