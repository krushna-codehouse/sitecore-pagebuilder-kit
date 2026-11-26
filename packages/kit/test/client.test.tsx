import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { SitecoreProviderReactContext } from '@sitecore-content-sdk/react';
import type { ReactNode } from 'react';
import {
  EditingOnly,
  EmptyListHint,
  LiveOnly,
  useEditingExpand,
  useEditingSafeAutoplay,
} from '../src/client.js';

afterEach(cleanup);

// Provide only what the hooks read: page.mode.isEditing.
const withMode = (isEditing: boolean, node: ReactNode) => (
  <SitecoreProviderReactContext.Provider value={{ page: { mode: { isEditing } } } as never}>
    {node}
  </SitecoreProviderReactContext.Provider>
);

function Accordion({ open, autoplay }: { open: boolean; autoplay: boolean }) {
  const isOpen = useEditingExpand(open);
  const play = useEditingSafeAutoplay(autoplay);
  return <div data-testid="acc">{`${isOpen}-${play}`}</div>;
}

describe('client hooks', () => {
  it('expand panels and stop autoplay in editing', () => {
    render(withMode(true, <Accordion open={false} autoplay />));
    expect(screen.getByTestId('acc').textContent).toBe('true-false');
  });

  it('leave live-site behaviour unchanged', () => {
    render(withMode(false, <Accordion open={false} autoplay />));
    expect(screen.getByTestId('acc').textContent).toBe('false-true');
  });

  it('work without a provider (treated as live)', () => {
    render(<Accordion open={false} autoplay />);
    expect(screen.getByTestId('acc').textContent).toBe('false-true');
  });
});

describe('EditingOnly / LiveOnly', () => {
  it('switch on mode', () => {
    render(withMode(true, <><EditingOnly><i data-testid="e" /></EditingOnly><LiveOnly><i data-testid="l" /></LiveOnly></>));
    expect(screen.queryByTestId('e')).toBeTruthy();
    expect(screen.queryByTestId('l')).toBeNull();
  });
});

describe('EmptyListHint', () => {
  it('shows for an empty list in editing only', () => {
    render(withMode(true, <EmptyListHint items={[]} />));
    expect(screen.getByRole('note')).toBeTruthy();
    cleanup();
    const live = render(withMode(false, <EmptyListHint items={[]} />));
    expect(live.container.innerHTML).toBe('');
    cleanup();
    const filled = render(withMode(true, <EmptyListHint items={[{ id: '1' }]} />));
    expect(filled.container.innerHTML).toBe('');
  });
});
