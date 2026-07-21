import type { ResumeData } from '@/components/resume/templates/types';
import {
  escapeLatex,
  inline,
  richText,
  dateRange,
  href,
  hasWork,
  hasEdu,
  hasSkills,
  hasProjects,
  hasCerts,
  hasLangs,
  hasCustom,
  sectionOrderOf,
  generateLatexFromData,
} from './latexGenerator';

// LaTeX-only resume templates — the classic looks people pick LaTeX for.
// These are NOT tied to the visual templates: a LaTeX resume is its own thing,
// chosen at creation time. Every template compiles with pdflatex on
// latexonline.cc using only packages verified to exist there (raleway, roboto,
// lato, carlito, XCharter, newtxtext, helvet, titlesec, enumitem, xcolor,
// paracol, tabularx, geometry, hyperref).

export interface LatexTemplate {
  id: string;
  label: string;
  blurb: string;
  generate: (data: ResumeData) => string;
}

// ─── Shared bits ──────────────────────────────────────────────────────────────

function contactParts(data: ResumeData, sep: string): string {
  const pd = data.personalDetails;
  const items: string[] = [];
  if (pd.phone) items.push(escapeLatex(pd.phone));
  if (pd.email) items.push(href(`mailto:${pd.email}`, escapeLatex(pd.email)));
  if (pd.linkedin) items.push(href(pd.linkedin, escapeLatex(pd.linkedin.replace(/^https?:\/\/(www\.)?/i, ''))));
  if (pd.github) items.push(href(pd.github, escapeLatex(pd.github.replace(/^https?:\/\/(www\.)?/i, ''))));
  if (pd.website) items.push(href(pd.website, escapeLatex(pd.website.replace(/^https?:\/\/(www\.)?/i, ''))));
  if (pd.location) items.push(escapeLatex(pd.location));
  return items.join(sep);
}

// ─── 1. Jake's — the classic single-column ATS resume ────────────────────────

