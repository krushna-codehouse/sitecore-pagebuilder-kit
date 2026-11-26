# eslint-plugin-sitecore-pagebuilder

[![npm version](https://img.shields.io/npm/v/eslint-plugin-sitecore-pagebuilder.svg)](https://www.npmjs.com/package/eslint-plugin-sitecore-pagebuilder)
[![license: MIT](https://img.shields.io/npm/l/eslint-plugin-sitecore-pagebuilder.svg)](https://github.com/Krushna285/sitecore-pagebuilder-kit/blob/main/LICENSE)

ESLint rules for [Sitecore Content SDK](https://doc.sitecore.com/sai/en/developers/content-sdk/) projects that catch code which hides empty fields and components from content authors in Page Builder.

> Community package. Not affiliated with or endorsed by Sitecore.

---

## Contents

- [The problem](#the-problem)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Rules](#rules)
  - [no-conditional-field-render](#no-conditional-field-render)
  - [no-empty-early-return](#no-empty-early-return)
- [Fixing what the rules report](#fixing-what-the-rules-report)
- [Turning a rule off for one line](#turning-a-rule-off-for-one-line)
- [Limitations](#limitations)
- [FAQ](#faq)
- [License](#license)

---

## The problem

This is a very common way to write a Sitecore component:

```tsx
{fields.title.value && <Text field={fields.title} tag="h2" />}
```

It reads as "only show the title if there is one", and on the live site that's exactly what happens.

In Page Builder, though, a freshly added component has an empty title. The condition is false, so `<Text>` never renders, and neither does the "click to add text" placeholder the SDK would have shown. The author sees nothing to click and can't fill the field in.

This kind of bug gets past code review because the code looks reasonable, and it works in every environment developers usually test in. It tends to show up weeks later as a ticket from an author.

This plugin catches it in your editor, as you type.

## Requirements

- ESLint **9** or later, with the flat config format (`eslint.config.js` / `.mjs`). Content SDK starter apps use flat config by default.
- Node.js 18.18 or later.
- To lint `.tsx` files you need a TypeScript parser, such as `typescript-eslint`, which Content SDK apps already include.

## Installation

```sh
npm install --save-dev eslint-plugin-sitecore-pagebuilder
```

```sh
yarn add --dev eslint-plugin-sitecore-pagebuilder
```

```sh
pnpm add -D eslint-plugin-sitecore-pagebuilder
```

## Configuration

### Recommended setup

Add the recommended config to your `eslint.config.mjs`. It turns on both rules as warnings.

```js
// eslint.config.mjs
import pagebuilder from 'eslint-plugin-sitecore-pagebuilder';

export default [
  // ...your existing config (Next.js, TypeScript, etc.)
  pagebuilder.configs.recommended,
];
```

That's all you need. Run `npx eslint .` or check your editor.

### Only lint your component folder

```js
export default [
  // ...
  {
    ...pagebuilder.configs.recommended,
    files: ['src/components/**/*.{jsx,tsx}'],
  },
];
```

### Choose rules and severity yourself

```js
import pagebuilder from 'eslint-plugin-sitecore-pagebuilder';

export default [
  {
    plugins: { 'sitecore-pagebuilder': pagebuilder },
    rules: {
      'sitecore-pagebuilder/no-conditional-field-render': 'error',
      'sitecore-pagebuilder/no-empty-early-return': 'warn',
    },
  },
];
```

Use `'error'` if you want CI to fail on these. The recommended config uses `'warn'` so adding the plugin to an existing project doesn't break the build.

## Rules

| Rule | What it catches | In `recommended` |
| --- | --- | --- |
| [`no-conditional-field-render`](#no-conditional-field-render) | A field component hidden behind a check on its own value | warn |
| [`no-empty-early-return`](#no-empty-early-return) | A component that returns nothing when a field is empty | warn |

---

### no-conditional-field-render

Reports a Content SDK field component (`Text`, `RichText`, `Image`, etc.) that's only rendered when its **own field** has a value.

#### Why

In Page Builder the SDK's field components render an editable placeholder for empty fields. A condition on the field's value removes the component before that placeholder can appear.

#### Examples of code this rule reports

```tsx
{fields.title.value && <Text field={fields.title} tag="h2" />}

{fields.image?.value?.src ? <Image field={fields.image} /> : null}

{!fields.cta.value.href ? null : <Link field={fields.cta} />}

{fields.title.value && (
  <div className="card__title">
    <Text field={fields.title} tag="h2" />
  </div>
)}

// Destructured fields and TypeScript non-null assertions are understood too
const { title } = fields;
{title.value && <Text field={title} />}
{fields.title!.value && <Text field={fields.title!} />}
```

#### Examples of code this rule allows

```tsx
// No condition: the SDK handles empty fields itself
<Text field={fields.title} tag="h2" />

// A guard that knows about Page Builder
<FieldGuard field={fields.title}>
  <div className="card__title"><Text field={fields.title} tag="h2" /></div>
</FieldGuard>

// The condition also checks for editing mode
{(page.mode.isEditing || fields.title.value) && <Text field={fields.title} />}
{(isEditing || fields.title.value) && <Text field={fields.title} />}

// The condition is about a *different* field (e.g. a checkbox toggle)
{fields.showTitle.value && <Text field={fields.title} />}
```

A condition counts as editing-aware if it mentions `isEditing`, `isPageEditing`, `isEditMode` or `pageEditing`.

#### Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `components` | `string[]` | `[]` | Extra component names that render a field through a `field` prop, such as your own wrappers. They're added to the built-in list. |

Built-in components: `Text`, `RichText`, `Image`, `NextImage`, `Link`, `DateField`, `File`. Member expressions also match, so `<Sdk.Text>` counts as `Text`.

```js
'sitecore-pagebuilder/no-conditional-field-render': [
  'warn',
  { components: ['Heading', 'CtaLink', 'ResponsiveImage'] },
],
```

#### Message

> 'fields.title' is hidden when empty, so authors can't fill it in Page Builder. Wrap it in &lt;FieldGuard field={fields.title}&gt; or render the field component without the condition.

---

### no-empty-early-return

Reports an `if` statement in a component that returns `null` (or `undefined`, `false`, `''`) because a field is empty, without checking for Page Builder first.

#### Why

On the live site, skipping a component with no content is fine. In Page Builder, the whole component disappears from the page. The author just added it and can't see it, select it or fill it in.

#### Examples of code this rule reports

```tsx
function Promo({ fields }) {
  if (!fields.image.value.src) return null;
  return <Image field={fields.image} />;
}

function RelatedArticles(props) {
  if (!props.fields.items?.length) return null;
  return <ul>...</ul>;
}

const Banner = ({ fields }) => {
  if (!fields.heading.value) {
    return null;
  }
  return <Text field={fields.heading} tag="h1" />;
};
```

#### Examples of code this rule allows

```tsx
// Checks the mode first
function Promo({ fields }) {
  const { page } = useSitecore();
  if (!page.mode.isEditing && !fields.image.value.src) return null;
  return <Image field={fields.image} />;
}

// Missing datasource: a bare `fields` check is not reported.
// Prefer the SDK's withDatasourceCheck() for this case.
function Promo({ fields }) {
  if (!fields) return null;
  return <Image field={fields.image} />;
}

// Not a component: functions that don't return JSX are ignored
function getTitle(fields) {
  if (!fields.title.value) return null;
  return fields.title.value;
}
```

#### Options

None.

#### Message

> This component returns nothing when 'fields.image.value.src' is empty, so it disappears in Page Builder. Check page.mode.isEditing first, or keep rendering so authors can fill the field in.

---

## Fixing what the rules report

There are usually three fixes, roughly in order of preference:

1. **Remove the condition.** If the condition was only wrapping a bare `<Text>`, `<Image>` or `<Link>`, delete it. The SDK already renders nothing for empty fields on the live site.

2. **Use `FieldGuard`** from [`sitecore-pagebuilder-kit`](https://www.npmjs.com/package/sitecore-pagebuilder-kit) when there's wrapper markup you don't want left empty on the live site. It works in server components with no hook:

   ```tsx
   import { FieldGuard } from 'sitecore-pagebuilder-kit';

   <FieldGuard field={fields.title}>
     <div className="card__title"><Text field={fields.title} tag="h2" /></div>
   </FieldGuard>
   ```

3. **Check the editing mode yourself**, especially for early returns:

   ```tsx
   const { page } = useSitecore();
   if (!page.mode.isEditing && !fields.title.value) return null;
   ```

   Or with the kit's client hook:

   ```tsx
   import { useIsEditing } from 'sitecore-pagebuilder-kit/client';

   const isEditing = useIsEditing();
   if (!isEditing && !fields.title.value) return null;
   ```

## Turning a rule off for one line

Sometimes hiding a field is deliberate, for example in a component that's never placed through Page Builder. Disable the rule for that spot and leave a note explaining why:

```tsx
{/* eslint-disable-next-line sitecore-pagebuilder/no-conditional-field-render -- footer is not authorable in Page Builder */}
{fields.copyright.value && <Text field={fields.copyright} />}
```

```tsx
// eslint-disable-next-line sitecore-pagebuilder/no-empty-early-return -- rendered by a listing page, not placed by authors
if (!fields.items.length) return null;
```

## Limitations

These rules look at the shape of your code, not at TypeScript types. They cover the patterns teams actually write, but not every possible variation. In particular, these **won't** be reported:

- A field renamed through a variable: `const t = fields.title; {fields.title.value && <Text field={t} />}`
- An empty check moved into a helper: `{hasTitle(fields) && <Text field={fields.title} />}`
- A field passed down to a child component that does the check.

There's no auto-fix yet. The right fix depends on the design: removing the condition, adding a `FieldGuard`, or checking the mode are all valid, so the rules leave that choice to you.

## FAQ

**Does it work with the old `.eslintrc` format?**
No. The plugin targets ESLint 9 flat config only.

**Will it slow down linting?**
No. Each rule only looks at `&&` expressions, ternaries and `if` statements, and does a small amount of work on each.

**I use my own `<Heading field={...}>` wrapper. Is it covered?**
Not by default. Add it to the `components` option of `no-conditional-field-render`.

**Does it work for plain JavaScript (`.jsx`)?**
Yes. The rules work on any JSX that ESLint can parse.

## Related

- [`sitecore-pagebuilder-kit`](https://www.npmjs.com/package/sitecore-pagebuilder-kit): `FieldGuard`, field empty checks, editor-only hints and editing-aware hooks. These are the fixes for what this plugin finds.
- [Sitecore Content SDK documentation](https://doc.sitecore.com/sai/en/developers/content-sdk/)

## Contributing

Found a pattern the rules miss, or a false positive? Open an issue on [GitHub](https://github.com/Krushna285/sitecore-pagebuilder-kit/issues) with a small code example.

## License

[MIT](https://github.com/Krushna285/sitecore-pagebuilder-kit/blob/main/LICENSE) © Krushna Patel
