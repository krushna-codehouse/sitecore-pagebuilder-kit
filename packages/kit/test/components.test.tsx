import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { EditorHint, FieldGuard, ImageAltHint, LinkTextHint, TextLengthHint } from '../src/index.js';

afterEach(cleanup);

const meta = { fieldType: 'Single-Line Text' };

describe('FieldGuard', () => {
  it('hides wrapper markup for an empty field on the live site', () => {
    const { container } = render(
      <FieldGuard field={{ value: '' }}>
        <section data-testid="wrapper">x</section>
      </FieldGuard>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('keeps an empty field visible in Page Builder (detected from metadata)', () => {
    render(
      <FieldGuard field={{ value: '', metadata: meta }}>
        <section data-testid="wrapper">x</section>
      </FieldGuard>,
    );
    expect(screen.getByTestId('wrapper')).toBeTruthy();
  });

  it('respects an explicit isEditing override', () => {
    render(
      <FieldGuard field={{ value: '' }} isEditing>
        <section data-testid="wrapper">x</section>
      </FieldGuard>,
    );
    expect(screen.getByTestId('wrapper')).toBeTruthy();
  });

  it('renders the fallback on the live site when empty', () => {
    render(
      <FieldGuard field={{ value: '' }} fallback={<span data-testid="fallback" />}>
        <section />
      </FieldGuard>,
    );
    expect(screen.getByTestId('fallback')).toBeTruthy();
  });

  it('supports any/all across several fields', () => {
    const fields = [{ value: 'Title' }, { value: '' }];
    const any = render(<FieldGuard fields={fields}><i data-testid="any" /></FieldGuard>);
    expect(any.queryByTestId('any')).toBeTruthy();
    cleanup();
    const all = render(<FieldGuard fields={fields} require="all"><i data-testid="all" /></FieldGuard>);
    expect(all.queryByTestId('all')).toBeNull();
  });

  it('passes state to render-function children', () => {
    render(
      <FieldGuard field={{ value: '', metadata: meta }}>
        {({ isEditing, isEmpty }) => <span data-testid="state">{`${isEditing}-${isEmpty}`}</span>}
      </FieldGuard>,
    );
    expect(screen.getByTestId('state').textContent).toBe('true-true');
  });
});

describe('hints', () => {
  it('EditorHint renders only in editing', () => {
    const live = render(<EditorHint field={{ value: 'x' }}>note</EditorHint>);
    expect(live.container.innerHTML).toBe('');
    cleanup();
    render(<EditorHint field={{ value: 'x', metadata: meta }}>note</EditorHint>);
    expect(screen.getByRole('note').textContent).toBe('note');
  });

  it('TextLengthHint warns when text is too long', () => {
    render(<TextLengthHint field={{ value: 'A'.repeat(70), metadata: meta }} max={60} label="Headline" />);
    expect(screen.getByRole('note').textContent).toBe('Headline is 70 characters. Aim for 60 or fewer.');
  });

  it('TextLengthHint stays quiet within the limit', () => {
    const { container } = render(<TextLengthHint field={{ value: 'Short', metadata: meta }} max={60} />);
    expect(container.innerHTML).toBe('');
  });

  it('ImageAltHint warns for an image without alt text, not for an empty image', () => {
    render(<ImageAltHint field={{ value: { src: '/a.jpg', alt: '' }, metadata: meta }} />);
    expect(screen.getByRole('note').getAttribute('data-pagebuilder-hint')).toBe('image-alt');
    cleanup();
    const empty = render(<ImageAltHint field={{ value: {}, metadata: meta }} />);
    expect(empty.container.innerHTML).toBe('');
  });

  it('LinkTextHint warns for a link with a URL but no text', () => {
    render(<LinkTextHint field={{ value: { href: '/about', text: '' }, metadata: meta }} />);
    expect(screen.getByRole('note')).toBeTruthy();
  });

  it('unstyled drops inline styles', () => {
    render(<EditorHint isEditing unstyled className="my-hint">x</EditorHint>);
    const note = screen.getByRole('note');
    expect(note.getAttribute('style')).toBeNull();
    expect(note.className).toBe('my-hint');
  });
});
