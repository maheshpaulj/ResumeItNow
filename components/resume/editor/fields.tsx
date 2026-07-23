"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Bold, Italic, List, Loader2, RotateCcw, Sparkles, Camera, X, Calendar } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/* ---------------------------------- markdown ---------------------------------- */

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Parse markdown into individual formatted HTML lines. */
export function markdownToLines(md: string): string[] {
  if (!md) return [];
  return md
    .split('\n')
    .map((line) => {
      let l = escapeHtml(line);
      // bold before italic so ** isn't matched as two single-* italics
      l = l.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      l = l.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      if (/^\s*-\s/.test(line)) {
        l = `• ${l.replace(/^\s*-\s/, '')}`;
      }
      return l;
    });
}

/** Render the app's markdown subset (bold + "- " bullets) as read-only HTML. */
export function markdownToHtml(md: string): string {
  if (!md) return '';
  return md
    .split('\n')
    .map((line) => {
      let l = escapeHtml(line);
      // bold before italic so ** isn't matched as two single-* italics
      l = l.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      l = l.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      if (/^\s*-\s/.test(line)) {
        l = `• ${l.replace(/^\s*-\s/, '')}`;
      }
      return l;
    })
    .join('<br/>');
}

/** Markdown → editable HTML (one div per line so contentEditable behaves). */
function mdToEditableHtml(md: string): string {
  return (md || '')
    .split('\n')
    .map((line) => {
      let l = escapeHtml(line);
      l = l.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
      l = l.replace(/\*([^*]+)\*/g, '<i>$1</i>');
      if (/^\s*-\s/.test(line)) l = '• ' + l.replace(/^\s*-\s/, '');
      return `<div>${l || '<br>'}</div>`;
    })
    .join('');
}

/** Editable HTML → markdown (b/strong → **, i/em → *, block elements → newlines, • → "- "). */
function editableHtmlToMd(el: HTMLElement): string {
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    const e = node as HTMLElement;
    const inner = Array.from(node.childNodes).map(walk).join('');
    switch (e.tagName) {
      case 'B':
      case 'STRONG':
        return inner ? `**${inner}**` : '';
      case 'I':
      case 'EM':
        return inner ? `*${inner}*` : '';
      case 'BR':
        return '';
      case 'DIV':
      case 'P':
      case 'LI':
        return `\n${inner}`;
      default:
        return inner;
    }
  };
  let md = Array.from(el.childNodes).map(walk).join('');
  md = md.replace(/^\n/, '');
  return md
    .split('\n')
    .map((l) => l.replace(/^\s*•\s?/, '- '))
    .join('\n')
    .replace(/\n+$/, '');
}

/* ---------------------------------- InlineText ---------------------------------- */

interface InlineTextProps {
  value: string;
  onCommit: (value: string) => void;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  ariaLabel?: string;
}

/** Single-line seamless inline editor. Uncontrolled contentEditable so the caret never jumps. */
export function InlineText({
  value,
  onCommit,
  className,
  style,
  placeholder,
  ariaLabel,
}: InlineTextProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerText !== (value || '')) {
      el.innerText = value || '';
    }
  }, [value]);

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={ariaLabel}
      data-placeholder={placeholder || ariaLabel}
      spellCheck={false}
      className={cn(
        'inline-block min-w-0 max-w-full cursor-text rounded-sm outline-none break-words',
        'transition-colors hover:bg-black/[0.04] focus:bg-emerald-50/80 focus:ring-1 focus:ring-emerald-300',
        'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400/90 empty:before:pointer-events-none',
        className
      )}
      style={style}
      onInput={(e) => onCommit((e.target as HTMLElement).innerText.replace(/\n/g, ' '))}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      }}
      onPaste={(e) => {
        e.preventDefault();
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
      }}
    />
  );
}

/* ---------------------------------- DateField ---------------------------------- */

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface DateFieldProps {
  value: string;
  onCommit: (value: string) => void;
  className?: string;
  style?: CSSProperties;
  allowPresent?: boolean;
  ariaLabel?: string;
}

