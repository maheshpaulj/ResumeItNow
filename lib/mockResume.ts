import type { ResumeData } from '@/components/resume/templates/types';

/**
 * Rich sample resume used to render real full-page template previews
 * (create flow, template pickers). Written to comfortably fill an A4 first
 * page in every template.
 */
export const MOCK_RESUME: ResumeData = {
  personalDetails: {
    fullName: 'Alex Morgan',
    email: 'alex.morgan@email.com',
    phone: '+1 (415) 555-0134',
    linkedin: 'linkedin.com/in/alexmorgan',
    github: 'github.com/alexmorgan',
    website: '',
    location: 'San Francisco, CA',
  },
  jobTitle: 'Senior Software Engineer',
  objective:
    'Software engineer with 7+ years of experience building high-traffic web platforms and developer tools. Led teams of up to six engineers, shipped products used by millions, and cut infrastructure costs by 40%. Passionate about performance, clean architecture, and mentoring.',
  workExperience: [
    {
      jobTitle: 'Senior Software Engineer',
      companyName: 'Northwind Labs',
      location: 'San Francisco, CA',
      startDate: 'Mar 2021',
      endDate: 'Present',
      description:
        '- Led migration of a monolith serving 4M MAU to event-driven microservices, cutting p95 latency by 38%\n- Designed the real-time collaboration engine (CRDTs over WebSocket) now used across 3 product lines\n- Mentored 5 engineers; introduced RFC process that halved design-review turnaround',
    },
    {
      jobTitle: 'Software Engineer',
      companyName: 'Brightpath Inc.',
      location: 'Seattle, WA',
      startDate: 'Jun 2018',
      endDate: 'Feb 2021',
      description:
        '- Built the customer analytics dashboard (React, TypeScript, GraphQL) adopted by 900+ enterprise accounts\n- Reduced CI pipeline time from 42 to 9 minutes through test sharding and caching',
    },
  ],
  education: [
    {
      degree: 'B.S. Computer Science',
      institution: 'University of Washington',
      location: 'Seattle, WA',
      startDate: 'Sep 2014',
      endDate: 'Jun 2018',
      gpa: '3.8',
      description: '',
    },
  ],
  skills: [
    {
      skillType: 'group',
      category: 'Languages',
      skills: 'TypeScript, Python, Go, SQL',
      skill: '',
    },
    {
      skillType: 'group',
      category: 'Technologies',
      skills: 'React, Next.js, Node.js, PostgreSQL, Redis, AWS, Docker, Kubernetes',
      skill: '',
    },
  ],
  projects: [
    {
      projectName: 'OpenMetrics',
      description:
        '- Open-source observability toolkit with 4.2k GitHub stars; maintainer since 2022\n- Plugin architecture with adapters for Prometheus, Datadog, and Grafana',
      link: 'github.com/alexmorgan/openmetrics',
    },
  ],
  languages: [
    { language: 'English', proficiency: 'Native' },
    { language: 'Spanish', proficiency: 'Professional' },
  ],
  certifications: [
    {
      certificationName: 'AWS Solutions Architect – Associate',
      issuingOrganization: 'Amazon Web Services',
      issueDate: 'Jan 2023',
    },
  ],
  customSections: [],
};
