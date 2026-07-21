'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor, { type OnMount, type Monaco } from '@monaco-editor/react';
import type { editor as MonacoEditorApi, Position as MonacoPosition } from 'monaco-editor';
import { useDebounce } from 'use-debounce';
import { useTheme } from 'next-themes';
import { ResumeData } from '../templates/types';
import { generateLatex } from '@/lib/latexTemplates';
import { Play, AlertTriangle, Loader2 } from 'lucide-react';
import PdfJsPreview from './PdfJsPreview';

type MonacoEditor = Parameters<OnMount>[0];

interface CompileError {
  line: number | null;
  message: string;
}

interface LatexEditorProps {
  resumeData: ResumeData;
  updateResumeData: (data: ResumeData) => void;
  selectedTemplate?: string;
  autoCompile: boolean;
  activeTemplate: string;
  setActiveTemplate: (val: string) => void;
  showPreview: boolean;
  compileStatus: 'idle' | 'compiling' | 'success' | 'error';
  setCompileStatus: (status: 'idle' | 'compiling' | 'success' | 'error') => void;
  executeActionRef: React.MutableRefObject<((action: string) => void) | null>;
  recompileRef: React.MutableRefObject<(() => void) | null>;
  regenerateRef: React.MutableRefObject<((templateId?: string) => void) | null>;
}

// ─── Toolbar text actions (driven from the top toolbar in resumeView) ─────────

const TOOLBAR_ACTIONS: Record<string, { prefix: string; suffix: string; snippet?: string }> = {
  'bold': { prefix: '\\textbf{', suffix: '}' },
  'italic': { prefix: '\\textit{', suffix: '}' },
  'underline': { prefix: '\\underline{', suffix: '}' },
  'section': { prefix: '\\section{', suffix: '}' },
  'bullet list': { prefix: '', suffix: '', snippet: '\\begin{itemize}\n  \\item \n\\end{itemize}' },
  'numbered list': { prefix: '', suffix: '', snippet: '\\begin{enumerate}\n  \\item \n\\end{enumerate}' },
  'math': { prefix: '$', suffix: '$' },
  'link': { prefix: '\\href{url}{', suffix: '}' },
};

// ─── Monaco LaTeX language (Monaco ships no built-in LaTeX support) ───────────

