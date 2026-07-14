"use client";
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, EyeOff, GripVertical, Plus, Scissors, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ENTRY_DEFAULTS, useEditor, type ArraySection } from './context';

/**
 * Wraps one resume section on the canvas: drag handle to reorder sections,
 * hide/add/move controls. Only one section/entry's controls are visible at a
 * time — resumeView tracks the hovered `data-rbkey` and sets `activeKey`.
 */
export function EditableSection({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  const { editable, hideSection, addEntry, moveSection, activeKey, pageBreaks, toggleBreak } =
    useEditor();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: !editable });

  if (!editable) {
    // still tag the wrapper so the PDF page renderer can apply manual breaks
    return (
      <div className={className} data-rbkey={`s:${id}`}>
        {children}
      </div>
    );
  }

  const isArraySection = id in ENTRY_DEFAULTS;
  const active = activeKey === `s:${id}` || isDragging;
  const broken = pageBreaks.includes(`s:${id}`);

  const style: CSSProperties = {
    // translate only — CSS.Transform includes a scale factor that stretches
    // the dragged section when neighbours have different heights
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const railBtn =
    'flex h-7 w-7 items-center justify-center text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900';

  return (
    <div
      ref={setNodeRef}
      data-rbkey={`s:${id}`}
      style={style}
      className={cn(
        'relative rounded-sm',
        isDragging && 'z-30 bg-white shadow-2xl ring-2 ring-emerald-400/60',
        className
      )}
    >
      {/* Section controls: one solid connected block flush against the section */}
      <div
        className={cn(
          'absolute right-full top-0 z-30 pr-1.5 print:hidden transition-opacity duration-150',
          active ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        contentEditable={false}
      >
        <div className="flex flex-col divide-y overflow-hidden rounded-lg border bg-white shadow-md">
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder section"
            title="Drag to reorder section"
            className={cn(railBtn, 'cursor-grab active:cursor-grabbing')}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Move section up"
            title="Move section up"
            onClick={() => moveSection(id, -1)}
            className={railBtn}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Move section down"
            title="Move section down"
            onClick={() => moveSection(id, 1)}
            className={railBtn}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          {isArraySection && (
            <button
              type="button"
              aria-label="Add entry to section"
              title="Add entry"
              onClick={() => addEntry(id as ArraySection)}
              className={cn(railBtn, 'hover:text-emerald-600')}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            aria-label="Page break after section"
            title={broken ? 'Remove page break' : 'Page break after section'}
            onClick={() => toggleBreak(`s:${id}`)}
            className={cn(railBtn, broken ? 'text-sky-600' : 'hover:text-sky-600')}
          >
            <Scissors className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Hide section"
            title="Hide section"
            onClick={() => hideSection(id)}
            className={cn(railBtn, 'hover:text-red-500')}
          >
            <EyeOff className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

/**
 * Floating toolbar for one entry (job, project, skill row…). Rendered as the
 * first child of the entry's wrapper — the wrapper just needs `relative` in its
 * className; this tags the wrapper with a `data-rbkey` so hover tracking works.
 */
export function EntryChrome({
  section,
  index,
  count,
}: {
  section: ArraySection;
  index: number;
  count: number;
}) {
  const { editable, addEntry, removeEntry, moveEntry, activeKey, pageBreaks, toggleBreak } =
    useEditor();
  const ref = useRef<HTMLDivElement>(null);
  const key = `e:${section}:${index}`;
  const broken = pageBreaks.includes(key);

  // Tag the parent (the entry wrapper) so the central hover tracker can find it.
  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (parent) parent.dataset.rbkey = key;
  }, [key]);

  if (!editable) return null;
  const active = activeKey === key;

  const iconBtn =
    'flex h-8 w-8 items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors first:rounded-l-full last:rounded-r-full';

  return (
    <div
      ref={ref}
      contentEditable={false}
      className={cn(
        'absolute -top-8 left-1/2 z-20 -translate-x-1/2 print:hidden transition-all duration-150',
        active ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-1'
      )}
    >
      <div className="flex items-center overflow-hidden rounded-full border bg-white shadow-lg">
        <button
          type="button"
          onClick={() => addEntry(section, index)}
          className="flex h-8 items-center gap-1 bg-emerald-500 pl-2.5 pr-3 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
          aria-label="Add entry below"
        >
          <Plus className="h-4 w-4" />
          Entry
        </button>
        <button
          type="button"
          onClick={() => moveEntry(section, index, -1)}
          disabled={index === 0}
          className={cn(iconBtn, 'disabled:opacity-30 disabled:hover:bg-transparent')}
          aria-label="Move entry up"
          title="Move up"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => moveEntry(section, index, 1)}
          disabled={index >= count - 1}
          className={cn(iconBtn, 'disabled:opacity-30 disabled:hover:bg-transparent')}
          aria-label="Move entry down"
          title="Move down"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => toggleBreak(key)}
          className={cn(iconBtn, broken ? 'text-sky-600' : 'hover:text-sky-600')}
          aria-label="Page break after entry"
          title={broken ? 'Remove page break' : 'Page break after this entry'}
        >
          <Scissors className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => removeEntry(section, index)}
          className={cn(iconBtn, 'hover:text-red-600 hover:bg-red-50')}
          aria-label="Delete entry"
          title="Delete entry"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
