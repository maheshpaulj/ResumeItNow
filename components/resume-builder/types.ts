export type FormValues = {
    personalDetails: {
      fullName: string;
      email: string;
      phone: string;
      linkedin?: string;
      github?: string;
      website?: string;
      location?: string;
    };
    objective?: string;
    jobTitle?: string;
    workExperience: {
      jobTitle: string;
      companyName: string;
      location?: string;
      startDate: string;
      endDate: string;
      description?: string;
    }[];
    education: {
      degree: string;
      institution: string;
      location?: string;
      startDate?: string;
      endDate: string;
      description?: string;
    }[];
    skills: {
      skillType?: "group" | "individual"; 
      category?: string;
      skills?: string; 
      skill?: string;
    }[];
    projects: {
      projectName: string;
      description: string;
      link?: string;
    }[];
    languages: {
      language: string;
      proficiency?: 'Basic' | 'Fluent' | 'Native';
    }[];
    certifications: {
      certificationName: string;
      issuingOrganization: string;
      issueDate: string;
    }[];
    customSections: {
      sectionTitle: string;
      content: string;
    }[];
  };