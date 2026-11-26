import type { ReactNode } from 'react';
import { hasEditingMetadata, isEmptyField, type MaybeField } from './empty.js';

export interface FieldGuardState {
  /** True when the page is rendering inside Page Builder. */
  isEditing: boolean;
  /** True when the guarded field(s) have no content. */
  isEmpty: boolean;
}

export interface FieldGuardProps {
  /** The field to guard. Use `fields` to guard several at once. */
  field?: MaybeField;
  /** Several fields to guard together, e.g. a heading and its subheading. */
  fields?: MaybeField[];
  /**
   * With several fields: render when `any` has content (default),
   * or only when `all` of them do.
   */
  require?: 'any' | 'all';
  /**
   * Override editing detection. By default the guard treats the page as
   * editing when any guarded field carries Page Builder metadata, which
   * works in server components without a hook.
   */
  isEditing?: boolean;
  /** Rendered on the live site when the field is empty. Defaults to nothing. */
  fallback?: ReactNode;
  /** Content to render, or a function that receives the guard state. */
  children: ReactNode | ((state: FieldGuardState) => ReactNode);
}

/**
 * Renders its children (wrapper markup included) when the field has
 * content, and always in Page Builder so authors can fill in empty fields.
 *
 * Replaces the common `fields.title.value && <Text field={fields.title} />`
 * pattern, which hides empty fields from authors.
 *
 * @example
 * <FieldGuard field={fields.heading}>
 *   <div className="hero__heading">
 *     <Text field={fields.heading} tag="h1" />
 *   </div>
 * </FieldGuard>
 */
export function FieldGuard({
  field,
  fields,
  require = 'any',
  isEditing,
  fallback = null,
  children,
}: FieldGuardProps) {
  const guarded: MaybeField[] = fields ?? [field];
  const editing = isEditing ?? guarded.some(hasEditingMetadata);
  const filled = guarded.map((f) => !isEmptyField(f));
  const hasContent = require === 'all' ? filled.every(Boolean) : filled.some(Boolean);
  const state: FieldGuardState = { isEditing: editing, isEmpty: !hasContent };

  if (!editing && !hasContent) return <>{fallback}</>;
  return <>{typeof children === 'function' ? children(state) : children}</>;
}
