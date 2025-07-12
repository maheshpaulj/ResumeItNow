import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { NextResponse } from 'next/server';
import React from 'react';
import { Document, Page, StyleSheet, renderToStream, View, Text, Font } from '@react-pdf/renderer';

interface PersonalDetails {
    fullName: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    website: string;
    location: string;
  }

  interface WorkExperience {
    jobTitle: string;
    companyName: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  }

  interface Education {
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

  interface Project {
    projectName: string;
    description: string;
    link: string;
  }

  interface Language {
    language: string;
    proficiency: string;
  }

  interface Certification {
    certificationName: string;
    issuingOrganization: string;
    issueDate: string;
  }
// Define interfaces
interface ResumeData {
  personalDetails: PersonalDetails;
  objective: string;
  jobTitle: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  languages: Language[];
  certifications: Certification[];
}

Font.register({
    family: 'Open Sans',
    fonts: [
      { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
      { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf', fontWeight: 600 }
    ]
  })

// Create base styles
const minimal = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
  },
  section: {
    marginBottom: 10,
  },
  bold: {
    fontFamily: 'Helvetica-Bold'
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  jobTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  contactInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    fontSize: 10,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 2,
  },
  experienceItem: {
    paddingBottom: 8,
  },
  experienceLastItem: {
    marginBottom: 12,
    borderBottom: 1,
    borderBottomStyle: "dashed",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingBottom: 8
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  companyName: {
    fontFamily: 'Helvetica-Bold'
  },
  dates: {
    color: '#666',
  },
  description: {
    flexDirection: "column",
    fontSize: 10,
    color: '#444',
    lineHeight: 1.5,
    paddingLeft: "12px",
    textAlign: "justify"
  },
  p: {
    flexDirection: "column",
    fontSize: 10,
    color: '#444',
    lineHeight: 1.5,
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
},
skillCategory: {
    fontFamily: 'Helvetica-Bold',
    marginRight: 5,
},
});

const modern = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
  },
  section: {
    marginBottom: 10,
  },
  bold: {
    fontFamily: 'Helvetica-Bold'
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  headerName: {
    display: "flex",
    flexDirection: "row",
    alignContent: "flex-start",
    gap: 8,
  },
  name: {
    fontSize: 24,
    marginBottom: 5,
    fontFamily: "Helvetica-Bold",
    color: "#0e7490"
  },
  jobTitle: {
    fontSize: 12,
    color: '#155e75',
    alignSelf: "center"
  },
  contact: {
    flexDirection: "column",
    gap: 8,
    fontSize: 10,
    justifyContent: "flex-start",
    color: '#666',
  },
  contactInfo: {
    flexDirection: 'row',
    gap: 8
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: "#0e7490",
    paddingBottom: 2,
  },
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6
  },
  border: {
    height: 3,
    flex: 1,
    backgroundColor: "#0e7490",
    marginBottom: 7,
  },
  experienceItem: {
    marginBottom: 8,
  },
  experienceLastItem: {
    marginBottom: 12,
    borderBottom: 1,
    borderBottomStyle: "dashed",
    borderBottomWidth: 1,
    borderBottomColor: "#0891b2",
    paddingBottom: 8
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  companyName: {
    color: "#155e75"
  },
  dates: {
    color: '#155e75',
  },
  description: {
    flexDirection: "column",
    fontSize: 10,
    color: '#444',
    lineHeight: 1.5,
    paddingLeft: "12px",
    textAlign: "justify"
  },
  p: {
    flexDirection: "column",
    fontSize: 10,
    color: '#444',
    lineHeight: 1.5,
  },
  subHeading: {
    fontSize: 12
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  skillCategory: {
      fontFamily: 'Helvetica',
      color: "#155e75",
      marginRight: 2,
  },
});

