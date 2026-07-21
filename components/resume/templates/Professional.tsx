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
    className="text-lg text-black font-semibold mb-3 border-b-2 border-gray-800 break-inside-avoid"
  >
    <h2 className="text-center">{title}</h2>
  </div>
);

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
  // Memoize accentColor directly
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
      <div className="mb-8 break-inside-avoid">
        <div className="flex justify-between w-full gap-4">
          <div className="flex items-center gap-3">
            <PhotoField
              value={resumeData.personalDetails.photo}
              isEditing={isEditing}
              show={showPhoto}
              onChange={(value) => updateField('personalDetails', null, 'photo', value)}
              className="h-20 w-20"
            />
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
          </div>
          <div className="text-right text-sm">
            {(isEditing || resumeData.personalDetails.email) && (
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
            {(isEditing || resumeData.personalDetails.phone) && (
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
            {(isEditing || resumeData.personalDetails.location) && (
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
            {(isEditing || resumeData.personalDetails.linkedin) && (
              <div className="flex items-center gap-1 justify-end">
                {showIcons && <FaLinkedin className="w-4 h-4" style={{ color: colors.accent }} />}
                {renderInput({
                  value: resumeData.personalDetails.linkedin,
                  onChange: (value) => updateField('personalDetails', null, 'linkedin', value),
                  className: 'inline-block text-sm break-all',
                  type: 'link',
                  textColor: 'text-gray-600',
                  ariaLabel: 'LinkedIn profile',
                })}
              </div>
            )}
            {(isEditing || resumeData.personalDetails.github) && (
              <div className="flex items-center gap-1 justify-end">
                {showIcons && <FaGithub className="w-4 h-4" style={{ color: colors.accent }} />}
                {renderInput({
                  value: resumeData.personalDetails.github,
                  onChange: (value) => updateField('personalDetails', null, 'github', value),
                  className: 'inline-block text-sm break-all',
                  type: 'link',
                  textColor: 'text-gray-600',
                  ariaLabel: 'GitHub profile',
                })}
              </div>
            )}
            {(isEditing || resumeData.personalDetails.website) && (
              <div className="flex items-center gap-1 justify-end">
                {showIcons && <Globe className="w-4 h-4" style={{ color: colors.accent }} />}
                {renderInput({
                  value: resumeData.personalDetails.website,
                  onChange: (value) => updateField('personalDetails', null, 'website', value),
                  className: 'inline-block text-sm break-all',
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
        <EditableSection key={section} id={section} className="mb-6 empty:hidden">
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
              {resumeData.workExperience.map((experience, index) => (
                <div
                  key={index}
                  className={`relative group/entry pb-4 ${
                    index !== resumeData.workExperience.length - 1 ? 'mb-4 border-b-2 border-dashed border-gray-800' : ''
                  }`}
                  data-rb="entry"
                  data-rbkey={`e:workExperience:${index}`}><EntryChrome section="workExperience" index={index} count={resumeData.workExperience.length} />
                  <div className="break-inside-avoid" data-rb="entry-header">
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
                        type: 'date',
                        textColor: 'text-gray-600',
                        ariaLabel: 'Start date',
                      })}
                      {((isEditing && (experience.startDate || experience.endDate)) || (experience.startDate && experience.endDate)) && <span>-</span>}
                      {renderInput({
                        value: experience.endDate,
                        onChange: (value) => updateField('workExperience', index, 'endDate', value),
                        type: 'date',
                        allowPresent: true,
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
              <SectionHeader title="Projects" />
              {resumeData.projects.map((project, index) => (
                <div
                  key={index}
                  className={`relative group/entry pb-4 ${
                    index !== resumeData.projects.length - 1 ? 'mb-4 border-b-2 border-dashed border-gray-800' : ''
                  }`}
                  data-rb="entry"
                  data-rbkey={`e:projects:${index}`}><EntryChrome section="projects" index={index} count={resumeData.projects.length} />
                  <div className="break-inside-avoid flex items-center justify-between mb-1" data-rb="entry-header">
                    {renderInput({
                      value: project.projectName,
                      onChange: (value) => updateField('projects', index, 'projectName', value),
                      className: 'font-semibold',
                      textColor: 'text-gray-800',
                      ariaLabel: 'Project name',
                    })}
                    {(isEditing || project.link) && (
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
              <SectionHeader title="Education" />
              {resumeData.education.map((edu, index) => (
                <div key={index} className="relative group/entry mb-4 last:mb-0" data-rb="entry" data-rbkey={`e:education:${index}`}><EntryChrome section="education" index={index} count={resumeData.education.length} />
                  <div className="break-inside-avoid" data-rb="entry-header">
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
                        type: 'date',
                        textColor: 'text-gray-600',
                        ariaLabel: 'Start date',
                      })}
                      {((isEditing && (edu.startDate || edu.endDate)) || (edu.startDate && edu.endDate)) && <span>-</span>}
                      {renderInput({
                        value: edu.endDate,
                        onChange: (value) => updateField('education', index, 'endDate', value),
                        type: 'date',
                        allowPresent: true,
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
                  </div>
                  {(isEditing || edu.gpa) && (
                    <div className="text-sm text-gray-600">
                      GPA:{' '}
                      {renderInput({
                        value: edu.gpa || '',
                        onChange: (value) => updateField('education', index, 'gpa', value),
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
              <SectionHeader title="Skills" />
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

          {section === 'certifications' && (isEditing || hasContent(resumeData.certifications)) && (
            <div>
              <SectionHeader title="Certifications" />
              {resumeData.certifications.map((cert, index) => (
                <div key={index} className="relative group/entry mb-3 last:mb-0 break-inside-avoid" data-rbkey={`e:certifications:${index}`}><EntryChrome section="certifications" index={index} count={resumeData.certifications.length} />
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
                        type: 'date',
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

          {section === 'languages' && (isEditing || hasContent(resumeData.languages)) && (
            <div>
              <SectionHeader title="Languages" />
              <div className="flex flex-col space-y-2">
                {resumeData.languages.map((language, index) => (
                  <div key={index} className="relative group/entry text-sm flex items-center gap-2 p-1 rounded-md break-inside-avoid" data-rbkey={`e:languages:${index}`}><EntryChrome section="languages" index={index} count={resumeData.languages.length} />
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

          {section === 'customSections' && (isEditing || hasContent(resumeData.customSections)) && (
            <div>
              {resumeData.customSections.map((custom, idx) => (
                <div key={idx} className="relative group/entry mb-4" data-rb="entry" data-rbkey={`e:customSections:${idx}`}><EntryChrome section="customSections" index={idx} count={resumeData.customSections.length} />
                  <div className="break-inside-avoid" data-rb="entry-header">
                    <SectionHeader title={custom.sectionTitle} />
                  </div>
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
        </EditableSection>
      ))}
    </div>
  );
}