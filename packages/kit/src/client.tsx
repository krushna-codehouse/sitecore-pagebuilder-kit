'use client';

import type { ReactNode } from 'react';
import { useSitecore } from '@sitecore-content-sdk/react';
import { EditorHint, type EditorHintProps } from './hints.js';
import { isEmptyList, type MaybeField } from './empty.js';

/**
 * True when the page is rendering inside Page Builder.
 * Reads `page.mode.isEditing` from the Content SDK's SitecoreProvider,
 * and returns false when there is no provider (tests, Storybook).
 */
export function useIsEditing(): boolean {
  const { page } = useSitecore();
  return Boolean(page?.mode?.isEditing);
}

/**
 * Keeps accordions, tabs and carousels fully open in Page Builder,
 * so authors can edit content in collapsed panels and hidden slides.
 * On the live site it returns your own open state unchanged.
 *
 * @example
 * const [open, setOpen] = useState(false);
 * const isOpen = useEditingExpand(open);
 * <div hidden={!isOpen}>...</div>
 */
export function useEditingExpand(isOpen: boolean): boolean {
  return useIsEditing() || isOpen;
}

/**
 * Turns autoplay off in Page Builder so slides don't move while an
 * author is typing. On the live site it returns your setting unchanged.
 *
 * @example
 * const autoplay = useEditingSafeAutoplay(params.Autoplay === '1');
 */
export function useEditingSafeAutoplay(autoplay: boolean): boolean {
  return !useIsEditing() && autoplay;
}

export interface ModeOnlyProps {
  children: ReactNode;
}

/** Renders its children only in Page Builder. */
export function EditingOnly({ children }: ModeOnlyProps) {
  return useIsEditing() ? <>{children}</> : null;
}

/** Renders its children everywhere except Page Builder. */
export function LiveOnly({ children }: ModeOnlyProps) {
  return useIsEditing() ? null : <>{children}</>;
}

export interface EmptyListHintProps extends Omit<EditorHintProps, 'when' | 'isEditing' | 'field' | 'children'> {
  /** Multilist, treelist or other reference field (an array of items). */
  items: MaybeField;
  /** Custom message. */
  children?: ReactNode;
}

/**
 * Tells authors how to fill an empty reference field, which Page Builder
 * can't edit inline. Reference fields carry no editing metadata, so this
 * reads the editing mode from the SitecoreProvider.
 */
export function EmptyListHint({ items, children, kind = 'empty-list', ...rest }: EmptyListHintProps) {
  const editing = useIsEditing();
  return (
    <EditorHint isEditing={editing} when={isEmptyList(items)} kind={kind} {...rest}>
      {children ?? 'No items selected yet. Choose them in the Content panel.'}
    </EditorHint>
  );
}
