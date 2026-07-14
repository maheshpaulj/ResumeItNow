// Every web font a template can use, loaded identically in BOTH the editor and
// the PDF render page so text metrics (and therefore pagination) match 1:1.
// System fonts (Arial, Times New Roman, Helvetica, Georgia, Verdana, Calibri)
// need no loading.
export const RESUME_FONT_FAMILIES = [
  'DM+Sans:wght@400;500;600;700',
  'Roboto:wght@400;500;700',
  'Lato:wght@400;700',
  'Open+Sans:wght@400;600;700',
  'Montserrat:wght@400;500;600;700',
  'Domine:wght@400;500;600;700',
];

export const RESUME_FONTS_HREF =
  'https://fonts.googleapis.com/css2?' +
  RESUME_FONT_FAMILIES.map((f) => `family=${f}`).join('&') +
  '&display=swap';
