import type { CSSProperties, ReactNode } from 'react';
import { hasEditingMetadata, isEmptyImage, isEmptyLink, type MaybeField } from './empty.js';

/** Default look for hints. Override with `className` + `unstyled`, or target `[data-pagebuilder-hint]`. */
export const hintStyle: CSSProperties = {
  display: 'block',
  margin: '4px 0',
  padding: '4px 8px',
  border: '1px dashed #b45309',
  borderRadius: 4,
  background: '#fffbeb',
  color: '#78350f',
  font: '12px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif',
};

interface BaseHintProps {
  /** Extra class for the hint element. */
  className?: string;
  /** Drop the default inline styles and style the hint yourself. */
  unstyled?: boolean;
}

export interface EditorHintProps extends BaseHintProps {
  /** Show the hint. Defaults to true. Combine with your own checks. */
  when?: boolean;
  /** Explicit editing flag. Use this when no field is available to detect it. */
  isEditing?: boolean;
  /** A field on the same component; its editing metadata marks the page as editing. */
  field?: MaybeField;
  /** Kind of hint, exposed as `data-pagebuilder-hint` for styling. */
  kind?: string;
  children: ReactNode;
}

/**
 * A note that only authors see in Page Builder. Renders nothing on the live site.
 * Editing is detected from `isEditing`, or from the editing metadata on `field`.
 *
 * @example
 * <EditorHint field={fields.heading}>Related articles are managed in the Content panel.</EditorHint>
 */
export function EditorHint({
  when = true,
  isEditing,
  field,
  kind = 'note',
  className,
  unstyled,
  children,
}: EditorHintProps) {
  const editing = isEditing ?? hasEditingMetadata(field);
  if (!editing || !when) return null;
  return (
    <span
      role="note"
      data-pagebuilder-hint={kind}
      className={className}
      style={unstyled ? undefined : hintStyle}
    >
      {children}
    </span>
  );
}

const visibleLength = (value: unknown): number =>
  String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .trim().length;

export interface TextLengthHintProps extends BaseHintProps {
  /** Text or rich text field to measure. */
  field: MaybeField;
  /** Recommended maximum number of characters. */
  max: number;
  /** Human name of the field used in the message, e.g. "Headline". */
  label?: string;
  /** Custom message. Receives the current length and the maximum. */
  message?: (length: number, max: number) => ReactNode;
}

/**
 * Warns authors in Page Builder when a field is longer than recommended,
 * e.g. headlines that will wrap badly or meta titles that get cut off.
 */
export function TextLengthHint({ field, max, label = 'This text', message, ...rest }: TextLengthHintProps) {
  const value = field && !Array.isArray(field) ? field.value : undefined;
  const length = visibleLength(value);
  return (
    <EditorHint field={field} when={length > max} kind="text-length" {...rest}>
      {message ? message(length, max) : `${label} is ${length} characters. Aim for ${max} or fewer.`}
    </EditorHint>
  );
}

export interface ImageAltHintProps extends BaseHintProps {
  /** Image field to check. */
  field: MaybeField;
  /** Custom message. */
  children?: ReactNode;
}

/**
 * Warns authors in Page Builder when an image has no alt text.
 * Says nothing for empty image fields, since the SDK already shows its own placeholder.
 */
export function ImageAltHint({ field, children, ...rest }: ImageAltHintProps) {
  const value = field && !Array.isArray(field) ? (field.value as { alt?: unknown } | undefined) : undefined;
  const missingAlt = !isEmptyImage(field) && String(value?.alt ?? '').trim() === '';
  return (
    <EditorHint field={field} when={missingAlt} kind="image-alt" {...rest}>
      {children ?? 'This image has no alt text. Add it on the image field or its media item so screen readers can describe it.'}
    </EditorHint>
  );
}

export interface LinkTextHintProps extends BaseHintProps {
  /** General Link field to check. */
  field: MaybeField;
  /** Custom message. */
  children?: ReactNode;
}

/** Warns authors in Page Builder when a link has a URL but no link text. */
export function LinkTextHint({ field, children, ...rest }: LinkTextHintProps) {
  const value = field && !Array.isArray(field) ? (field.value as { text?: unknown } | undefined) : undefined;
  const missingText = !isEmptyLink(field) && String(value?.text ?? '').trim() === '';
  return (
    <EditorHint field={field} when={missingText} kind="link-text" {...rest}>
      {children ?? 'This link has no text. Add a description so visitors know where it goes.'}
    </EditorHint>
  );
}