const professional = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
  },
  section: {
    marginBottom: 10,
  },
  bold: {
    fontFamily: 'Helvetica-Bold'
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  headerName: {
    display: "flex",
    fontFamily: "Helvetica-Bold"
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  jobTitle: {
    fontSize: 12,
    color: '#000',
    marginBottom: 10,
    fontFamily: "Helvetica"
  },
  contactInfo: {
    display: "flex",
    flexDirection: "column",
    fontSize: 10,
    color: '#666',
    alignItems: "flex-end"
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 2,
    textAlign: "center"
  },
  experienceItem: {
    marginBottom: 8,
  },
  experienceLastItem: {
    marginBottom: 12,
    borderBottom: 1,
    borderBottomStyle: "dashed",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingBottom: 8
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  companyName: {
    fontFamily: 'Helvetica-Bold'
  },
  dates: {
    color: '#666',
    fontFamily: "Times-Italic",
  },
  description: {
    flexDirection: "column",
    fontSize: 10,
    color: '#444',
    lineHeight: 1.5,
    paddingLeft: "12px",
    textAlign: "justify"
  },
  p: {
    flexDirection: "column",
    fontSize: 10,
    color: '#444',
    lineHeight: 1.5,
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  skillCategory: {
      fontFamily: 'Helvetica-Bold',
      marginRight: 5,
  },
});

// Helper function to process bold text
const processBoldText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return <Text key={index} style={minimal.bold}>{boldText}</Text>;
    }
    return <Text key={index}>{part}</Text>;
  });
};

const Br = () => "\n";

const renderPDFContent = (content: string | undefined | null) => {
    if (!content) return null;
  
    const lines = content.split('\n');
    
    return lines.map((line, lineIndex) => {
      const trimmedLine = line.trim();
      
      // Handle bullet points
      if (trimmedLine.startsWith('- ')) {
        return (
          <View key={lineIndex} style={{ flexDirection: 'row', marginBottom: 2 }}>
            <Text style={{ width: 10 }}>{lineIndex !== 0 && <Br/>}• </Text>
            <Text style={{ flex: 1 }}>
              {processBoldText(trimmedLine.substring(2))}
            </Text>
          </View>
        );
      }
      
      // Handle normal text with potential bold sections
      return trimmedLine ? (
        <Text key={lineIndex} style={{ marginBottom: 2 }}>
          {processBoldText(trimmedLine)}
        </Text>
      ) : (
        // Empty line - add some spacing
        <Text key={lineIndex} style={{ marginBottom: 4 }}>{' '}</Text>
      );
    });
  };

