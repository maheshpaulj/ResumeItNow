"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Check,
  Cloud,
  Code2,
  Download,
  Eye,
  EyeOff,
  GripVertical,
  Layers,
  LayoutTemplate,
  Loader2,
  Maximize,
  Palette,
  ZoomIn,
  ZoomOut,
  Bold,
  Italic,
  Underline,
  Heading2,
  List,
  ListOrdered,
  Link2,
  Play,
  AlertTriangle,
  RefreshCw,
  Wand2,
  Undo2,
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RESUME_FONTS_HREF } from '@/lib/fonts';
import { paginate, applyManualBreaks } from '@/lib/paginate';
import type { ResumeData } from './types';
import { useSession } from 'next-auth/react';
import { ModernTemplate } from '@/components/resume/templates/Modern';
import { MinimalTemplate } from '@/components/resume/templates/Minimal';
import { ProfessionalTemplate } from '@/components/resume/templates/Professional';
import { CompactTemplate } from '@/components/resume/templates/Compact';
import { SidebarTemplate } from '@/components/resume/templates/Sidebar';
import LatexEditor from '@/components/resume/editor/LatexEditor';
import { LATEX_TEMPLATES, isLatexTemplate } from '@/lib/latexTemplates';
import {
  EditorContext,
  ENTRY_DEFAULTS,
  type ArraySection,
} from '@/components/resume/editor/context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const TEMPLATES = {
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  professional: ProfessionalTemplate,
  compact: CompactTemplate,
  sidebar: SidebarTemplate,
} as const;

type TemplateKey = keyof typeof TEMPLATES;

const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  modern: 'Modern',
  minimal: 'Minimal',
  professional: 'Professional',
  compact: 'Compact',
  sidebar: 'Sidebar',
};

// One-click accent presets for the Design popover.
const ACCENT_PRESETS = [
  '#111827', // near-black
  '#1e3a8a', // navy
  '#0e7490', // teal
  '#047857', // emerald
  '#b91c1c', // red
  '#c2410c', // orange
  '#7c3aed', // violet
  '#be185d', // pink
];

// 96dpi CSS pixels. Content height excludes the 24px top/bottom print margins
// used by /api/pdf, so the on-screen guides match the real page breaks.
const PAGE_FORMATS = {
  a4: { label: 'A4', width: 794, height: 1123 },
  letter: { label: 'US Letter', width: 816, height: 1056 },
} as const;

type PageFormat = keyof typeof PAGE_FORMATS;
const getPageMarginY = (margins: 'normal' | 'narrow') => margins === 'narrow' ? 48 : 72;
// distance between one page's last content line and the next page's first
// (both pages' print margins plus the visible gray gap of ~40px)
const getPageGap = (margins: 'normal' | 'narrow') => getPageMarginY(margins) + 40;

const DEFAULT_SECTION_ORDER = [
  'objective',
  'workExperience',
  'projects',
  'education',
  'skills',
  'certifications',
  'languages',
  'customSections',
];

const SECTION_LABELS: Record<string, string> = {
  objective: 'Professional Summary',
  workExperience: 'Work Experience',
  projects: 'Projects',
  education: 'Education',
  skills: 'Skills',
  certifications: 'Certifications',
  languages: 'Languages',
  customSections: 'Custom Sections',
};

const FONT_OPTIONS = [
  'DM Sans',
  'Arial',
  'Times New Roman',
  'Helvetica',
  'Georgia',
  'Roboto',
  'Lato',
  'Open Sans',
  'Verdana',
  'Calibri',
];

type SaveStatus = 'saved' | 'dirty' | 'saving' | 'error';

