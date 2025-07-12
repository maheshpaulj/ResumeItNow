import * as z from 'zod';

export const personalInfoSchema = z.object({
  personalDetails: z.object({
    fullName: z.string().min(1, "Full Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must have at least 10 digits"),
    linkedin: z.string().optional().or(z.string().url("Invalid LinkedIn URL")),
    github: z.string().optional().or(z.string().url("Invalid GitHub/Portfolio URL")),
    website: z.string().optional().or(z.string().url("Invalid Website URL")),
    location: z.string().optional(),
  })
});
export const careerObjectiveSchema = z.object({
    objective: z.string().max(500, "Objective must be less than 500 characters").optional(),
  });

export const jobTitleSchema = z.object({
    jobTitle: z.string().max(200, "Job Title must be less than 200 characters").optional(),
  });

  export const workExperienceSchema = z.object({
    workExperience: z.array(z.object({
      jobTitle: z.string().min(1, "Job Title is required"),
      companyName: z.string().min(1, "Company Name is required"),
      location: z.string().optional(),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().optional(),
      description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
    }))
  });

  export const educationSchema = z.object({
    education: z.array(z.object({
      degree: z.string().min(1, "Degree is required"),
      institution: z.string().min(1, "School/University Name is required"),
      location: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().min(1, "End date(or expected) is required"),
      description: z.string().optional(),
    }))
  });

  export const skillsSchema = z.object({
    skillType: z.enum(["group", "individual"]).optional(),
    skills: z.array(
      z.union([
        z.object({
          category: z.string().min(1, "Category name is required"), // Group schema
          skills: z.string().min(1, "Skills are required"),
        }),
        z.object({
          skill: z.string().min(1, "Skill is required"), // Individual schema
        }),
      ])
    ),
  });

  export const projectsSchema = z.object({
    projects: z.array(z.object({
      projectName: z.string().min(1, "Project Name is required"),
      description: z.string().max(1000, "Description must be less than 1000 characters").min(1, "Description is required"),
      link: z.string().optional().or(z.string().url("Invalid URL")),
    }))
  });

  export const languagesSchema = z.object({
    languages: z.array(z.object({
      language: z.string().min(1, "Language is required"),
      proficiency: z.enum(["Basic", "Fluent", "Native"]).optional(),
    }))
  });

  export const certificationsSchema = z.object({
    certifications: z.array(z.object({
      certificationName: z.string().min(1, "Certification Name is required"),
      issuingOrganization: z.string().min(1, "Issuing Organization is required"),
      issueDate: z.string().min(1, "Issue Date is required"),
    }))
  });

  export const customSectionSchema = z.object({
    customSections: z.array(z.object({
      sectionTitle: z.string().min(1, "Section title is required"),
      content: z.string().max(2000, "Content must be less than 2000 characters").optional(),
    }))
  });

  export const steps = [
    { schema: personalInfoSchema, title: "Personal Info" },
    { schema: jobTitleSchema, title: "Job Title" },
    { schema: careerObjectiveSchema, title: "Career Objective" },
    { schema: workExperienceSchema, title: "Work Experience" },
    { schema: projectsSchema, title: "Projects" },
    { schema: educationSchema, title: "Education" },
    { schema: skillsSchema, title: "Skills" },
    { schema: languagesSchema, title: "Languages" },
    { schema: certificationsSchema, title: "Certifications" },
    { schema: customSectionSchema, title: "Custom Sections" },
  ];

  // Utility function to save schema to localStorage
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
export const saveSchemaToLocalStorage = (key: string, schema: z.ZodObject<any>) => {
  try {
    localStorage.setItem(key, JSON.stringify(schema.shape));
  } catch (error) {
    console.error("Failed to save schema to localStorage", error);
  }
};

// Utility function to retrieve schema from localStorage
export const getSchemaFromLocalStorage = (key: string) => {
  try {
    const savedSchema = localStorage.getItem(key);
    return savedSchema ? JSON.parse(savedSchema) : null;
  } catch (error) {
    console.error("Failed to retrieve schema from localStorage", error);
    return null;
  }
};