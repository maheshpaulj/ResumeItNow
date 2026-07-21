import type { ResumeData } from '@/components/resume/templates/types';

// Generates LaTeX that mirrors the visual templates 1:1 — same accent color,
// section order, section titles, entry layout, and the closest TeX Live
// equivalent of the selected web font. The output is a plain-article document
// that compiles with pdflatex on a full TeX Live install (latexonline.cc),
// so LaTeX pasted from anywhere (ChatGPT, Overleaf, …) also compiles fine.

type TemplateStyle = 'modern' | 'professional' | 'minimal' | 'compact' | 'sidebar';

// ─── Escaping & rich text ─────────────────────────────────────────────────────

const LATEX_ESCAPES: Record<string, string> = {
  '\\': '\\textbackslash{}',
  '&': '\\&',
  '%': '\\%',
  '$': '\\$',
  '#': '\\#',
  '_': '\\_',
  '{': '\\{',
  '}': '\\}',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
};

export function escapeLatex(text: string | undefined): string {
  if (!text) return '';
  return text.replace(/[\\&%$#_{}~^]/g, (c) => LATEX_ESCAPES[c]);
}

/** Escape + convert the editor's markdown (bold/italic) to LaTeX. */
export function inline(text: string | undefined): string {
  return escapeLatex(text)
    .replace(/\*\*([^*]+)\*\*/g, '\\textbf{$1}')
    .replace(/\*([^*]+)\*/g, '\\textit{$1}');
}

/** URLs go into \href's first argument: only % and # need escaping there. */
function urlArg(url: string): string {
  // Any explicit scheme (https:, mailto:, …) passes through untouched.
  const withProto = /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`;
  return withProto.replace(/%/g, '\\%').replace(/#/g, '\\#');
}

export function href(url: string | undefined, label: string): string {
  if (!url) return '';
  return `\\href{${urlArg(url)}}{${label}}`;
}

/**
 * Rich-text field (descriptions, custom sections): bullet lines become itemize
 * items, plain lines become paragraphs — matching the editor's rendering.
 */
export function richText(md: string | undefined): string {
  if (!md || !md.trim()) return '';
  let out = '';
  let inList = false;
  for (const raw of md.split('\n')) {
    const line = raw.trim();
    if (!line) {
      if (inList) { out += '\\end{itemize}\n'; inList = false; }
      continue;
    }
    const bullet = line.match(/^[•*\-]\s+(.*)$/);
    if (bullet) {
      if (!inList) { out += '\\begin{itemize}\n'; inList = true; }
      out += `  \\item ${inline(bullet[1])}\n`;
    } else {
      if (inList) { out += '\\end{itemize}\n'; inList = false; }
      out += `${inline(line)}\\par\n`;
    }
  }
  if (inList) out += '\\end{itemize}\n';
  return out;
}

export function dateRange(start?: string, end?: string): string {
  const s = escapeLatex(start);
  const e = escapeLatex(end);
  if (s && e) return `${s} -- ${e}`;
  return s || e || '';
}

// ─── Fonts ────────────────────────────────────────────────────────────────────

// Closest pdflatex-compatible TeX Live package for each font the editor offers.
const FONT_PREAMBLE: Record<string, string> = {
  'DM Sans': '\\usepackage[sfdefault]{roboto}',
  'Roboto': '\\usepackage[sfdefault]{roboto}',
  'Lato': '\\usepackage[default]{lato}',
  'Open Sans': '\\usepackage[default]{opensans}',
  // montserrat.sty is missing on latexonline's TeX Live; raleway is the
  // closest available geometric sans.
  'Montserrat': '\\usepackage[default]{raleway}',
  'Domine': '\\usepackage{XCharter}',
  'Georgia': '\\usepackage{XCharter}',
  'Times New Roman': '\\usepackage{newtxtext}',
  'Arial': '\\usepackage[scaled]{helvet}\n\\renewcommand{\\familydefault}{\\sfdefault}',
  'Helvetica': '\\usepackage[scaled]{helvet}\n\\renewcommand{\\familydefault}{\\sfdefault}',
  'Verdana': '\\usepackage{DejaVuSans}\n\\renewcommand{\\familydefault}{\\sfdefault}',
  'Calibri': '\\usepackage[sfdefault]{carlito}',
};

function fontPreamble(fontFamily: string | undefined, fallback: string): string {
  const key = (fontFamily || '').trim();
  return FONT_PREAMBLE[key] || FONT_PREAMBLE[fallback] || FONT_PREAMBLE['Lato'];
}

// ─── Template identity (matches the web components' defaults) ─────────────────

const TEMPLATE_DEFAULTS: Record<TemplateStyle, { accent: string; font: string }> = {
  modern: { accent: '0E7490', font: 'Montserrat' },
  minimal: { accent: '000000', font: 'DM Sans' },
  professional: { accent: '000000', font: 'Domine' },
  compact: { accent: '1F2937', font: 'Georgia' },
  sidebar: { accent: '155E75', font: 'Lato' },
};

function accentHex(data: ResumeData, style: TemplateStyle): string {
  const raw = (data.accentColor || '').replace('#', '').trim();
  return /^[0-9a-fA-F]{6}$/.test(raw) ? raw.toUpperCase() : TEMPLATE_DEFAULTS[style].accent;
}

// px (editor margins) → inches for the geometry package.
function pxToIn(px: number): string {
  return `${(px / 96).toFixed(3)}in`;
}

function geometry(data: ResumeData): string {
  const custom = data.customMargins;
  let m = { top: 36, bottom: 36, left: 32, right: 32 };
  if (data.margins === 'narrow') m = { top: 24, bottom: 24, left: 20, right: 20 };
  else if (custom && [custom.top, custom.bottom, custom.left, custom.right].every((v) => Number.isFinite(Number(v)))) {
    m = { top: Number(custom.top), bottom: Number(custom.bottom), left: Number(custom.left), right: Number(custom.right) };
  }
  return `\\usepackage[a4paper,top=${pxToIn(m.top)},bottom=${pxToIn(m.bottom)},left=${pxToIn(m.left)},right=${pxToIn(m.right)}]{geometry}`;
}

// ─── Content presence checks ──────────────────────────────────────────────────

export const hasWork = (d: ResumeData) => d.workExperience?.some((w) => w.companyName || w.jobTitle);
export const hasEdu = (d: ResumeData) => d.education?.some((e) => e.institution || e.degree);
export const hasSkills = (d: ResumeData) => d.skills?.some((s) => s.skill || s.category);
export const hasProjects = (d: ResumeData) => d.projects?.some((p) => p.projectName);
export const hasCerts = (d: ResumeData) => d.certifications?.some((c) => c.certificationName);
export const hasLangs = (d: ResumeData) => d.languages?.some((l) => l.language);
export const hasCustom = (d: ResumeData) => d.customSections?.some((c) => c.sectionTitle || c.content);

const DEFAULT_ORDER = [
  'objective',
  'workExperience',
  'projects',
  'education',
  'skills',
  'certifications',
  'languages',
  'customSections',
];

export function sectionOrderOf(data: ResumeData): string[] {
  const order = Array.isArray(data.sectionOrder) && data.sectionOrder.length > 0
    ? [...data.sectionOrder]
    : [...DEFAULT_ORDER];
  // Anything not explicitly ordered still renders at the end (matches the editor).
  for (const key of DEFAULT_ORDER) if (!order.includes(key)) order.push(key);
  return order;
}

// ─── Shared section bodies ────────────────────────────────────────────────────

interface EntryStyle {
  /** 'title-first' → job title bold, company italic (Modern/Minimal). 'company-first' → Professional. 'one-line' → Compact. */
  work: 'title-first' | 'company-first' | 'one-line';
  entryGap: string; // \vspace between entries
}

function workBlock(data: ResumeData, s: EntryStyle): string {
  let out = '';
  for (const exp of data.workExperience) {
    if (!exp.companyName && !exp.jobTitle) continue;
    const dates = dateRange(exp.startDate, exp.endDate);
    if (s.work === 'one-line') {
      out += `\\textbf{${escapeLatex(exp.jobTitle)}}${exp.companyName ? `, ${escapeLatex(exp.companyName)}` : ''} \\hfill {\\color{mute}\\small ${dates}}\\par\n`;
    } else if (s.work === 'company-first') {
      out += `\\textbf{${escapeLatex(exp.companyName)}} \\hfill {\\color{mute}\\small ${escapeLatex(exp.location)}}\\par\n`;
      out += `\\textit{${escapeLatex(exp.jobTitle)}} \\hfill {\\color{mute}\\small ${dates}}\\par\n`;
    } else {
      out += `\\textbf{${escapeLatex(exp.jobTitle)}} \\hfill {\\color{mute}\\small ${dates}}\\par\n`;
      out += `\\textit{${escapeLatex(exp.companyName)}} \\hfill {\\color{mute}\\small ${escapeLatex(exp.location)}}\\par\n`;
    }
    out += richText(exp.description);
    out += `\\vspace{${s.entryGap}}\n\n`;
  }
  return out;
}

function projectsBlock(data: ResumeData, s: EntryStyle): string {
  let out = '';
  for (const proj of data.projects) {
    if (!proj.projectName) continue;
    out += `\\textbf{${escapeLatex(proj.projectName)}}`;
    if (proj.link) out += ` \\,{\\small ${href(proj.link, escapeLatex(proj.link.replace(/^https?:\/\//i, '')))}}`;
    out += '\\par\n';
    out += richText(proj.description);
    out += `\\vspace{${s.entryGap}}\n\n`;
  }
  return out;
}

function educationBlock(data: ResumeData, s: EntryStyle): string {
  let out = '';
  for (const edu of data.education) {
    if (!edu.institution && !edu.degree) continue;
    const dates = dateRange(edu.startDate, edu.endDate);
    out += `\\textbf{${escapeLatex(edu.degree)}}`;
    if (edu.gpa) out += ` {\\small (GPA: ${escapeLatex(edu.gpa)})}`;
    out += ` \\hfill {\\color{mute}\\small ${dates}}\\par\n`;
    out += `\\textit{${escapeLatex(edu.institution)}} \\hfill {\\color{mute}\\small ${escapeLatex(edu.location)}}\\par\n`;
    out += richText(edu.description);
    out += `\\vspace{${s.entryGap}}\n\n`;
  }
  return out;
}

function skillsBlock(data: ResumeData): string {
  let out = '';
  const individual: string[] = [];
  for (const skill of data.skills) {
    if (skill.skillType === 'individual' && skill.skill) individual.push(escapeLatex(skill.skill));
    else if (skill.category || skill.skills) {
      out += `\\textbf{${escapeLatex(skill.category)}}${skill.category ? ': ' : ''}${escapeLatex(skill.skills)}\\par\n`;
    }
  }
  if (individual.length) out += individual.join(' $\\cdot$ ') + '\\par\n';
  return out;
}

function certsBlock(data: ResumeData): string {
  let out = '\\begin{itemize}\n';
  for (const cert of data.certifications) {
    if (!cert.certificationName) continue;
    let line = `  \\item \\textbf{${escapeLatex(cert.certificationName)}}`;
    if (cert.issuingOrganization) line += ` -- ${escapeLatex(cert.issuingOrganization)}`;
    if (cert.issueDate) line += ` {\\color{mute}\\small (${escapeLatex(cert.issueDate)})}`;
    out += line + '\n';
  }
  out += '\\end{itemize}\n';
  return out;
}

function langsLine(data: ResumeData): string {
  return data.languages
    .filter((l) => l.language)
    .map((l) => escapeLatex(l.language) + (l.proficiency ? ` {\\color{mute}\\small (${escapeLatex(l.proficiency)})}` : ''))
    .join(' $\\cdot$ ') + '\\par\n';
}

interface SectionTitles {
  objective: string;
  workExperience: string;
  projects: string;
  education: string;
  skills: string;
  certifications: string;
  languages: string;
}

const STANDARD_TITLES: SectionTitles = {
  objective: 'Professional Summary',
  workExperience: 'Work Experience',
  projects: 'Projects',
  education: 'Education',
  skills: 'Skills',
  certifications: 'Certifications',
  languages: 'Languages',
};

const COMPACT_TITLES: SectionTitles = {
  objective: 'Summary',
  workExperience: 'Experience',
  projects: 'Projects',
  education: 'Education',
  skills: 'Skills',
  certifications: 'Certifications',
  languages: 'Languages',
};

/** Renders every section in the resume's own order using \section{...}. */
function orderedSections(data: ResumeData, titles: SectionTitles, s: EntryStyle, skip: string[] = []): string {
  let out = '';
  for (const key of sectionOrderOf(data)) {
    if (skip.includes(key)) continue;
    switch (key) {
      case 'objective':
        if (data.objective) out += `\\section{${titles.objective}}\n${richText(data.objective)}\n`;
        break;
      case 'workExperience':
        if (hasWork(data)) out += `\\section{${titles.workExperience}}\n${workBlock(data, s)}`;
        break;
      case 'projects':
        if (hasProjects(data)) out += `\\section{${titles.projects}}\n${projectsBlock(data, s)}`;
        break;
      case 'education':
        if (hasEdu(data)) out += `\\section{${titles.education}}\n${educationBlock(data, s)}`;
        break;
      case 'skills':
        if (hasSkills(data)) out += `\\section{${titles.skills}}\n${skillsBlock(data)}`;
        break;
      case 'certifications':
        if (hasCerts(data)) out += `\\section{${titles.certifications}}\n${certsBlock(data)}`;
        break;
      case 'languages':
        if (hasLangs(data)) out += `\\section{${titles.languages}}\n${langsLine(data)}`;
        break;
      case 'customSections':
        if (hasCustom(data)) {
          for (const custom of data.customSections) {
            if (!custom.sectionTitle && !custom.content) continue;
            out += `\\section{${escapeLatex(custom.sectionTitle)}}\n${richText(custom.content)}\n`;
          }
        }
        break;
    }
  }
  return out;
}

// ─── Shared preamble pieces ───────────────────────────────────────────────────

function basePreamble(data: ResumeData, style: TemplateStyle, pt: 9 | 10 | 11): string {
  return `\\documentclass[a4paper,${pt}pt]{article}
% ── Generated by ResumeItNow to match the "${style}" template. ──
% Edit freely — this is standard LaTeX. Recompile with the ▶ button.
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
${geometry(data)}
${fontPreamble(data.fontFamily, TEMPLATE_DEFAULTS[style].font)}
\\usepackage[hidelinks]{hyperref}
\\usepackage{enumitem}
\\usepackage{xcolor}
\\usepackage{titlesec}
\\definecolor{accent}{HTML}{${accentHex(data, style)}}
\\definecolor{mute}{HTML}{4B5563}
\\colorlet{accentsub}{accent!80!white}
\\colorlet{accentmute}{accent!60!white}
\\setlist[itemize]{nosep,topsep=1pt,leftmargin=14pt,itemsep=1pt}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{1pt}
\\pagestyle{empty}
\\raggedbottom
`;
}

// NB: \; is math-mode-only — use \enspace for text-mode separator spacing.
function contactLine(data: ResumeData, sep = '\\enspace{\\color{accentmute}\\textbar}\\enspace '): string {
  const pd = data.personalDetails;
  const items: string[] = [];
  if (pd.email) items.push(href(`mailto:${pd.email}`.replace('https://', ''), escapeLatex(pd.email)));
  if (pd.phone) items.push(escapeLatex(pd.phone));
  if (pd.location) items.push(escapeLatex(pd.location));
  if (pd.linkedin) items.push(href(pd.linkedin, escapeLatex(pd.linkedin.replace(/^https?:\/\/(www\.)?/i, ''))));
  if (pd.github) items.push(href(pd.github, escapeLatex(pd.github.replace(/^https?:\/\/(www\.)?/i, ''))));
  if (pd.website) items.push(href(pd.website, escapeLatex(pd.website.replace(/^https?:\/\/(www\.)?/i, ''))));
  return items.join(sep);
}

// ─── Templates ────────────────────────────────────────────────────────────────

// Modern: left-aligned accent name + lighter job title, accent section titles
// with a thick accent rule filling the rest of the line.
function generateModern(data: ResumeData): string {
  const s: EntryStyle = { work: 'title-first', entryGap: '4pt' };
  let tex = basePreamble(data, 'modern', 10);
  tex += `\\titleformat{\\section}{\\large\\bfseries\\color{accent}}{}{0pt}{}[{\\color{accent}\\vspace{-6pt}\\rule{\\textwidth}{1.6pt}}]
\\titlespacing{\\section}{0pt}{10pt}{6pt}

\\begin{document}

{\\fontsize{24}{28}\\selectfont\\bfseries\\color{accent} ${escapeLatex(data.personalDetails.fullName) || 'Your Name'}}${data.jobTitle ? `\\enspace{\\large\\color{accentsub} ${escapeLatex(data.jobTitle)}}` : ''}\\par
\\vspace{4pt}
{\\small\\color{accentmute} ${contactLine(data)}}\\par
\\vspace{6pt}

`;
  tex += orderedSections(data, STANDARD_TITLES, s);
  tex += '\n\\end{document}\n';
  return tex;
}

// Minimal: black left-aligned header, plain bold section titles over a dark rule.
function generateMinimal(data: ResumeData): string {
  const s: EntryStyle = { work: 'title-first', entryGap: '4pt' };
  let tex = basePreamble(data, 'minimal', 10);
  tex += `\\definecolor{ruledark}{HTML}{1F2937}
\\titleformat{\\section}{\\large\\bfseries}{}{0pt}{}[{\\color{ruledark}\\vspace{-4pt}\\rule{\\textwidth}{1.2pt}}]
\\titlespacing{\\section}{0pt}{10pt}{6pt}

\\begin{document}

{\\fontsize{22}{26}\\selectfont\\bfseries ${escapeLatex(data.personalDetails.fullName) || 'Your Name'}}\\par
${data.jobTitle ? `{\\large\\color{mute} ${escapeLatex(data.jobTitle)}}\\par\n` : ''}\\vspace{3pt}
{\\small\\color{mute} ${contactLine(data, '\\enspace\\textbar\\enspace ')}}\\par
\\vspace{6pt}

`;
  tex += orderedSections(data, STANDARD_TITLES, s);
  tex += '\n\\end{document}\n';
  return tex;
}

// Professional: centered serif header, centered section titles over a dark rule.
function generateProfessional(data: ResumeData): string {
  const s: EntryStyle = { work: 'company-first', entryGap: '5pt' };
  let tex = basePreamble(data, 'professional', 11);
  tex += `\\definecolor{ruledark}{HTML}{1F2937}
\\titleformat{\\section}{\\large\\bfseries\\filcenter}{}{0pt}{}[{\\color{ruledark}\\vspace{-4pt}\\rule{\\textwidth}{1.2pt}}]
\\titlespacing{\\section}{0pt}{10pt}{6pt}

\\begin{document}

\\begin{center}
  {\\fontsize{22}{26}\\selectfont\\bfseries ${escapeLatex(data.personalDetails.fullName) || 'Your Name'}}\\\\[3pt]
${data.jobTitle ? `  {\\large\\color{mute} ${escapeLatex(data.jobTitle)}}\\\\[3pt]\n` : ''}  {\\small\\color{mute} ${contactLine(data, '\\enspace\\textbar\\enspace ')}}
\\end{center}
\\vspace{4pt}

`;
  tex += orderedSections(data, STANDARD_TITLES, s);
  tex += '\n\\end{document}\n';
  return tex;
}

// Compact: dense 9pt, name left / contacts right, uppercase letterspaced
// section titles over a hairline accent rule.
function generateCompact(data: ResumeData): string {
  const s: EntryStyle = { work: 'one-line', entryGap: '2pt' };
  let tex = basePreamble(data, 'compact', 9);
  tex += `\\usepackage[normalem]{ulem}
\\titleformat{\\section}{\\small\\bfseries\\color{accent}}{}{0pt}{\\MakeUppercase}[{\\color{accent}\\vspace{-5pt}\\rule{\\textwidth}{0.5pt}}]
\\titlespacing{\\section}{0pt}{7pt}{4pt}

\\begin{document}

{\\fontsize{17}{20}\\selectfont\\bfseries ${escapeLatex(data.personalDetails.fullName) || 'Your Name'}}${data.jobTitle ? ` {\\color{mute} --- ${escapeLatex(data.jobTitle)}}` : ''} \\hfill {\\footnotesize\\color{mute} ${contactLine(data, ' \\textbar\\ ')}}\\par
{\\color{accent}\\rule{\\textwidth}{0.5pt}}\\par
\\vspace{3pt}

`;
  tex += orderedSections(data, COMPACT_TITLES, s);
  tex += '\n\\end{document}\n';
  return tex;
}

// Sidebar: gray left column (contact / skills / languages) + main right column,
// built with paracol so the columns flow across pages like the web template.
function generateSidebar(data: ResumeData): string {
  const s: EntryStyle = { work: 'title-first', entryGap: '4pt' };
  let tex = basePreamble(data, 'sidebar', 10);
  tex += `\\usepackage{paracol}
\\definecolor{sidebg}{HTML}{F1F5F9}
\\columnratio{0.32}
\\setlength{\\columnsep}{18pt}
\\backgroundcolor{c[0](6pt,6pt)(6pt,6pt)}{sidebg}
\\newcommand{\\sidehead}[1]{{\\small\\bfseries\\color{accent}\\MakeUppercase{#1}}\\par\\vspace{3pt}}
\\titleformat{\\section}{\\large\\bfseries\\color{accent}}{}{0pt}{}
\\titlespacing{\\section}{0pt}{10pt}{4pt}

\\begin{document}

{\\fontsize{22}{26}\\selectfont\\bfseries\\color{accent} ${escapeLatex(data.personalDetails.fullName) || 'Your Name'}}\\par
${data.jobTitle ? `{\\large\\color{mute} ${escapeLatex(data.jobTitle)}}\\par\n` : ''}\\vspace{8pt}

\\begin{paracol}{2}
\\raggedright
\\sidehead{Contact}
{\\small
`;
  const pd = data.personalDetails;
  if (pd.email) tex += `${href(`mailto:${pd.email}`, escapeLatex(pd.email))}\\par\\vspace{2pt}\n`;
  if (pd.phone) tex += `${escapeLatex(pd.phone)}\\par\\vspace{2pt}\n`;
  if (pd.location) tex += `${escapeLatex(pd.location)}\\par\\vspace{2pt}\n`;
  if (pd.linkedin) tex += `${href(pd.linkedin, escapeLatex(pd.linkedin.replace(/^https?:\/\/(www\.)?/i, '')))}\\par\\vspace{2pt}\n`;
  if (pd.github) tex += `${href(pd.github, escapeLatex(pd.github.replace(/^https?:\/\/(www\.)?/i, '')))}\\par\\vspace{2pt}\n`;
  if (pd.website) tex += `${href(pd.website, escapeLatex(pd.website.replace(/^https?:\/\/(www\.)?/i, '')))}\\par\\vspace{2pt}\n`;
  tex += `}
`;
  if (hasSkills(data)) {
    tex += `\\vspace{8pt}
\\sidehead{Skills}
{\\small
${skillsBlock(data)}}
`;
  }
  if (hasLangs(data)) {
    tex += `\\vspace{8pt}
\\sidehead{Languages}
{\\small
${langsLine(data)}}
`;
  }
  tex += `
\\switchcolumn

`;
  // Right column: everything else, in the resume's own section order.
  tex += orderedSections(data, STANDARD_TITLES, s, ['skills', 'languages']);
  tex += `\\end{paracol}

\\end{document}
`;
  return tex;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function generateLatexFromData(data: ResumeData, template?: string): string {
  const style = (template || data.template || 'modern') as TemplateStyle;
  switch (style) {
    case 'professional': return generateProfessional(data);
    case 'minimal': return generateMinimal(data);
    case 'compact': return generateCompact(data);
    case 'sidebar': return generateSidebar(data);
    case 'modern':
    default: return generateModern(data);
  }
}
