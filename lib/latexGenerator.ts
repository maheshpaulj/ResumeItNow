import type { ResumeData } from '@/components/resume/templates/types';

function escapeLatex(text: string | undefined): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

type TemplateStyle = 'modern' | 'professional' | 'minimal' | 'compact' | 'sidebar';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function contactLine(pd: ResumeData['personalDetails']): string {
  const items: string[] = [];
  if (pd.email) items.push(`\\href{mailto:${escapeLatex(pd.email)}}{${escapeLatex(pd.email)}}`);
  if (pd.phone) items.push(escapeLatex(pd.phone));
  if (pd.location) items.push(escapeLatex(pd.location));
  if (pd.linkedin) items.push(`\\href{${escapeLatex(pd.linkedin)}}{LinkedIn}`);
  if (pd.github) items.push(`\\href{${escapeLatex(pd.github)}}{GitHub}`);
  if (pd.website) items.push(`\\href{${escapeLatex(pd.website)}}{Portfolio}`);
  return items.join(' $|$ ');
}

function descriptionItems(desc: string | undefined): string {
  if (!desc) return '';
  const lines = desc.split('\n').filter(Boolean);
  if (lines.length === 0) return '';
  let out = '\\begin{itemize}[nosep]\n';
  for (const line of lines) {
    const stripped = line.replace(/^[•*\-]\s*/, '');
    if (stripped) out += `  \\item ${escapeLatex(stripped)}\n`;
  }
  out += '\\end{itemize}\n';
  return out;
}

function hasWork(data: ResumeData) {
  return data.workExperience?.length > 0 && data.workExperience.some(w => w.companyName || w.jobTitle);
}
function hasEdu(data: ResumeData) {
  return data.education?.length > 0 && data.education.some(e => e.institution || e.degree);
}
function hasSkills(data: ResumeData) {
  return data.skills?.length > 0 && data.skills.some(s => s.skill || s.category);
}
function hasProjects(data: ResumeData) {
  return data.projects?.length > 0 && data.projects.some(p => p.projectName);
}
function hasCerts(data: ResumeData) {
  return data.certifications?.length > 0 && data.certifications.some(c => c.certificationName);
}
function hasLangs(data: ResumeData) {
  return data.languages?.length > 0 && data.languages.some(l => l.language);
}

function skillsBlock(data: ResumeData): string {
  if (!hasSkills(data)) return '';
  let out = '';
  for (const skill of data.skills) {
    if (skill.skillType === 'group' && skill.category) {
      out += `\\textbf{${escapeLatex(skill.category)}:} ${escapeLatex(skill.skills)} \\\\\n`;
    } else if (skill.skillType === 'individual' && skill.skill) {
      out += `${escapeLatex(skill.skill)} \\\\\n`;
    }
  }
  return out;
}

function certsBlock(data: ResumeData): string {
  if (!hasCerts(data)) return '';
  let out = '\\begin{itemize}[nosep]\n';
  for (const cert of data.certifications) {
    if (!cert.certificationName) continue;
    let line = `  \\item \\textbf{${escapeLatex(cert.certificationName)}}`;
    if (cert.issuingOrganization) line += ` -- ${escapeLatex(cert.issuingOrganization)}`;
    if (cert.issueDate) line += ` (${escapeLatex(cert.issueDate)})`;
    out += line + '\n';
  }
  out += '\\end{itemize}\n';
  return out;
}

function langsBlock(data: ResumeData): string {
  if (!hasLangs(data)) return '';
  const items = data.languages.filter(l => l.language).map(l => {
    let s = escapeLatex(l.language);
    if (l.proficiency) s += ` (${escapeLatex(l.proficiency)})`;
    return s;
  });
  return items.join(' $\\cdot$ ') + '\n';
}

// ─── Template generators ──────────────────────────────────────────────────────

