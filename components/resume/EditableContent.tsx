// src/components/resume/EditableContent.tsx
"use client";

import ContentEditable, { ContentEditableEvent } from 'react-contenteditable';
import { cn } from '@/lib/utils';
import React from 'react';

// A helper to sanitize pasted content, especially from Word/Docs
const sanitize = (html: string): string => {
  // A simple sanitizer: remove all tags except basic formatting
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Allow only <b>, <strong>, <i>, <em>, <ul>, <ol>, <li>, <br>
  const allowedTags = ['B', 'STRONG', 'I', 'EM', 'UL', 'OL', 'LI', 'BR'];
  doc.body.querySelectorAll('*').forEach(node => {
    if (!allowedTags.includes(node.tagName)) {
        // Replace disallowed tags with their text content
        node.replaceWith(...Array.from(node.childNodes));
    }
  });
  return doc.body.innerHTML;
};

interface EditableContentProps {
  isEditing: boolean;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  tagName?: keyof React.JSX.IntrinsicElements;
  multiline?: boolean;
  ariaLabel?: string;
  style?: React.CSSProperties;
  // For rendering special content like links when not editing
  nonEditRenderer?: () => React.ReactNode;
}

export const EditableContent = React.memo(
  ({
    isEditing,
    value,
    onChange,
    className,
    tagName = 'div',
    multiline = false,
    ariaLabel,
    style,
    nonEditRenderer,
  }: EditableContentProps) => {
    const handleChange = (evt: ContentEditableEvent) => {
      // Use the raw text value from the event
      const sanitizedValue = sanitize(evt.target.value);
      onChange(sanitizedValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Prevent new lines for single-line inputs
      if (!multiline && e.key === 'Enter') {
        e.preventDefault();
        (e.target as HTMLElement).blur(); // Optionally blur on enter
      }
    };

    if (!isEditing) {
      // Use the custom renderer if provided (for links, etc.)
      if (nonEditRenderer) {
        return <>{nonEditRenderer()}</>;
      }
      // Render the HTML content when not editing
      const Tag = tagName;
      return (
        <Tag
          className={className}
          style={style}
          dangerouslySetInnerHTML={{ __html: value || '' }}
        />
      );
    }

    return (
      <ContentEditable
        html={value || ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        tagName={tagName}
        className={cn(
          'outline-none focus:bg-muted focus:ring-2 focus:ring-ring rounded-sm px-1 -mx-1 transition-all',
          className
        )}
        aria-label={ariaLabel}
        style={style}
      />
    );
  }
);

EditableContent.displayName = 'EditableContent';