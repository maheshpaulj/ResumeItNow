'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Mail, User, Trash2, Pencil, Check, X, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from "@/components/ui/toaster"
import { ModernTemplate } from '@/components/resume/templates/Modern'
import { MinimalTemplate } from '@/components/resume/templates/Minimal'
import { ProfessionalTemplate } from '@/components/resume/templates/Professional'
import { CompactTemplate } from '@/components/resume/templates/Compact'
import { SidebarTemplate } from '@/components/resume/templates/Sidebar'
import type { ResumeData } from '@/components/resume/templates/types'
import { isLatexTemplate } from '@/lib/latexTemplates'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const TEMPLATES = {
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  professional: ProfessionalTemplate,
  compact: CompactTemplate,
  sidebar: SidebarTemplate,
} as const

interface Resume {
  id: string
  title?: string
  createdAt: string
  updatedAt: string
  template?: string
  data: ResumeData & {
    accentColor?: string
    fontFamily?: string
    sectionOrder?: string[]
    hiddenSections?: string[]
    showIcons?: boolean
  }
}

// A4 page is 794px wide at 96dpi; thumbnails render the real template scaled
// down to exactly fill the card width.
const PAGE_WIDTH_PX = 794

// A LaTeX resume can't be rendered with the visual template components — its
// output is a compiled PDF. Compiling per card would be far too slow, so show
// the chosen LaTeX template's representative preview image instead (instant,
// and it reflects the actual template style).
function LatexPreview({ resume }: { resume: Resume }) {
  const isKnown = isLatexTemplate(resume.template)
  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      {isKnown ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/latex-templates/${resume.template}.png`}
          alt={`${resume.title || 'LaTeX resume'} preview`}
          className="h-full w-full object-cover object-top"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted">
          <FileText className="h-9 w-9 text-muted-foreground opacity-50" />
          <span className="text-xs font-medium text-muted-foreground">LaTeX résumé</span>
        </div>
      )}
      <span className="absolute right-2 top-2 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
        TeX
      </span>
    </div>
  )
}

function ResumePreview({ resume }: { resume: Resume }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) =>
      setScale(entries[0].contentRect.width / PAGE_WIDTH_PX)
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // LaTeX resumes get their own image-based preview.
  if (resume.data?.editorMode === 'latex' || isLatexTemplate(resume.template)) {
    return <LatexPreview resume={resume} />
  }

  const templateKey =
    resume.template && resume.template in TEMPLATES
      ? (resume.template as keyof typeof TEMPLATES)
      : 'modern'
  const TemplateComponent = TEMPLATES[templateKey]
  const data = resume.data

  if (!data?.personalDetails) {
    return (
      <div className="flex items-center justify-center h-full bg-muted">
        <FileText className="w-10 h-10 text-muted-foreground opacity-50" />
      </div>
    )
  }

  const visibleOrder = data.sectionOrder?.filter(
    (s) => !(data.hiddenSections || []).includes(s)
  )

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-white pointer-events-none select-none"
    >
      {scale > 0 && (
        <div
          style={{
            width: PAGE_WIDTH_PX,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          aria-hidden
        >
          <TemplateComponent
            resumeData={data}
            isEditing={false}
            updateField={() => {}}
            accentColor={data.accentColor}
            fontFamily={data.fontFamily}
            sectionOrder={visibleOrder}
            showIcons={data.showIcons ?? true}
          />
        </div>
      )}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 md:grid-cols-[300px_1fr]">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[500px]" />
      </div>
    </div>
  )
}

export default function Page() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setDisplayName(window.localStorage.getItem("resumeitnow_name"));
  }, []);

  const deleteResume = async (resumeId: string) => {
    try {
      await deleteDoc(doc(db, `users/${session?.user?.email}/resumes/${resumeId}`));
      toast({
        title: "Success",
        description: "Resume deleted successfully!",
        duration: 3000,
      });
      setResumes((prevResumes) => prevResumes.filter((resume) => resume.id !== resumeId));
    } catch (error) {
      console.error("Error deleting resume:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error deleting resume. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const startRename = (resume: Resume) => {
    setEditingId(resume.id);
    setEditingTitle(resume.title || defaultTitle(resume));
  };

  const saveRename = async (resumeId: string) => {
    const title = editingTitle.trim();
    setEditingId(null);
    if (!title) return;
    try {
      await updateDoc(doc(db, `users/${session?.user?.email}/resumes/${resumeId}`), { title });
      setResumes((prev) =>
        prev.map((r) => (r.id === resumeId ? { ...r, title } : r))
      );
    } catch (error) {
      console.error("Error renaming resume:", error);
      toast({
        title: "Error",
        description: "Could not rename resume. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  useEffect(() => {
    const fetchResumes = async () => {
      if (!session?.user?.email) return;

      try {
        const resumesRef = collection(db, `users/${session.user.email}/resumes`);
        const resumesSnapshot = await getDocs(resumesRef);

        const resumeData = resumesSnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            title: data.title,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            template: data.template,
            data: data as Resume['data'],
          } as Resume;
        });

        setResumes(resumeData);
      } catch (error) {
        console.error('Error fetching resumes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResumes();
  }, [session?.user?.email]);

  if (status === 'loading') {
    return <ProfileSkeleton />;
  }

  if (!session) {
    router.push('/signin');
    return null;
  }

  const defaultTitle = (resume: Resume) =>
    resume.data?.jobTitle ||
    resume.data?.personalDetails?.fullName ||
    'Untitled Resume';

  return (
    <div className="container min-h-screen mx-auto px-4 py-8">
      <div className="grid gap-8 md:grid-cols-[300px_1fr]">
        {/* Profile Information Card */}
        <Card className="h-fit">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src={session.user?.image ?? ''} alt={session.user?.name ?? ''} />
              <AvatarFallback>
                {session.user?.name?.charAt(0) ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <CardTitle>{displayName || session.user?.name}</CardTitle>
            <CardDescription>
              <span className="flex items-center justify-center gap-2">
                <User className="w-4 h-4" />
                <span>@{session.user?.name ?? 'username'}</span>
              </span>
              <span className="flex items-center justify-center gap-2 mt-2">
                <Mail className="w-4 h-4" />
                <span>{session.user?.email}</span>
              </span>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Resumes List Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Resumes</CardTitle>
                <CardDescription>Manage your created resumes</CardDescription>
              </div>
              <Button onClick={() => router.push('/resume/create')} className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Resume</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : resumes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No resumes found. Create your first resume!</p>
                <Button
                  className="mt-4"
                  onClick={() => router.push('/resume/create')}
                >
                  Create Resume
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {resumes
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .map((resume) => (
                    <Card
                      key={resume.id}
                      className="group overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <button
                        type="button"
                        className="block w-full h-48 border-b cursor-pointer text-left"
                        onClick={() => router.push(`/resume/${resume.id}`)}
                        aria-label={`Open ${resume.title || defaultTitle(resume)}`}
                      >
                        <ResumePreview resume={resume} />
                      </button>
                      <div className="p-3">
                        {editingId === resume.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveRename(resume.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              className="h-8 text-sm"
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-2"
                              onClick={() => saveRename(resume.id)}
                              aria-label="Save name"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-2"
                              onClick={() => setEditingId(null)}
                              aria-label="Cancel rename"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <div
                              className="min-w-0 cursor-pointer"
                              onClick={() => router.push(`/resume/${resume.id}`)}
                            >
                              <p className="font-medium text-sm truncate">
                                {resume.title || defaultTitle(resume)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {resume.updatedAt
                                  ? `Updated ${new Date(resume.updatedAt).toLocaleDateString()}`
                                  : `Created ${new Date(resume.createdAt).toLocaleDateString()}`}
                              </p>
                            </div>
                            <div className="flex items-center shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="px-2"
                                onClick={() => startRename(resume)}
                                aria-label="Rename resume"
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="px-2 text-red-500 hover:text-red-600"
                                    aria-label="Delete resume"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete your resume.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteResume(resume.id)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  );
}