function generateModern(data: ResumeData, margin: string): string {
  const { personalDetails, objective } = data;
  let tex = `\\documentclass[a4paper,10pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=${margin}]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{xcolor}
\\usepackage{titlesec}

\\definecolor{accent}{HTML}{2563EB}
\\titleformat{\\section}{\\large\\bfseries\\color{accent}}{}{0pt}{}[\\color{accent}\\titlerule]
\\titlespacing{\\section}{0pt}{8pt}{4pt}
\\setlist[itemize]{nosep, leftmargin=*}
\\setlength{\\parindent}{0pt}
\\pagestyle{empty}

\\begin{document}

\\begin{center}
  {\\LARGE\\bfseries ${escapeLatex(personalDetails.fullName) || 'Your Name'}} \\\\[2pt]
  {\\small ${contactLine(personalDetails)}}
\\end{center}
\\vspace{2mm}
`;

  if (objective) {
    tex += `\\section{Summary}\n${escapeLatex(objective)}\n\\vspace{2mm}\n`;
  }
  if (hasWork(data)) {
    tex += `\\section{Experience}\n`;
    for (const exp of data.workExperience) {
      if (!exp.companyName && !exp.jobTitle) continue;
      tex += `\\textbf{${escapeLatex(exp.jobTitle)}} \\hfill ${escapeLatex(exp.startDate)} -- ${escapeLatex(exp.endDate)} \\\\\n`;
      tex += `\\textit{${escapeLatex(exp.companyName)}} \\hfill ${escapeLatex(exp.location)} \\\\\n`;
      tex += descriptionItems(exp.description);
      tex += '\\vspace{2mm}\n';
    }
  }
  if (hasProjects(data)) {
    tex += `\\section{Projects}\n`;
    for (const proj of data.projects) {
      if (!proj.projectName) continue;
      tex += `\\textbf{${escapeLatex(proj.projectName)}}`;
      if (proj.link) tex += ` $|$ \\href{${escapeLatex(proj.link)}}{\\small Link}`;
      tex += ' \\\\\n';
      tex += descriptionItems(proj.description);
      tex += '\\vspace{2mm}\n';
    }
  }
  if (hasEdu(data)) {
    tex += `\\section{Education}\n`;
    for (const edu of data.education) {
      if (!edu.institution && !edu.degree) continue;
      tex += `\\textbf{${escapeLatex(edu.degree)}}`;
      if (edu.gpa) tex += ` (GPA: ${escapeLatex(edu.gpa)})`;
      tex += ` \\hfill ${escapeLatex(edu.startDate)} -- ${escapeLatex(edu.endDate)} \\\\\n`;
      tex += `\\textit{${escapeLatex(edu.institution)}} \\hfill ${escapeLatex(edu.location)} \\\\\n`;
      tex += '\\vspace{2mm}\n';
    }
  }
  if (hasSkills(data)) {
    tex += `\\section{Skills}\n${skillsBlock(data)}`;
  }
  if (hasCerts(data)) {
    tex += `\\section{Certifications}\n${certsBlock(data)}`;
  }
  if (hasLangs(data)) {
    tex += `\\section{Languages}\n${langsBlock(data)}`;
  }

  tex += '\n\\end{document}\n';
  return tex;
}

function generateProfessional(data: ResumeData, margin: string): string {
  const { personalDetails, objective } = data;
  let tex = `\\documentclass[a4paper,11pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=${margin}]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}

\\titleformat{\\section}{\\large\\bfseries\\scshape}{}{0pt}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{10pt}{6pt}
\\setlist[itemize]{nosep, leftmargin=*}
\\setlength{\\parindent}{0pt}
\\pagestyle{empty}

\\begin{document}

\\begin{center}
  {\\LARGE\\bfseries\\scshape ${escapeLatex(personalDetails.fullName) || 'Your Name'}} \\\\[4pt]
  {\\small ${contactLine(personalDetails)}}
\\end{center}
\\vspace{4mm}
`;

  if (objective) {
    tex += `\\section{Professional Summary}\n${escapeLatex(objective)}\n\\vspace{3mm}\n`;
  }
  if (hasWork(data)) {
    tex += `\\section{Professional Experience}\n`;
    for (const exp of data.workExperience) {
      if (!exp.companyName && !exp.jobTitle) continue;
      tex += `\\textbf{${escapeLatex(exp.companyName)}} \\hfill ${escapeLatex(exp.location)} \\\\\n`;
      tex += `\\textit{${escapeLatex(exp.jobTitle)}} \\hfill ${escapeLatex(exp.startDate)} -- ${escapeLatex(exp.endDate)} \\\\\n`;
      tex += descriptionItems(exp.description);
      tex += '\\vspace{3mm}\n';
    }
  }
  if (hasProjects(data)) {
    tex += `\\section{Projects}\n`;
    for (const proj of data.projects) {
      if (!proj.projectName) continue;
      tex += `\\textbf{${escapeLatex(proj.projectName)}}`;
      if (proj.link) tex += ` -- \\href{${escapeLatex(proj.link)}}{Link}`;
      tex += ' \\\\\n';
      tex += descriptionItems(proj.description);
      tex += '\\vspace{3mm}\n';
    }
  }
  if (hasEdu(data)) {
    tex += `\\section{Education}\n`;
    for (const edu of data.education) {
      if (!edu.institution && !edu.degree) continue;
      tex += `\\textbf{${escapeLatex(edu.institution)}} \\hfill ${escapeLatex(edu.location)} \\\\\n`;
      tex += `\\textit{${escapeLatex(edu.degree)}}`;
      if (edu.gpa) tex += ` -- GPA: ${escapeLatex(edu.gpa)}`;
      tex += ` \\hfill ${escapeLatex(edu.startDate)} -- ${escapeLatex(edu.endDate)} \\\\\n`;
      tex += '\\vspace{3mm}\n';
    }
  }
  if (hasSkills(data)) {
    tex += `\\section{Skills}\n${skillsBlock(data)}`;
  }
  if (hasCerts(data)) {
    tex += `\\section{Certifications}\n${certsBlock(data)}`;
  }
  if (hasLangs(data)) {
    tex += `\\section{Languages}\n${langsBlock(data)}`;
  }

  tex += '\n\\end{document}\n';
  return tex;
}