function generateJakes(data: ResumeData): string {
  let tex = `\\documentclass[letterpaper,11pt]{article}
% ── Jake's-style resume: single column, Computer Modern, tabular* headings ──
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[letterpaper,margin=0.6in]{geometry}
\\usepackage[hidelinks]{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{tabularx}
\\usepackage{xcolor}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}
\\setlength{\\parindent}{0pt}
\\pagestyle{empty}
\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule\\vspace{-5pt}]
\\newcommand{\\rentry}[4]{%
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}
\\newcommand{\\rentryline}[2]{%
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & \\textit{\\small #2} \\\\
    \\end{tabular*}\\vspace{-7pt}
}
\\newcommand{\\rlist}[1]{\\begin{itemize}[leftmargin=0.15in,label={$\\vcenter{\\hbox{\\tiny$\\bullet$}}$},itemsep=0pt,topsep=2pt,parsep=1pt]#1\\end{itemize}\\vspace{-5pt}}

\\begin{document}

\\begin{center}
  {\\Huge\\scshape ${escapeLatex(data.personalDetails.fullName) || 'Your Name'}} \\\\ \\vspace{4pt}
  {\\small ${contactParts(data, ' $|$ ')}}
\\end{center}
`;
  const bullets = (md?: string) => {
    if (!md || !md.trim()) return '';
    const items = md.split('\n').map((l) => l.trim()).filter(Boolean)
      .map((l) => `\\item ${inline(l.replace(/^[•*\-]\s*/, ''))}`).join('\n');
    return `\\rlist{\n${items}\n}\n`;
  };

  for (const key of sectionOrderOf(data)) {
    switch (key) {
      case 'objective':
        if (data.objective) tex += `\n\\section{Summary}\n${richText(data.objective)}`;
        break;
      case 'education':
        if (hasEdu(data)) {
          tex += `\n\\section{Education}\n\\begin{itemize}[leftmargin=0.15in,label={}]\n`;
          for (const e of data.education) {
            if (!e.institution && !e.degree) continue;
            const degree = escapeLatex(e.degree) + (e.gpa ? ` (GPA: ${escapeLatex(e.gpa)})` : '');
            tex += `\\rentry{${escapeLatex(e.institution)}}{${escapeLatex(e.location)}}{${degree}}{${dateRange(e.startDate, e.endDate)}}\n`;
            if (e.description) tex += bullets(e.description);
          }
          tex += `\\end{itemize}\n`;
        }
        break;
      case 'workExperience':
        if (hasWork(data)) {
          tex += `\n\\section{Experience}\n\\begin{itemize}[leftmargin=0.15in,label={}]\n`;
          for (const w of data.workExperience) {
            if (!w.companyName && !w.jobTitle) continue;
            tex += `\\rentry{${escapeLatex(w.jobTitle)}}{${dateRange(w.startDate, w.endDate)}}{${escapeLatex(w.companyName)}}{${escapeLatex(w.location)}}\n`;
            if (w.description) tex += bullets(w.description);
          }
          tex += `\\end{itemize}\n`;
        }
        break;
      case 'projects':
        if (hasProjects(data)) {
          tex += `\n\\section{Projects}\n\\begin{itemize}[leftmargin=0.15in,label={}]\n`;
          for (const p of data.projects) {
            if (!p.projectName) continue;
            const name = escapeLatex(p.projectName) + (p.link ? ` $|$ {\\small ${href(p.link, escapeLatex(p.link.replace(/^https?:\/\//i, '')))}}` : '');
            tex += `\\rentryline{${name}}{}\n`;
            if (p.description) tex += bullets(p.description);
          }
          tex += `\\end{itemize}\n`;
        }
        break;
      case 'skills':
        if (hasSkills(data)) {
          tex += `\n\\section{Technical Skills}\n\\begin{itemize}[leftmargin=0.15in,label={},itemsep=0pt]\n`;
          for (const s of data.skills) {
            if (s.skillType === 'individual' && s.skill) tex += `\\item{${escapeLatex(s.skill)}}\n`;
            else if (s.category || s.skills) tex += `\\item{\\textbf{${escapeLatex(s.category)}}{: ${escapeLatex(s.skills)}}}\n`;
          }
          tex += `\\end{itemize}\n`;
        }
        break;
      case 'certifications':
        if (hasCerts(data)) {
          tex += `\n\\section{Certifications}\n\\begin{itemize}[leftmargin=0.15in,label={},itemsep=0pt]\n`;
          for (const c of data.certifications) {
            if (!c.certificationName) continue;
            tex += `\\item{\\textbf{${escapeLatex(c.certificationName)}}${c.issuingOrganization ? ` -- ${escapeLatex(c.issuingOrganization)}` : ''}${c.issueDate ? ` {\\small(${escapeLatex(c.issueDate)})}` : ''}}\n`;
          }
          tex += `\\end{itemize}\n`;
        }
        break;
      case 'languages':
        if (hasLangs(data)) {
          tex += `\n\\section{Languages}\n${data.languages.filter((l) => l.language).map((l) => escapeLatex(l.language) + (l.proficiency ? ` (${escapeLatex(l.proficiency)})` : '')).join(' $\\cdot$ ')}\n`;
        }
        break;
      case 'customSections':
        if (hasCustom(data)) {
          for (const c of data.customSections) {
            if (!c.sectionTitle && !c.content) continue;
            tex += `\n\\section{${escapeLatex(c.sectionTitle)}}\n${richText(c.content)}`;
          }
        }
        break;
    }
  }
  tex += '\n\\end{document}\n';
  return tex;
}

// ─── 2. Deedy — two-column with a bold left rail ─────────────────────────────

