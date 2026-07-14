"use client";
import { createContext, useContext } from 'react';
import type { ResumeData } from '@/components/resume/templates/types';

export type ArraySection =
  | 'workExperience'
  | 'projects'
  | 'education'
  | 'skills'
  | 'languages'
  | 'certifications'
  | 'customSections';

export const ENTRY_DEFAULTS: Record<ArraySection, object> = {
  workExperience: {
    jobTitle: '',
    companyName: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
  },
  projects: { projectName: '', description: '', link: '' },
  education: {
    degree: '',
    institution: '',
    location: '',
    startDate: '',
    endDate: '',
    gpa: '',
    description: '',
  },
  skills: { skillType: 'group', category: '', skills: '', skill: '' },
  languages: { language: '', proficiency: '' },
  certifications: { certificationName: '', issuingOrganization: '', issueDate: '' },
  customSections: { sectionTitle: '', content: '' },
};

export interface EditorApi {
  /** true when the canvas is interactive (false on the PDF render page) */
  editable: boolean;
  addEntry: (section: ArraySection, afterIndex?: number) => void;
  removeEntry: (section: ArraySection, index: number) => void;
  moveEntry: (section: ArraySection, index: number, direction: -1 | 1) => void;
  hideSection: (section: string) => void;
  moveSection: (section: string, direction: -1 | 1) => void;
  /** the single hovered element key ("e:section:index" or "s:section"); only its
   *  floating controls are shown, so bubbles never stack up */
  activeKey: string | null;
  setActiveKey: (key: string | null) => void;
  /** keys of blocks the user forced a page break after ("e:section:index" | "s:section") */
  pageBreaks: string[];
  toggleBreak: (key: string) => void;
}

const noop = () => {};

export const EditorContext = createContext<EditorApi>({
  editable: false,
  addEntry: noop,
  removeEntry: noop,
  moveEntry: noop,
  hideSection: noop,
  moveSection: noop,
  activeKey: null,
  setActiveKey: noop,
  pageBreaks: [],
  toggleBreak: noop,
});

export const useEditor = () => useContext(EditorContext);

export type { ResumeData };