function generateMinimal(data: ResumeData, margin: string): string {
  const { personalDetails, objective } = data;
  let tex = `\\documentclass[a4paper,10pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=${margin}]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}

\\setlist[itemize]{nosep, leftmargin=12pt}
\\setlength{\\parindent}{0pt}
\\pagestyle{empty}
\\renewcommand{\\section}[1]{\\vspace{8pt}{\\large\\textbf{#1}}\\vspace{4pt}\\par}

\\begin{document}

\\begin{center}
  {\\LARGE\\textbf{${escapeLatex(personalDetails.fullName) || 'Your Name'}}} \\\\[3pt]
  {\\small ${contactLine(personalDetails)}}
\\end{center}
\\vspace{4mm}
`;

  if (objective) {
    tex += `\\section{Summary}\n${escapeLatex(objective)}\n\\vspace{3mm}\n`;
  }
  if (hasWork(data)) {
    tex += `\\section{Experience}\n`;
    for (const exp of data.workExperience) {
      if (!exp.companyName && !exp.jobTitle) continue;
      tex += `\\textbf{${escapeLatex(exp.jobTitle)}} \\hfill ${escapeLatex(exp.startDate)} -- ${escapeLatex(exp.endDate)} \\\\\n`;
      tex += `${escapeLatex(exp.companyName)} \\hfill ${escapeLatex(exp.location)} \\\\\n`;
      tex += descriptionItems(exp.description);
      tex += '\\vspace{3mm}\n';
    }
  }
  if (hasProjects(data)) {
    tex += `\\section{Projects}\n`;
    for (const proj of data.projects) {
      if (!proj.projectName) continue;
      tex += `\\textbf{${escapeLatex(proj.projectName)}}`;
      if (proj.link) tex += ` -- \\href{${escapeLatex(proj.link)}}{Link}`;
      tex += ' \\\\\n';
      tex += descriptionItems(proj.description);
      tex += '\\vspace{3mm}\n';
    }
  }
  if (hasEdu(data)) {
    tex += `\\section{Education}\n`;
    for (const edu of data.education) {
      if (!edu.institution && !edu.degree) continue;
      tex += `\\textbf{${escapeLatex(edu.degree)}}`;
      if (edu.gpa) tex += ` (${escapeLatex(edu.gpa)})`;
      tex += ` \\hfill ${escapeLatex(edu.startDate)} -- ${escapeLatex(edu.endDate)} \\\\\n`;
      tex += `${escapeLatex(edu.institution)} \\hfill ${escapeLatex(edu.location)} \\\\\n`;
      tex += '\\vspace{3mm}\n';
    }
  }
  if (hasSkills(data)) {
    tex += `\\section{Skills}\n${skillsBlock(data)}`;
  }
  if (hasCerts(data)) {
    tex += `\\section{Certifications}\n${certsBlock(data)}`;
  }
  if (hasLangs(data)) {
    tex += `\\section{Languages}\n${langsBlock(data)}`;
  }

  tex += '\n\\end{document}\n';
  return tex;
}