function SortableSectionRow({
  section,
  hidden,
  onToggleVisibility,
}: {
  section: string;
  hidden: boolean;
  onToggleVisibility: (section: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `panel-${section}` });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center justify-between rounded-md border bg-card p-2 select-none ${
        isDragging ? 'z-10 shadow-lg ring-2 ring-primary/30' : 'shadow-sm'
      } ${hidden ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-accent touch-none"
          aria-label={`Drag to reorder ${SECTION_LABELS[section] ?? section}`}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-medium">{SECTION_LABELS[section] ?? section}</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onToggleVisibility(section)}
        aria-label={hidden ? 'Show section' : 'Hide section'}
      >
        {hidden ? (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

function SaveStatusChip({ status }: { status: SaveStatus }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground"
      aria-live="polite"
    >
      {status === 'saving' ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : status === 'error' ? (
        <Cloud className="h-3 w-3 text-red-500" />
      ) : status === 'dirty' ? (
        <Cloud className="h-3 w-3" />
      ) : (
        <Check className="h-3 w-3 text-emerald-500" />
      )}
      {status === 'saving'
        ? 'Saving…'
        : status === 'error'
        ? 'Save failed'
        : status === 'dirty'
        ? 'Unsaved'
        : 'Saved'}
    </div>
  );
}

export default function ResumeView({
  resumeData: initialResumeData,
  resumeId,
}: {
  resumeData: ResumeData & {
    template?: string;
    accentColor?: string;
    fontFamily?: string;
    sectionOrder?: string[];
    hiddenSections?: string[];
    showIcons?: boolean;
    pageFormat?: string;
    margins?: 'normal' | 'narrow' | 'custom';
    customMargins?: { top: number; bottom: number; left: number; right: number };
  };
  resumeId: string;
}) {
  const [resumeData, setResumeData] = useState(initialResumeData);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>(
    initialResumeData.template && initialResumeData.template in TEMPLATES
      ? (initialResumeData.template as TemplateKey)
      : 'modern'
  );
  const [accentColor, setAccentColor] = useState(initialResumeData.accentColor || '#000000');
  const [fontFamily, setFontFamily] = useState(initialResumeData.fontFamily || 'DM Sans');
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    const saved = initialResumeData.sectionOrder || [];
    return [...saved, ...DEFAULT_SECTION_ORDER.filter((s) => !saved.includes(s))];
  });
  const [hiddenSections, setHiddenSections] = useState<string[]>(
    initialResumeData.hiddenSections || []
  );
  const [showIcons, setShowIcons] = useState(initialResumeData.showIcons ?? true);
  const [showPhoto, setShowPhoto] = useState(initialResumeData.showPhoto ?? false);
  const [pageBreaks, setPageBreaks] = useState<string[]>(
    (initialResumeData as { pageBreaks?: string[] }).pageBreaks || []
  );
  const [pageFormat, setPageFormat] = useState<PageFormat>(
    initialResumeData.pageFormat === 'letter' ? 'letter' : 'a4'
  );
  const [margins, setMargins] = useState<'normal' | 'narrow' | 'custom'>(
    initialResumeData.margins || 'normal'
  );
  const [customMargins, setCustomMargins] = useState<{
    top: number;
    bottom: number;
    left: number;
    right: number;
  }>(() => {
    return initialResumeData.customMargins || { top: 36, bottom: 36, left: 32, right: 32 };
  });
  // Fixed at creation time — visual and LaTeX resumes are separate worlds now.
  const [editorMode] = useState<'visual' | 'latex'>(
    initialResumeData.editorMode || 'visual'
  );
  const [isSectionsOpen, setIsSectionsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [containerWidth, setContainerWidth] = useState<number>(PAGE_FORMATS.a4.width);
  const [pageHeight, setPageHeight] = useState<number>(0);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const activeLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);
  const { data: session } = useSession();

  /* ────────────────── AI Auto-Fit state ────────────────── */
  const [isAutoFitting, setIsAutoFitting] = useState(false);
  const [autoFitProgress, setAutoFitProgress] = useState(0);
  const [autoFitSnapshot, setAutoFitSnapshot] = useState<{
    template: TemplateKey;
    margins: 'normal' | 'narrow' | 'custom';
    hiddenSections: string[];
  } | null>(null);
 
  // LaTeX Editor Toolbar Sync States & Refs
  const [latexAutoCompile, setLatexAutoCompile] = useState(true);
  // LaTeX resumes store a LaTeX-template id in `template` (e.g. "jakes");
  // fall back to a registry default for docs created before the split.
  const [activeLatexTemplate, setActiveLatexTemplate] = useState<string>(() =>
    isLatexTemplate(initialResumeData.template) ? (initialResumeData.template as string) : 'jakes'
  );
  const [showLatexPreview, setShowLatexPreview] = useState(true);
  const [latexCompileStatus, setLatexCompileStatus] = useState<'idle' | 'compiling' | 'success' | 'error'>('idle');
  const executeLatexActionRef = useRef<((action: string) => void) | null>(null);
  const recompileLatexRef = useRef<(() => void) | null>(null);
  const regenerateLatexRef = useRef<((templateId?: string) => void) | null>(null);

  const page = PAGE_FORMATS[pageFormat];
  const resolvedMargins = useMemo(() => {
    if (margins === 'narrow') {
      return { top: 24, bottom: 24, left: 20, right: 20 };
    }
    if (margins === 'normal') {
      return { top: 36, bottom: 36, left: 32, right: 32 };
    }
    const top = Number(customMargins?.top);
    const bottom = Number(customMargins?.bottom);
    const left = Number(customMargins?.left);
    const right = Number(customMargins?.right);
    return {
      top: isNaN(top) ? 36 : top,
      bottom: isNaN(bottom) ? 36 : bottom,
      left: isNaN(left) ? 32 : left,
      right: isNaN(right) ? 32 : right,
    };
  }, [margins, customMargins]);

  const pageMarginY = resolvedMargins.top + resolvedMargins.bottom;
  const pageGap = pageMarginY + 40;
  const contentPerPage = page.height - pageMarginY;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /* ------------------------------ measurements ------------------------------ */

  // Both observers key on editorMode: when the page mounts in LaTeX mode the
  // visual canvas (and pageRef) doesn't exist yet, so a mount-only effect would
  // never attach — leaving pagination permanently stale after switching back
  // to visual (headers stranded at page bottoms, entries split mid-block).
  useEffect(() => {
    if (editorMode !== 'visual') return;
    const el = previewContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) =>
      setContainerWidth(entries[0].contentRect.width)
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [editorMode]);

  // Content height changes (fonts finishing, images, dnd drops, edits) both
  // resize the outer frame and re-trigger pagination, debounced. repaginate is
  // idempotent, so the resize it causes converges instead of looping.
  const repaginateRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (editorMode !== 'visual') return;
    const el = pageRef.current;
    if (!el) return;
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const observer = new ResizeObserver((entries) => {
      setPageHeight(entries[0].contentRect.height);
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => repaginateRef.current(), 250);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (debounce) clearTimeout(debounce);
    };
  }, [editorMode]);

  const scale = zoom === 'fit' ? Math.min(1, containerWidth / page.width) : zoom;

  const visibleSectionOrder = useMemo(
    () => sectionOrder.filter((s) => !hiddenSections.includes(s)),
    [sectionOrder, hiddenSections]
  );

  /* -------------------------------- pagination -------------------------------
   * True WYSIWYG pagination: any atomic block (entry or section header) that
   * would straddle a page boundary is pushed below it with a margin spacer —
   * exactly what Chrome's print engine does with break-inside-avoid. The canvas
   * then renders each page as its own white sheet with a gray gap in between.
   * pageStarts holds each page's first content-Y (content coordinates).
   */
  const [pageStarts, setPageStarts] = useState<number[]>([0]);
  const [canvasMin, setCanvasMin] = useState<number>(0);

  const repaginate = useCallback(() => {
    const content = pageRef.current;
    if (!content) return;

    applyManualBreaks(content, pageBreaks);
    const starts = paginate(content, { contentPerPage, gap: pageGap, mode: 'push' });
    const limit = starts[starts.length - 1] + contentPerPage;

    setPageStarts((prev) =>
      prev.length === starts.length && prev.every((v, k) => Math.abs(v - starts[k]) < 0.5)
        ? prev
        : starts
    );
    setCanvasMin((prev) => (Math.abs(prev - limit) < 0.5 ? prev : limit));
  }, [contentPerPage, pageGap, pageBreaks]);

  useEffect(() => {
    repaginateRef.current = repaginate;
  }, [repaginate]);

  // No dependency array on purpose: this runs after EVERY commit. Any render
  // (autosave chip, hover tracking, edits …) can reflow or remount template
  // DOM and silently drop the paginator's margin spacers, so pagination must
  // be re-asserted before each paint. repaginate is idempotent and only sets
  // state when the page starts actually change, so this cannot loop.
  // The follow-up timeout re-runs it in a settled context: layout measured
  // inside React's commit can differ slightly from the final layout (fields,
  // chrome and toolbars finish mounting), and a stale 36px here is exactly a
  // page-margin's worth of drift on every page boundary.
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useLayoutEffect(() => {
    repaginate();
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => repaginateRef.current(), 60);
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  });

  useEffect(() => {
    // fonts loading late shifts every measurement
    document.fonts?.ready?.then(() => repaginate());
  }, [repaginate]);

  /* --------------------------------- autosave -------------------------------- */

  function flattenObject(obj: any, parentKey = ''): { [key: string]: any } { // eslint-disable-line @typescript-eslint/no-explicit-any
    return Object.keys(obj).reduce((acc, key) => {
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      if (Array.isArray(obj[key])) {
        return { ...acc, [newKey]: obj[key] };
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        return { ...acc, ...flattenObject(obj[key], newKey) };
      }
      return { ...acc, [newKey]: obj[key] };
    }, {});
  }

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSaveStatus('dirty');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const userEmail = session?.user?.email || 'temp_resumes';
        await updateDoc(
          doc(db, `users/${userEmail}/resumes/${resumeId}`),
          flattenObject({
            ...resumeData,
            template: editorMode === 'latex' ? activeLatexTemplate : selectedTemplate,
            accentColor,
            fontFamily,
            sectionOrder,
            hiddenSections,
            showIcons,
            showPhoto,
            pageFormat,
            editorMode,
            margins,
            customMargins,
            pageBreaks,
            updatedAt: new Date().toISOString(),
          })
        );
        localStorage.setItem('resumeitnow_template', selectedTemplate);
        setSaveStatus('saved');
      } catch (error) {
        console.error('Autosave failed:', error);
        setSaveStatus('error');
      }
    }, 1200);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    resumeData,
    selectedTemplate,
    activeLatexTemplate,
    accentColor,
    fontFamily,
    sectionOrder,
    hiddenSections,
    showIcons,
    showPhoto,
    pageFormat,
    editorMode,
    margins,
    customMargins,
    pageBreaks,
  ]);

  /* ------------------------------ data mutations ----------------------------- */

  const updateField = <T extends keyof ResumeData>(
    section: T,
    index: number | null,
    field: string,
    value: string
  ) => {
    setResumeData((prev) => {
      if (index === null) {
        if (section === 'personalDetails') {
          return { ...prev, personalDetails: { ...prev.personalDetails, [field]: value } };
        }
        if (section === 'objective') return { ...prev, objective: value };
        if (section === 'jobTitle') return { ...prev, jobTitle: value };
        return prev;
      }
      const sectionArray = [...(prev[section] as any[])]; // eslint-disable-line @typescript-eslint/no-explicit-any
      sectionArray[index] = { ...sectionArray[index], [field]: value };
      return { ...prev, [section]: sectionArray };
    });
  };

  const addEntry = useCallback((section: ArraySection, afterIndex?: number) => {
    setResumeData((prev) => {
      const arr = [...((prev[section] as object[]) || [])];
      const insertAt = afterIndex === undefined ? arr.length : afterIndex + 1;
      arr.splice(insertAt, 0, { ...ENTRY_DEFAULTS[section] });
      return { ...prev, [section]: arr };
    });
  }, []);

  const removeEntry = useCallback((section: ArraySection, index: number) => {
    setResumeData((prev) => {
      const arr = [...((prev[section] as object[]) || [])];
      arr.splice(index, 1);
      return { ...prev, [section]: arr };
    });
  }, []);

  const moveEntry = useCallback(
    (section: ArraySection, index: number, direction: -1 | 1) => {
      setResumeData((prev) => {
        const arr = [...((prev[section] as object[]) || [])];
        const target = index + direction;
        if (target < 0 || target >= arr.length) return prev;
        [arr[index], arr[target]] = [arr[target], arr[index]];
        return { ...prev, [section]: arr };
      });
    },
    []
  );

  const hideSection = useCallback((section: string) => {
    setHiddenSections((prev) => (prev.includes(section) ? prev : [...prev, section]));
    toast({
      title: 'Section hidden',
      description: 'Bring it back any time from the Sections panel.',
      duration: 2500,
    });
  }, []);

  const toggleSectionVisibility = (section: string) => {
    setHiddenSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  // Swap a section with its nearest *visible* neighbour so hidden sections
  // don't swallow the move.
  const moveSection = useCallback(
    (section: string, direction: -1 | 1) => {
      setSectionOrder((order) => {
        const visible = order.filter((s) => !hiddenSections.includes(s));
        const vIndex = visible.indexOf(section);
        const neighbour = visible[vIndex + direction];
        if (vIndex === -1 || !neighbour) return order;
        const next = [...order];
        const a = next.indexOf(section);
        const b = next.indexOf(neighbour);
        [next[a], next[b]] = [next[b], next[a]];
        return next;
      });
    },
    [hiddenSections]
  );

  const toggleBreak = useCallback((key: string) => {
    setPageBreaks((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  /* ────────────────── AI Auto-Fit handler ────────────────── */
  const handleAutoFit = useCallback(async () => {
    if (isAutoFitting) return;
    setIsAutoFitting(true);
    setAutoFitProgress(5);

    // Save snapshot for undo
    setAutoFitSnapshot({
      template: selectedTemplate,
      margins,
      hiddenSections: [...hiddenSections],
    });

    // Simulated progress animation
    const progressInterval = setInterval(() => {
      setAutoFitProgress((p) => {
        if (p < 40) return p + Math.random() * 8;
        if (p < 75) return p + Math.random() * 4;
        if (p < 92) return p + Math.random() * 1.5;
        return Math.min(p + 0.3, 96);
      });
    }, 300);

    try {
      const res = await fetch('/api/auto-fit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData,
          currentTemplate: selectedTemplate,
          currentMargins: margins,
          pageCount: pageStarts.length,
        }),
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Auto-fit failed');
      }

      const { result } = await res.json();

      // Apply result
      setAutoFitProgress(100);
      await new Promise((r) => setTimeout(r, 300));

      if (result.template && result.template in TEMPLATES) {
        setSelectedTemplate(result.template as TemplateKey);
      }
      if (result.margins) {
        setMargins(result.margins);
      }
      if (Array.isArray(result.hideSections)) {
        setHiddenSections(result.hideSections);
      }

      toast({
        title: 'Auto-fit applied ✨',
        description: `Switched to ${TEMPLATE_LABELS[result.template as TemplateKey] || result.template} template with ${result.margins} margins.`,
        duration: 4000,
      });
    } catch (error) {
      clearInterval(progressInterval);
      toast({
        title: 'Auto-fit failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
        duration: 3000,
      });
      setAutoFitSnapshot(null);
    } finally {
      setIsAutoFitting(false);
      setAutoFitProgress(0);
    }
  }, [isAutoFitting, resumeData, selectedTemplate, margins, hiddenSections, pageStarts.length]);

  const handleUndoAutoFit = useCallback(() => {
    if (!autoFitSnapshot) return;
    setSelectedTemplate(autoFitSnapshot.template);
    setMargins(autoFitSnapshot.margins);
    setHiddenSections(autoFitSnapshot.hiddenSections);
    setAutoFitSnapshot(null);
    toast({
      title: 'Auto-fit reverted',
      description: 'Your previous layout has been restored.',
      duration: 2500,
    });
  }, [autoFitSnapshot]);

  const editorApi = useMemo(
    () => ({
      editable: true,
      addEntry,
      removeEntry,
      moveEntry,
      hideSection,
      moveSection,
      activeKey,
      setActiveKey,
      pageBreaks,
      toggleBreak,
    }),
    [addEntry, removeEntry, moveEntry, hideSection, moveSection, activeKey, pageBreaks, toggleBreak]
  );

  // Central hover tracker: the closest ancestor with a data-rbkey wins, so only
  // one section/entry shows its floating controls at any moment.
  const onCanvasPointerMove = (e: React.PointerEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-rbkey]');
    const key = el?.dataset.rbkey ?? null;
    if (activeLeaveTimer.current) {
      clearTimeout(activeLeaveTimer.current);
      activeLeaveTimer.current = null;
    }
    setActiveKey((prev) => (prev === key ? prev : key));
  };
  const onCanvasPointerLeave = () => {
    if (activeLeaveTimer.current) clearTimeout(activeLeaveTimer.current);
    activeLeaveTimer.current = setTimeout(() => setActiveKey(null), 200);
  };

  /* ------------------------------- section drag ------------------------------ */

  const onCanvasDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSectionOrder((order) => {
      const oldIndex = order.indexOf(active.id as string);
      const newIndex = order.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return order;
      return arrayMove(order, oldIndex, newIndex);
    });
  };

  const onPanelDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const a = String(active.id).replace(/^panel-/, '');
    const b = String(over.id).replace(/^panel-/, '');
    setSectionOrder((order) => {
      const oldIndex = order.indexOf(a);
      const newIndex = order.indexOf(b);
      if (oldIndex === -1 || newIndex === -1) return order;
      return arrayMove(order, oldIndex, newIndex);
    });
  };

  /* --------------------------------- download -------------------------------- */

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      let blob;
      
      if (editorMode === 'latex') {
        // Same compile proxy as the live preview (POST — the document doesn't
        // fit in a URL), so the download is byte-identical to the preview.
        const response = await fetch('/api/latex/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latex: resumeData.latexContent || '' }),
        });
        if (!response.ok) throw new Error('Failed to generate LaTeX PDF');
        blob = await response.blob();
      } else {
        // POST (not GET) so a base64 profile photo can't blow past URL-length limits.
        const response = await fetch('/api/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: resumeData,
            template: selectedTemplate,
            accentColor,
            fontFamily,
            sectionOrder: visibleSectionOrder,
            showIcons,
            showPhoto,
            pageFormat,
            editorMode,
            margins,
            customMargins,
            pageBreaks,
          }),
        });
        if (!response.ok) throw new Error('Failed to generate PDF');
        blob = await response.blob();
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = (resumeData.personalDetails.fullName || 'Resume').replace(
        /[\\/:*?"<>|]/g,
        ''
      );
      a.href = url;
      a.download = `${safeName} - Made with ResumeItNow.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Could not generate the PDF. Please try again.',
        variant: 'destructive',
        duration: 3000,
      });
      console.error('Error downloading PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const TemplateComponent = TEMPLATES[selectedTemplate];

  return (
    <div className={`w-full flex flex-col items-center min-h-screen ${editorMode === 'latex' ? 'bg-background py-4 px-4' : 'bg-gray-100 dark:bg-gray-950 py-4 px-2 sm:px-6'}`}>
      {/* Load all template web fonts so the canvas renders the exact same
          typography as the exported PDF (React 19 hoists this into <head>). */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={RESUME_FONTS_HREF} />
      {/* Toolbar */}
      <Card className={`w-full print:hidden z-40 ${editorMode === 'latex' ? 'rounded-none border-t-0 border-x-0 border-b border-border bg-card text-card-foreground mb-6' : 'mb-6 max-w-5xl sticky top-[calc(var(--app-nav-height,4rem)+0.5rem)] transition-[top] duration-300 backdrop-blur supports-[backdrop-filter]:bg-card/95'}`}>
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex flex-wrap items-center gap-2">
            {editorMode === 'visual' && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 gap-2">
                      <LayoutTemplate className="h-4 w-4" />
                      <span className="hidden sm:inline">Layout</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 space-y-4" align="start">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Template</Label>
                      <Select
                        value={selectedTemplate}
                        onValueChange={(value: TemplateKey) => setSelectedTemplate(value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Template" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(TEMPLATES) as TemplateKey[]).map((key) => (
                            <SelectItem key={key} value={key}>
                              {TEMPLATE_LABELS[key]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Page Format</Label>
                      <Select
                        value={pageFormat}
                        onValueChange={(value: PageFormat) => setPageFormat(value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Format" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(PAGE_FORMATS) as PageFormat[]).map((key) => (
                            <SelectItem key={key} value={key}>
                              {PAGE_FORMATS[key].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Margins</Label>
                      <Select
                        value={margins}
                        onValueChange={(value: 'normal' | 'narrow' | 'custom') => setMargins(value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Margins" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="narrow">Narrow</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>

                      {margins === 'custom' && (
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Top (px)</Label>
                            <input
                              type="number"
                              min="0"
                              max="150"
                              value={customMargins.top}
                              onChange={(e) => setCustomMargins(prev => ({ ...prev, top: Math.max(0, parseInt(e.target.value) || 0) }))}
                              className="h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Bottom (px)</Label>
                            <input
                              type="number"
                              min="0"
                              max="150"
                              value={customMargins.bottom}
                              onChange={(e) => setCustomMargins(prev => ({ ...prev, bottom: Math.max(0, parseInt(e.target.value) || 0) }))}
                              className="h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Left (px)</Label>
                            <input
                              type="number"
                              min="0"
                              max="150"
                              value={customMargins.left}
                              onChange={(e) => setCustomMargins(prev => ({ ...prev, left: Math.max(0, parseInt(e.target.value) || 0) }))}
                              className="h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Right (px)</Label>
                            <input
                              type="number"
                              min="0"
                              max="150"
                              value={customMargins.right}
                              onChange={(e) => setCustomMargins(prev => ({ ...prev, right: Math.max(0, parseInt(e.target.value) || 0) }))}
                              className="h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 gap-2">
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Design</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 space-y-4" align="start">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Accent color</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {ACCENT_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Use ${c}`}
                        onClick={() => setAccentColor(c)}
                        className={`h-6 w-6 rounded-full border transition-transform hover:scale-110 ${
                          accentColor.toLowerCase() === c.toLowerCase()
                            ? 'ring-2 ring-offset-1 ring-primary'
                            : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <label
                      className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border"
                      style={{
                        background:
                          'conic-gradient(red, orange, yellow, lime, cyan, blue, magenta, red)',
                      }}
                      title="Custom color"
                    >
                      <Input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      />
                    </label>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Font</Label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font} value={font}>
                          <span style={{ fontFamily: font }}>{font}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="icon-toggle" className="text-sm">
                    Contact icons
                  </Label>
                  <Switch id="icon-toggle" checked={showIcons} onCheckedChange={setShowIcons} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="photo-toggle" className="text-sm">
                    Profile photo
                  </Label>
                  <Switch id="photo-toggle" checked={showPhoto} onCheckedChange={setShowPhoto} />
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              onClick={() => setIsSectionsOpen(true)}
              className="h-9 gap-2"
            >
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Sections</span>
            </Button>

            {/* ── AI Auto-Fit Button ── */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                onClick={handleAutoFit}
                disabled={isAutoFitting}
                className="h-9 gap-2 relative overflow-hidden border-violet-300 dark:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950 transition-all"
                title="AI-powered: automatically picks the best template & settings to fit your resume on one page"
              >
                {isAutoFitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                    <span className="hidden sm:inline text-violet-600 dark:text-violet-400">Fitting…</span>
                    {/* progress bar overlay */}
                    <span
                      className="absolute bottom-0 left-0 h-0.5 bg-violet-500 transition-all duration-300 ease-out"
                      style={{ width: `${autoFitProgress}%` }}
                    />
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 text-violet-500" />
                    <span className="hidden sm:inline">Fit to 1 Page</span>
                  </>
                )}
              </Button>
              {autoFitSnapshot && !isAutoFitting && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndoAutoFit}
                  className="h-9 px-2 text-muted-foreground hover:text-foreground"
                  title="Undo auto-fit"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center rounded-md border h-9">
              <Button
                variant="ghost"
                size="sm"
                className="px-2 h-full"
                aria-label="Zoom out"
                onClick={() => setZoom((z) => Math.max(0.4, (z === 'fit' ? scale : z) - 0.1))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="w-11 text-center text-xs tabular-nums text-muted-foreground select-none">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="px-2 h-full"
                aria-label="Zoom in"
                onClick={() => setZoom((z) => Math.min(1.5, (z === 'fit' ? scale : z) + 0.1))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="px-2 h-full border-l rounded-l-none"
                aria-label="Fit to screen"
                onClick={() => setZoom('fit')}
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
            
            </>
            )}

            {editorMode === 'latex' && (
              <>
                {/* Reset the document to the selected template + resume data */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 border-border hover:bg-muted text-foreground"
                  onClick={() => regenerateLatexRef.current?.()}
                  title="Regenerate the LaTeX from the template (discards manual edits)"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Reset to Template</span>
                </Button>

                <div className="h-4 w-px bg-border mx-1" />

                {/* Formatting controls */}
                <div className="flex items-center gap-0.5 border border-border rounded-md p-0.5 bg-muted/20">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => executeLatexActionRef.current?.('Bold')} title="Bold"><Bold className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => executeLatexActionRef.current?.('Italic')} title="Italic"><Italic className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => executeLatexActionRef.current?.('Underline')} title="Underline"><Underline className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => executeLatexActionRef.current?.('Section')} title="Section"><Heading2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => executeLatexActionRef.current?.('Bullet List')} title="Bullet List"><List className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => executeLatexActionRef.current?.('Numbered List')} title="Numbered List"><ListOrdered className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => executeLatexActionRef.current?.('Math')} title="Math"><Code2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => executeLatexActionRef.current?.('Link')} title="Link"><Link2 className="h-4 w-4" /></Button>
                </div>

                <div className="h-4 w-px bg-border mx-1" />

                {/* Template selector — LaTeX-only templates */}
                <Select value={activeLatexTemplate} onValueChange={(val: string) => {
                  setActiveLatexTemplate(val);
                  regenerateLatexRef.current?.(val);
                }}>
                  <SelectTrigger className="h-9 w-[120px] border-border text-foreground bg-transparent">
                    <SelectValue placeholder="Template" />
                  </SelectTrigger>
                  <SelectContent>
                    {LATEX_TEMPLATES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Auto Compile */}
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none px-2">
                  <input
                    type="checkbox"
                    checked={latexAutoCompile}
                    onChange={(e) => setLatexAutoCompile(e.target.checked)}
                    className="rounded border-border bg-background text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  Auto Compile
                </label>

                {/* Recompile */}
                <Button
                  onClick={() => recompileLatexRef.current?.()}
                  disabled={latexCompileStatus === 'compiling'}
                  size="sm"
                  className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {latexCompileStatus === 'compiling' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  Recompile
                </Button>

                {/* Show/Hide Preview */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 border-border hover:bg-muted text-foreground"
                  onClick={() => setShowLatexPreview(!showLatexPreview)}
                >
                  {showLatexPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showLatexPreview ? 'Hide Preview' : 'Show Preview'}</span>
                </Button>
              </>
            )}

            <div className="ml-auto flex items-center gap-2">
              <SaveStatusChip status={saveStatus} />

            <Button onClick={handleDownload} className="h-9 gap-2" disabled={isDownloading}>
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{isDownloading ? 'Preparing…' : 'Download'}</span>
            </Button>
          </div>
          </div>
        </CardContent>
      </Card>

      {/* Canvas */}
      <div
        ref={previewContainerRef}
        className={editorMode === 'visual' ? 'w-full pb-16 overflow-x-auto overflow-y-hidden' : 'w-full h-[calc(100vh-14rem)] min-h-[750px] overflow-hidden'}
      >
        {editorMode === 'latex' ? (
          <LatexEditor
            // Merge the design settings in so regenerated LaTeX mirrors the
            // visual editor: same accent, font, margins, and section order.
            resumeData={{
              ...resumeData,
              accentColor,
              fontFamily,
              margins: margins === 'custom' ? undefined : margins,
              customMargins: resolvedMargins,
              sectionOrder: visibleSectionOrder,
              template: selectedTemplate,
            } as typeof resumeData}
            selectedTemplate={activeLatexTemplate}
            updateResumeData={(data) => {
              setResumeData(data);
              // Save it to firebase
              const userId = session?.user?.email || 'temp_resumes';
              const resumeRef = doc(db, `users/${userId}/resumes/${resumeId}`);
              updateDoc(resumeRef, { latexContent: data.latexContent, editorMode: 'latex' });
            }}
            autoCompile={latexAutoCompile}
            activeTemplate={activeLatexTemplate}
            setActiveTemplate={setActiveLatexTemplate}
            showPreview={showLatexPreview}
            compileStatus={latexCompileStatus}
            setCompileStatus={setLatexCompileStatus}
            executeActionRef={executeLatexActionRef}
            recompileRef={recompileLatexRef}
            regenerateRef={regenerateLatexRef}
          />
      ) : (
      <EditorContext.Provider value={editorApi}>
        <div
          style={{
            width: (page.width + 96) * scale,
            paddingLeft: 48 * scale,
            paddingRight: 48 * scale,
            height: pageHeight ? pageHeight * scale : undefined,
          }}
          className="mx-auto"
        >
          <div
            style={{
              width: page.width,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
            className="relative"
          >
            {/* Each page is its own sheet */}
             {pageStarts.map((start, k) => {
              const sheetTop = k === 0 ? 0 : start - resolvedMargins.top;
              return (
                <div
                  key={k}
                  aria-hidden
                  className="absolute inset-x-0 rounded-[3px] bg-white shadow-xl ring-1 ring-black/5 print:hidden"
                  style={{ top: sheetTop, height: contentPerPage + pageMarginY }}
                />
              );
            })}

            {/* Gray gaps between sheets, with page labels */}
            {pageStarts.slice(1).map((start, k) => {
              const coverTop = pageStarts[k] + contentPerPage + pageMarginY;
              const nextSheetTop = start - resolvedMargins.top;
              const coverH = nextSheetTop - coverTop;
              if (coverH < 8) return null;
              return (
                <div
                  key={`gap-${k}`}
                  aria-hidden
                  className="pointer-events-none absolute -left-4 -right-4 z-20 flex items-center justify-center bg-gray-100 dark:bg-gray-950 print:hidden"
                  style={{ top: coverTop, height: coverH }}
                >
                  <div className="flex items-center gap-3 text-xs text-muted-foreground select-none">
                    <div className="h-px w-12 bg-gray-300 dark:bg-gray-700" />
                    <span>Page {k + 2}</span>
                    <div className="h-px w-12 bg-gray-300 dark:bg-gray-700" />
                  </div>
                </div>
              );
            })}

            <div
              ref={pageRef}
              id="resume-content"
              className="relative z-10 w-full"
              style={{ minHeight: canvasMin || contentPerPage }}
              onPointerMove={onCanvasPointerMove}
              onPointerLeave={onCanvasPointerLeave}
            >
                <DndContext
                  id="canvas-sections"
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onCanvasDragEnd}
                >
                  <SortableContext
                    items={visibleSectionOrder}
                    strategy={verticalListSortingStrategy}
                  >
                    <TemplateComponent
                      resumeData={resumeData}
                      isEditing={true}
                      updateField={updateField}
                      accentColor={accentColor}
                      fontFamily={fontFamily}
                      sectionOrder={visibleSectionOrder}
                      showIcons={showIcons}
                      showPhoto={showPhoto}
                      customMargins={resolvedMargins}
                    />
                  </SortableContext>
                </DndContext>
            </div>
          </div>
        </div>
      </EditorContext.Provider>
      )}
      </div>

      {/* Sections panel */}
      <Dialog open={isSectionsOpen} onOpenChange={setIsSectionsOpen}>
        <DialogContent className="print:hidden max-w-md">
          <DialogHeader>
            <DialogTitle>Sections</DialogTitle>
            <DialogDescription>
              Drag to reorder. Use the eye to show or hide a section. Changes save
              automatically.
            </DialogDescription>
          </DialogHeader>
          <DndContext
            id="panel-sections"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onPanelDragEnd}
          >
            <SortableContext
              items={sectionOrder.map((s) => `panel-${s}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {sectionOrder.map((section) => (
                  <SortableSectionRow
                    key={section}
                    section={section}
                    hidden={hiddenSections.includes(section)}
                    onToggleVisibility={toggleSectionVisibility}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </DialogContent>
      </Dialog>
    </div>
  );
}
