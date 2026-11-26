# sitecore-pagebuilder-kit

[![npm version](https://img.shields.io/npm/v/sitecore-pagebuilder-kit.svg)](https://www.npmjs.com/package/sitecore-pagebuilder-kit)
[![license: MIT](https://img.shields.io/npm/l/sitecore-pagebuilder-kit.svg)](https://github.com/Krushna285/sitecore-pagebuilder-kit/blob/main/LICENSE)

Small React helpers for [Sitecore Content SDK](https://doc.sitecore.com/sai/en/developers/content-sdk/) projects that keep your components editable in Page Builder.

> Community package. Not affiliated with or endorsed by Sitecore.

---

## Contents

- [Why this exists](#why-this-exists)
- [What's in the box](#whats-in-the-box)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick start](#quick-start)
- [How editing mode is detected](#how-editing-mode-is-detected)
- [API reference](#api-reference)
  - [FieldGuard](#fieldguard)
  - [Empty checks](#empty-checks)
  - [Editor hints](#editor-hints)
  - [Client hooks and components](#client-hooks-and-components)
- [Recipes](#recipes)
- [Styling the hints](#styling-the-hints)
- [Testing and Storybook](#testing-and-storybook)
- [FAQ](#faq)
- [Related](#related)
- [License](#license)

---

## Why this exists

If you've built Sitecore components for a while, you've written something like this:

```tsx
{fields.heading.value && (
  <div className="hero__heading">
    <Text field={fields.heading} tag="h1" />
  </div>
)}
```

It looks right and it works on the live site. Nobody wants an empty `<div>` in the markup.

In Page Builder it causes a problem. When an author drops in a new Hero, the heading is empty, so the condition is false and the whole block disappears. The SDK's `<Text>` component would have shown a "click here to add text" placeholder, but it never gets to render. The author has nothing to click, and that usually ends with a bug ticket that says "I can't edit the heading."

The same thing happens with:

- components that `return null` when a field is empty,
- accordion panels and tabs that start collapsed, so their content can't be edited inline,
- carousels that keep sliding while someone is trying to type,
- multilist fields, which Page Builder can't edit inline at all, so authors don't know where to set them.

This package fixes these cases. Each helper behaves the way you'd expect on the live site and stays out of the author's way in Page Builder.

## What's in the box

| Export | What it's for |
| --- | --- |
| `FieldGuard` | Hide wrapper markup for empty fields on the live site but keep it visible in Page Builder |
| `isEmptyText`, `isEmptyRichText`, `isEmptyImage`, `isEmptyLink`, `isEmptyFile`, `isEmptyDate`, `isEmptyList`, `isEmptyField` | Reliable "is this field empty?" checks for each field type |
| `hasEditingMetadata` | Tell whether a field came from a Page Builder render |
| `EditorHint`, `TextLengthHint`, `ImageAltHint`, `LinkTextHint` | Notes that only authors see, like "headline too long" or "image has no alt text" |
| `useIsEditing`, `useEditingExpand`, `useEditingSafeAutoplay` | Hooks for accordions, tabs, carousels and anything else that behaves differently while editing |
| `EditingOnly`, `LiveOnly`, `EmptyListHint` | Show content only in one mode, and guide authors on empty reference fields |

All of it is typed, tree-shakeable (`sideEffects: false`) and has no runtime dependencies beyond React and the Content SDK you already use.

## Requirements

- React 18 or 19
- `@sitecore-content-sdk/nextjs` or `@sitecore-content-sdk/react` 1.0 or later
- An ESM-aware bundler (Next.js, Vite, webpack 5). The package ships ES modules only.

The SDK is an optional peer dependency. The main entry point doesn't need it at all. Only the `/client` entry imports `useSitecore()` from it.

## Installation

```sh
npm install sitecore-pagebuilder-kit
```

```sh
yarn add sitecore-pagebuilder-kit
```

```sh
pnpm add sitecore-pagebuilder-kit
```

There's nothing to configure. Import what you need.

## Quick start

A typical Hero component, before:

```tsx
import { Text, RichText, Image, Link } from '@sitecore-content-sdk/nextjs';

export default function Hero({ fields }) {
  if (!fields.image.value?.src) return null;          // whole component vanishes in Page Builder

  return (
    <section className="hero">
      <Image field={fields.image} />
      {fields.heading.value && (                      // heading can't be added in Page Builder
        <div className="hero__heading">
          <Text field={fields.heading} tag="h1" />
        </div>
      )}
      <RichText field={fields.body} />
      {fields.cta.value.href && <Link field={fields.cta} />}
    </section>
  );
}
```

After:

```tsx
import { Text, RichText, Image, Link } from '@sitecore-content-sdk/nextjs';
import { FieldGuard, TextLengthHint, ImageAltHint, LinkTextHint } from 'sitecore-pagebuilder-kit';

export default function Hero({ fields }) {
  return (
    <section className="hero">
      <FieldGuard field={fields.image}>
        <Image field={fields.image} />
        <ImageAltHint field={fields.image} />
      </FieldGuard>

      <FieldGuard field={fields.heading}>
        <div className="hero__heading">
          <Text field={fields.heading} tag="h1" />
        </div>
        <TextLengthHint field={fields.heading} max={60} label="Headline" />
      </FieldGuard>

      <RichText field={fields.body} />

      <FieldGuard field={fields.cta}>
        <Link field={fields.cta} />
        <LinkTextHint field={fields.cta} />
      </FieldGuard>
    </section>
  );
}
```

On the live site the output is the same as before: empty fields leave no markup behind. In Page Builder every field shows up, so authors can click it and fill it in, and the hints tell them when something needs attention.

This works in a React Server Component. It doesn't need a hook or `'use client'`.

## How editing mode is detected

There are two entry points, and they detect editing mode differently.

| Import from | Works in | How it knows you're in Page Builder |
| --- | --- | --- |
| `sitecore-pagebuilder-kit` | Server **and** client components | Looks for the `metadata` object the SDK attaches to fields when rendering for Page Builder. You can also pass `isEditing` yourself. |
| `sitecore-pagebuilder-kit/client` | Client components only (`'use client'`) | Reads `page.mode.isEditing` from the SDK's `SitecoreProvider` with `useSitecore()` |

When the Content SDK renders a page for Page Builder, each directly editable field gets an extra `metadata` property. On the live site that property isn't there. The main entry point checks for it, so it can tell the mode from the field alone, without a hook or context. That's why it works in server components.

Reference fields like multilists come back as arrays of items and don't carry that metadata. For those, use the `/client` helpers, which ask the provider instead.

If you already know the mode, for example from `page.mode.isEditing` in a server component, pass `isEditing={...}` to skip detection.

---

## API reference

### FieldGuard

```tsx
import { FieldGuard } from 'sitecore-pagebuilder-kit';
```

Renders its children when the field has content. In Page Builder it always renders them, so authors can fill the field in. On the live site, if the field is empty, it renders `fallback`, which is nothing by default.

Use it whenever you have **wrapper markup** (a `div`, a heading container, a list item) around a field component that you don't want left empty on the live site.

#### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `field` | field | | The field to guard. |
| `fields` | field[] | | Several fields to guard together. Use this instead of `field`. |
| `require` | `'any'` \| `'all'` | `'any'` | With `fields`: render when **any** field has content, or only when **all** of them do. |
| `isEditing` | `boolean` | auto | Force editing on or off. By default the guard counts as editing if any guarded field has Page Builder metadata. |
| `fallback` | `ReactNode` | `null` | What to show on the live site when the field is empty. Not used in Page Builder. |
| `children` | `ReactNode` or `(state) => ReactNode` | | The content. Pass a function to get `{ isEditing, isEmpty }`. |

#### Examples

Guard one field:

```tsx
<FieldGuard field={fields.subtitle}>
  <p className="card__subtitle">
    <Text field={fields.subtitle} />
  </p>
</FieldGuard>
```

Guard a group. The header renders if either the eyebrow or the heading has text:

```tsx
<FieldGuard fields={[fields.eyebrow, fields.heading]}>
  <header className="section__header">
    <Text field={fields.eyebrow} tag="span" className="eyebrow" />
    <Text field={fields.heading} tag="h2" />
  </header>
</FieldGuard>
```

Only render when *every* field is filled, for example a quote with its author:

```tsx
<FieldGuard fields={[fields.quote, fields.author]} require="all">
  <figure>...</figure>
</FieldGuard>
```

Show a default image on the live site when none is set:

```tsx
<FieldGuard field={fields.image} fallback={<img src="/images/placeholder.jpg" alt="" />}>
  <Image field={fields.image} />
</FieldGuard>
```

Use the render function to style the empty state while editing:

```tsx
<FieldGuard field={fields.quote}>
  {({ isEditing, isEmpty }) => (
    <blockquote className={isEditing && isEmpty ? 'quote quote--empty' : 'quote'}>
      <Text field={fields.quote} />
    </blockquote>
  )}
</FieldGuard>
```

Pass the mode explicitly when you already have it:

```tsx
const { page } = useSitecore();

<FieldGuard field={fields.heading} isEditing={page.mode.isEditing}>
  ...
</FieldGuard>
```

#### When *not* to use it

You don't need `FieldGuard` around a field component on its own:

```tsx
// Fine as it is. The SDK already outputs nothing for an empty field on the live site
// and a placeholder in Page Builder.
<Text field={fields.heading} tag="h1" />
```

Reach for `FieldGuard` when there's markup *around* the field that would otherwise be left empty.

---

### Empty checks

```tsx
import {
  isEmptyText,
  isEmptyRichText,
  isEmptyImage,
  isEmptyLink,
  isEmptyFile,
  isEmptyDate,
  isEmptyList,
  isEmptyField,
  hasEditingMetadata,
  EMPTY_DATE_FIELD_VALUE,
} from 'sitecore-pagebuilder-kit';
```

`!fields.x.value` isn't a reliable empty check. A rich text field containing `<p></p>` is truthy. An image field is an object even when no image is selected. An unset date is the string `0001-01-01T00:00:00Z`. These functions know what "empty" means for each field type.

They all accept `null` or `undefined`, so a missing field won't throw. A missing field counts as empty.

| Function | Field types | Empty when |
| --- | --- | --- |
| `isEmptyText(field)` | Single-Line Text, Multi-Line Text, Number, Integer | Value is missing, an empty string, or only whitespace. Numbers and booleans, including `0` and `false`, are **not** empty. |
| `isEmptyRichText(field)` | Rich Text | No visible text after stripping tags, comments and `&nbsp;`. Media tags (`img`, `iframe`, `video`, `audio`, `embed`, `object`, `svg`, `picture`, `canvas`, `hr`) count as content. |
| `isEmptyImage(field)` | Image | No `src`, or `src` is blank. |
| `isEmptyLink(field)` | General Link | No `href`, or `href` is blank. Link text alone doesn't count. |
| `isEmptyFile(field)` | File | No `src`. |
| `isEmptyDate(field)` | Date, Datetime | Missing, an empty string, an invalid `Date`, or Sitecore's "never set" date `0001-01-01T00:00:00Z`. |
| `isEmptyList(field)` | Multilist, Treelist, other reference fields | An empty array, `{ value: [] }`, `null` or `undefined`. |
| `isEmptyField(field)` | Any | Works out the type from the value's shape and applies the matching check above. |
| `hasEditingMetadata(field)` | Any | Not an empty check. Returns `true` when the field has Page Builder editing metadata. |

`EMPTY_DATE_FIELD_VALUE` is the constant `'0001-01-01T00:00:00Z'`, in case you need to compare against it yourself.

#### Examples

```ts
isEmptyText({ value: '' });                                // true
isEmptyText({ value: '   ' });                             // true
isEmptyText({ value: 0 });                                 // false: 0 is a real value

isEmptyRichText({ value: '<p></p>' });                     // true
isEmptyRichText({ value: '<p>&nbsp;</p><!-- note -->' });  // true
isEmptyRichText({ value: '<p><img src="/a.jpg"></p>' });   // false: an image is content

isEmptyImage({ value: { alt: 'Team photo' } });            // true: alt text but no image
isEmptyImage({ value: { src: '/team.jpg' } });             // false

isEmptyLink({ value: { text: 'Read more', href: '' } });   // true
isEmptyLink({ value: { href: '/about' } });                // false

isEmptyDate({ value: '0001-01-01T00:00:00Z' });            // true
isEmptyDate({ value: '2026-03-01T00:00:00Z' });            // false

isEmptyList([]);                                           // true
isEmptyList(fields.relatedArticles);                       // depends on the data

isEmptyField(undefined);                                   // true
isEmptyField({ value: { href: '' } });                     // true (treated as a link)
```

Use the specific function when you know the field type. Use `isEmptyField` in generic code, like a guard that takes any field.

---

### Editor hints

```tsx
import { EditorHint, TextLengthHint, ImageAltHint, LinkTextHint } from 'sitecore-pagebuilder-kit';
```

Hints are short notes that **only appear in Page Builder**. On the live site they render nothing, so you can leave them in your components permanently. Use them to point out content problems while the author is still on the page.

Every hint renders a single element:

```html
<span role="note" data-pagebuilder-hint="text-length">Headline is 74 characters. Aim for 60 or fewer.</span>
```

#### Common props (all hints)

| Prop | Type | Description |
| --- | --- | --- |
| `className` | `string` | Extra class on the hint element. |
| `unstyled` | `boolean` | Drop the default inline styles so you can style it yourself. |

#### `TextLengthHint`

Warns when a text or rich text field is longer than you'd like. Use it for headlines that wrap badly, card titles that get cut off, or meta descriptions. Tags and `&nbsp;` aren't counted.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `field` | field | **required** | Text or rich text field to measure. |
| `max` | `number` | **required** | Recommended maximum number of characters. |
| `label` | `string` | `'This text'` | Name used in the message. |
| `message` | `(length, max) => ReactNode` | | Write your own message. |

```tsx
<TextLengthHint field={fields.heading} max={60} label="Headline" />
// "Headline is 74 characters. Aim for 60 or fewer."

<TextLengthHint
  field={fields.summary}
  max={160}
  message={(length, max) => `Search engines cut this off after ${max} characters (currently ${length}).`}
/>
```

#### `ImageAltHint`

Warns when an image is set but has no alt text. If no image is selected it says nothing, because the SDK already shows its own "add image" placeholder.

| Prop | Type | Description |
| --- | --- | --- |
| `field` | field | **Required.** The image field. |
| `children` | `ReactNode` | Replace the default message. |

```tsx
<Image field={fields.image} />
<ImageAltHint field={fields.image} />
```

#### `LinkTextHint`

Warns when a link has a URL but no text. Screen readers and visitors would otherwise get a bare URL or an empty link.

| Prop | Type | Description |
| --- | --- | --- |
| `field` | field | **Required.** The General Link field. |
| `children` | `ReactNode` | Replace the default message. |

```tsx
<Link field={fields.cta} />
<LinkTextHint field={fields.cta} />
```

#### `EditorHint`

A general hint for anything else. You decide when it shows with `when`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | **required** | The message. |
| `when` | `boolean` | `true` | Only show when this is true. |
| `field` | field | | Any field on the same component. It's only used to detect editing mode. |
| `isEditing` | `boolean` | | Set the mode yourself when there's no field to detect it from. |
| `kind` | `string` | `'note'` | Value of the `data-pagebuilder-hint` attribute, handy for styling. |

```tsx
<EditorHint field={fields.heading} when={!params.Theme}>
  Pick a theme in this component's rendering parameters.
</EditorHint>

<EditorHint isEditing={page.mode.isEditing} kind="info">
  This list is filled automatically from the latest news articles.
</EditorHint>
```

`EditorHint` needs either a `field` (to read its metadata) or `isEditing`. With neither, it treats the page as live and shows nothing.

---

### Client hooks and components

```tsx
'use client';

import {
  useIsEditing,
  useEditingExpand,
  useEditingSafeAutoplay,
  EditingOnly,
  LiveOnly,
  EmptyListHint,
} from 'sitecore-pagebuilder-kit/client';
```

These read the mode from the SDK's `SitecoreProvider`, so they must run inside client components. If there's no provider, as in unit tests or Storybook, they act as if the page is live.

#### `useIsEditing(): boolean`

Returns `true` in Page Builder. It's shorthand for `useSitecore().page.mode.isEditing` that won't throw without a provider.

```tsx
const isEditing = useIsEditing();
```

#### `useEditingExpand(isOpen: boolean): boolean`

For accordions, tabs, "read more" sections and anything else that hides content behind a click. In Page Builder it always returns `true`, so every panel is open and editable. On the live site it returns your own `isOpen` unchanged.

```tsx
'use client';
import { useState } from 'react';
import { Text, RichText } from '@sitecore-content-sdk/nextjs';
import { useEditingExpand } from 'sitecore-pagebuilder-kit/client';

export function AccordionItem({ fields }) {
  const [open, setOpen] = useState(false);
  const isOpen = useEditingExpand(open);

  return (
    <div className="accordion__item">
      <button aria-expanded={isOpen} onClick={() => setOpen(!open)}>
        <Text field={fields.title} />
      </button>
      <div hidden={!isOpen}>
        <RichText field={fields.body} />
      </div>
    </div>
  );
}
```

The same works for tabs. Treat every tab as active while editing:

```tsx
const isActive = useEditingExpand(index === activeIndex);
```

#### `useEditingSafeAutoplay(autoplay: boolean): boolean`

Returns `false` in Page Builder, so slides don't move while an author is editing them. On the live site it returns your setting unchanged.

```tsx
const autoplay = useEditingSafeAutoplay(params.Autoplay === '1');

<Swiper autoplay={autoplay ? { delay: 5000 } : false}>...</Swiper>
```

#### `<EditingOnly>` and `<LiveOnly>`

Render children in only one of the two modes.

```tsx
<EditingOnly>
  <p className="note">This banner only appears on the live site between 9am and 5pm.</p>
</EditingOnly>

<LiveOnly>
  <AnimatedCounter />   {/* animations and third-party widgets that get in the way of editing */}
</LiveOnly>
```

#### `<EmptyListHint>`

Page Builder can't edit multilists and treelists inline. Authors have to use the Content panel, and many don't know that. This hint tells them where to go when the list is empty.

| Prop | Type | Description |
| --- | --- | --- |
| `items` | reference field | **Required.** The multilist or treelist field (an array of items). |
| `children` | `ReactNode` | Replace the default message. |
| `kind`, `className`, `unstyled` | | Same as the other hints. |

```tsx
<EmptyListHint items={fields.relatedArticles}>
  No related articles yet. Select them in the Content panel on the right.
</EmptyListHint>

<ul>
  {fields.relatedArticles?.map((item) => <li key={item.id}>...</li>)}
</ul>
```

---

## Recipes

### A component that should vanish on the live site when empty

Don't `return null` early. That hides the component in Page Builder too. Check the mode first:

```tsx
'use client';
import { useIsEditing } from 'sitecore-pagebuilder-kit/client';
import { isEmptyImage } from 'sitecore-pagebuilder-kit';

export default function Promo({ fields }) {
  const isEditing = useIsEditing();
  if (!isEditing && isEmptyImage(fields.image)) return null;

  return <Image field={fields.image} />;
}
```

Or, in a server component, wrap the whole body in a `FieldGuard`:

```tsx
export default function Promo({ fields }) {
  return (
    <FieldGuard field={fields.image}>
      <aside className="promo">
        <Image field={fields.image} />
      </aside>
    </FieldGuard>
  );
}
```

### Cards in a list

```tsx
{fields.cards.map((card) => (
  <article key={card.id} className="card">
    <FieldGuard field={card.fields.image}>
      <div className="card__media"><Image field={card.fields.image} /></div>
    </FieldGuard>
    <Text field={card.fields.title} tag="h3" />
    <TextLengthHint field={card.fields.title} max={45} label="Card title" />
  </article>
))}
```

### Read the mode once and pass it down

If a server component already has `page`, pass the mode to the guards:

```tsx
const isEditing = page.mode.isEditing;

<FieldGuard field={fields.heading} isEditing={isEditing}>...</FieldGuard>
<EditorHint isEditing={isEditing} when={!params.Theme}>Choose a theme.</EditorHint>
```

## Styling the hints

Hints come with a light amber style so they stand out without being alarming. You can change that in three ways.

**Target the attribute in your CSS.** The default inline styles still apply, so use `!important` or combine this with `unstyled`:

```css
[data-pagebuilder-hint] { font-size: 13px; }
[data-pagebuilder-hint='image-alt'] { border-color: crimson; }
```

**Use your own class with no defaults:**

```tsx
<TextLengthHint field={fields.heading} max={60} unstyled className="pb-hint" />
```

**Reuse the defaults** in your own components:

```tsx
import { hintStyle } from 'sitecore-pagebuilder-kit';

<div style={hintStyle}>Custom note</div>
```

Values of `data-pagebuilder-hint`: `note` (EditorHint default), `text-length`, `image-alt`, `link-text`, `empty-list`, or whatever you pass as `kind`.

## Testing and Storybook

- **Main entry.** Pass fields with or without a `metadata` object to switch between modes. With `{ value: '' }` the guard acts as on the live site. With `{ value: '', metadata: {} }` it acts as in Page Builder.
- **Client entry.** Without a `SitecoreProvider` the hooks return "live" values. To test editing mode, wrap the component in a `SitecoreProvider` whose page has `mode.isEditing: true`, or mock `useSitecore`.

```tsx
render(<FieldGuard field={{ value: '' }}><p>Title</p></FieldGuard>);                // renders nothing
render(<FieldGuard field={{ value: '', metadata: {} }}><p>Title</p></FieldGuard>);  // renders <p>Title</p>
```

## FAQ

**Does this change anything on the live site?**
No. On the live site `FieldGuard` renders nothing for empty fields, the hints render nothing, and the hooks return your own values. The only differences are in Page Builder.

**Do I need to wrap every field in `FieldGuard`?**
No. Only use it where there's wrapper markup around a field. A bare `<Text field={...} />` already handles empty fields correctly.

**Does it work with the App Router and server components?**
Yes. The main entry has no hooks and no `'use client'`. Only `sitecore-pagebuilder-kit/client` needs a client component.

**Does it work with JSS or older Sitecore setups?**
It's built and tested against the Content SDK. The empty checks and `FieldGuard` with an explicit `isEditing` work with any field shaped like `{ value }`. Automatic mode detection relies on the field `metadata` that the Content SDK adds for Page Builder, so older Experience Editor setups need `isEditing` passed in.

**Why doesn't `FieldGuard` detect editing on my multilist?**
Reference fields come back as plain arrays with no metadata. Use `EmptyListHint` from `/client`, or pass `isEditing` explicitly.

**Can I use CommonJS (`require`)?**
No, the package is ESM only. Next.js, Vite and modern webpack all handle that.

**How do I find the places in my code that need these helpers?**
Install [`eslint-plugin-sitecore-pagebuilder`](https://www.npmjs.com/package/eslint-plugin-sitecore-pagebuilder). It flags the hidden-field patterns automatically.

## Related

- [`eslint-plugin-sitecore-pagebuilder`](https://www.npmjs.com/package/eslint-plugin-sitecore-pagebuilder): lint rules that find the problems this package fixes.
- [Sitecore Content SDK documentation](https://doc.sitecore.com/sai/en/developers/content-sdk/)

## Contributing

Bug reports and pull requests are welcome on [GitHub](https://github.com/Krushna285/sitecore-pagebuilder-kit). If you've hit a Page Builder problem that isn't covered here, open an issue and describe it.

## License

[MIT](https://github.com/Krushna285/sitecore-pagebuilder-kit/blob/main/LICENSE) © Krushna Patel
