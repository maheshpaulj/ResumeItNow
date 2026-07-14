// Shared pagination used by BOTH the editor canvas and the PDF render page so
// the on-screen pages and the exported pages break at the exact same blocks.
//
// A resume is a continuous flow of "atomic" blocks (section headers and entries,
// all marked with `break-inside-avoid` / `data-rb="header"`). We walk them in
// order and decide where each printed page ends:
//   • auto break — the first block that would cross the page's usable height.
//   • manual break — a block flagged `data-break-after` forces the next block
//     onto a new page (user control).
//
// mode "push"  (editor): the break block gets a top-margin spacer so it visually
//                        drops to the next page frame; returns the page starts.
// mode "break" (export): the break block gets `break-before: page`; Chrome then
//                        starts a new PDF page there — matching the editor 1:1.

// total vertical page margin (top+bottom). 36px each matches the PDF print margin.
export const PAGE_MARGIN_Y = 72;
export const PAGE_MARGIN_Y_NARROW = 48;
// on-screen gray gap between page frames (editor only)
export const PAGE_VISUAL_GAP = 40;

/** Flag the wrappers the user forced a page break after (matched by data-rbkey). */
export function applyManualBreaks(content: HTMLElement, keys: string[]) {
  content
    .querySelectorAll<HTMLElement>('[data-break-after]')
    .forEach((el) => delete el.dataset.breakAfter);
  keys.forEach((k) => {
    const el = content.querySelector<HTMLElement>(`[data-rbkey="${k}"]`);
    if (el) el.dataset.breakAfter = '1';
  });
}

export interface PaginateOpts {
  contentPerPage: number;
  gap: number;
  mode: 'push' | 'break';
}

export function paginate(
  content: HTMLElement,
  { contentPerPage, gap, mode }: PaginateOpts
): number[] {
  // ---- reset any marks from a previous pass ----
  content.querySelectorAll<HTMLElement>('[data-page-spacer]').forEach((el) => {
    el.style.marginTop = el.dataset.origMt || '';
    delete el.dataset.pageSpacer;
    delete el.dataset.origMt;
  });
  content.querySelectorAll<HTMLElement>('[data-page-break]').forEach((el) => {
    el.style.breakBefore = '';
    delete el.dataset.pageBreak;
  });

  // offsetTop-based measurement ignores CSS transforms (zoom / dnd animations).
  const topOf = (el: HTMLElement) => {
    let y = 0;
    let node: HTMLElement | null = el;
    while (node && node !== content) {
      y += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    return y;
  };
  const bottomOf = (el: HTMLElement) => topOf(el) + el.offsetHeight;

  const rawCandidates = Array.from(
    content.querySelectorAll<HTMLElement>(
      '.break-inside-avoid, .break-inside-avoid-line, [data-rb="header"], [data-rich-text="true"] > div'
    )
  );

  // Tag rich-text children so they match entry-content rules during live editing
  rawCandidates.forEach((c) => {
    if (c.parentElement?.dataset.richText === 'true') {
      c.dataset.rb = 'entry-content';
    }
  });

  const candidates = rawCandidates.sort((a, b) => topOf(a) - topOf(b));

  // Manual breaks: a block flagged `data-break-after` forces the *next* atomic
  // block onto a fresh page.
  const forced = new Set<HTMLElement>();
  content.querySelectorAll<HTMLElement>('[data-break-after]').forEach((marker) => {
    const mb = bottomOf(marker);
    const next = candidates.find((c) => topOf(c) >= mb - 1 && !marker.contains(c) && marker !== c);
    if (next) forced.add(next);
  });

  const starts: number[] = [0];
  const firstTop = candidates.length > 0 ? topOf(candidates[0]) : 0;
  let limit = firstTop + contentPerPage;
  let i = 0;

  for (let guard = 0; guard < 80; guard += 1) {
    if (limit >= content.scrollHeight - 8 && forced.size === 0) break;

    // Advance to the next block that must break: either forced onto a new page,
    // or the first block whose bottom exceeds the current page's usable height.
    let target: HTMLElement | null = null;
    const pageTop = starts[starts.length - 1];
    while (i < candidates.length) {
      const c = candidates[i];
      if (forced.has(c) && topOf(c) > pageTop + 1) {
        target = c;
        break;
      }
      if (bottomOf(c) > limit + 0.5) {
        target = c;
        break;
      }
      i += 1;
    }
    if (!target) break;

    // Keep a section header glued to the block that follows it.
    const idx = candidates.indexOf(target);
    const prev = idx > 0 ? candidates[idx - 1] : null;
    if (
      prev &&
      prev.dataset.rb === 'header' &&
      !prev.dataset.pageSpacer &&
      !forced.has(target) &&
      topOf(prev) < limit &&
      topOf(target) - bottomOf(prev) < 40
    ) {
      target = prev;
    } else if (
      prev &&
      prev.dataset.rb === 'entry-header' &&
      target.dataset.rb === 'entry-content' &&
      prev.closest('[data-rb="entry"]') === target.closest('[data-rb="entry"]') &&
      !prev.dataset.pageSpacer &&
      !forced.has(target)
    ) {
      target = prev;
    }

    const blockH = bottomOf(target) - topOf(target);
    if (topOf(target) < limit && blockH > contentPerPage && !forced.has(target)) {
      // Block taller than a whole page — let it split naturally.
      starts.push(limit);
      limit += contentPerPage;
      i = candidates.indexOf(target) + 1;
      continue;
    }

    if (mode === 'push') {
      const push = Math.max(0, limit + gap - topOf(target));
      if (push > 0) {
        const base = parseFloat(getComputedStyle(target).marginTop) || 0;
        target.dataset.origMt = target.style.marginTop || '';
        target.dataset.pageSpacer = '1';
        target.style.marginTop = `${base + push}px`;
        const shortfall = limit + gap - topOf(target);
        if (shortfall > 0.5) target.style.marginTop = `${base + push + shortfall}px`;
      }
    } else {
      target.style.breakBefore = 'page';
      target.dataset.pageBreak = '1';
    }

    // The break block now sits at the top of a new page (its pushed position in
    // push mode, its original position in break mode since content isn't moved).
    const newTop = topOf(target);
    starts.push(newTop);
    limit = newTop + contentPerPage;
    i = candidates.indexOf(target) + 1;
  }

  return starts;
}
