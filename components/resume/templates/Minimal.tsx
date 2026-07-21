"use client";
import { useMemo } from 'react';
import type { TemplateProps } from './types';
import { useRenderInput, PhotoField, SkillTypeToggle } from '@/components/resume/editor/fields';
import { EditableSection, EntryChrome } from '@/components/resume/editor/chrome';
import { Mail, Phone, MapPin, Link2, Building2, GraduationCap, Globe } from 'lucide-react';
import { FaLinkedin, FaGithub } from 'react-icons/fa6';

// Module scope on purpose: an inline definition makes React remount headers
// every render, wiping the paginator's margin spacers.
const SectionHeader = ({ title }: { title: string }) => (
  <div
    data-rb="header"
    className="text-lg text-black font-semibold mb-2 pb-1 border-b-2 border-gray-800 break-inside-avoid"
  >
    <h2>{title}</h2>
  </div>
);

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
  // Memoize accentColor to avoid recalculation
  const colors = useMemo(() => ({
    accent: accentColor,
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
      <div className="mb-6 break-inside-avoid flex flex-col sm:flex-row items-center justify-center gap-6">
        {showPhoto && (
          <div className="shrink-0">
            <PhotoField
              value={resumeData.personalDetails.photo}
              isEditing={isEditing}
              show={showPhoto}
              onChange={(v) => updateField('personalDetails', null, 'photo', v)}
              className="h-24 w-24"
            />
          </div>
        )}
        <div className="flex flex-col items-center">
          <div className="text-3xl font-bold text-center">
            {renderInput({
              value: resumeData.personalDetails.fullName,
              onChange: (value) => updateField('personalDetails', null, 'fullName', value),
              className: 'text-center',
              textColor: 'text-black',
              ariaLabel: 'Full name',
            })}
          </div>
          <div className="mb-2 flex justify-center text-lg font-medium">
            {renderInput({
              value: resumeData.jobTitle,
              onChange: (value) => updateField('jobTitle', null, 'jobTitle', value),
              className: 'text-center',
              inlineStyle: { color: colors.accent }, // Direct accentColor for job title
              ariaLabel: 'Job Title',
            })}
          </div>
          <div className="text-center text-sm flex flex-wrap justify-center gap-x-4 gap-y-2">
            {(isEditing || resumeData.personalDetails.email) && (
              <span className="inline-flex items-center gap-1">
                {showIcons && <Mail className="w-4 h-4" style={{ color: colors.accent }} />}
                {renderInput({
                  value: resumeData.personalDetails.email,
                  onChange: (value) => updateField('personalDetails', null, 'email', value),
                  className: 'inline-block break-all',
                  type: 'mail',
                  textColor: 'text-gray-600',
                  ariaLabel: 'Email address',
                })}
              </span>
            )}
            {(isEditing || resumeData.personalDetails.phone) && (
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
            {(isEditing || resumeData.personalDetails.location) && (
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
          <div className="text-center mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2">
            {(isEditing || resumeData.personalDetails.linkedin) && (
              <span className="inline-flex items-center gap-1">
                {showIcons && <FaLinkedin className="w-4 h-4" style={{ color: colors.accent }} />}
                {renderInput({
                  value: resumeData.personalDetails.linkedin,
                  onChange: (value) => updateField('personalDetails', null, 'linkedin', value),
                  className: 'inline-block text-sm break-all',
                  type: 'link',
                  textColor: 'text-gray-600',
                  ariaLabel: 'LinkedIn profile',
                })}
              </span>
            )}
            {(isEditing || resumeData.personalDetails.github) && (
              <span className="inline-flex items-center gap-1">
                {showIcons && <FaGithub className="w-4 h-4" style={{ color: colors.accent }} />}
                {renderInput({
                  value: resumeData.personalDetails.github,
                  onChange: (value) => updateField('personalDetails', null, 'github', value),
                  className: 'inline-block text-sm break-all',
                  type: 'link',
                  textColor: 'text-gray-600',
                  ariaLabel: 'GitHub profile',
                })}
              </span>
            )}
            {(isEditing || resumeData.personalDetails.website) && (
              <span className="inline-flex items-center gap-1">
                {showIcons && <Globe className="w-4 h-4" style={{ color: colors.accent }} />}
                {renderInput({
                  value: resumeData.personalDetails.website,
                  onChange: (value) => updateField('personalDetails', null, 'website', value),
                  className: 'inline-block text-sm break-all',
                  type: 'link',
                  textColor: 'text-gray-600',
                  ariaLabel: 'Website',
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Render sections based on sectionOrder */}
      {sectionOrder.map((section) => (
        <EditableSection key={section} id={section} className="mb-4 empty:hidden">
          {section === 'objective' && (isEditing || hasContent(resumeData.objective)) && (
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

          {section === 'workExperience' && (isEditing || hasContent(resumeData.workExperience)) && (
            <div>
              <SectionHeader title="Work Experience" />
              <div className="space-y-3">
                {resumeData.workExperience.map((experience, idx) => (
                  <div
                    key={idx}
                    className="relative group/entry pb-3 last:pb-0"
                    style={{
                      borderBottom:
                        idx !== resumeData.workExperience.length - 1
                          ? `1px dashed ${colors.accent}`
                          : 'none',
                    }}
                    data-rb="entry"
                    data-rbkey={`e:workExperience:${idx}`}><EntryChrome section="workExperience" index={idx} count={resumeData.workExperience.length} />
                    <div className="break-inside-avoid" data-rb="entry-header">
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
                        {((isEditing && (experience.startDate || experience.endDate)) || (experience.startDate && experience.endDate)) && <span>-</span>}
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
                    </div>
                      {renderInput({
                        value: experience.description,
                        onChange: (value) =>
                          updateField('workExperience', idx, 'description', value),
                        multiline: true,
                        className: 'text-sm pl-5 text-justify',
                        textColor: 'text-gray-600',
                        ariaLabel: 'Job description',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'projects' && (isEditing || hasContent(resumeData.projects)) && (
            <div>
              <SectionHeader title="Projects" />
              <div className="space-y-3">
                {resumeData.projects.map((project, idx) => (
                  <div
                    key={idx}
                    className="relative group/entry pb-3 last:pb-0"
                    style={{
                      borderBottom:
                        idx !== resumeData.projects.length - 1
                          ? `1px dashed ${colors.accent}`
                          : 'none',
                    }}
                    data-rb="entry"
                    data-rbkey={`e:projects:${idx}`}><EntryChrome section="projects" index={idx} count={resumeData.projects.length} />
                    <div className="break-inside-avoid flex flex-col items-start mb-1" data-rb="entry-header">
                      {renderInput({
                        value: project.projectName,
                        onChange: (value) =>
                          updateField('projects', idx, 'projectName', value),
                        className: 'font-semibold',
                        textColor: 'text-gray-800',
                        ariaLabel: 'Project name',
                      })}
                      {(isEditing || project.link) && (
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
                      className: 'text-sm pl-5 text-justify',
                      textColor: 'text-gray-600',
                      ariaLabel: 'Project description',
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'education' && (isEditing || hasContent(resumeData.education)) && (
            <div>
              <SectionHeader title="Education" />
              <div className="space-y-3">
                {resumeData.education.map((edu, idx) => (
                  <div key={idx} className="relative group/entry pb-3 last:pb-0" data-rb="entry" data-rbkey={`e:education:${idx}`}><EntryChrome section="education" index={idx} count={resumeData.education.length} />
                    <div className="break-inside-avoid" data-rb="entry-header">
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
                        {((isEditing && (edu.startDate || edu.endDate)) || (edu.startDate && edu.endDate)) && <span>-</span>}
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
                    </div>
                    {(isEditing || edu.gpa) && (
                      <div className="text-sm text-gray-600">
                        GPA:{' '}
                        {renderInput({
                          value: edu.gpa || '',
                          onChange: (value) => updateField('education', idx, 'gpa', value),
                          className: 'inline-block',
                          textColor: 'text-gray-600',
                          ariaLabel: 'GPA',
                        })}
                      </div>
                    )}
                    {(isEditing || edu.description) && (
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

          {section === 'skills' && (isEditing || hasContent(resumeData.skills)) && (
            <div>
              <SectionHeader title="Skills" />
              <div className="space-y-1">
                {resumeData.skills.map((skill, idx) => (
                  <div key={idx} className="relative group/entry break-inside-avoid" data-rbkey={`e:skills:${idx}`}><EntryChrome section="skills" index={idx} count={resumeData.skills.length} />
                    {isEditing && (
                      <div className="absolute right-0 top-0 z-10">
                        <SkillTypeToggle type={skill.skillType} onChange={(t) => updateField('skills', idx, 'skillType', t)} />
                      </div>
                    )}
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

          {section === 'certifications' && (isEditing || hasContent(resumeData.certifications)) && (
            <div>
              <SectionHeader title="Certifications" />
              <div className="space-y-2">
                {resumeData.certifications.map((cert, idx) => (
                  <div key={idx} className="relative group/entry break-inside-avoid" data-rbkey={`e:certifications:${idx}`}><EntryChrome section="certifications" index={idx} count={resumeData.certifications.length} />
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

          {section === 'languages' && (isEditing || hasContent(resumeData.languages)) && (
            <div>
              <SectionHeader title="Languages" />
              <div className="space-y-1">
                {resumeData.languages.map((language, idx) => (
                  <div key={idx} className="relative group/entry break-inside-avoid text-sm flex items-center gap-2" data-rbkey={`e:languages:${idx}`}><EntryChrome section="languages" index={idx} count={resumeData.languages.length} />
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

          {section === 'customSections' && (isEditing || hasContent(resumeData.customSections)) && (
            <div>
               {resumeData.customSections.map((custom, idx) => (
                <div key={idx} className="relative group/entry mb-4 last:mb-0" data-rb="entry" data-rbkey={`e:customSections:${idx}`}><EntryChrome section="customSections" index={idx} count={resumeData.customSections.length} />
                  <div className="break-inside-avoid" data-rb="entry-header">
                    <SectionHeader title={custom.sectionTitle} />
                  </div>
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
        </EditableSection>
      ))}
    </div>
  );
}