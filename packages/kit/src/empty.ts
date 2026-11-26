/**
 * Field-type aware empty checks.
 *
 * These follow the same rules as the Content SDK's own `isFieldValueEmpty`
 * (images and files need a `src`, links need an `href`, dates use the
 * Sitecore minimum date as "empty"), and add the cases that matter for
 * rendering decisions: whitespace-only text and rich text that is only
 * empty markup such as `<p></p>` or `<p>&nbsp;</p>`.
 */

/** The value Sitecore returns for a date field that has never been set. */
export const EMPTY_DATE_FIELD_VALUE = '0001-01-01T00:00:00Z';

/** Minimal shape of a Sitecore field, compatible with Content SDK field types. */
export interface FieldLike<T = unknown> {
  value?: T;
  metadata?: { [key: string]: unknown };
}

/** Anything a component might receive for a field, including missing data. */
export type MaybeField = FieldLike | unknown[] | null | undefined;

type Obj = { [key: string]: unknown };

const isObject = (value: unknown): value is Obj =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const valueOf = (field: unknown): unknown => (isObject(field) ? field.value : undefined);

/** Tags that make rich text meaningful even when it contains no text. */
const MEANINGFUL_TAGS = /<(img|iframe|video|audio|embed|object|svg|picture|canvas|hr)\b/i;

/** Single-line text, multi-line text and numeric fields. */
export function isEmptyText(field: MaybeField): boolean {
  const value = valueOf(field);
  if (value === null || value === undefined) return true;
  if (typeof value === 'number' || typeof value === 'boolean') return false;
  return String(value).trim() === '';
}

/** Rich text fields. Treats markup with no visible text (and no media) as empty. */
export function isEmptyRichText(field: MaybeField): boolean {
  const value = valueOf(field);
  if (value === null || value === undefined) return true;
  const html = String(value);
  if (MEANINGFUL_TAGS.test(html)) return false;
  const text = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;|&#160;|&#xa0;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();
  return text === '';
}

/** Image fields (including NextImage). Empty when there is no `src`. */
export function isEmptyImage(field: MaybeField): boolean {
  const value = valueOf(field);
  return !(isObject(value) && typeof value.src === 'string' && value.src.trim() !== '');
}

/** General Link fields. Empty when there is no `href`. */
export function isEmptyLink(field: MaybeField): boolean {
  const value = valueOf(field);
  return !(isObject(value) && typeof value.href === 'string' && value.href.trim() !== '');
}

/** File fields. Empty when there is no `src`. */
export function isEmptyFile(field: MaybeField): boolean {
  return isEmptyImage(field);
}

/** Date and Datetime fields. Empty when unset or the Sitecore minimum date. */
export function isEmptyDate(field: MaybeField): boolean {
  const value = valueOf(field);
  if (value === null || value === undefined || value === '') return true;
  if (value instanceof Date) return isNaN(value.getTime());
  if (typeof value === 'string') return value === EMPTY_DATE_FIELD_VALUE;
  return true;
}

/**
 * Multilist, treelist and other reference fields, which Layout Service
 * returns as an array of items. Also accepts `{ value: [] }`.
 */
export function isEmptyList(field: MaybeField): boolean {
  if (Array.isArray(field)) return field.length === 0;
  const value = valueOf(field);
  if (Array.isArray(value)) return value.length === 0;
  return field === null || field === undefined;
}

/**
 * Detects the field type from its value and applies the matching check.
 * Use the specific checks when you know the type; this is a convenience
 * for guards that accept any field.
 */
export function isEmptyField(field: MaybeField): boolean {
  if (field === null || field === undefined) return true;
  if (Array.isArray(field)) return field.length === 0;
  const value = valueOf(field);
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (value instanceof Date) return isNaN(value.getTime());
  if (isObject(value)) {
    if ('href' in value) return isEmptyLink(field);
    if ('src' in value) return isEmptyImage(field);
    return Object.keys(value).length === 0;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return false;
  const text = String(value);
  if (text === EMPTY_DATE_FIELD_VALUE) return true;
  if (/<[a-z][\s\S]*>/i.test(text)) return isEmptyRichText(field);
  return isEmptyText(field);
}

/**
 * True when a field was delivered with Page Builder editing metadata.
 * In editing mode the Content SDK adds `metadata` to every directly
 * editable field, so this works in server components without a hook.
 */
export function hasEditingMetadata(field: MaybeField): boolean {
  return isObject(field) && isObject(field.metadata);
}
