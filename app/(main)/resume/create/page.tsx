"use client";

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { doc, increment, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EMPTY_RESUME, normalizeImportedResume } from '@/lib/resumeDefaults';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
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
    setBusy('import');
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
      setPendingData(data);
      setPendingTitle(title);
      setBusy(null);
      setMode('template');
    } catch (error) {
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
    setBusy('import');
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
      setPendingData(data);
      setPendingTitle(title);
      setBusy(null);
      setMode('template');
    } catch (error) {
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
    <div className="container mx-auto min-h-screen max-w-4xl px-4 py-12">
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

      <AnimatePresence mode="wait">
        {mode === 'choose' ? (
          <motion.div
            key="choose"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
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
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Choose a starting template</h2>
              <button
                onClick={() => setMode('choose')}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Start over
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {[
                { id: 'modern', label: 'Modern' },
                { id: 'minimal', label: 'Minimal' },
                { id: 'professional', label: 'Professional' },
                { id: 'compact', label: 'Compact' },
                { id: 'sidebar', label: 'Sidebar' },
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
                      router.push(`/resume/\${resumeId}`);
                    } catch (error) {
                      toast({
                        title: 'Error',
                        variant: 'destructive',
                        description: 'Failed to create resume.',
                      });
                      setBusy(null);
                    }
                  }}
                  className={`group relative cursor-pointer overflow-hidden border-2 transition-all hover:border-primary ${
                    busy ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  <div className="aspect-[1/1.414] bg-muted/30 p-2">
                    <div className="flex h-full w-full items-center justify-center rounded border bg-white shadow-sm transition-transform group-hover:scale-[1.02]">
                      <span className="text-sm font-medium text-muted-foreground">{t.label}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="import"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Card className="border-2 border-violet-500/40">
              <CardContent className="p-6 sm:p-8">
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
                            {importing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            {importing ? 'Importing…' : 'Import'}
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
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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