/** Editable date: click to open a month/year picker. Commits "Mon YYYY" or "Present". */
export function DateField({
  value,
  onCommit,
  className,
  style,
  allowPresent,
  ariaLabel,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const parsed = value?.match(/([A-Za-z]{3,})\.?\s*(\d{4})/);
  const initialYear = parsed ? parseInt(parsed[2], 10) : new Date().getFullYear();
  const [year, setYear] = useState(initialYear);

  useEffect(() => {
    if (open) setYear(initialYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel || 'Pick a date'}
          className={cn(
            'inline-flex items-center gap-1 rounded-sm outline-none cursor-pointer',
            'transition-colors hover:bg-black/[0.04] data-[state=open]:bg-emerald-50 data-[state=open]:ring-1 data-[state=open]:ring-emerald-300',
            !value && 'text-gray-400/90',
            className
          )}
          style={style}
        >
          <Calendar className="h-3 w-3 shrink-0 opacity-60" />
          {value || ariaLabel || 'Date'}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-2" align="start" contentEditable={false}>
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            className="rounded p-1 hover:bg-accent"
            onClick={() => setYear((y) => y - 1)}
            aria-label="Previous year"
          >
            ‹
          </button>
          <span className="text-sm font-semibold">{year}</span>
          <button
            type="button"
            className="rounded p-1 hover:bg-accent"
            onClick={() => setYear((y) => y + 1)}
            aria-label="Next year"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {MONTHS.map((m) => {
            const label = `${m} ${year}`;
            const selected = value === label;
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  onCommit(label);
                  setOpen(false);
                }}
                className={cn(
                  'rounded py-1.5 text-xs hover:bg-accent',
                  selected && 'bg-primary text-primary-foreground hover:bg-primary'
                )}
              >
                {m}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex gap-1">
          <button
            type="button"
            onClick={() => {
              onCommit(`${year}`);
              setOpen(false);
            }}
            className="flex-1 rounded border py-1 text-xs hover:bg-accent"
          >
            Year only
          </button>
          {allowPresent && (
            <button
              type="button"
              onClick={() => {
                onCommit('Present');
                setOpen(false);
              }}
              className="flex-1 rounded border py-1 text-xs hover:bg-accent"
            >
              Present
            </button>
          )}
          {value && (
            <button
              type="button"
              onClick={() => {
                onCommit('');
                setOpen(false);
              }}
              className="rounded border px-2 py-1 text-xs text-red-500 hover:bg-red-50"
              aria-label="Clear date"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ---------------------------------- PhotoField ---------------------------------- */

// Downscale to a square thumbnail so the base64 stays well under Firestore's 1MB.
function fileToScaledDataUrl(file: File, size = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('no canvas'));
      ctx.drawImage(
        img,
        (img.width - side) / 2,
        (img.height - side) / 2,
        side,
        side,
        0,
        0,
        size,
        size
      );
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

interface PhotoFieldProps {
  value?: string;
  isEditing: boolean;
  /** whether the photo slot is enabled (from the "Show photo" setting) */
  show?: boolean;
  onChange: (dataUrl: string) => void;
  className?: string;
  style?: CSSProperties;
}

/** Circular profile photo. Visibility is controlled entirely by `show` (the
 *  "Profile photo" toggle) so it can be turned off even after a photo is added. */
export function PhotoField({ value, isEditing, show, onChange, className, style }: PhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  if (!show) return null;

  const pick = async (file?: File) => {
    if (!file) return;
    try {
      onChange(await fileToScaledDataUrl(file));
    } catch (e) {
      console.error('photo error', e);
    }
  };

  return (
    <div
      className={cn(
        'group/photo relative shrink-0 overflow-hidden rounded-full bg-gray-100',
        className
      )}
      style={style}
      contentEditable={false}
    >
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="Profile" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-gray-400">
          <Camera className="h-1/3 w-1/3" />
        </div>
      )}
      {isEditing && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity group-hover/photo:opacity-100 print:hidden"
            aria-label="Upload photo"
          >
            <Camera className="h-1/4 w-1/4" />
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-0 top-0 rounded-full bg-white/90 p-0.5 text-red-500 opacity-0 shadow transition-opacity group-hover/photo:opacity-100 print:hidden"
              aria-label="Remove photo"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </>
      )}
    </div>
  );
}

/* ------------------------------- SkillTypeToggle ------------------------------- */

/** Edit-mode toggle to switch a skill row between a category group and a single skill. */
export function SkillTypeToggle({
  type,
  onChange,
}: {
  type?: string;
  onChange: (t: string) => void;
}) {
  const individual = type === 'individual';
  return (
    <button
      type="button"
      contentEditable={false}
      onClick={() => onChange(individual ? 'group' : 'individual')}
      title="Switch between a category group and a single skill"
      className="ml-2 shrink-0 rounded border px-1 text-[10px] font-medium text-gray-500 hover:bg-gray-100 print:hidden"
    >
      {individual ? 'Individual' : 'Category'}
    </button>
  );
}

/* ---------------------------------- RichText ---------------------------------- */

interface RichTextProps {
  value: string;
  onCommit: (value: string) => void;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  ariaLabel?: string;
}

/**
 * Multiline WYSIWYG editor for descriptions. Bold/italic render live, "- " lines
 * render as bullets, and a floating toolbar (bold / italic / bullet / AI enhance /
 * undo) appears on focus.
 */
export function RichText({
  value,
  onCommit,
  className,
  style,
  placeholder,
  ariaLabel,
}: RichTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  // holds the pre-enhance markdown so the user can revert one AI pass
  const [undoValue, setUndoValue] = useState<string | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && !enhancing) {
      const next = mdToEditableHtml(value);
      if (el.innerHTML !== next) el.innerHTML = value ? next : '';
    }
  }, [value, enhancing]);

  const commit = useCallback(() => {
    if (ref.current) onCommit(editableHtmlToMd(ref.current));
  }, [onCommit]);

  const handleEnhance = async () => {
    if (!ref.current || enhancing) return;
    const current = editableHtmlToMd(ref.current);
    if (!current.trim()) return;
    setEnhancing(true);
    try {
      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: current }),
      });
      if (!res.ok) throw new Error('enhance failed');
      const data = await res.json();
      if (data.enhanced && ref.current) {
        setUndoValue(current);
        ref.current.innerHTML = mdToEditableHtml(data.enhanced);
        onCommit(data.enhanced);
      }
    } catch (error) {
      console.error('AI enhance failed:', error);
    } finally {
      setEnhancing(false);
    }
  };

  const handleUndo = () => {
    if (undoValue === null || !ref.current) return;
    ref.current.innerHTML = mdToEditableHtml(undoValue);
    onCommit(undoValue);
    setUndoValue(null);
  };

  const toolbarButton = (
    icon: ReactNode,
    onClick: () => void,
    label: string,
    extra?: string
  ) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'flex h-7 items-center gap-1 rounded-md px-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors',
        extra
      )}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {icon}
    </button>
  );

  return (
    <div className="relative">
      <AnimatePresence>
        {(focused || enhancing) && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute -top-9 left-0 z-30 flex items-center gap-0.5 rounded-lg border bg-white p-1 shadow-lg"
            contentEditable={false}
          >
            {toolbarButton(<Bold className="h-3.5 w-3.5" />, () => {
              document.execCommand('bold');
              commit();
            }, 'Bold (Ctrl+B)')}
            {toolbarButton(<Italic className="h-3.5 w-3.5" />, () => {
              document.execCommand('italic');
              commit();
            }, 'Italic (Ctrl+I)')}
            {toolbarButton(<List className="h-3.5 w-3.5" />, () => {
              document.execCommand('insertText', false, '• ');
              commit();
            }, 'Bullet')}
            <div className="mx-0.5 h-4 w-px bg-gray-200" />
            {toolbarButton(
              enhancing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Enhance</span>
                </>
              ),
              handleEnhance,
              'Enhance with AI',
              'text-violet-600 hover:bg-violet-50 hover:text-violet-700'
            )}
            {undoValue !== null &&
              toolbarButton(
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Undo</span>
                </>,
                handleUndo,
                'Undo AI enhance',
                'text-amber-600 hover:bg-amber-50 hover:text-amber-700'
              )}
          </motion.div>
        )}
      </AnimatePresence>
      <div
        ref={ref}
        contentEditable={!enhancing}
        data-rich-text="true"
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        data-placeholder={placeholder || ariaLabel}
        spellCheck={false}
        className={cn(
          'w-full cursor-text rounded-sm outline-none whitespace-pre-wrap break-words min-w-0',
          'transition-colors hover:bg-black/[0.04] focus:bg-emerald-50/60 focus:ring-1 focus:ring-emerald-300',
          'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400/90 empty:before:pointer-events-none',
          enhancing && 'opacity-60 animate-pulse',
          className
        )}
        style={style}
        onFocus={() => {
          if (blurTimer.current) clearTimeout(blurTimer.current);
          setFocused(true);
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setFocused(false), 160);
        }}
        onInput={() => {
          setUndoValue(null);
          commit();
        }}
        onPaste={(e) => {
          e.preventDefault();
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
        }}
      />
    </div>
  );
}