function registerLatexLanguage(monaco: Monaco) {
  if (monaco.languages.getLanguages().some((l: { id: string }) => l.id === 'latex')) return;

  monaco.languages.register({ id: 'latex', extensions: ['.tex'], aliases: ['LaTeX', 'latex', 'tex'] });

  monaco.languages.setMonarchTokensProvider('latex', {
    defaultToken: '',
    tokenizer: {
      root: [
        [/%.*$/, 'comment'],
        [/\\(?:documentclass|usepackage|begin|end|input|include|newcommand|renewcommand|definecolor|colorlet)\b/, 'keyword.control'],
        [/\\[a-zA-Z@]+\*?/, 'keyword'],
        [/\\[\\%&$#_{}~^,;!: ]/, 'string.escape'],
        [/\$\$/, { token: 'string.math', next: '@displaymath' }],
        [/\$/, { token: 'string.math', next: '@inlinemath' }],
        [/[{}[\]]/, 'delimiter.bracket'],
        [/[&~]/, 'operator'],
        [/#+\d/, 'variable'],
        [/-?\d+(\.\d+)?(pt|mm|cm|in|em|ex|bp|sp|mu)?\b/, 'number'],
      ],
      displaymath: [
        [/\$\$/, { token: 'string.math', next: '@pop' }],
        [/\\[a-zA-Z@]+/, 'keyword'],
        [/[^$\\]+/, 'string.math'],
        [/./, 'string.math'],
      ],
      inlinemath: [
        [/\$/, { token: 'string.math', next: '@pop' }],
        [/\\[a-zA-Z@]+/, 'keyword'],
        [/[^$\\]+/, 'string.math'],
        [/./, 'string.math'],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration('latex', {
    comments: { lineComment: '%' },
    brackets: [['{', '}'], ['[', ']'], ['(', ')']],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '$', close: '$' },
      { open: '`', close: "'" },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '$', close: '$' },
    ],
    wordPattern: /\\?[a-zA-Z@]+/,
  });

  const commandSnippets: [string, string, string][] = [
    // [label, insertText (snippet), detail]
    ['\\section', '\\section{${1:Title}}', 'Section heading'],
    ['\\subsection', '\\subsection{${1:Title}}', 'Subsection heading'],
    ['\\textbf', '\\textbf{${1:text}}', 'Bold'],
    ['\\textit', '\\textit{${1:text}}', 'Italic'],
    ['\\underline', '\\underline{${1:text}}', 'Underline'],
    ['\\emph', '\\emph{${1:text}}', 'Emphasis'],
    ['\\item', '\\item ', 'List item'],
    ['\\href', '\\href{${1:url}}{${2:text}}', 'Hyperlink'],
    ['\\url', '\\url{${1:url}}', 'URL'],
    ['\\hfill', '\\hfill ', 'Horizontal fill'],
    ['\\vspace', '\\vspace{${1:6pt}}', 'Vertical space'],
    ['\\hspace', '\\hspace{${1:1em}}', 'Horizontal space'],
    ['\\rule', '\\rule{\\textwidth}{${1:0.5pt}}', 'Horizontal rule'],
    ['\\textcolor', '\\textcolor{${1:accent}}{${2:text}}', 'Colored text'],
    ['\\definecolor', '\\definecolor{${1:name}}{HTML}{${2:0E7490}}', 'Define a color'],
    ['\\colorlet', '\\colorlet{${1:name}}{${2:accent!60!white}}', 'Derive a color'],
    ['\\usepackage', '\\usepackage{${1:package}}', 'Load a package'],
    ['\\newcommand', '\\newcommand{\\\\${1:name}}[${2:1}]{${3:body}}', 'Define a command'],
    ['\\includegraphics', '\\includegraphics[width=${1:\\linewidth}]{${2:file}}', 'Image'],
    ['\\titleformat', '\\titleformat{\\section}{${1:\\large\\bfseries}}{}{0pt}{}', 'Style section titles'],
    ['\\begin', '\\begin{${1:itemize}}\n\t$0\n\\end{${1:itemize}}', 'Environment'],
  ];
  const environments = ['itemize', 'enumerate', 'center', 'flushleft', 'flushright', 'tabular', 'minipage', 'figure', 'document', 'paracol', 'small'];

  monaco.languages.registerCompletionItemProvider('latex', {
    triggerCharacters: ['\\'],
    provideCompletionItems: (model: MonacoEditorApi.ITextModel, position: MonacoPosition) => {
      const word = model.getWordUntilPosition(position);
      const lineText = model.getLineContent(position.lineNumber);
      // If the user already typed the backslash, replace it too so we don't double it.
      const startColumn = lineText[word.startColumn - 2] === '\\' ? word.startColumn - 1 : word.startColumn;
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn,
        endColumn: word.endColumn,
      };

      const suggestions = commandSnippets.map(([label, insertText, detail]) => ({
        label,
        kind: monaco.languages.CompletionItemKind.Function,
        insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail,
        range,
      }));
      for (const env of environments) {
        suggestions.push({
          label: `\\begin{${env}}`,
          kind: monaco.languages.CompletionItemKind.Module,
          insertText: `\\begin{${env}}\n\t$0\n\\end{${env}}`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: `${env} environment`,
          range,
        });
      }
      return { suggestions };
    },
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LatexEditor({
  resumeData,
  updateResumeData,
  selectedTemplate,
  autoCompile,
  activeTemplate,
  showPreview,
  compileStatus,
  setCompileStatus,
  executeActionRef,
  recompileRef,
  regenerateRef,
}: LatexEditorProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const initialLatex = resumeData.latexContent || generateLatex(resumeData, selectedTemplate);
  const [content, setContent] = useState(initialLatex);
  const [debouncedContent] = useDebounce(content, 2000);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [compileMs, setCompileMs] = useState<number | null>(null);
  const [compileErrors, setCompileErrors] = useState<CompileError[]>([]);
  const [rawLog, setRawLog] = useState('');
  const [showRawLog, setShowRawLog] = useState(false);
  const editorRef = useRef<MonacoEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const compileNowRef = useRef<() => void>(() => {});
  const inFlight = useRef<AbortController | null>(null);
  const compileSeq = useRef(0);
  const lastCompiled = useRef('');

  // Save latex content to resume data
  useEffect(() => {
    if (!resumeData.latexContent) {
      updateResumeData({ ...resumeData, latexContent: initialLatex });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyMarkers = useCallback((errors: CompileError[]) => {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel();
    if (!monaco || !model) return;
    monaco.editor.setModelMarkers(
      model,
      'latex-compile',
      errors
        .filter((e): e is { line: number; message: string } => e.line !== null)
        .map((e) => {
          const line = Math.min(Math.max(1, e.line), model.getLineCount());
          return {
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: line,
            endLineNumber: line,
            startColumn: 1,
            endColumn: model.getLineMaxColumn(line),
            message: e.message,
          };
        })
    );
  }, []);

  // Compile via our proxy (full TeX Live; engine auto-detected server-side).
  // Server round trips are slow (~30s on the free compiler), so: cancel any
  // in-flight compile when a new one starts, drop out-of-order responses, and
  // never recompile identical source.
  const compile = useCallback(async (source: string, force = false) => {
    if (!source.trim()) return;
    if (!force && source === lastCompiled.current) return;
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    const seq = ++compileSeq.current;
    const startedAt = performance.now();

    setCompileStatus('compiling');
    setCompileErrors([]);
    setRawLog('');
    try {
      const response = await fetch('/api/latex/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex: source }),
        signal: controller.signal,
      });
      if (seq !== compileSeq.current) return; // superseded

      if (!response.ok) {
        setCompileStatus('error');
        const errData = await response.json().catch(() => ({}));
        const errors: CompileError[] = Array.isArray(errData.errors) && errData.errors.length > 0
          ? errData.errors
          : [{ line: null, message: errData.details || errData.message || 'LaTeX compilation failed. Check your syntax.' }];
        setCompileErrors(errors);
        setRawLog(typeof errData.details === 'string' ? errData.details : '');
        applyMarkers(errors);
        return;
      }

      const buffer = await response.arrayBuffer();
      if (seq !== compileSeq.current) return;
      lastCompiled.current = source;
      setPdfData(buffer);
      setCompileMs(Math.round(performance.now() - startedAt));
      setCompileStatus('success');
      applyMarkers([]);
    } catch (err) {
      if (controller.signal.aborted || seq !== compileSeq.current) return;
      setCompileStatus('error');
      setCompileErrors([{ line: null, message: err instanceof Error ? err.message : 'Compilation connection failed.' }]);
    }
  }, [setCompileStatus, applyMarkers]);

  // Always-fresh compile entry point for keybindings/toolbar
  useEffect(() => {
    compileNowRef.current = () => compile(content, true);
  }, [content, compile]);

  // Cancel any in-flight compile on unmount
  useEffect(() => {
    return () => inFlight.current?.abort();
  }, []);

  // Auto-compile on debounced content change (covers typing AND pasting)
  useEffect(() => {
    if (autoCompile && debouncedContent) {
      compile(debouncedContent);
    }
  }, [debouncedContent, autoCompile, compile]);

  // Expose callbacks to parent via refs
  useEffect(() => {
    executeActionRef.current = (actionType: string) => {
      const editor = editorRef.current;
      if (!editor) return;
      const selection = editor.getSelection();
      if (!selection) return;

      const action = TOOLBAR_ACTIONS[actionType.toLowerCase()];
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
        editor.executeEdits('latex-toolbar', [{
          range: selection,
          text: action.prefix + selectedText + action.suffix,
          forceMoveMarkers: true,
        }]);
      }
      editor.focus();
    };

    recompileRef.current = () => {
      compile(content, true);
    };

    regenerateRef.current = (templateId?: string) => {
      const tmpl = templateId || activeTemplate;
      const newLatex = generateLatex(resumeData, tmpl);
      setContent(newLatex);
      updateResumeData({ ...resumeData, latexContent: newLatex });
      compile(newLatex, true);
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

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    // Overleaf-style compile shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => compileNowRef.current());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => compileNowRef.current());
  };

  const jumpToLine = (line: number) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.revealLineInCenter(line);
    editor.setPosition({ lineNumber: line, column: 1 });
    editor.focus();
  };

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-background text-foreground">
      {/* ── Main split ─────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Editor pane ─────────────────────────────────── */}
        <div className={showPreview ? 'w-1/2 flex flex-col min-h-0 border-r border-border' : 'w-full flex flex-col min-h-0'}>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              defaultLanguage="latex"
              theme={isDark ? 'vs-dark' : 'vs-light'}
              value={content}
              onChange={handleEditorChange}
              beforeMount={registerLatexLanguage}
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
                quickSuggestions: { other: true, comments: false, strings: true },
              }}
            />
          </div>
          <div className="shrink-0 border-t border-border bg-muted/30 px-3 py-1 text-[11px] text-muted-foreground select-none">
            Ctrl+Enter / Ctrl+S to compile · type \ for suggestions · paste any LaTeX document — it compiles as-is
            {compileStatus === 'compiling' && ' · compiling on server (can take ~30s)…'}
            {compileStatus === 'success' && compileMs !== null && ` · compiled in ${(compileMs / 1000).toFixed(1)}s`}
          </div>
        </div>

        {/* ── Preview pane ────────────────────────────────── */}
        {showPreview && (
          <div className="w-1/2 flex flex-col min-h-0 bg-muted/10">
            {/* PDF display (pdf.js canvases — iframes can't reliably show PDFs) */}
            <div className="flex-1 min-h-0">
              {pdfData ? (
                <PdfJsPreview data={pdfData} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                  {compileStatus === 'compiling' ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/60" />
                      <span className="text-sm">Compiling on the server — first build takes ~30s</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-8 h-8 text-muted-foreground/60" />
                      <span className="text-sm">Click Recompile or enable Auto Compile</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Error panel (shows automatically on compilation errors) */}
            {compileStatus === 'error' && compileErrors.length > 0 && (
              <div className="border-t border-border bg-card px-3 py-2 max-h-48 overflow-y-auto shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Compilation errors
                  </div>
                  {rawLog && (
                    <button
                      type="button"
                      onClick={() => setShowRawLog((v) => !v)}
                      className="text-[11px] text-muted-foreground underline hover:text-foreground"
                    >
                      {showRawLog ? 'Hide full log' : 'Show full log'}
                    </button>
                  )}
                </div>
                {compileErrors.map((err, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => err.line !== null && jumpToLine(err.line)}
                    className={`block w-full text-left text-xs font-mono py-0.5 text-red-600 dark:text-red-400 ${
                      err.line !== null ? 'hover:underline cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    {err.line !== null ? `line ${err.line}: ` : ''}
                    {err.message}
                  </button>
                ))}
                {showRawLog && rawLog && (
                  <pre className="mt-2 max-h-28 overflow-auto rounded bg-muted/40 p-2 text-[10px] leading-4 text-muted-foreground whitespace-pre-wrap">
                    {rawLog}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
