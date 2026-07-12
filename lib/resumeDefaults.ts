import type { ResumeData } from '@/components/resume/templates/types';

/**
 * Blank resume used by "start from scratch". Empty strings render as gray
 * placeholders in the editor and print as nothing.
 */
export const EMPTY_RESUME: ResumeData = {
  personalDetails: {
    fullName: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    website: '',
    location: '',
  },
  jobTitle: '',
  objective: '',
  workExperience: [
    { jobTitle: '', companyName: '', location: '', startDate: '', endDate: '', description: '' },
  ],
  education: [
    { degree: '', institution: '', location: '', startDate: '', endDate: '', gpa: '', description: '' },
  ],
  skills: [
    { skillType: 'group', category: '', skills: '', skill: '' },
    { skillType: 'group', category: '', skills: '', skill: '' },
  ],
  projects: [{ projectName: '', description: '', link: '' }],
  languages: [{ language: '', proficiency: '' }],
  certifications: [{ certificationName: '', issuingOrganization: '', issueDate: '' }],
  customSections: [],
};

/** Merge AI-imported data over the empty shape so every key exists. */
export function normalizeImportedResume(data: Partial<ResumeData>): ResumeData {
  const arr = <T,>(v: T[] | undefined, fallback: T[]): T[] =>
    Array.isArray(v) && v.length > 0 ? v : fallback;
  return {
    personalDetails: { ...EMPTY_RESUME.personalDetails, ...(data.personalDetails || {}) },
    jobTitle: data.jobTitle || '',
    objective: data.objective || '',
    workExperience: arr(data.workExperience, EMPTY_RESUME.workExperience),
    education: arr(data.education, EMPTY_RESUME.education),
    skills: arr(data.skills, EMPTY_RESUME.skills),
    projects: arr(data.projects, EMPTY_RESUME.projects),
    languages: arr(data.languages, EMPTY_RESUME.languages),
    certifications: arr(data.certifications, EMPTY_RESUME.certifications),
    customSections: Array.isArray(data.customSections) ? data.customSections : [],
  };
}
