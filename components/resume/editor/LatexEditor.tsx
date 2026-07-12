'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useDebounce } from 'use-debounce';
import { useTheme } from 'next-themes';
import { ResumeData } from '../templates/types';
import { generateLatexFromData } from '@/lib/latexGenerator';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading2,
  Link2,
  Play,
  Check,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Code2,
  FileText,
  LayoutTemplate,
} from 'lucide-react';

type MonacoEditor = Parameters<OnMount>[0];

interface LatexEditorProps {
  resumeData: ResumeData;
  updateResumeData: (data: ResumeData) => void;
  selectedTemplate?: string;
  autoCompile: boolean;
  activeTemplate: 'modern' | 'professional' | 'minimal' | 'compact' | 'sidebar';
  setActiveTemplate: (val: 'modern' | 'professional' | 'minimal' | 'compact' | 'sidebar') => void;
  showPreview: boolean;
  compileStatus: 'idle' | 'compiling' | 'success' | 'error';
  setCompileStatus: (status: 'idle' | 'compiling' | 'success' | 'error') => void;
  executeActionRef: React.MutableRefObject<((action: string) => void) | null>;
  recompileRef: React.MutableRefObject<(() => void) | null>;
  regenerateRef: React.MutableRefObject<((templateId?: string) => void) | null>;
}

// ─── LaTeX formatting toolbar actions ─────────────────────────────────────────

interface ToolbarAction {
  label: string;
  icon: React.ReactNode;
  prefix: string;
  suffix: string;
  block?: boolean;
  snippet?: string;
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { label: 'Bold', icon: <Bold className="w-4 h-4" />, prefix: '\\textbf{', suffix: '}' },
  { label: 'Italic', icon: <Italic className="w-4 h-4" />, prefix: '\\textit{', suffix: '}' },
  { label: 'Underline', icon: <Underline className="w-4 h-4" />, prefix: '\\underline{', suffix: '}' },
  { label: 'Section', icon: <Heading2 className="w-4 h-4" />, prefix: '\\section{', suffix: '}' },
  {
    label: 'Bullet List',
    icon: <List className="w-4 h-4" />,
    prefix: '',
    suffix: '',
    block: true,
    snippet: '\\begin{itemize}\n  \\item \n\\end{itemize}',
  },
  {
    label: 'Numbered List',
    icon: <ListOrdered className="w-4 h-4" />,
    prefix: '',
    suffix: '',
    block: true,
    snippet: '\\begin{enumerate}\n  \\item \n\\end{enumerate}',
  },
  {
    label: 'Math',
    icon: <Code2 className="w-4 h-4" />,
    prefix: '$',
    suffix: '$',
  },
  { label: 'Link', icon: <Link2 className="w-4 h-4" />, prefix: '\\href{url}{', suffix: '}' },
];

