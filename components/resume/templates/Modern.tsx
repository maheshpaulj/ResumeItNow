"use client";
import { useMemo } from 'react';
import type { TemplateProps } from './types';
import { useRenderInput, PhotoField, SkillTypeToggle } from '@/components/resume/editor/fields';
import { EditableSection, EntryChrome } from '@/components/resume/editor/chrome';
import { Mail, Phone, MapPin, Link2, Building2, GraduationCap, Globe, Landmark } from 'lucide-react';
import { FaLinkedin, FaGithub } from 'react-icons/fa6';
import { lightenColor } from '@/lib/utils';

// Module scope on purpose: defining this inside the template makes React see a
// new component type every render and REMOUNT each header — wiping the inline
// margin spacers the paginator puts on them.
const SectionHeader = ({ title, color }: { title: string; color: string }) => (
  <div data-rb="header" className="flex items-center gap-2 text-nowrap text-lg font-semibold mb-3 pb-1">
    <h2 style={{ color }}>{title}</h2>
    <div className="flex-1 h-1 mt-1" style={{ backgroundColor: color }}></div>
  </div>
);

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
  showIcons,
  showPhoto,
  customMargins,
  isPrint,
}: TemplateProps & {
  accentColor?: string;
  fontFamily?: string;
  sectionOrder?: string[];
  showIcons?: boolean;
  showPhoto?: boolean;
  customMargins?: { top: number; bottom: number; left: number; right: number };
  isPrint?: boolean;
}) {
  // Memoize derived colors to avoid recalculation
  const colors = useMemo(() => ({
    sectionTitle: accentColor,
    subheading: lightenColor(accentColor, 20),
    tertiary: lightenColor(accentColor, 40),
  }), [accentColor]);


  const renderInput = useRenderInput(isEditing);

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
    <div 
      className="w-full mx-auto bg-white text-gray-900" 
      style={{ 
        fontFamily,
        paddingTop: customMargins ? `${customMargins.top}px` : '1.5rem',
        paddingBottom: customMargins ? `${customMargins.bottom}px` : '1.5rem',
        paddingLeft: customMargins ? `${customMargins.left}px` : '2rem',
        paddingRight: customMargins ? `${customMargins.right}px` : '2rem',
      }}
    >
      {/* Personal Details Section */}
      <div className="mb-8 break-inside-avoid flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
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
          <div>
            {renderInput({
              value: resumeData.jobTitle,
              onChange: (value) => updateField('jobTitle', null, 'jobTitle', value),
              className: 'text-left',
              inlineStyle: { color: colors.subheading },
              ariaLabel: 'Job Title',
            })}
          </div>
        </div>
        <div className="text-left text-sm flex flex-wrap gap-x-4 gap-y-2" style={{ color: colors.tertiary }}>
          {(isEditing || resumeData.personalDetails.email) && (
            <span className="inline-flex items-center gap-1">
              {showIcons && <Mail className="w-4 h-4" style={{ color: colors.tertiary }} />}
              {renderInput({
                value: resumeData.personalDetails.email,
                onChange: (value) => updateField('personalDetails', null, 'email', value),
                className: 'inline-block break-all',
                type: 'mail',
                inlineStyle: { color: colors.tertiary },
                ariaLabel: 'Email address',
              })}
            </span>
          )}
          {(isEditing || resumeData.personalDetails.phone) && (
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
          {(isEditing || resumeData.personalDetails.location) && (
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
        <div className="text-left mt-2 flex flex-wrap gap-x-4 gap-y-2">
          {(isEditing || resumeData.personalDetails.linkedin) && (
            <span className="inline-flex items-center gap-1">
              {showIcons && <FaLinkedin className="w-4 h-4" style={{ color: colors.tertiary }} />}
              {renderInput({
                value: resumeData.personalDetails.linkedin,
                onChange: (value) => updateField('personalDetails', null, 'linkedin', value),
                className: 'inline-block text-sm break-all',
                type: 'link',
                inlineStyle: { color: colors.tertiary },
                ariaLabel: 'LinkedIn profile',
              })}
            </span>
          )}
          {(isEditing || resumeData.personalDetails.github) && (
            <span className="inline-flex items-center gap-1">
              {showIcons && <FaGithub className="w-4 h-4" style={{ color: colors.tertiary }} />}
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
          {(isEditing || resumeData.personalDetails.website) && (
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
        <PhotoField
          value={resumeData.personalDetails.photo}
          isEditing={isEditing}
          show={showPhoto}
          onChange={(v) => updateField('personalDetails', null, 'photo', v)}
          className="h-24 w-24"
        />
      </div>

      {/* Render sections based on sectionOrder */}
      {sectionOrder.map((section) => (
        <EditableSection key={section} id={section} className="mb-6 empty:hidden">
          {section === 'objective' && (isEditing || hasContent(resumeData.objective)) && (
            <div>
              <SectionHeader color={colors.sectionTitle} title="Professional Summary" />
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

          {section === 'workExperience' && (isEditing || hasContent(resumeData.workExperience)) && (
            <div className="flex-1">
              <SectionHeader color={colors.sectionTitle} title="Work Experience" />
              {resumeData.workExperience.map((experience, index) => (
                <div
                  key={index}
                  className={`relative group/entry pb-4 ${
                    index !== resumeData.workExperience.length - 1 ? 'mb-4 border-b border-dashed' : ''
                  }`}
                  style={{ borderColor: index !== resumeData.workExperience.length - 1 ? colors.sectionTitle : 'transparent' }}
                  data-rb="entry"
                  data-rbkey={`e:workExperience:${index}`}><EntryChrome section="workExperience" index={index} count={resumeData.workExperience.length} />
                  <div className="break-inside-avoid" data-rb="entry-header">
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
                        type: 'date',
                        inlineStyle: { color: colors.tertiary },
                        ariaLabel: 'Start date',
                      })}
                      {((isEditing && (experience.startDate || experience.endDate)) || (experience.startDate && experience.endDate)) && <span>-</span>}
                      {renderInput({
                        value: experience.endDate,
                        onChange: (value) => updateField('workExperience', index, 'endDate', value),
                        type: 'date',
                        allowPresent: true,
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
                  </div>
                    {renderInput({
                      value: experience.description,
                      onChange: (value) => updateField('workExperience', index, 'description', value),
                      multiline: true,
                      className: 'text-sm pl-4 text-justify',
                      textColor: 'text-gray-600',
                      ariaLabel: 'Job description',
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'projects' && (isEditing || hasContent(resumeData.projects)) && (
            <div>
              <SectionHeader color={colors.sectionTitle} title="Projects" />
              {resumeData.projects.map((project, index) => (
                <div
                  key={index}
                  className={`relative group/entry pb-4 ${
                    index !== resumeData.projects.length - 1 ? 'mb-4 border-b border-dashed' : ''
                  }`}
                  style={{ borderColor: index !== resumeData.projects.length - 1 ? colors.sectionTitle : 'transparent' }}
                  data-rb="entry"
                  data-rbkey={`e:projects:${index}`}><EntryChrome section="projects" index={index} count={resumeData.projects.length} />
                  <div className="break-inside-avoid flex flex-col items-start mb-1" data-rb="entry-header">
                    {renderInput({
                      value: project.projectName,
                      onChange: (value) => updateField('projects', index, 'projectName', value),
                      className: 'font-semibold',
                      inlineStyle: { color: colors.subheading },
                      ariaLabel: 'Project name',
                    })}
                    {(isEditing || project.link) && (
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
                    className: 'text-sm pl-4 text-justify',
                    textColor: 'text-gray-600',
                    ariaLabel: 'Project description',
                  })}
                </div>
              ))}
            </div>
          )}

          {section === 'education' && (isEditing || hasContent(resumeData.education)) && (
            <div>
              <SectionHeader color={colors.sectionTitle} title="Education" />
              {resumeData.education.map((edu, index) => (
                <div key={index} className="relative group/entry mb-4 last:mb-0" data-rb="entry" data-rbkey={`e:education:${index}`}><EntryChrome section="education" index={index} count={resumeData.education.length} />
                  <div className="break-inside-avoid" data-rb="entry-header">
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
                        type: 'date',
                        inlineStyle: { color: colors.tertiary },
                        ariaLabel: 'Start date',
                      })}
                      {((isEditing && (edu.startDate || edu.endDate)) || (edu.startDate && edu.endDate)) && <span>-</span>}
                      {renderInput({
                        value: edu.endDate,
                        onChange: (value) => updateField('education', index, 'endDate', value),
                        type: 'date',
                        allowPresent: true,
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
                  </div>
                  {(isEditing || edu.gpa) && (
                    <div className="text-sm" style={{ color: colors.tertiary }}>
                      GPA:{' '}
                      {renderInput({
                        value: edu.gpa || '',
                        onChange: (value) => updateField('education', index, 'gpa', value),
                        className: 'inline-block',
                        inlineStyle: { color: colors.tertiary },
                        ariaLabel: 'GPA',
                      })}
                    </div>
                  )}
                  {(isEditing || edu.description) && (
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

          {section === 'skills' && (isEditing || hasContent(resumeData.skills)) && (
            <div>
              <SectionHeader color={colors.sectionTitle} title="Skills" />
              <div className="space-y-2">
                {resumeData.skills.map((skill, index) => (
                  <div key={index} className="relative group/entry flex items-start break-inside-avoid" data-rbkey={`e:skills:${index}`}><EntryChrome section="skills" index={index} count={resumeData.skills.length} />
                    {isEditing && (
                      <div className="absolute right-0 top-0 z-10">
                        <SkillTypeToggle type={skill.skillType} onChange={(t) => updateField('skills', index, 'skillType', t)} />
                      </div>
                    )}
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

          {section === 'certifications' && (isEditing || hasContent(resumeData.certifications)) && (
            <div>
              <SectionHeader color={colors.sectionTitle} title="Certifications" />
              {resumeData.certifications.map((cert, index) => (
                <div key={index} className="relative group/entry mb-3 last:mb-0 break-inside-avoid" data-rbkey={`e:certifications:${index}`}><EntryChrome section="certifications" index={index} count={resumeData.certifications.length} />
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
                        type: 'date',
                        className: 'text-sm',
                        inlineStyle: { color: colors.tertiary },
                        ariaLabel: 'Certification date',
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {showIcons && <Landmark className="w-4 h-4" style={{ color: colors.sectionTitle }} />}
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

          {section === 'languages' && (isEditing || hasContent(resumeData.languages)) && (
            <div>
              <SectionHeader color={colors.sectionTitle} title="Languages" />
              <div className="flex flex-col">
                {resumeData.languages.map((language, index) => (
                  <div key={index} className="relative group/entry text-sm flex items-center gap-2 p-1 text-nowrap rounded-md break-inside-avoid" data-rbkey={`e:languages:${index}`}><EntryChrome section="languages" index={index} count={resumeData.languages.length} />
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

          {section === 'customSections' && (isEditing || hasContent(resumeData.customSections)) && (
            <div>
              {resumeData.customSections.map((custom, idx) => (
                <div key={idx} className="relative group/entry mb-4 last:mb-0" data-rb="entry" data-rbkey={`e:customSections:${idx}`}><EntryChrome section="customSections" index={idx} count={resumeData.customSections.length} />
                  <div className="break-inside-avoid" data-rb="entry-header">
                    <SectionHeader color={colors.sectionTitle} title={custom.sectionTitle} />
                  </div>
                  {renderInput({
                    value: custom.content,
                    onChange: (value) => updateField('customSections', idx, 'content', value),
                    multiline: true,
                    className: 'text-sm leading-relaxed text-justify',
                    textColor: 'text-gray-700',
                    ariaLabel: custom.sectionTitle,
                  })}
                </div>
              ))}
            </div>
          )}
        </EditableSection>
      ))}
    </div>
  );
}