// Template Components
const MinimalTemplate = ({ resumeData }: { resumeData: ResumeData }) => (
    <Document>
      <Page size="A4" style={minimal.page}>
        {/* Header */}
        <View style={minimal.header}>
          <Text style={minimal.name}>{resumeData.personalDetails.fullName}</Text>
          <Text style={minimal.jobTitle}>{resumeData.jobTitle}</Text>
          <View style={minimal.contactInfo}>
            <Text>{resumeData.personalDetails.email}</Text>
            <Text>{resumeData.personalDetails.phone}</Text>
            <Text>{resumeData.personalDetails.location}</Text>
          </View>
          {(resumeData.personalDetails.linkedin || resumeData.personalDetails.github) && (
            <View style={[minimal.contactInfo, { marginTop: 5 }]}>
              {resumeData.personalDetails.linkedin && (
                <Text style={{ color: '#0077B5' }}>{resumeData.personalDetails.linkedin}</Text>
              )}
              {resumeData.personalDetails.github && (
                <Text style={{ color: '#0077B5' }}>{resumeData.personalDetails.github}</Text>
              )}
            </View>
          )}
        </View>
  
        {/* Professional Summary */}
        {resumeData.objective && (
          <View style={minimal.section}>
            <Text style={minimal.sectionTitle}>Professional Summary</Text>
            <Text style={minimal.p}>{renderPDFContent(resumeData.objective)}</Text>
          </View>
        )}
  
        {/* Work Experience */}
        {resumeData.workExperience.length > 0 && (
          <View style={minimal.section}>
            <Text style={minimal.sectionTitle}>Work Experience</Text>
            {resumeData.workExperience.map((exp, index) => (
              <View key={index} style={index === (resumeData.workExperience.length - 1) ? minimal.experienceItem : minimal.experienceLastItem} wrap={false}>
                <View style={minimal.experienceHeader}>
                  <Text style={minimal.companyName}>{exp.jobTitle}</Text>
                  <Text style={minimal.dates}>{`${exp.startDate} - ${exp.endDate}`}</Text>
                </View>
                <Text>{exp.companyName}</Text>
                <Text style={minimal.description}>{renderPDFContent(exp.description)}</Text>
              </View>
            ))}
          </View>
        )}
  
        {/* Projects Section */}
        {resumeData.projects.length > 0 && (
          <View style={minimal.section}>
            <Text style={minimal.sectionTitle}>Projects</Text>
            {resumeData.projects.map((project, index) => ( 
              <View key={index} style={index === (resumeData.projects.length - 1) ? minimal.experienceItem : minimal.experienceLastItem} wrap={false}>
                <View style={minimal.experienceHeader}>
                  <Text style={minimal.companyName}>{project.projectName}</Text>
                </View>
                {project.link && (
                  <Text style={{ color: '#0077B5', fontSize: 10, marginBottom: 3 }}>
                    {project.link}
                  </Text>
                )}
                <Text style={minimal.description}>{renderPDFContent(project.description)}</Text>
              </View>
            ))}
          </View>
        )}
  
        {/* Education Section */}
        {resumeData.education.length > 0 && (
          <View style={minimal.section} wrap={false}>
            <Text style={minimal.sectionTitle}>Education</Text>
            {resumeData.education.map((edu, index) => (
              <View key={index} style={minimal.experienceItem} wrap={false}>
                <View style={minimal.experienceHeader}>
                  <Text style={minimal.companyName}>{edu.degree}</Text>
                  <Text style={minimal.dates}>{`${edu.startDate} - ${edu.endDate}`}</Text>
                </View>
                <Text>{edu.institution}</Text>
                {edu.description && (
                  <Text style={minimal.p}>{edu.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}
  
        {/* Skills Section */}
        {resumeData.skills.length > 0 && (
          <View style={minimal.section} wrap={false}>
            <Text style={minimal.sectionTitle}>Technical Skills</Text>
            <View style={{ flexDirection: 'column', gap: 5 }}>
              {resumeData.skills.map((skill, index) => (
                <View key={index} style={{ flexDirection: 'row', gap: 5 }}>
                  {skill.skillType === 'individual' ? (
                    <Text style={[minimal.skillCategory, { flex: 1 }]}>{skill.skill}</Text>
                  ) : (
                    <>
                      <Text style={minimal.skillCategory}>{skill.category}:</Text>
                      <Text style={[minimal.p, { flex: 1 }]}>{skill.skills}</Text>
                    </>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
  
        {/* Certifications Section */}
        {resumeData.certifications.length > 0 && (
          <View style={minimal.section}>
            <Text style={minimal.sectionTitle}>Certifications</Text>
            {resumeData.certifications.map((cert, index) => (
              <View key={index} style={minimal.experienceItem}>
                <View style={minimal.experienceHeader}>
                  <Text style={minimal.companyName}>{cert.certificationName}</Text>
                  <Text style={minimal.dates}>{cert.issueDate}</Text>
                </View>
                <Text style={minimal.p}>{cert.issuingOrganization}</Text>
              </View>
            ))}
          </View>
        )}
  
        {/* Languages Section */}
        {resumeData.languages.length > 0 && (
          <View style={minimal.section}>
            <Text style={minimal.sectionTitle}>Languages</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {resumeData.languages.map((lang, index) => (
                <View key={index} style={{ flexDirection: 'row', width: '45%', gap: 5 }}>
                  <Text style={minimal.skillCategory}>{lang.language}:</Text>
                  <Text style={minimal.p}>{lang.proficiency}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );

// Modern Template - Example of another template
const ModernTemplate = ({ resumeData }: { resumeData: ResumeData }) => (
  <Document>
    <Page size="A4" style={modern.page}>
      {/* Header */}
      <View style={modern.header}>
        <View style={modern.headerName}>
          <Text style={modern.name}>{resumeData.personalDetails.fullName}</Text>
          <Text style={modern.jobTitle}>{resumeData.jobTitle}</Text>
        </View>
        <View style={modern.contact}>
          <View style={modern.contactInfo}>
            <Text>{resumeData.personalDetails.email}</Text>
            <Text>{resumeData.personalDetails.phone}</Text>
            <Text>{resumeData.personalDetails.location}</Text>
          </View>
          {(resumeData.personalDetails.linkedin || resumeData.personalDetails.github) && (
            <View style={modern.contactInfo}>
              {resumeData.personalDetails.linkedin && (
                <Text style={{ color: '#0077B5' }}>{resumeData.personalDetails.linkedin}</Text>
              )}
              {resumeData.personalDetails.github && (
                <Text style={{ color: '#0077B5' }}>{resumeData.personalDetails.github}</Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Professional Summary */}
      {resumeData.objective && (
        <View style={modern.section}>
          <View style={modern.row}>
            <Text style={modern.sectionTitle}>Professional Summary</Text>
            <Text style={modern.border}> </Text>
          </View>
          <Text style={modern.p}>{renderPDFContent(resumeData.objective)}</Text>
        </View>
      )}

      {/* Work Experience */}
      {resumeData.workExperience.length > 0 && (
        <View style={modern.section}>
          <View style={modern.row}>
            <Text style={modern.sectionTitle}>Work Experience</Text>
            <Text style={modern.border}> </Text>
          </View>
          {resumeData.workExperience.map((exp, index) => (
            <View key={index} style={index === (resumeData.projects.length - 1) ? modern.experienceItem : modern.experienceLastItem} wrap={false}>
              <View style={modern.experienceHeader}>
                <Text style={modern.bold}>{exp.jobTitle}</Text>
                <Text style={modern.dates}>{`${exp.startDate} - ${exp.endDate}`}</Text>
              </View>
              <Text style={modern.companyName}>{exp.companyName}</Text>
              <Text style={modern.description}>{renderPDFContent(exp.description)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Projects Section */}
      {resumeData.projects.length > 0 && (
        <View style={modern.section}>
          <View style={modern.row}>
            <Text style={modern.sectionTitle}>Projects</Text>
            <Text style={modern.border}> </Text>
          </View>
          {resumeData.projects.map((project, index) => (
            <View key={index} style={index === (resumeData.projects.length - 1) ? modern.experienceItem : modern.experienceLastItem} wrap={false}>
              <View style={modern.experienceHeader}>
                <Text style={modern.companyName}>{project.projectName}</Text>
                {project.link && (
                  <Text style={{ color: '#0077B5', fontSize: 10, fontFamily:"Times-Italic" }}>
                    {project.link}
                  </Text>
                )}
              </View>
              <Text style={modern.description}>{renderPDFContent(project.description)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Education Section */}
      {resumeData.education.length > 0 && (
        <View style={modern.section} wrap={false}>
          <View style={modern.row}>
            <Text style={modern.sectionTitle}>Education</Text>
            <Text style={modern.border}> </Text>
          </View>
          {resumeData.education.map((edu, index) => (
            <View key={index} style={modern.experienceItem} wrap={false}>
              <View style={modern.experienceHeader}>
                <Text style={modern.bold}>{edu.degree}</Text>
                <Text style={modern.dates}>{`${edu.startDate} - ${edu.endDate}`}</Text>
              </View>
              <Text style={modern.companyName}>{edu.institution}</Text>
              {edu.description && (
                <Text style={modern.p}>{edu.description}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Skills Section */}
      {resumeData.skills.length > 0 && (
        <View style={modern.section} wrap={false}>
          <View style={modern.row}>
            <Text style={modern.sectionTitle}>Skills</Text>
            <Text style={modern.border}> </Text>
          </View>
          <View style={{ flexDirection: 'column', gap: 5 }}>
            {resumeData.skills.map((skill, index) => (
              <View key={index} style={{ flexDirection: 'row', gap: 5 }}>
                {skill.skillType === 'individual' ? (
                  <Text style={[modern.skillCategory, { flex: 1 }]}>{skill.skill}</Text>
                ) : (
                  <>
                    <Text style={modern.skillCategory}>{skill.category}:</Text>
                    <Text style={[modern.p, { flex: 1 }]}>{skill.skills}</Text>
                  </>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Certifications Section */}
      {resumeData.certifications.length > 0 && (
        <View style={modern.section}>
          <View style={modern.row}>
            <Text style={modern.sectionTitle}>Certifications</Text>
            <Text style={modern.border}> </Text>
          </View>
          {resumeData.certifications.map((cert, index) => (
            <View key={index} style={modern.experienceItem}>
              <View style={modern.experienceHeader}>
                <Text style={modern.subHeading}>{cert.certificationName}</Text>
                <Text style={modern.dates}>{cert.issueDate}</Text>
              </View>
              <Text style={modern.companyName}>{cert.issuingOrganization}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Languages Section */}
      {resumeData.languages.length > 0 && (
        <View style={modern.section}>
          <View style={modern.row}>
            <Text style={modern.sectionTitle}>Languages</Text>
            <Text style={modern.border}> </Text>
          </View>
          <View style={{ flexDirection: 'column', gap: 5 }}>
            {resumeData.languages.map((lang, index) => (
              <View key={index} style={{ flexDirection: 'row', gap: 2 }}>
                <Text style={modern.skillCategory}>{lang.language}:</Text>
                <Text style={modern.p}>{lang.proficiency}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Page>
  </Document>
);

const ProfessionalTemplate = ({ resumeData }: { resumeData: ResumeData }) => (
  <Document>
    <Page size="A4" style={professional.page}>
      {/* Header */}
      <View style={professional.header}>
        <View style={professional.headerName}>          
          <Text style={professional.name}>{resumeData.personalDetails.fullName}</Text>
          <Text style={professional.jobTitle}>{resumeData.jobTitle}</Text>
        </View>
        <View style={professional.contactInfo}>
          <Text>{resumeData.personalDetails.email}</Text>
          <Text>{resumeData.personalDetails.phone}</Text>
          <Text>{resumeData.personalDetails.location}</Text>
          {(resumeData.personalDetails.linkedin || resumeData.personalDetails.github) && (
          <View style={professional.contactInfo}>
            {resumeData.personalDetails.linkedin && (
              <Text style={{ color: '#0077B5' }}>{resumeData.personalDetails.linkedin}</Text>
            )}
            {resumeData.personalDetails.github && (
              <Text style={{ color: '#0077B5' }}>{resumeData.personalDetails.github}</Text>
            )}
          </View>
        )}
        </View>
      </View>

      {/* Professional Summary */}
      {resumeData.objective && (
        <View style={professional.section}>
          <Text style={professional.sectionTitle}>Professional Summary</Text>
          <Text style={professional.p}>{renderPDFContent(resumeData.objective)}</Text>
        </View>
      )}

      {/* Work Experience */}
      {resumeData.workExperience.length > 0 && (
        <View style={professional.section}>
          <Text style={professional.sectionTitle}>Work Experience</Text>
          {resumeData.workExperience.map((exp, index) => (
            <View key={index} style={index === (resumeData.workExperience.length - 1) ? professional.experienceItem : professional.experienceLastItem} wrap={false}>
              <View style={professional.experienceHeader}>
                <Text style={professional.companyName}>{exp.jobTitle}</Text>
                <Text style={professional.dates}>{`${exp.startDate} - ${exp.endDate}`}</Text>
              </View>
              <Text>{exp.companyName}</Text>
              <Text style={professional.description}>{renderPDFContent(exp.description)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Projects Section */}
      {resumeData.projects.length > 0 && (
        <View style={professional.section}>
          <View wrap={false}>
            <Text style={professional.sectionTitle}>Projects</Text>
            <View key={0} style={0 === (resumeData.projects.length - 1) ? professional.experienceItem : professional.experienceLastItem}>
                <View style={professional.experienceHeader}>
                  <Text style={professional.companyName}>{resumeData.projects[0].projectName}</Text>
                  {resumeData.projects[0].link && (
                    <Text style={{ color: '#0077B5', fontSize: 10, marginBottom: 3, fontFamily: "Times-Italic" }}>
                      {resumeData.projects[0].link}
                    </Text>
                  )}
                </View>
                <Text style={professional.description}>{renderPDFContent(resumeData.projects[0].description)}</Text>
              </View>
          </View>
          {resumeData.projects.map((project, index) => ( index !== 0 &&
            <View key={index} style={index === (resumeData.projects.length - 1) ? professional.experienceItem : professional.experienceLastItem}>
              <View style={professional.experienceHeader}>
                <Text style={professional.companyName}>{project.projectName}</Text>
                {project.link && (
                  <Text style={{ color: '#0077B5', fontSize: 10, marginBottom: 3, fontFamily: "Times-Italic" }}>
                    {project.link}
                  </Text>
                )}
              </View>
              <Text style={professional.description}>{renderPDFContent(project.description)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Education Section */}
      {resumeData.education.length > 0 && (
        <View style={professional.section} wrap={false}>
          <Text style={professional.sectionTitle}>Education</Text>
          {resumeData.education.map((edu, index) => (
            <View key={index} style={professional.experienceItem} wrap={false}>
              <View style={professional.experienceHeader}>
                <Text style={professional.companyName}>{edu.degree}</Text>
                <Text style={professional.dates}>{`${edu.startDate} - ${edu.endDate}`}</Text>
              </View>
              <Text>{edu.institution}</Text>
              {edu.description && (
                <Text style={professional.p}>{edu.description}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Skills Section */}
      {resumeData.skills.length > 0 && (
        <View style={professional.section} wrap={false}>
          <Text style={professional.sectionTitle}>Technical Skills</Text>
          <View style={{ flexDirection: 'column', gap: 5 }}>
            {resumeData.skills.map((skill, index) => (
              <View key={index} style={{ flexDirection: 'row', gap: 5 }}>
                {skill.skillType === 'individual' ? (
                  <Text style={[professional.skillCategory, { flex: 1 }]}>{skill.skill}</Text>
                ) : (
                  <>
                    <Text style={professional.skillCategory}>{skill.category}:</Text>
                    <Text style={[professional.p, { flex: 1 }]}>{skill.skills}</Text>
                  </>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Certifications Section */}
      {resumeData.certifications.length > 0 && (
        <View style={professional.section}>
          <Text style={professional.sectionTitle}>Certifications</Text>
          {resumeData.certifications.map((cert, index) => (
            <View key={index} style={index < resumeData.certifications.length - 1 ?  professional.experienceItem : {}}>
              <View style={professional.experienceHeader}>
                <Text style={professional.companyName}>{cert.certificationName}</Text>
                <Text style={professional.dates}>{cert.issueDate}</Text>
              </View>
              <Text style={professional.contactInfo}>{cert.issuingOrganization}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Languages Section */}
      {resumeData.languages.length > 0 && (
        <View style={professional.section}>
          <Text style={professional.sectionTitle}>Languages</Text>
          <View style={{ flexDirection: 'column' , gap: 5 }}>
            {resumeData.languages.map((lang, index) => (
              <View key={index} style={{ flexDirection: 'row' , gap:2 }}>
                <Text style={professional.skillCategory}>{lang.language}:</Text>
                <Text style={professional.p}>{lang.proficiency}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Page>
  </Document>
);


// Template registry
const templates = {
  minimal: MinimalTemplate,
  modern: ModernTemplate,
  professional: ProfessionalTemplate
};

export async function GET(
  request: Request, 
  { params }: { params: { resumeId: string } }
) {
  try {
    // Get session and validate
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email || "temp_resumes";

    // Get template preference from query params
    const { searchParams } = new URL(request.url);
    const templateName = searchParams.get('template') || 'minimal';

    // Fetch resume data
    const resumeRef = doc(db, `users/${userId}/resumes/${params.resumeId}`);
    const resumeSnap = await getDoc(resumeRef);

    if (!resumeSnap.exists()) {
      return new Response('Resume not found', { status: 404 });
    }

    const resumeData = resumeSnap.data() as ResumeData;

    // Get the appropriate template
    const TemplateComponent = templates[templateName as keyof typeof templates] || templates.minimal;

    // Generate PDF
    const stream = await renderToStream(<TemplateComponent resumeData={resumeData} />);

    // Return PDF stream with appropriate headers
    return new NextResponse(stream as unknown as ReadableStream
        , {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${resumeData.personalDetails.fullName}'s Resume - Made using ResumeItNow.pdf"`,
      },}
);

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response('Error generating PDF', { status: 500 });
  }
}