/* ---------------------------------- renderInput ---------------------------------- */

export interface RenderInputOptions {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  className?: string;
  type?: string;
  ariaLabel?: string;
  textColor?: string;
  inlineStyle?: CSSProperties;
  /** for type="date": offer a "Present" option */
  allowPresent?: boolean;
}

/**
 * Shared field renderer used by every template. In view mode it renders links and
 * markdown; in edit mode it renders seamless inline editors that inherit the
 * template's typography.
 */
export function useRenderInput(isEditing: boolean) {
  return useCallback(
    ({
      value,
      onChange,
      multiline = false,
      className = '',
      type = '',
      ariaLabel = '',
      textColor = '',
      inlineStyle = {},
      allowPresent = false,
    }: RenderInputOptions) => {
      if (!isEditing) {
        if (type === 'date') {
          return (
            <span className={cn(textColor, className)} style={inlineStyle} aria-label={ariaLabel}>
              {value}
            </span>
          );
        }
        const linkHref =
          type === 'mail' ? `mailto:${value}` : type === 'phone' ? `tel:${value}` : value;
        if (type === 'link' || type === 'mail' || type === 'phone') {
          return (
            <a
              href={linkHref}
              {...(type === 'link' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className={cn('hover:underline break-words min-w-0', textColor, className)}
              style={inlineStyle}
              aria-label={ariaLabel}
            >
              {type === 'link' ? value?.replace(/^https?:\/\//, '') : value}
            </a>
          );
        }
        if (multiline) {
          const lines = markdownToLines(value);
          return (
            <div className={cn('flex flex-col', className)} style={inlineStyle} aria-label={ariaLabel}>
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="break-inside-avoid-line text-justify break-words min-w-0"
                  data-rb="entry-content"
                  dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }}
                />
              ))}
            </div>
          );
        }
        return (
          <span
            className={cn('break-words min-w-0', textColor, className)}
            style={inlineStyle}
            aria-label={ariaLabel}
            dangerouslySetInnerHTML={{ __html: markdownToHtml(value) }}
          />
        );
      }

      if (type === 'date') {
        return (
          <DateField
            value={value || ''}
            onCommit={onChange}
            className={cn(textColor, className)}
            style={inlineStyle}
            allowPresent={allowPresent}
            ariaLabel={ariaLabel}
          />
        );
      }

      if (multiline) {
        return (
          <RichText
            value={value || ''}
            onCommit={onChange}
            className={cn(textColor, className)}
            style={inlineStyle}
            ariaLabel={ariaLabel}
          />
        );
      }

      return (
        <InlineText
          value={value || ''}
          onCommit={onChange}
          className={cn(textColor, className)}
          style={inlineStyle}
          ariaLabel={ariaLabel}
        />
      );
    },
    [isEditing]
  );
}
