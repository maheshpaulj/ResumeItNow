"use client";
import type { TemplateProps } from './types';
import { useRenderInput, PhotoField, SkillTypeToggle } from '@/components/resume/editor/fields';
import { EditableSection, EntryChrome } from '@/components/resume/editor/chrome';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import { FaLinkedin, FaGithub } from 'react-icons/fa6';

const contactIcons = {
  location: MapPin,
  phone: Phone,
  email: Mail,
  linkedin: FaLinkedin,
  github: FaGithub,
  website: Globe,
};

// Dense, ATS-friendly single-column template with uppercase rule headers.
// Module scope on purpose: an inline definition makes React remount headers
// every render, wiping the paginator's margin spacers.
const SectionHeader = ({ title, color }: { title: string; color: string }) => (
  <h2
    data-rb="header"
    className="text-[13px] font-bold uppercase tracking-[0.15em] border-b pb-0.5 mb-2"
    style={{ color, borderColor: color }}
  >
    {title}
  </h2>
);

export function CompactTemplate({
  resumeData,
  isEditing,
  updateField,
  accentColor = '#1f2937',
  fontFamily = 'Georgia',
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
  showIcons = true,
  showPhoto = false,
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

  const renderInput = useRenderInput(isEditing);

  const hasContent = (section: unknown): boolean => {
    if (!section) return false;
    if (Array.isArray(section)) return section.length > 0;
    if (typeof section === 'object') {
      return Object.values(section as object).some((v) =>
        typeof v === 'string' ? v.trim() !== '' : Boolean(v)
      );
    }
    return typeof section === 'string' ? section.trim() !== '' : Boolean(section);
  };

  return (
    <div 
      className="w-full mx-auto bg-white text-gray-800 text-[13px] leading-snug" 
      style={{ 
        fontFamily,
        paddingTop: customMargins ? `${customMargins.top}px` : '1.5rem',
        paddingBottom: customMargins ? `${customMargins.bottom}px` : '1.5rem',
        paddingLeft: customMargins ? `${customMargins.left}px` : '2rem',
        paddingRight: customMargins ? `${customMargins.right}px` : '2rem',
      }}
    >
      {/* Header */}
      <div className="text-center mb-4">
        {showPhoto && (
          <div className="mb-2 flex justify-center">
            <PhotoField
              value={resumeData.personalDetails.photo}
              isEditing={isEditing}
              show={showPhoto}
              onChange={(v) => updateField('personalDetails', null, 'photo', v)}
              className="h-20 w-20"
            />
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-wide" style={{ color: accentColor }}>
          {renderInput({
            value: resumeData.personalDetails.fullName,
            onChange: (v) => updateField('personalDetails', null, 'fullName', v),
            ariaLabel: 'Full name',
          })}
        </h1>
        {(isEditing || resumeData.jobTitle) && (
          <div className="text-sm text-gray-600">
            {renderInput({
              value: resumeData.jobTitle,
              onChange: (v) => updateField('jobTitle', null, 'jobTitle', v),
              ariaLabel: 'Job title',
            })}
          </div>
        )}
        <div className="mt-1 text-xs text-gray-600 flex flex-wrap justify-center items-center gap-x-3 gap-y-1">
          {([
            ['location', 'Location', ''],
            ['phone', 'Phone', 'phone'],
            ['email', 'Email', 'mail'],
          ] as const).map(([field, label, type]) => {
            if (!isEditing && !resumeData.personalDetails[field]) return null;
            const Icon = contactIcons[field];
            return (
              <span key={field} className="inline-flex items-center gap-1">
                {showIcons && Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-gray-500" />}
                {renderInput({
                  value: resumeData.personalDetails[field] || '',
                  onChange: (v) => updateField('personalDetails', null, field, v),
                  type,
                  ariaLabel: label,
                })}
              </span>
            );
          })}
        </div>
        <div className="mt-1 text-xs flex flex-wrap justify-center gap-x-4 gap-y-1" style={{ color: accentColor }}>
          {([
            ['linkedin', 'LinkedIn'],
            ['github', 'GitHub'],
            ['website', 'Website'],
          ] as const).map(([field, label]) => {
            if (!isEditing && !resumeData.personalDetails[field]) return null;
            const Icon = contactIcons[field];
            return (
              <span key={field} className="inline-flex items-center gap-1">
                {showIcons && Icon && <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: accentColor }} />}
                {renderInput({
                  value: resumeData.personalDetails[field] || '',
                  onChange: (v) => updateField('personalDetails', null, field, v),
                  className: 'break-all',
                  type: 'link',
                  ariaLabel: label,
                })}
              </span>
            );
          })}
        </div>
      </div>

      {sectionOrder.map((section) => (
        <EditableSection key={section} id={section} className="mb-3 empty:hidden">
          {section === 'objective' && (isEditing || hasContent(resumeData.objective)) && (
            <div>
              <SectionHeader color={accentColor} title="Summary" />
              <div className="text-justify">
                {renderInput({
                  value: resumeData.objective,
                  onChange: (v) => updateField('objective', null, 'objective', v),
                  multiline: true,
                  ariaLabel: 'Summary',
                })}
              </div>
            </div>
          )}

          {section === 'workExperience' && (isEditing || hasContent(resumeData.workExperience)) && (
            <div>
              <SectionHeader color={accentColor} title="Experience" />
              {resumeData.workExperience.map((exp, index) => (
                <div key={index} className="relative group/entry mb-2 last:mb-0" data-rb="entry" data-rbkey={`e:workExperience:${index}`}><EntryChrome section="workExperience" index={index} count={resumeData.workExperience.length} />
                  <div className="break-inside-avoid flex justify-between items-baseline" data-rb="entry-header">
                    <div className="font-semibold">
                      {renderInput({
                        value: exp.jobTitle,
                        onChange: (v) => updateField('workExperience', index, 'jobTitle', v),
                        ariaLabel: 'Job title',
                      })}
                      <span className="font-normal text-gray-600">
                        {' '}—{' '}
                        {renderInput({
                          value: exp.companyName,
                          onChange: (v) => updateField('workExperience', index, 'companyName', v),
                          ariaLabel: 'Company',
                        })}
                        {(isEditing || exp.location) && (
                          <>
                            {', '}
                            {renderInput({
                              value: exp.location,
                              onChange: (v) => updateField('workExperience', index, 'location', v),
                              className: 'inline-block',
                              ariaLabel: 'Location',
                            })}
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap ml-2">
                      {renderInput({
                        value: exp.startDate,
                        onChange: (v) => updateField('workExperience', index, 'startDate', v),
                        type: 'date',
                        ariaLabel: 'Start date',
                      })}
                      {((isEditing && (exp.startDate || exp.endDate)) || (exp.startDate && exp.endDate)) && <span>–</span>}
                      {renderInput({
                        value: exp.endDate,
                        onChange: (v) => updateField('workExperience', index, 'endDate', v),
                        type: 'date',
                        allowPresent: true,
                        ariaLabel: 'End date',
                      })}
                    </div>
                  </div>
                  <div className="text-gray-700">
                    {renderInput({
                      value: exp.description,
                      onChange: (v) => updateField('workExperience', index, 'description', v),
                      multiline: true,
                      ariaLabel: 'Description',
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'projects' && (isEditing || hasContent(resumeData.projects)) && (
            <div>
              <SectionHeader color={accentColor} title="Projects" />
              {resumeData.projects.map((project, index) => (
                <div key={index} className="relative group/entry mb-2 last:mb-0" data-rb="entry" data-rbkey={`e:projects:${index}`}><EntryChrome section="projects" index={index} count={resumeData.projects.length} />
                  <div className="break-inside-avoid flex justify-between items-baseline" data-rb="entry-header">
                    <div className="flex items-baseline gap-1.5 min-w-0">
                      <span className="font-bold" style={{ color: accentColor }}>
                        {renderInput({
                          value: project.projectName,
                          onChange: (v) => updateField('projects', index, 'projectName', v),
                          ariaLabel: 'Project name',
                        })}
                      </span>
                      {(isEditing || (project as unknown as Record<string, string>).techStack) && (
                        <span className="text-xs text-gray-500 truncate">
                          {'| '}
                          {renderInput({
                            value: (project as unknown as Record<string, string>).techStack || '',
                            onChange: (v) => updateField('projects', index, 'techStack', v),
                            ariaLabel: 'Tech stack',
                          })}
                        </span>
                      )}
                    </div>
                    {(isEditing || project.link) && (
                      <span className="text-xs ml-2 shrink-0" style={{ color: accentColor }}>
                        {renderInput({
                          value: project.link,
                          onChange: (v) => updateField('projects', index, 'link', v),
                          type: 'link',
                          ariaLabel: 'Project link',
                        })}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-600 text-[12.5px]">
                    {renderInput({
                      value: project.description,
                      onChange: (v) => updateField('projects', index, 'description', v),
                      multiline: true,
                      ariaLabel: 'Project description',
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'education' && (isEditing || hasContent(resumeData.education)) && (
            <div>
              <SectionHeader color={accentColor} title="Education" />
              {resumeData.education.map((edu, index) => (
                <div key={index} className="relative group/entry mb-1.5 last:mb-0" data-rb="entry" data-rbkey={`e:education:${index}`}><EntryChrome section="education" index={index} count={resumeData.education.length} />
                  <div className="break-inside-avoid flex justify-between items-start" data-rb="entry-header">
                    <div>
                      <span className="font-semibold">
                        {renderInput({
                          value: edu.degree,
                          onChange: (v) => updateField('education', index, 'degree', v),
                          ariaLabel: 'Degree',
                        })}
                      </span>
                      <span className="text-gray-600">
                        {' '}—{' '}
                        {renderInput({
                          value: edu.institution,
                          onChange: (v) => updateField('education', index, 'institution', v),
                          ariaLabel: 'Institution',
                        })}
                        {(isEditing || edu.location) && (
                          <>
                            {', '}
                            {renderInput({
                              value: edu.location,
                              onChange: (v) => updateField('education', index, 'location', v),
                              className: 'inline-block',
                              ariaLabel: 'Location',
                            })}
                          </>
                        )}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap ml-2 text-right shrink-0">
                      <div className="flex items-center gap-1">
                        {renderInput({
                          value: edu.startDate,
                          onChange: (v) => updateField('education', index, 'startDate', v),
                          type: 'date',
                          ariaLabel: 'Start date',
                        })}
                        {((isEditing && (edu.startDate || edu.endDate)) || (edu.startDate && edu.endDate)) && <span>–</span>}
                        {renderInput({
                          value: edu.endDate,
                          onChange: (v) => updateField('education', index, 'endDate', v),
                          type: 'date',
                          allowPresent: true,
                          ariaLabel: 'End date',
                        })}
                      </div>
                      {(isEditing || edu.gpa) && (
                        <div className="text-gray-500">
                          GPA:{' '}
                          {renderInput({
                            value: edu.gpa || '',
                            onChange: (v) => updateField('education', index, 'gpa', v),
                            ariaLabel: 'GPA',
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  {(isEditing || edu.description) && (
                    <div className="text-gray-700 text-xs">
                      {renderInput({
                        value: edu.description,
                        onChange: (v) => updateField('education', index, 'description', v),
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
              <SectionHeader color={accentColor} title="Skills" />
              <div className="space-y-0.5">
                {resumeData.skills.map((skill, index) => (
                  <div key={index} className="relative group/entry break-inside-avoid" data-rbkey={`e:skills:${index}`}><EntryChrome section="skills" index={index} count={resumeData.skills.length} />
                    {isEditing && (
                      <div className="absolute right-0 top-0 z-10">
                        <SkillTypeToggle type={skill.skillType} onChange={(t) => updateField('skills', index, 'skillType', t)} />
                      </div>
                    )}
                    {skill.skillType === 'individual' ? (
                      renderInput({
                        value: skill.skill,
                        onChange: (v) => updateField('skills', index, 'skill', v),
                        className: 'font-semibold',
                        ariaLabel: 'Skill',
                      })
                    ) : (
                      <div>
                        <span className="font-semibold">
                          {renderInput({
                            value: skill.category,
                            onChange: (v) => updateField('skills', index, 'category', v),
                            ariaLabel: 'Skill category',
                          })}
                        </span>
                        <span>: </span>
                        {renderInput({
                          value: skill.skills,
                          onChange: (v) => updateField('skills', index, 'skills', v),
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
              <SectionHeader color={accentColor} title="Certifications" />
              {resumeData.certifications.map((cert, index) => (
                <div key={index} className="relative group/entry flex justify-between items-baseline mb-1 last:mb-0 break-inside-avoid" data-rbkey={`e:certifications:${index}`}><EntryChrome section="certifications" index={index} count={resumeData.certifications.length} />
                  <div>
                    <span className="font-semibold">
                      {renderInput({
                        value: cert.certificationName,
                        onChange: (v) => updateField('certifications', index, 'certificationName', v),
                        ariaLabel: 'Certification',
                      })}
                    </span>
                    <span className="text-gray-600">
                      {' '}—{' '}
                      {renderInput({
                        value: cert.issuingOrganization,
                        onChange: (v) => updateField('certifications', index, 'issuingOrganization', v),
                        ariaLabel: 'Issuing organization',
                      })}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {renderInput({
                      value: cert.issueDate,
                      onChange: (v) => updateField('certifications', index, 'issueDate', v),
                      type: 'date',
                      ariaLabel: 'Issue date',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {section === 'languages' && (isEditing || hasContent(resumeData.languages)) && (
            <div>
              <SectionHeader color={accentColor} title="Languages" />
              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                {resumeData.languages.map((language, index) => (
                  <span key={index} className="relative group/entry break-inside-avoid"><EntryChrome section="languages" index={index} count={resumeData.languages.length} />
                    <span className="font-semibold">
                      {renderInput({
                        value: language.language,
                        onChange: (v) => updateField('languages', index, 'language', v),
                        ariaLabel: 'Language',
                      })}
                    </span>
                    {(isEditing || language.proficiency) && (
                      <span className="text-gray-600">
                        {' '}(
                        {renderInput({
                          value: language.proficiency,
                          onChange: (v) => updateField('languages', index, 'proficiency', v),
                          ariaLabel: 'Proficiency',
                        })}
                        )
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {section === 'customSections' && (isEditing || hasContent(resumeData.customSections)) && (
            <div>
              {resumeData.customSections.map((custom, idx) => (
                <div key={idx} className="relative group/entry mb-2 last:mb-0" data-rb="entry" data-rbkey={`e:customSections:${idx}`}><EntryChrome section="customSections" index={idx} count={resumeData.customSections.length} />
                  <div className="break-inside-avoid" data-rb="entry-header">
                    <SectionHeader color={accentColor} title={custom.sectionTitle} />
                  </div>
                  <div className="text-gray-700">
                    {renderInput({
                      value: custom.content,
                      onChange: (v) => updateField('customSections', idx, 'content', v),
                      multiline: true,
                      ariaLabel: custom.sectionTitle,
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </EditableSection>
      ))}
    </div>
  );
}
