"use client";
import { useMemo } from 'react';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import { FaLinkedin, FaGithub } from 'react-icons/fa6';
import { lightenColor } from '@/lib/utils';
import type { TemplateProps } from './types';
import { useRenderInput, PhotoField, SkillTypeToggle } from '@/components/resume/editor/fields';
import { EditableSection, EntryChrome } from '@/components/resume/editor/chrome';

const SIDEBAR_SECTIONS = ['skills', 'languages', 'certifications'];

// Two-column template: accent sidebar with contact/skills, main column with experience.
// Module scope on purpose: an inline definition makes React remount headers
// every render, wiping the paginator's margin spacers.
const SidebarHeader = ({ title, color }: { title: string; color: string }) => (
  <h2
    data-rb="header"
    className="text-xs font-bold uppercase tracking-[0.15em] mb-2 mt-4 first:mt-0"
    style={{ color }}
  >
    {title}
  </h2>
);

const MainHeader = ({ title, color }: { title: string; color: string }) => (
  <h2
    data-rb="header"
    className="text-base font-bold uppercase tracking-wide border-b-2 pb-1 mb-2"
    style={{ color, borderColor: color }}
  >
    {title}
  </h2>
);

export function SidebarTemplate({
  resumeData,
  isEditing,
  updateField,
  accentColor = '#155e75',
  fontFamily = 'Lato',
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
  const sidebarBg = useMemo(() => lightenColor(accentColor, 92), [accentColor]);


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

  const sidebarOrder = sectionOrder.filter((s) => SIDEBAR_SECTIONS.includes(s));
  const mainOrder = sectionOrder.filter((s) => !SIDEBAR_SECTIONS.includes(s));

  const contact = resumeData.personalDetails;

  return (
    <div className="w-full mx-auto bg-white text-gray-800 text-[13px] leading-snug flex items-stretch" style={{ fontFamily }}>
      {/* Print-only fixed background to guarantee the sidebar color spans all pages without flex layout bugs */}
      <div className="hidden print:block fixed inset-y-0 left-0 w-[34%] -z-10" style={{ backgroundColor: sidebarBg }} />
      
      {/* Sidebar — in the EDITOR, negative vertical margins bleed the accent
          column up/down into the sheet's margin band so it looks edge-to-edge;
          in PRINT the page has zero margins (the fixed background above covers
          the full page), so no bleed — it would clip the top padding instead. */}
      <div
        className="w-[34%]"
        style={{
          backgroundColor: sidebarBg,
          marginTop: isPrint ? undefined : customMargins ? `-${customMargins.top}px` : '-36px',
          marginBottom: isPrint ? undefined : customMargins ? `-${customMargins.bottom}px` : '-36px',
          paddingTop: customMargins ? `${customMargins.top}px` : '36px',
          paddingBottom: customMargins ? `${customMargins.bottom}px` : '36px',
          paddingLeft: customMargins ? `${customMargins.left}px` : '1.25rem',
          paddingRight: customMargins ? `${customMargins.right}px` : '1.25rem',
        }}
      >
        {showPhoto && (
          <div className="mb-3 flex justify-center">
            <PhotoField
              value={contact.photo}
              isEditing={isEditing}
              show={showPhoto}
              onChange={(v) => updateField('personalDetails', null, 'photo', v)}
              className="h-24 w-24"
            />
          </div>
        )}
        <h1 className="text-2xl font-bold leading-tight mb-1" style={{ color: accentColor }}>
          {renderInput({
            value: contact.fullName,
            onChange: (v) => updateField('personalDetails', null, 'fullName', v),
            ariaLabel: 'Full name',
          })}
        </h1>
        {(isEditing || resumeData.jobTitle) && (
          <div className="text-sm text-gray-600 mb-4">
            {renderInput({
              value: resumeData.jobTitle,
              onChange: (v) => updateField('jobTitle', null, 'jobTitle', v),
              ariaLabel: 'Job title',
            })}
          </div>
        )}

        <SidebarHeader color={accentColor} title="Contact" />
        <div className="space-y-1.5 text-xs text-gray-700">
          {(isEditing || contact.email) && (
            <div className="flex items-start gap-1.5">
              {showIcons && <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: accentColor }} />}
              {renderInput({
                value: contact.email,
                onChange: (v) => updateField('personalDetails', null, 'email', v),
                type: 'mail',
                className: 'break-all',
                ariaLabel: 'Email',
              })}
            </div>
          )}
          {(isEditing || contact.phone) && (
            <div className="flex items-start gap-1.5">
              {showIcons && <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: accentColor }} />}
              {renderInput({
                value: contact.phone,
                onChange: (v) => updateField('personalDetails', null, 'phone', v),
                type: 'phone',
                ariaLabel: 'Phone',
              })}
            </div>
          )}
          {(isEditing || contact.location) && (
            <div className="flex items-start gap-1.5">
              {showIcons && <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: accentColor }} />}
              {renderInput({
                value: contact.location,
                onChange: (v) => updateField('personalDetails', null, 'location', v),
                ariaLabel: 'Location',
              })}
            </div>
          )}
          {(isEditing || contact.linkedin) && (
            <div className="flex items-start gap-1.5">
              {showIcons && <FaLinkedin className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: accentColor }} />}
              {renderInput({
                value: contact.linkedin,
                onChange: (v) => updateField('personalDetails', null, 'linkedin', v),
                type: 'link',
                ariaLabel: 'LinkedIn',
              })}
            </div>
          )}
          {(isEditing || contact.github) && (
            <div className="flex items-start gap-1.5">
              {showIcons && <FaGithub className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: accentColor }} />}
              {renderInput({
                value: contact.github,
                onChange: (v) => updateField('personalDetails', null, 'github', v),
                type: 'link',
                ariaLabel: 'GitHub',
              })}
            </div>
          )}
          {(isEditing || contact.website) && (
            <div className="flex items-start gap-1.5">
              {showIcons && <Globe className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: accentColor }} />}
              {renderInput({
                value: contact.website,
                onChange: (v) => updateField('personalDetails', null, 'website', v),
                type: 'link',
                ariaLabel: 'Website',
              })}
            </div>
          )}
        </div>

        {sidebarOrder.map((section) => (
          <EditableSection key={section} id={section} className="mt-4 empty:hidden">
            {section === 'skills' && (isEditing || hasContent(resumeData.skills)) && (
              <div>
                <SidebarHeader color={accentColor} title="Skills" />
                <div className="space-y-1.5 text-xs">
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
                          <div className="font-semibold" style={{ color: accentColor }}>
                            {renderInput({
                              value: skill.category,
                              onChange: (v) => updateField('skills', index, 'category', v),
                              ariaLabel: 'Skill category',
                            })}
                          </div>
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

            {section === 'languages' && (isEditing || hasContent(resumeData.languages)) && (
              <div>
                <SidebarHeader color={accentColor} title="Languages" />
                <div className="space-y-1 text-xs">
                  {resumeData.languages.map((language, index) => (
                    <div key={index} className="relative group/entry flex justify-between break-inside-avoid" data-rbkey={`e:languages:${index}`}><EntryChrome section="languages" index={index} count={resumeData.languages.length} />
                      <span className="font-semibold">
                        {renderInput({
                          value: language.language,
                          onChange: (v) => updateField('languages', index, 'language', v),
                          ariaLabel: 'Language',
                        })}
                      </span>
                      <span className="text-gray-600">
                        {renderInput({
                          value: language.proficiency,
                          onChange: (v) => updateField('languages', index, 'proficiency', v),
                          ariaLabel: 'Proficiency',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section === 'certifications' && (isEditing || hasContent(resumeData.certifications)) && (
              <div>
                <SidebarHeader color={accentColor} title="Certifications" />
                <div className="space-y-1.5 text-xs">
                  {resumeData.certifications.map((cert, index) => (
                    <div key={index} className="relative group/entry break-inside-avoid" data-rbkey={`e:certifications:${index}`}><EntryChrome section="certifications" index={index} count={resumeData.certifications.length} />
                      <div className="font-semibold">
                        {renderInput({
                          value: cert.certificationName,
                          onChange: (v) => updateField('certifications', index, 'certificationName', v),
                          ariaLabel: 'Certification',
                        })}
                      </div>
                      <div className="text-gray-600">
                        {renderInput({
                          value: cert.issuingOrganization,
                          onChange: (v) => updateField('certifications', index, 'issuingOrganization', v),
                          ariaLabel: 'Issuing organization',
                        })}
                        {(isEditing || cert.issueDate) && <span> · </span>}
                        {renderInput({
                          value: cert.issueDate,
                          onChange: (v) => updateField('certifications', index, 'issueDate', v),
                          type: 'date',
                          ariaLabel: 'Issue date',
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </EditableSection>
        ))}
      </div>

      {/* Main column */}
      <div 
        className="w-[66%]"
        style={{
          paddingTop: customMargins ? `${customMargins.top}px` : '36px',
          paddingBottom: customMargins ? `${customMargins.bottom}px` : '36px',
          paddingLeft: customMargins ? `${customMargins.left}px` : '1.5rem',
          paddingRight: customMargins ? `${customMargins.right}px` : '1.5rem',
        }}
      >
        {mainOrder.map((section) => (
          <EditableSection key={section} id={section} className="mb-4 empty:hidden">
            {section === 'objective' && (isEditing || hasContent(resumeData.objective)) && (
              <div>
                <MainHeader color={accentColor} title="Profile" />
                <div className="text-justify text-gray-700">
                  {renderInput({
                    value: resumeData.objective,
                    onChange: (v) => updateField('objective', null, 'objective', v),
                    multiline: true,
                    ariaLabel: 'Profile summary',
                  })}
                </div>
              </div>
            )}

            {section === 'workExperience' && (isEditing || hasContent(resumeData.workExperience)) && (
              <div>
                <MainHeader color={accentColor} title="Experience" />
                {resumeData.workExperience.map((exp, index) => (
                  <div key={index} className="relative group/entry mb-3 last:mb-0" data-rb="entry" data-rbkey={`e:workExperience:${index}`}><EntryChrome section="workExperience" index={index} count={resumeData.workExperience.length} />
                    <div className="break-inside-avoid" data-rb="entry-header">
                      <div className="flex justify-between items-baseline">
                      <span className="font-bold" style={{ color: accentColor }}>
                        {renderInput({
                          value: exp.jobTitle,
                          onChange: (v) => updateField('workExperience', index, 'jobTitle', v),
                          ariaLabel: 'Job title',
                        })}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap ml-2">
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
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      {renderInput({
                        value: exp.companyName,
                        onChange: (v) => updateField('workExperience', index, 'companyName', v),
                        ariaLabel: 'Company',
                      })}
                      {(isEditing || exp.location) && (
                        <>
                          {' · '}
                          {renderInput({
                            value: exp.location,
                            onChange: (v) => updateField('workExperience', index, 'location', v),
                            className: 'inline-block',
                            ariaLabel: 'Location',
                          })}
                        </>
                      )}
                    </div>
                    </div>
                    <div className="text-gray-700 mt-0.5">
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
                <MainHeader color={accentColor} title="Projects" />
                {resumeData.projects.map((project, index) => (
                  <div key={index} className="relative group/entry mb-3 last:mb-0" data-rb="entry" data-rbkey={`e:projects:${index}`}><EntryChrome section="projects" index={index} count={resumeData.projects.length} />
                    <div className="break-inside-avoid flex justify-between items-baseline" data-rb="entry-header">
                      <span className="font-bold" style={{ color: accentColor }}>
                        {renderInput({
                          value: project.projectName,
                          onChange: (v) => updateField('projects', index, 'projectName', v),
                          ariaLabel: 'Project name',
                        })}
                      </span>
                      {(isEditing || project.link) && (
                        <span className="text-xs ml-2" style={{ color: accentColor }}>
                          {renderInput({
                            value: project.link,
                            onChange: (v) => updateField('projects', index, 'link', v),
                            type: 'link',
                            ariaLabel: 'Project link',
                          })}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-700 mt-0.5">
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
                <MainHeader color={accentColor} title="Education" />
                {resumeData.education.map((edu, index) => (
                  <div key={index} className="relative group/entry mb-2 last:mb-0" data-rb="entry" data-rbkey={`e:education:${index}`}><EntryChrome section="education" index={index} count={resumeData.education.length} />
                    <div className="break-inside-avoid" data-rb="entry-header">
                      <div className="flex justify-between items-baseline">
                      <span className="font-bold" style={{ color: accentColor }}>
                        {renderInput({
                          value: edu.degree,
                          onChange: (v) => updateField('education', index, 'degree', v),
                          ariaLabel: 'Degree',
                        })}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap ml-2">
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
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {renderInput({
                        value: edu.institution,
                        onChange: (v) => updateField('education', index, 'institution', v),
                        ariaLabel: 'Institution',
                      })}
                      {(isEditing || edu.location) && (
                        <>
                          {' · '}
                          {renderInput({
                            value: edu.location,
                            onChange: (v) => updateField('education', index, 'location', v),
                            className: 'inline-block',
                            ariaLabel: 'Location',
                          })}
                        </>
                      )}
                    </div>
                    </div>
                    {(isEditing || edu.gpa) && (
                      <div className="text-xs text-gray-600">
                        GPA:{' '}
                        {renderInput({
                          value: edu.gpa || '',
                          onChange: (v) => updateField('education', index, 'gpa', v),
                          ariaLabel: 'GPA',
                        })}
                      </div>
                    )}
                    {(isEditing || edu.description) && (
                      <div className="text-xs text-gray-700">
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

            {section === 'customSections' && (isEditing || hasContent(resumeData.customSections)) && (
              <div>
                {resumeData.customSections.map((custom, idx) => (
                  <div key={idx} className="relative group/entry mb-3 last:mb-0" data-rb="entry" data-rbkey={`e:customSections:${idx}`}><EntryChrome section="customSections" index={idx} count={resumeData.customSections.length} />
                    <div className="break-inside-avoid" data-rb="entry-header">
                      <MainHeader color={accentColor} title={custom.sectionTitle} />
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
    </div>
  );
}