const LATEX_TEMPLATES = [
  { id: 'modern', label: 'Modern' },
  { id: 'professional', label: 'Professional' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'compact', label: 'Compact' },
  { id: 'sidebar', label: 'Sidebar' },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function LatexEditor({
  resumeData,
  updateResumeData,
  selectedTemplate,
  autoCompile,
  activeTemplate,
  setActiveTemplate,
  showPreview,
  compileStatus,
  setCompileStatus,
  executeActionRef,
  recompileRef,
  regenerateRef,
}: LatexEditorProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const initialLatex = resumeData.latexContent || generateLatexFromData(resumeData, selectedTemplate);
  const [content, setContent] = useState(initialLatex);
  const [debouncedContent] = useDebounce(content, 2000);
  const [pdfUrl, setPdfUrl] = useState('');
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const editorRef = useRef<MonacoEditor | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Save latex content to resume data
  useEffect(() => {
    if (!resumeData.latexContent) {
      updateResumeData({ ...resumeData, latexContent: initialLatex });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compile function
  // Compile function via POST proxy
  const compile = useCallback(async (source: string) => {
    if (!source.trim()) return;
    setCompileStatus('compiling');
    setLogMessages([]);
    try {
      const response = await fetch('/api/latex/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex: source }),
      });

      if (!response.ok) {
        setCompileStatus('error');
        const errData = await response.json().catch(() => ({}));
        setLogMessages([errData.details || errData.message || 'LaTeX compilation failed. Check your syntax.']);
        return;
      }

      const blob = await response.blob();
      const localUrl = URL.createObjectURL(blob);

      setPdfUrl((prev) => {
        if (prev && prev.startsWith('blob:')) {
          URL.revokeObjectURL(prev);
        }
        return localUrl;
      });
      setCompileStatus('success');
    } catch (err: any) {
      setCompileStatus('error');
      setLogMessages([err?.message || 'Compilation connection failed.']);
    }
  }, [setCompileStatus]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      setPdfUrl((prev) => {
        if (prev && prev.startsWith('blob:')) {
          URL.revokeObjectURL(prev);
        }
        return '';
      });
    };
  }, []);

  // Auto-compile on debounced content change
  useEffect(() => {
    if (autoCompile && debouncedContent) {
      compile(debouncedContent);
    }
  }, [debouncedContent, autoCompile, compile]);

  const handleRecompile = () => compile(content);

  // Expose callbacks to parent via refs
  useEffect(() => {
    executeActionRef.current = (actionType: string) => {
      const editor = editorRef.current;
      if (!editor) return;
      const selection = editor.getSelection();
      if (!selection) return;

      const action = TOOLBAR_ACTIONS.find((a) => a.label.toLowerCase() === actionType.toLowerCase());
      if (!action) return;

      if (action.snippet) {
        editor.executeEdits('latex-toolbar', [{
          range: selection,
          text: action.snippet,
          forceMoveMarkers: true,
        }]);
      } else {
        const model = editor.getModel();
        if (!model) return;
        const selectedText = model.getValueInRange(selection);
        const newText = action.prefix + selectedText + action.suffix;
        editor.executeEdits('latex-toolbar', [{
          range: selection,
          text: newText,
          forceMoveMarkers: true,
        }]);
      }
      editor.focus();
    };

    recompileRef.current = () => {
      compile(content);
    };

    regenerateRef.current = (templateId?: string) => {
      const tmpl = templateId || activeTemplate;
      const newLatex = generateLatexFromData(resumeData, tmpl);
      setContent(newLatex);
      updateResumeData({ ...resumeData, latexContent: newLatex });
      compile(newLatex);
    };

    return () => {
      executeActionRef.current = null;
      recompileRef.current = null;
      regenerateRef.current = null;
    };
  }, [content, compile, activeTemplate, resumeData, updateResumeData, executeActionRef, recompileRef, regenerateRef]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
      updateResumeData({ ...resumeData, latexContent: value });
    }
  };

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-background text-foreground">
      {/* ── Main split ─────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Editor pane ─────────────────────────────────── */}
        <div className={showPreview ? 'w-1/2 flex flex-col min-h-0 border-r border-border' : 'w-full flex flex-col min-h-0'}>
          {/* Monaco editor */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              defaultLanguage="latex"
              theme={isDark ? 'vs-dark' : 'vs-light'}
              value={content}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: false },
                wordWrap: 'on',
                padding: { top: 12 },
                fontSize: 13,
                lineHeight: 20,
                scrollBeyondLastLine: false,
                renderLineHighlight: 'line',
                cursorBlinking: 'smooth',
                smoothScrolling: true,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                bracketPairColorization: { enabled: true },
                autoClosingBrackets: 'always',
                autoClosingQuotes: 'always',
                suggestOnTriggerCharacters: true,
              }}
            />
          </div>
        </div>

        {/* ── Preview pane ────────────────────────────────── */}
        {showPreview && (
          <div className="w-1/2 flex flex-col min-h-0 bg-muted/10">
            {/* PDF display */}
            <div className="flex-1 min-h-0 p-2">
              {pdfUrl ? (
                <iframe
                  ref={iframeRef}
                  src={pdfUrl}
                  key={pdfUrl} // FORCES IFRAME UNMOUNT & REMOUNT ON RECOMPILE, PREVENTING BROWSER CACHE FROM BLOCKING PDF UPDATES!
                  className="w-full h-full border-0 rounded bg-white shadow-sm border border-border"
                  title="PDF Preview"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <Play className="w-8 h-8 text-muted-foreground/60" />
                  <span className="text-sm">Click Recompile or enable Auto Compile</span>
                </div>
              )}
            </div>

            {/* Logs panel (shows automatically on compilation errors) */}
            {compileStatus === 'error' && logMessages.length > 0 && (
              <div className="border-t border-border bg-card px-3 py-2 max-h-40 overflow-y-auto shrink-0">
                <div className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Compilation Errors</div>
                {logMessages.map((msg, i) => (
                  <p key={i} className="text-xs text-red-600 dark:text-red-400 font-mono">{msg}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