function generateCompact(data: ResumeData, margin: string): string {
  const { personalDetails, objective } = data;
  let tex = `\\documentclass[a4paper,9pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=${margin}]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}

\\titleformat{\\section}{\\normalsize\\bfseries\\uppercase}{}{0pt}{}[\\vspace{-4pt}\\rule{\\textwidth}{0.5pt}]
\\titlespacing{\\section}{0pt}{6pt}{3pt}
\\setlist[itemize]{nosep, leftmargin=10pt, itemsep=0pt}
\\setlength{\\parindent}{0pt}
\\pagestyle{empty}

\\begin{document}

{\\large\\bfseries ${escapeLatex(personalDetails.fullName) || 'Your Name'}} \\hfill {\\small ${contactLine(personalDetails)}} \\\\
\\vspace{2mm}
`;

  if (objective) {
    tex += `\\section{Summary}\n{\\small ${escapeLatex(objective)}}\n`;
  }
  if (hasWork(data)) {
    tex += `\\section{Experience}\n`;
    for (const exp of data.workExperience) {
      if (!exp.companyName && !exp.jobTitle) continue;
      tex += `{\\small \\textbf{${escapeLatex(exp.jobTitle)}} at \\textbf{${escapeLatex(exp.companyName)}} \\hfill ${escapeLatex(exp.startDate)} -- ${escapeLatex(exp.endDate)}} \\\\\n`;
      tex += descriptionItems(exp.description);
    }
  }
  if (hasProjects(data)) {
    tex += `\\section{Projects}\n`;
    for (const proj of data.projects) {
      if (!proj.projectName) continue;
      tex += `{\\small \\textbf{${escapeLatex(proj.projectName)}}`;
      if (proj.link) tex += ` $|$ \\href{${escapeLatex(proj.link)}}{Link}`;
      tex += '} \\\\\n';
      tex += descriptionItems(proj.description);
    }
  }
  if (hasEdu(data)) {
    tex += `\\section{Education}\n`;
    for (const edu of data.education) {
      if (!edu.institution && !edu.degree) continue;
      tex += `{\\small \\textbf{${escapeLatex(edu.degree)}} -- ${escapeLatex(edu.institution)} \\hfill ${escapeLatex(edu.startDate)} -- ${escapeLatex(edu.endDate)}} \\\\\n`;
    }
  }
  if (hasSkills(data)) {
    tex += `\\section{Skills}\n{\\small ${skillsBlock(data)}}`;
  }
  if (hasCerts(data)) {
    tex += `\\section{Certifications}\n{\\small ${certsBlock(data)}}`;
  }
  if (hasLangs(data)) {
    tex += `\\section{Languages}\n{\\small ${langsBlock(data)}}`;
  }

  tex += '\n\\end{document}\n';
  return tex;
}