function generateDeedy(data: ResumeData): string {
  const pd = data.personalDetails;
  let tex = `\\documentclass[a4paper,10pt]{article}
% ── Deedy-inspired two-column resume ──
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[a4paper,top=0.55in,bottom=0.55in,left=0.55in,right=0.55in]{geometry}
\\usepackage[default]{lato}
\\usepackage[hidelinks]{hyperref}
\\usepackage{enumitem}
\\usepackage{xcolor}
\\usepackage{paracol}
\\definecolor{primary}{HTML}{0F2E53}
\\definecolor{accent}{HTML}{2A6BB0}
\\definecolor{mute}{HTML}{5A6572}
\\setlist[itemize]{nosep,topsep=1pt,leftmargin=12pt,itemsep=1pt}
\\setlength{\\parindent}{0pt}
\\pagestyle{empty}
\\raggedbottom
\\columnratio{0.33}
\\setlength{\\columnsep}{16pt}
\\newcommand{\\lefthead}[1]{{\\large\\bfseries\\color{primary}\\MakeUppercase{#1}}\\par{\\color{accent}\\rule{\\linewidth}{1.2pt}}\\par\\vspace{4pt}}
\\newcommand{\\righthead}[1]{{\\Large\\bfseries\\color{primary}\\MakeUppercase{#1}}\\par{\\color{accent}\\rule{\\linewidth}{1.2pt}}\\par\\vspace{5pt}}

\\begin{document}

{\\fontsize{28}{32}\\selectfont\\bfseries\\color{primary} ${escapeLatex(pd.fullName) || 'Your Name'}}\\par
${data.jobTitle ? `{\\large\\color{mute} ${escapeLatex(data.jobTitle)}}\\par\n` : ''}\\vspace{2pt}
{\\color{accent}\\rule{\\textwidth}{1.6pt}}\\par
\\vspace{8pt}

\\begin{paracol}{2}
\\raggedright
\\lefthead{Contact}
{\\small
`;
  if (pd.email) tex += `${href(`mailto:${pd.email}`, escapeLatex(pd.email))}\\par\\vspace{2pt}\n`;
  if (pd.phone) tex += `${escapeLatex(pd.phone)}\\par\\vspace{2pt}\n`;
  if (pd.location) tex += `${escapeLatex(pd.location)}\\par\\vspace{2pt}\n`;
  if (pd.linkedin) tex += `${href(pd.linkedin, escapeLatex(pd.linkedin.replace(/^https?:\/\/(www\.)?/i, '')))}\\par\\vspace{2pt}\n`;
  if (pd.github) tex += `${href(pd.github, escapeLatex(pd.github.replace(/^https?:\/\/(www\.)?/i, '')))}\\par\\vspace{2pt}\n`;
  if (pd.website) tex += `${href(pd.website, escapeLatex(pd.website.replace(/^https?:\/\/(www\.)?/i, '')))}\\par\\vspace{2pt}\n`;
  tex += `}\n`;

  if (hasEdu(data)) {
    tex += `\\vspace{10pt}\n\\lefthead{Education}\n{\\small\n`;
    for (const e of data.education) {
      if (!e.institution && !e.degree) continue;
      tex += `\\textbf{\\color{primary}${escapeLatex(e.degree)}}\\par ${escapeLatex(e.institution)}\\par {\\color{mute}${dateRange(e.startDate, e.endDate)}${e.gpa ? ` · GPA ${escapeLatex(e.gpa)}` : ''}}\\par\\vspace{5pt}\n`;
    }
    tex += `}\n`;
  }
  if (hasSkills(data)) {
    tex += `\\vspace{10pt}\n\\lefthead{Skills}\n{\\small\n`;
    for (const s of data.skills) {
      if (s.skillType === 'individual' && s.skill) tex += `${escapeLatex(s.skill)}\\par\\vspace{2pt}\n`;
      else if (s.category || s.skills) tex += `\\textbf{\\color{primary}${escapeLatex(s.category)}}\\par ${escapeLatex(s.skills)}\\par\\vspace{4pt}\n`;
    }
    tex += `}\n`;
  }
  if (hasLangs(data)) {
    tex += `\\vspace{10pt}\n\\lefthead{Languages}\n{\\small\n`;
    for (const l of data.languages) {
      if (!l.language) continue;
      tex += `${escapeLatex(l.language)}${l.proficiency ? ` {\\color{mute}(${escapeLatex(l.proficiency)})}` : ''}\\par\\vspace{2pt}\n`;
    }
    tex += `}\n`;
  }
  if (hasCerts(data)) {
    tex += `\\vspace{10pt}\n\\lefthead{Certifications}\n{\\small\n`;
    for (const c of data.certifications) {
      if (!c.certificationName) continue;
      tex += `\\textbf{${escapeLatex(c.certificationName)}}\\par {\\color{mute}${escapeLatex(c.issuingOrganization)}${c.issueDate ? ` · ${escapeLatex(c.issueDate)}` : ''}}\\par\\vspace{4pt}\n`;
    }
    tex += `}\n`;
  }

  tex += `\n\\switchcolumn\n\n`;
  if (data.objective) {
    tex += `\\righthead{Profile}\n${richText(data.objective)}\\vspace{8pt}\n\n`;
  }
  if (hasWork(data)) {
    tex += `\\righthead{Experience}\n`;
    for (const w of data.workExperience) {
      if (!w.companyName && !w.jobTitle) continue;
      tex += `{\\bfseries\\color{primary} ${escapeLatex(w.jobTitle)}} \\hfill {\\small\\color{mute}${dateRange(w.startDate, w.endDate)}}\\par\n`;
      tex += `{\\itshape ${escapeLatex(w.companyName)}} \\hfill {\\small\\color{mute}${escapeLatex(w.location)}}\\par\n`;
      tex += richText(w.description);
      tex += `\\vspace{7pt}\n\n`;
    }
  }
  if (hasProjects(data)) {
    tex += `\\righthead{Projects}\n`;
    for (const p of data.projects) {
      if (!p.projectName) continue;
      tex += `{\\bfseries\\color{primary} ${escapeLatex(p.projectName)}}${p.link ? ` \\hfill {\\small ${href(p.link, escapeLatex(p.link.replace(/^https?:\/\//i, '')))}}` : ''}\\par\n`;
      tex += richText(p.description);
      tex += `\\vspace{7pt}\n\n`;
    }
  }
  if (hasCustom(data)) {
    for (const c of data.customSections) {
      if (!c.sectionTitle && !c.content) continue;
      tex += `\\righthead{${escapeLatex(c.sectionTitle)}}\n${richText(c.content)}\\vspace{7pt}\n\n`;
    }
  }
  tex += `\\end{paracol}\n\n\\end{document}\n`;
  return tex;
}

// ─── 3. Classic — elegant serif, understated rules ───────────────────────────

function generateClassic(data: ResumeData): string {
  let tex = `\\documentclass[a4paper,11pt]{article}
% ── Classic serif resume: XCharter, centered small-caps header, thin rules ──
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[a4paper,top=0.7in,bottom=0.7in,left=0.8in,right=0.8in]{geometry}
\\usepackage{XCharter}
\\usepackage[hidelinks]{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\definecolor{mute}{HTML}{555555}
\\setlist[itemize]{nosep,topsep=2pt,leftmargin=16pt,itemsep=1pt}
\\setlength{\\parindent}{0pt}
\\pagestyle{empty}
\\raggedbottom
\\titleformat{\\section}{\\centering\\scshape\\large}{}{0pt}{}[{\\vspace{2pt}\\hrule height 0.4pt}]
\\titlespacing{\\section}{0pt}{12pt}{8pt}

\\begin{document}

\\begin{center}
  {\\huge\\scshape ${escapeLatex(data.personalDetails.fullName) || 'Your Name'}}\\\\[2pt]
${data.jobTitle ? `  {\\color{mute}\\itshape ${escapeLatex(data.jobTitle)}}\\\\[4pt]\n` : ''}  \\rule{0.35\\textwidth}{0.4pt}\\\\[4pt]
  {\\small\\color{mute} ${contactParts(data, ' \\textbullet\\ ')}}
\\end{center}
`;
  for (const key of sectionOrderOf(data)) {
    switch (key) {
      case 'objective':
        if (data.objective) tex += `\n\\section{Profile}\n${richText(data.objective)}`;
        break;
      case 'workExperience':
        if (hasWork(data)) {
          tex += `\n\\section{Experience}\n`;
          for (const w of data.workExperience) {
            if (!w.companyName && !w.jobTitle) continue;
            tex += `\\textbf{${escapeLatex(w.jobTitle)}}, {\\itshape ${escapeLatex(w.companyName)}} \\hfill {\\small\\color{mute}${dateRange(w.startDate, w.endDate)}}\\par\n`;
            tex += richText(w.description);
            tex += `\\vspace{6pt}\n`;
          }
        }
        break;
      case 'projects':
        if (hasProjects(data)) {
          tex += `\n\\section{Projects}\n`;
          for (const p of data.projects) {
            if (!p.projectName) continue;
            tex += `\\textbf{${escapeLatex(p.projectName)}}${p.link ? ` \\hfill {\\small ${href(p.link, escapeLatex(p.link.replace(/^https?:\/\//i, '')))}}` : ''}\\par\n`;
            tex += richText(p.description);
            tex += `\\vspace{6pt}\n`;
          }
        }
        break;
      case 'education':
        if (hasEdu(data)) {
          tex += `\n\\section{Education}\n`;
          for (const e of data.education) {
            if (!e.institution && !e.degree) continue;
            tex += `\\textbf{${escapeLatex(e.degree)}}${e.gpa ? ` {\\small(GPA: ${escapeLatex(e.gpa)})}` : ''} \\hfill {\\small\\color{mute}${dateRange(e.startDate, e.endDate)}}\\par\n`;
            tex += `{\\itshape ${escapeLatex(e.institution)}}${e.location ? `, ${escapeLatex(e.location)}` : ''}\\par\n`;
            tex += richText(e.description);
            tex += `\\vspace{6pt}\n`;
          }
        }
        break;
      case 'skills':
        if (hasSkills(data)) {
          tex += `\n\\section{Skills}\n`;
          for (const s of data.skills) {
            if (s.skillType === 'individual' && s.skill) tex += `${escapeLatex(s.skill)}\\par\n`;
            else if (s.category || s.skills) tex += `\\textbf{${escapeLatex(s.category)}}: ${escapeLatex(s.skills)}\\par\n`;
          }
        }
        break;
      case 'certifications':
        if (hasCerts(data)) {
          tex += `\n\\section{Certifications}\n`;
          for (const c of data.certifications) {
            if (!c.certificationName) continue;
            tex += `\\textbf{${escapeLatex(c.certificationName)}}${c.issuingOrganization ? ` -- ${escapeLatex(c.issuingOrganization)}` : ''}${c.issueDate ? ` {\\small\\color{mute}(${escapeLatex(c.issueDate)})}` : ''}\\par\n`;
          }
        }
        break;
      case 'languages':
        if (hasLangs(data)) {
          tex += `\n\\section{Languages}\n\\begin{center}${data.languages.filter((l) => l.language).map((l) => escapeLatex(l.language) + (l.proficiency ? ` {\\color{mute}(${escapeLatex(l.proficiency)})}` : '')).join(' \\textbullet\\ ')}\\end{center}\n`;
        }
        break;
      case 'customSections':
        if (hasCustom(data)) {
          for (const c of data.customSections) {
            if (!c.sectionTitle && !c.content) continue;
            tex += `\n\\section{${escapeLatex(c.sectionTitle)}}\n${richText(c.content)}`;
          }
        }
        break;
    }
  }
  tex += '\n\\end{document}\n';
  return tex;
}

// ─── 4. Crimson — bold accent, modern sans (Awesome-CV energy) ───────────────

function generateCrimson(data: ResumeData): string {
  const pd = data.personalDetails;
  let tex = `\\documentclass[a4paper,10pt]{article}
% ── Crimson: modern sans resume with a strong red accent ──
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[a4paper,top=0.6in,bottom=0.6in,left=0.7in,right=0.7in]{geometry}
\\usepackage[sfdefault]{roboto}
\\usepackage[hidelinks]{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\definecolor{accent}{HTML}{C0392B}
\\definecolor{dark}{HTML}{2C3E50}
\\definecolor{mute}{HTML}{7F8C8D}
\\setlist[itemize]{nosep,topsep=2pt,leftmargin=14pt,itemsep=1pt}
\\setlength{\\parindent}{0pt}
\\pagestyle{empty}
\\raggedbottom
\\titleformat{\\section}{\\Large\\bfseries\\color{dark}}{}{0pt}{}[{\\color{accent}\\vspace{-6pt}\\rule{28pt}{2.4pt}}]
\\titlespacing{\\section}{0pt}{12pt}{7pt}

\\begin{document}

{\\fontsize{30}{34}\\selectfont\\bfseries\\color{dark} ${escapeLatex(pd.fullName) || 'Your Name'}}${data.jobTitle ? `\\enspace{\\fontsize{30}{34}\\selectfont\\color{accent}\\bfseries /}\\enspace{\\large\\color{mute} ${escapeLatex(data.jobTitle)}}` : ''}\\par
\\vspace{4pt}
{\\small\\color{mute} ${contactParts(data, '\\enspace{\\color{accent}\\textbullet}\\enspace ')}}\\par
\\vspace{2pt}

`;
  for (const key of sectionOrderOf(data)) {
    switch (key) {
      case 'objective':
        if (data.objective) tex += `\n\\section{About}\n${richText(data.objective)}`;
        break;
      case 'workExperience':
        if (hasWork(data)) {
          tex += `\n\\section{Experience}\n`;
          for (const w of data.workExperience) {
            if (!w.companyName && !w.jobTitle) continue;
            tex += `{\\bfseries\\color{dark}${escapeLatex(w.jobTitle)}} {\\color{accent}@} {\\bfseries ${escapeLatex(w.companyName)}} \\hfill {\\small\\color{mute}${dateRange(w.startDate, w.endDate)}${w.location ? ` · ${escapeLatex(w.location)}` : ''}}\\par\n`;
            tex += richText(w.description);
            tex += `\\vspace{6pt}\n`;
          }
        }
        break;
      case 'projects':
        if (hasProjects(data)) {
          tex += `\n\\section{Projects}\n`;
          for (const p of data.projects) {
            if (!p.projectName) continue;
            tex += `{\\bfseries\\color{dark}${escapeLatex(p.projectName)}}${p.link ? ` \\hfill {\\small\\color{accent}${href(p.link, escapeLatex(p.link.replace(/^https?:\/\//i, '')))}}` : ''}\\par\n`;
            tex += richText(p.description);
            tex += `\\vspace{6pt}\n`;
          }
        }
        break;
      case 'education':
        if (hasEdu(data)) {
          tex += `\n\\section{Education}\n`;
          for (const e of data.education) {
            if (!e.institution && !e.degree) continue;
            tex += `{\\bfseries\\color{dark}${escapeLatex(e.degree)}} \\hfill {\\small\\color{mute}${dateRange(e.startDate, e.endDate)}}\\par\n`;
            tex += `${escapeLatex(e.institution)}${e.location ? ` · ${escapeLatex(e.location)}` : ''}${e.gpa ? ` · GPA ${escapeLatex(e.gpa)}` : ''}\\par\n`;
            tex += richText(e.description);
            tex += `\\vspace{6pt}\n`;
          }
        }
        break;
      case 'skills':
        if (hasSkills(data)) {
          tex += `\n\\section{Skills}\n`;
          for (const s of data.skills) {
            if (s.skillType === 'individual' && s.skill) tex += `${escapeLatex(s.skill)}\\par\n`;
            else if (s.category || s.skills) tex += `{\\bfseries\\color{dark}${escapeLatex(s.category)}}\\enspace ${escapeLatex(s.skills)}\\par\\vspace{2pt}\n`;
          }
        }
        break;
      case 'certifications':
        if (hasCerts(data)) {
          tex += `\n\\section{Certifications}\n`;
          for (const c of data.certifications) {
            if (!c.certificationName) continue;
            tex += `{\\bfseries ${escapeLatex(c.certificationName)}}${c.issuingOrganization ? ` -- ${escapeLatex(c.issuingOrganization)}` : ''}${c.issueDate ? ` {\\small\\color{mute}(${escapeLatex(c.issueDate)})}` : ''}\\par\n`;
          }
        }
        break;
      case 'languages':
        if (hasLangs(data)) {
          tex += `\n\\section{Languages}\n${data.languages.filter((l) => l.language).map((l) => escapeLatex(l.language) + (l.proficiency ? ` {\\color{mute}(${escapeLatex(l.proficiency)})}` : '')).join('\\enspace{\\color{accent}\\textbullet}\\enspace ')}\n`;
        }
        break;
      case 'customSections':
        if (hasCustom(data)) {
          for (const c of data.customSections) {
            if (!c.sectionTitle && !c.content) continue;
            tex += `\n\\section{${escapeLatex(c.sectionTitle)}}\n${richText(c.content)}`;
          }
        }
        break;
    }
  }
  tex += '\n\\end{document}\n';
  return tex;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const LATEX_TEMPLATES: LatexTemplate[] = [
  {
    id: 'jakes',
    label: "Jake's",
    blurb: 'The classic single-column ATS resume — Computer Modern, small-caps sections.',
    generate: generateJakes,
  },
  {
    id: 'deedy',
    label: 'Deedy',
    blurb: 'Two-column layout with a navy left rail for contact, education and skills.',
    generate: generateDeedy,
  },
  {
    id: 'classic',
    label: 'Classic',
    blurb: 'Elegant centered serif with thin rules — timeless and understated.',
    generate: generateClassic,
  },
  {
    id: 'crimson',
    label: 'Crimson',
    blurb: 'Modern sans with a strong red accent — bold without being loud.',
    generate: generateCrimson,
  },
];

export function isLatexTemplate(id: string | undefined): boolean {
  return !!id && LATEX_TEMPLATES.some((t) => t.id === id);
}

/** Generate LaTeX for any template id — registry templates first, then the
 * legacy visual-matched styles as a fallback. */
export function generateLatex(data: ResumeData, templateId?: string): string {
  const t = LATEX_TEMPLATES.find((x) => x.id === templateId);
  if (t) return t.generate(data);
  return generateLatexFromData(data, templateId);
}
