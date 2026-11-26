# sitecore-pagebuilder-kit

Page Builder-safe rendering helpers for [Sitecore Content SDK](https://doc.sitecore.com/sai/en/developers/content-sdk/) apps.

Most Page Builder bugs come from code that works on the live site but breaks the authoring experience: empty fields hidden behind conditions, collapsed accordions authors can't edit, carousels sliding away mid-edit. This package gives you small, typed helpers that do the right thing in both modes.

Pair it with [`eslint-plugin-sitecore-pagebuilder`](../eslint-plugin), which finds the problems these helpers fix.

> Community package. Not affiliated with or endorsed by Sitecore.

## Install

```sh
npm install sitecore-pagebuilder-kit
```

Works with `@sitecore-content-sdk/nextjs` or `@sitecore-content-sdk/react` and React 18+.

## Two entry points

| Import | Use in | Detects editing from |
| --- | --- | --- |
| `sitecore-pagebuilder-kit` | Server and client components | The field's Page Builder `metadata`, or an `isEditing` prop |
| `sitecore-pagebuilder-kit/client` | Client components only | `page.mode.isEditing` via the SDK's `useSitecore()` |

In editing mode the Content SDK adds a `metadata` object to every directly editable field. The main entry reads that, so it needs no hook and works in React Server Components.

## FieldGuard

The most common Page Builder bug:

```tsx
// ❌ An empty heading disappears in Page Builder, so authors can never fill it in.
{fields.heading.value && (
  <div className="hero__heading">
    <Text field={fields.heading} tag="h1" />
  </div>
)}
```

The SDK's `Text` already renders an empty-field placeholder in Page Builder, but the condition removes it first. `FieldGuard` keeps the wrapper while editing and drops it on the live site:

```tsx
// ✅
import { FieldGuard } from 'sitecore-pagebuilder-kit';

<FieldGuard field={fields.heading}>
  <div className="hero__heading">
    <Text field={fields.heading} tag="h1" />
  </div>
</FieldGuard>
```

Guard several fields, render a live-site fallback, or read the guard state:

```tsx
<FieldGuard fields={[fields.eyebrow, fields.heading]} require="any">
  <header>...</header>
</FieldGuard>

<FieldGuard field={fields.image} fallback={<DefaultImage />}>
  <Image field={fields.image} />
</FieldGuard>

<FieldGuard field={fields.quote}>
  {({ isEditing, isEmpty }) => (
    <blockquote className={isEditing && isEmpty ? 'quote quote--empty' : 'quote'}>
      <Text field={fields.quote} />
    </blockquote>
  )}
</FieldGuard>
```

| Prop | Description |
| --- | --- |
| `field` / `fields` | One field, or several to guard together |
| `require` | `'any'` (default) or `'all'` fields must have content |
| `isEditing` | Override editing detection |
| `fallback` | Rendered on the live site when empty |
| `children` | Content, or `({ isEditing, isEmpty }) => ReactNode` |

## Field-type empty checks

Each check understands what "empty" means for its field type. They follow the same rules as the SDK's own empty-field handling and add whitespace-only text and markup-only rich text.

```ts
import { isEmptyText, isEmptyRichText, isEmptyImage, isEmptyLink, isEmptyDate, isEmptyList, isEmptyField } from 'sitecore-pagebuilder-kit';

isEmptyText({ value: '   ' });              // true
isEmptyRichText({ value: '<p>&nbsp;</p>' }); // true — no visible text
isEmptyRichText({ value: '<p><img src="/a.jpg"></p>' }); // false — media counts
isEmptyImage({ value: { alt: 'x' } });       // true — no src
isEmptyLink({ value: { text: 'Read more', href: '' } }); // true — no href
isEmptyDate({ value: '0001-01-01T00:00:00Z' }); // true — Sitecore's unset date
isEmptyList(fields.relatedArticles);         // true for []
isEmptyField(anyField);                      // detects the type from the value
```

## Editor-only hints

Guidance that only authors see in Page Builder. Nothing renders on the live site.

```tsx
import { TextLengthHint, ImageAltHint, LinkTextHint, EditorHint } from 'sitecore-pagebuilder-kit';

<Text field={fields.heading} tag="h1" />
<TextLengthHint field={fields.heading} max={60} label="Headline" />

<Image field={fields.image} />
<ImageAltHint field={fields.image} />

<Link field={fields.cta} />
<LinkTextHint field={fields.cta} />

<EditorHint field={fields.heading} when={!params.Theme}>
  Pick a theme in the component's rendering parameters.
</EditorHint>
```

Hints render a `<span role="note" data-pagebuilder-hint="...">` with light default styling. Pass `className` and `unstyled` to style them yourself, or target `[data-pagebuilder-hint]` in your CSS. All messages can be replaced.

## Client hooks and components

```tsx
'use client';
import { useEditingExpand, useEditingSafeAutoplay, EditingOnly, LiveOnly, EmptyListHint, useIsEditing } from 'sitecore-pagebuilder-kit/client';
```

**Accordions, tabs and carousels.** Content inside collapsed panels or hidden slides is hard or impossible to edit inline. `useEditingExpand` keeps everything open while editing and leaves your state alone on the live site:

```tsx
function AccordionItem({ fields }) {
  const [open, setOpen] = useState(false);
  const isOpen = useEditingExpand(open);
  return (
    <div>
      <button onClick={() => setOpen(!open)} aria-expanded={isOpen}>
        <Text field={fields.title} />
      </button>
      <div hidden={!isOpen}>
        <RichText field={fields.body} />
      </div>
    </div>
  );
}
```

**Autoplay.** Stop slides moving while an author is typing:

```tsx
const autoplay = useEditingSafeAutoplay(params.Autoplay === '1');
```

**Mode-only content and empty reference fields.** Multilists and treelists can't be edited inline and carry no editing metadata, so `EmptyListHint` reads the mode from the provider:

```tsx
<EmptyListHint items={fields.relatedArticles}>
  No related articles yet. Select them in the component's fields.
</EmptyListHint>

<EditingOnly><p>This banner only shows between 9am and 5pm.</p></EditingOnly>
<LiveOnly><AnimatedCounter /></LiveOnly>
```

Without a `SitecoreProvider` (unit tests, Storybook) the hooks treat the page as live.

## License

MIT © Krushna Patel