function generateSidebar(data: ResumeData, margin: string): string {
  const { personalDetails, objective } = data;
  let tex = `\\documentclass[a4paper,10pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=${margin}]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{xcolor}
\\usepackage{paracol}

\\definecolor{primary}{HTML}{1E293B}
\\definecolor{secondary}{HTML}{475569}
\\definecolor{rulecolor}{HTML}{E2E8F0}

\\setlist[itemize]{nosep, leftmargin=*}
\\setlength{\\parindent}{0pt}
\\pagestyle{empty}

% Paracol styling
\\columnratio{0.30}
\\setlength{\\columnsep}{24pt}
\\setlength{\\columnseprule}{0.5pt}
\\colseprulecolor{rulecolor}

\\begin{document}

% Header (Full Width)
\\begin{center}
  {\\LARGE\\bfseries\\color{primary} ${escapeLatex(personalDetails.fullName) || 'Your Name'}} \\\\[2pt]
  {\\small\\color{secondary} ${escapeLatex(data.jobTitle) || ''}}
\\end{center}
\\vspace{4mm}

\\begin{paracol}{2}

% ─── Left Column (Contact & Skills) ─────────────────────
\\begin{leftcolumn}
\\raggedright

{\\small\\bfseries\\color{primary} CONTACT} \\\\[4pt]
\\begin{small}
`;

  if (personalDetails.email) tex += `\\href{mailto:${escapeLatex(personalDetails.email)}}{${escapeLatex(personalDetails.email)}} \\\\[4pt]\n`;
  if (personalDetails.phone) tex += `${escapeLatex(personalDetails.phone)} \\\\[4pt]\n`;
  if (personalDetails.location) tex += `${escapeLatex(personalDetails.location)} \\\\[4pt]\n`;
  if (personalDetails.linkedin) tex += `\\href{${escapeLatex(personalDetails.linkedin)}}{LinkedIn} \\\\[4pt]\n`;
  if (personalDetails.github) tex += `\\href{${escapeLatex(personalDetails.github)}}{GitHub} \\\\[4pt]\n`;

  tex += `\\end{small}
\\vspace{6mm}

{\\small\\bfseries\\color{primary} SKILLS} \\\\[4pt]
\\begin{small}
`;
  if (hasSkills(data)) {
    for (const skill of data.skills) {
      if (skill.skillType === 'group' && skill.category) {
        tex += `\\textbf{${escapeLatex(skill.category)}:}\\\\${escapeLatex(skill.skills)} \\\\[4pt]\n`;
      } else if (skill.skillType === 'individual' && skill.skill) {
        tex += `${escapeLatex(skill.skill)} \\\\[4pt]\n`;
      }
    }
  }
  tex += `\\end{small}
\\vspace{6mm}

{\\small\\bfseries\\color{primary} LANGUAGES} \\\\[4pt]
\\begin{small}
`;
  if (hasLangs(data)) {
    for (const lang of data.languages) {
      if (!lang.language) continue;
      let s = escapeLatex(lang.language);
      if (lang.proficiency) s += ` (${escapeLatex(lang.proficiency)})`;
      tex += `${s} \\\\[4pt]\n`;
    }
  }
  tex += `\\end{small}
\\end{leftcolumn}

% ─── Right Column (Experience & Education) ──────────────
\\begin{rightcolumn}
`;

  if (objective) {
    tex += `{\\large\\bfseries\\color{primary} Summary} \\\\[4pt]\n${escapeLatex(objective)}\n\\vspace{4mm}\n`;
  }
  if (hasWork(data)) {
    tex += `{\\large\\bfseries\\color{primary} Experience} \\\\[4pt]\n`;
    for (const exp of data.workExperience) {
      if (!exp.companyName && !exp.jobTitle) continue;
      tex += `\\textbf{${escapeLatex(exp.jobTitle)}} \\hfill ${escapeLatex(exp.startDate)} -- ${escapeLatex(exp.endDate)} \\\\\n`;
      tex += `\\textit{${escapeLatex(exp.companyName)}} \\hfill ${escapeLatex(exp.location)} \\\\\n`;
      tex += descriptionItems(exp.description);
      tex += '\\vspace{3mm}\n';
    }
  }
  if (hasProjects(data)) {
    tex += `{\\large\\bfseries\\color{primary} Projects} \\\\[4pt]\n`;
    for (const proj of data.projects) {
      if (!proj.projectName) continue;
      tex += `\\textbf{${escapeLatex(proj.projectName)}}`;
      if (proj.link) tex += ` $|$ \\href{${escapeLatex(proj.link)}}{Link}`;
      tex += ' \\\\\n';
      tex += descriptionItems(proj.description);
      tex += '\\vspace{3mm}\n';
    }
  }
  if (hasEdu(data)) {
    tex += `{\\large\\bfseries\\color{primary} Education} \\\\[4pt]\n`;
    for (const edu of data.education) {
      if (!edu.institution && !edu.degree) continue;
      tex += `\\textbf{${escapeLatex(edu.degree)}} \\hfill ${escapeLatex(edu.startDate)} -- ${escapeLatex(edu.endDate)} \\\\\n`;
      tex += `\\textit{${escapeLatex(edu.institution)}} \\hfill ${escapeLatex(edu.location)} \\\\\n`;
      tex += '\\vspace{3mm}\n';
    }
  }
  if (hasCerts(data)) {
    tex += `{\\large\\bfseries\\color{primary} Certifications} \\\\[4pt]\n${certsBlock(data)}`;
  }

  tex += `\\end{rightcolumn}
\\end{paracol}

\\end{document}
`;
  return tex;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function generateLatexFromData(data: ResumeData, template?: string): string {
  const margin = data.margins === 'narrow' ? '0.5in' : '0.75in';
  const style = (template || data.template || 'modern') as TemplateStyle;

  switch (style) {
    case 'professional': return generateProfessional(data, margin);
    case 'minimal':      return generateMinimal(data, margin);
    case 'compact':      return generateCompact(data, margin);
    case 'sidebar':      return generateSidebar(data, margin);
    case 'modern':
    default:             return generateModern(data, margin);
  }
}
