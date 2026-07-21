"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { doc, increment, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EMPTY_RESUME, normalizeImportedResume } from '@/lib/resumeDefaults';
import { MOCK_RESUME } from '@/lib/mockResume';
import { RESUME_FONTS_HREF } from '@/lib/fonts';
import { LATEX_TEMPLATES, generateLatex } from '@/lib/latexTemplates';
import { ModernTemplate } from '@/components/resume/templates/Modern';
import { MinimalTemplate } from '@/components/resume/templates/Minimal';
import { ProfessionalTemplate } from '@/components/resume/templates/Professional';
import { CompactTemplate } from '@/components/resume/templates/Compact';
import { SidebarTemplate } from '@/components/resume/templates/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Code2,
  FileUp,
  Loader2,
  PenLine,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { FaLinkedin } from 'react-icons/fa6';
import type { ResumeData } from '@/components/resume/templates/types';

type Mode = 'choose' | 'import' | 'template';
type ImportTab = 'pdf' | 'linkedin';

export default function CreateResumePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>('choose');
  const [tab, setTab] = useState<ImportTab>('pdf');
  const [busy, setBusy] = useState<null | 'scratch' | 'import'>(null);
  const [dragging, setDragging] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [pendingData, setPendingData] = useState<ResumeData | null>(null);
  const [pendingTitle, setPendingTitle] = useState<string>('');
  const [importProgress, setImportProgress] = useState(0);
  const importing = busy === 'import';

  const createResume = async (data: ResumeData, title: string) => {
    const userId = session?.user?.email || 'temp_resumes';
    const resumeId = `resume_${Date.now()}`;
    await setDoc(doc(db, `users/${userId}/resumes/${resumeId}`), {
      ...data,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    try {
      await updateDoc(doc(db, 'info', 'resumesCreated'), { count: increment(1) });
    } catch {
      // stats counter is best-effort
    }
    return resumeId;
  };

  const startFromScratch = async () => {
    setPendingData(EMPTY_RESUME);
    setPendingTitle('Untitled Resume');
    setMode('template');
  };

  const handleImportFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: 'Unsupported file',
        description: 'Please upload a PDF.',
        variant: 'destructive',
      });
      return;
    }
    setImportProgress(5);
    setBusy('import');
    const interval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev < 35) return prev + Math.floor(Math.random() * 8) + 4;
        if (prev < 65) return prev + Math.floor(Math.random() * 5) + 2;
        if (prev < 88) return prev + Math.floor(Math.random() * 2) + 1;
        if (prev < 96) return prev + 0.4;
        return prev;
      });
    }, 250);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await fetch('/api/import-resume', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Import failed');
      }
      const { resume } = await res.json();
      const data = normalizeImportedResume(resume);
      const title = data.jobTitle || data.personalDetails.fullName || 'Imported Resume';
      
      clearInterval(interval);
      setImportProgress(100);
      await new Promise((r) => setTimeout(r, 300));
      
      setPendingData(data);
      setPendingTitle(title);
      setBusy(null);
      setMode('template');
    } catch (error) {
      clearInterval(interval);
      setImportProgress(0);
      console.error('Error importing resume:', error);
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Could not read that file.',
        variant: 'destructive',
      });
      setBusy(null);
    }
  };

  const handleImportUrl = async () => {
    const url = linkedinUrl.trim();
    if (!/^https?:\/\/.+/i.test(url)) {
      toast({
        title: 'Invalid URL',
        description: 'Paste your full LinkedIn profile URL.',
        variant: 'destructive',
      });
      return;
    }
    setImportProgress(5);
    setBusy('import');
    const interval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev < 35) return prev + Math.floor(Math.random() * 8) + 4;
        if (prev < 65) return prev + Math.floor(Math.random() * 5) + 2;
        if (prev < 88) return prev + Math.floor(Math.random() * 2) + 1;
        if (prev < 96) return prev + 0.4;
        return prev;
      });
    }, 250);

    try {
      const res = await fetch('/api/import-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Import failed');
      }
      const { resume } = await res.json();
      const data = normalizeImportedResume(resume);
      const title = data.jobTitle || data.personalDetails.fullName || 'Imported Resume';
      
      clearInterval(interval);
      setImportProgress(100);
      await new Promise((r) => setTimeout(r, 300));

      setPendingData(data);
      setPendingTitle(title);
      setBusy(null);
      setMode('template');
    } catch (error) {
      clearInterval(interval);
      setImportProgress(0);
      console.error('Error importing from URL:', error);
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Could not read that profile.',
        variant: 'destructive',
        duration: 8000,
      });
      setBusy(null);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const Dropzone = () => (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleImportFile(file);
      }}
      onClick={() => busy === null && fileInputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
        dragging ? 'border-violet-500 bg-violet-500/5' : 'border-muted-foreground/25 hover:border-violet-400'
      }`}
    >
      {busy === 'import' ? (
        <>
          <Loader2 className="h-9 w-9 animate-spin text-violet-500" />
          <p className="text-sm text-muted-foreground">
            Reading your {tab === 'linkedin' ? 'LinkedIn export' : 'resume'} with AI…
          </p>
        </>
      ) : (
        <>
          <UploadCloud className="h-9 w-9 text-violet-500" />
          <div>
            <p className="font-medium">Drop your PDF here, or click to browse</p>
            <p className="mt-1 text-xs text-muted-foreground">
              AI extracts your details — you can edit everything afterwards.
            </p>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div
      className="mx-auto min-h-screen w-full px-4 py-12 transition-[max-width] duration-300"
      style={{ maxWidth: mode === 'template' ? '72rem' : '56rem' }}
    >
      {/* Template thumbnails render the real templates — load their fonts. */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={RESUME_FONTS_HREF} />
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Let&apos;s build your resume</h1>
        <p className="mt-2 text-muted-foreground">
          Start with a blank canvas or bring your existing resume — you&apos;ll edit
          everything directly on the page, like a document.
        </p>
        {!session && (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-500">
            You&apos;re not signed in — your resume won&apos;t be linked to an account.{' '}
            <Link href="/signin" className="underline">
              Sign in
            </Link>{' '}
            to keep it safe.
          </p>
        )}
      </div>

      {/* Plain conditional rendering with entrance-only animations —
          AnimatePresence mode="wait" deadlocks here (entering branch never
          mounts), so exit animations are intentionally dropped. */}
      <div>
        {mode === 'choose' ? (
          <motion.div
            key="choose"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="grid gap-6 sm:grid-cols-2"
          >
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.15 }}>
              <Card
                className="group h-full cursor-pointer border-2 transition-colors hover:border-primary"
                onClick={() => busy === null && startFromScratch()}
              >
                <CardContent className="flex h-full flex-col items-center gap-4 p-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    {busy === 'scratch' ? (
                      <Loader2 className="h-7 w-7 animate-spin" />
                    ) : (
                      <PenLine className="h-7 w-7" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Start from scratch</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      A clean page with guided placeholders. Click any text to edit it,
                      drag sections around, add entries as you go.
                    </p>
                  </div>
                  <Button variant="ghost" className="mt-auto gap-1 group-hover:text-primary">
                    Open the editor <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.15 }}>
              <Card
                className="group h-full cursor-pointer border-2 transition-colors hover:border-violet-500"
                onClick={() => setMode('import')}
              >
                <CardContent className="flex h-full flex-col items-center gap-4 p-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600">
                    <FileUp className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="flex items-center justify-center gap-1.5 text-lg font-semibold">
                      Import your resume
                      <Sparkles className="h-4 w-4 text-violet-500" />
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Bring in a PDF resume or your LinkedIn profile. AI fills everything
                      in for you.
                    </p>
                  </div>
                  <Button variant="ghost" className="mt-auto gap-1 group-hover:text-violet-600">
                    Choose a source <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        ) : mode === 'template' ? (
          <motion.div
            key="template"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">Choose a starting template</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Click any template to open it — you can change styling, colors and fonts later.
                </p>
              </div>
              <button
                onClick={() => setMode('choose')}
                className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Start over
              </button>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <PenLine className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Visual editor</h3>
                  <p className="text-xs text-muted-foreground">
                    Edit directly on the page like a document — drag sections, click any text.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { id: 'modern', label: 'Modern', blurb: 'Accent headers with a bold color rule.' },
                  { id: 'minimal', label: 'Minimal', blurb: 'Clean black-and-white, maximum content.' },
                  { id: 'professional', label: 'Professional', blurb: 'Centered classic layout, timeless.' },
                  { id: 'compact', label: 'Compact', blurb: 'Dense serif — fits more on one page.' },
                  { id: 'sidebar', label: 'Sidebar', blurb: 'Two-column with a tinted accent rail.' },
                ].map((t) => (
                  <Card
                    key={t.id}
                    onClick={async () => {
                      if (busy || !pendingData) return;
                      setBusy('import'); // reuse import state for loading UI
                      try {
                        const resumeId = await createResume(
                          { ...pendingData, template: t.id },
                          pendingTitle
                        );
                        toast({ title: 'Success', description: 'Resume created successfully.' });
                        router.push(`/resume/${resumeId}`);
                      } catch (error) {
                        toast({
                          title: 'Error',
                          variant: 'destructive',
                          description: 'Failed to create resume.',
                        });
                        setBusy(null);
                      }
                    }}
                    className={`group relative cursor-pointer overflow-hidden border-2 transition-all hover:-translate-y-1 hover:border-primary hover:shadow-xl ${
                      busy ? 'pointer-events-none opacity-50' : ''
                    }`}
                  >
                    <div className="aspect-[1/1.414] bg-muted/20 p-3">
                      <div className="relative h-full w-full overflow-hidden rounded-md border bg-white shadow-sm">
                        <TemplatePreview id={t.id} />
                        {/* hover call-to-action */}
                        <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-primary/70 via-primary/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          <span className="mb-4 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-primary shadow-lg">
                            Use this template
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t bg-card px-4 py-3 select-none">
                      <div className="text-sm font-semibold text-card-foreground">{t.label}</div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t.blurb}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="border-t pt-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Code2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">LaTeX editor</h3>
                  <p className="text-xs text-muted-foreground">
                    Classic LaTeX resumes edited as code, Overleaf-style — full control, compiled
                    with real TeX.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {LATEX_TEMPLATES.map((t) => (
                  <Card
                    key={t.id}
                    onClick={async () => {
                      if (busy || !pendingData) return;
                      setBusy('import');
                      try {
                        // Imported data populates the template; a scratch resume
                        // gets example content to edit (Overleaf-style).
                        const source = pendingData.personalDetails.fullName
                          ? generateLatex(pendingData, t.id)
                          : generateLatex(MOCK_RESUME, t.id);
                        const resumeId = await createResume(
                          {
                            ...pendingData,
                            template: t.id,
                            editorMode: 'latex',
                            latexContent: source,
                          },
                          pendingTitle
                        );
                        toast({ title: 'Success', description: 'LaTeX resume created.' });
                        router.push(`/resume/${resumeId}`);
                      } catch (error) {
                        toast({
                          title: 'Error',
                          variant: 'destructive',
                          description: 'Failed to create resume.',
                        });
                        setBusy(null);
                      }
                    }}
                    className={`group relative cursor-pointer overflow-hidden border-2 transition-all hover:-translate-y-1 hover:border-emerald-500 hover:shadow-xl ${
                      busy ? 'pointer-events-none opacity-50' : ''
                    }`}
                  >
                    <div className="aspect-[1/1.414] bg-muted/20 p-3">
                      <div className="relative h-full w-full overflow-hidden rounded-md border bg-white shadow-sm">
                        {/* Pre-compiled first page of the real template */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/latex-templates/${t.id}.png`}
                          alt={`${t.label} LaTeX template preview`}
                          className="h-full w-full object-cover object-top"
                        />
                        <span className="absolute right-2 top-2 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                          TeX
                        </span>
                        {/* hover call-to-action */}
                        <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-emerald-600/70 via-emerald-600/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          <span className="mb-4 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-emerald-600 shadow-lg">
                            Use this template
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t bg-card px-4 py-3 select-none">
                      <div className="text-sm font-semibold text-card-foreground">{t.label}</div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t.blurb}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="import"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Card className="border-2 border-violet-500/40">
              <CardContent className="p-6 sm:p-8">
                {importing ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center gap-5">
                    <div className="relative flex items-center justify-center">
                      <div className="h-14 w-14 rounded-full border-4 border-violet-100 border-t-violet-500 animate-spin" />
                      <Sparkles className="absolute h-5 w-5 text-violet-500 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-lg text-foreground">Analyzing with AI</p>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Our extraction engine is parsing your {tab === 'linkedin' ? 'LinkedIn profile' : 'resume'} and structuring your work history. This may take up to 20 seconds.
                      </p>
                    </div>
                    <div className="w-full max-w-xs bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
                      <div 
                        className="bg-gradient-to-r from-violet-500 to-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                    <p className="text-xs font-mono text-violet-600 dark:text-violet-400 font-bold">
                      {Math.round(importProgress)}%
                    </p>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => !importing && setMode('choose')}
                      disabled={importing}
                      className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>

                    <div className="mb-5 flex gap-2">
                      <button
                        onClick={() => !importing && setTab('pdf')}
                        disabled={importing}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          tab === 'pdf' ? 'bg-violet-500 text-white' : 'bg-muted hover:bg-muted/70'
                        }`}
                      >
                        <FileUp className="h-4 w-4" /> Resume PDF
                      </button>
                      <button
                        onClick={() => !importing && setTab('linkedin')}
                        disabled={importing}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          tab === 'linkedin' ? 'bg-[#0a66c2] text-white' : 'bg-muted hover:bg-muted/70'
                        }`}
                      >
                        <FaLinkedin className="h-4 w-4" /> LinkedIn
                      </button>
                    </div>

                    <div>
                      <motion.div
                        key={tab}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.18 }}
                      >
                        {tab === 'linkedin' ? (
                          <div className="space-y-3">
                            <label className="text-sm font-medium">Your LinkedIn profile URL</label>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <input
                                type="url"
                                value={linkedinUrl}
                                onChange={(e) => setLinkedinUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !importing && handleImportUrl()}
                                disabled={importing}
                                placeholder="https://www.linkedin.com/in/your-handle"
                                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-[#0a66c2] disabled:opacity-60"
                              />
                              <Button
                                onClick={handleImportUrl}
                                disabled={importing || !linkedinUrl.trim()}
                                className="gap-2 bg-[#0a66c2] text-white hover:bg-[#08508f]"
                              >
                                <Sparkles className="h-4 w-4" />
                                Import
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Make sure your profile is public. If LinkedIn blocks the read, use the
                              Resume PDF tab (Profile → More → Save to PDF).
                            </p>
                          </div>
                        ) : (
                          <Dropzone />
                        )}
                      </motion.div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImportFile(file);
          e.target.value = '';
        }}
      />

      {!importing && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Prefer the classic step-by-step form?{' '}
          <Link href="/resume/create/form" className="underline hover:text-foreground">
            Use it here
          </Link>
          .
        </p>
      )}
      <Toaster />
    </div>
  );
}

