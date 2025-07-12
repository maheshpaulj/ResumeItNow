export interface PersonalDetails {
    fullName: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    website: string;
    location: string;
  }
  
  export interface WorkExperience {
    jobTitle: string;
    companyName: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  }
  
  export interface Education {
    degree: string;
    institution: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  }
  
  interface Skill {
    skillType?: "group" | "individual";
    category: string;
    skills: string;
    skill: string;
  }
  
  export interface Project {
    projectName: string;
    description: string;
    link: string;
  }
  
  export interface Language {
    language: string;
    proficiency: string;
  }
  
  export interface Certification {
    certificationName: string;
    issuingOrganization: string;
    issueDate: string;
  }

  export interface CustomSection {
    sectionTitle: string;
    content: string;
  }
  
  export interface ResumeData {
    personalDetails: PersonalDetails;
    objective: string;
    jobTitle: string;
    workExperience: WorkExperience[];
    education: Education[];
    skills: Skill[];
    projects: Project[];
    languages: Language[];
    certifications: Certification[];
    customSections: CustomSection[];
    accentColor?: string;
    fontFamily?: string;
    sectionOrder?: string[];
    showIcons?: boolean;
  }

export interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  className?: string;
  link?: boolean;
  isEditing: boolean;
}

export interface TemplateProps {
  resumeData: ResumeData;
  isEditing: boolean;
  updateField: <T extends keyof ResumeData>(
    section: T,
    index: number | null,
    field: string,
    value: string
  ) => void;
}