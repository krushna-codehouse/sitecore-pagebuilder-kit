# eslint-plugin-sitecore-pagebuilder

ESLint rules for [Sitecore Content SDK](https://doc.sitecore.com/sai/en/developers/content-sdk/) apps that catch code which hides empty fields and components from authors in Page Builder.

These bugs pass code review and work fine on the live site. They're usually found late, by an author who can't fill in a field. This plugin finds them while you write the component.

The fixes it suggests come from [`sitecore-pagebuilder-kit`](../kit).

> Community package. Not affiliated with or endorsed by Sitecore.

## Install

```sh
npm install --save-dev eslint-plugin-sitecore-pagebuilder
```

Requires ESLint 9 with flat config, which Content SDK apps use by default from version 1.1.

## Usage

```js
// eslint.config.mjs
import pagebuilder from 'eslint-plugin-sitecore-pagebuilder';

export default [
  // ...your existing config
  pagebuilder.configs.recommended,
];
```

Or pick rules yourself:

```js
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

## Rules

| Rule | What it catches | Recommended |
| --- | --- | --- |
| [`no-conditional-field-render`](#no-conditional-field-render) | A field component hidden behind a check on its own value | warn |
| [`no-empty-early-return`](#no-empty-early-return) | A component that returns nothing for an empty field | warn |

### no-conditional-field-render

In Page Builder, the SDK's field components render a placeholder for empty fields so authors can click and type. A condition on the field's value removes the component before it gets the chance.

```tsx
// ❌
{fields.title.value && <Text field={fields.title} tag="h2" />}
{fields.image?.value?.src ? <Image field={fields.image} /> : null}
{!fields.cta.value.href ? null : <Link field={fields.cta} />}

// ✅ Let the SDK handle empty fields
<Text field={fields.title} tag="h2" />

// ✅ Wrapper markup that should disappear on the live site
<FieldGuard field={fields.title}>
  <div className="card__title"><Text field={fields.title} tag="h2" /></div>
</FieldGuard>

// ✅ Editing-aware conditions are allowed
{(page.mode.isEditing || fields.title.value) && <Text field={fields.title} />}
```

It only reports when the condition and the rendered component refer to the same field, so `{fields.showTitle.value && <Text field={fields.title} />}` is fine. Destructured fields and TypeScript non-null assertions are understood.

**Options**

- `components` (`string[]`): extra component names that render a field through a `field` prop, such as your own wrappers. Defaults cover `Text`, `RichText`, `Image`, `NextImage`, `Link`, `DateField` and `File`.

```js
'sitecore-pagebuilder/no-conditional-field-render': ['warn', { components: ['Heading', 'CtaLink'] }]
```

### no-empty-early-return

A component that returns `null` when a field is empty disappears entirely in Page Builder, leaving authors nothing to click.

```tsx
// ❌
function Promo({ fields }) {
  if (!fields.image.value.src) return null;
  return <Image field={fields.image} />;
}

function RelatedArticles(props) {
  if (!props.fields.items?.length) return null;
  return <ul>...</ul>;
}

// ✅ Keep it on the live site, show it while editing
function Promo({ fields }) {
  const { page } = useSitecore();
  if (!page.mode.isEditing && !fields.image.value.src) return null;
  return <Image field={fields.image} />;
}
```

A bare `if (!fields) return null` is not reported. Missing datasources are better handled by the SDK's `withDatasourceCheck()`. Functions that don't return JSX are ignored.

## Limitations

These rules use syntax, not types, so they follow the patterns teams actually write rather than every possible one. A field passed through a variable with a different name, or checked in a helper function, won't be matched. Reports have no auto-fix yet, because the right fix depends on the design.

## License

MIT © Krushna Patel
