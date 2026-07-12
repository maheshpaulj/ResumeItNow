// Single source of truth lives in the templates module; re-export so the editor
// and templates share one ResumeData type (avoids duplicate-type mismatches).
export type {
  PersonalDetails,
  WorkExperience,
  Education,
  Project,
  Language,
  Certification,
  CustomSection,
  ResumeData,
} from '@/components/resume/templates/types';