// A4 page is 794px wide at 96dpi; thumbnails render the real template with rich
// mock data, scaled so the entire first page fits the card (profile-page pattern).
const PAGE_WIDTH_PX = 794;
const PAGE_HEIGHT_PX = 1123;

const PREVIEW_TEMPLATES = {
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  professional: ProfessionalTemplate,
  compact: CompactTemplate,
  sidebar: SidebarTemplate,
} as const;

function TemplatePreview({ id }: { id: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Measure synchronously so the preview paints on the first frame; the
    // observer only handles later container resizes.
    setScale(el.getBoundingClientRect().width / PAGE_WIDTH_PX);
    const observer = new ResizeObserver((entries) =>
      setScale(entries[0].contentRect.width / PAGE_WIDTH_PX)
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const TemplateComponent = PREVIEW_TEMPLATES[id as keyof typeof PREVIEW_TEMPLATES];
  if (!TemplateComponent) return null;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-white pointer-events-none select-none"
    >
      {scale > 0 && (
        <div
          style={{
            width: PAGE_WIDTH_PX,
            height: PAGE_HEIGHT_PX,
            overflow: 'hidden',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          aria-hidden
        >
          <TemplateComponent
            resumeData={MOCK_RESUME}
            isEditing={false}
            updateField={() => {}}
            showIcons={true}
          />
        </div>
      )}
    </div>
  );
}
