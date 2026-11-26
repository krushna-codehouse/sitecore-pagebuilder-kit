import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import tsParser from '@typescript-eslint/parser';
import plugin from '../src/index.js';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const rules = plugin.rules;

tester.run('no-conditional-field-render', rules['no-conditional-field-render'], {
  valid: [
    // Rendering the field component directly lets the SDK handle empty fields.
    'const A = ({ fields }) => <Text field={fields.title} tag="h2" />;',
    // FieldGuard is the recommended replacement.
    'const A = ({ fields }) => <FieldGuard field={fields.title}><div><Text field={fields.title} /></div></FieldGuard>;',
    // Editing-aware conditions are fine.
    'const A = ({ fields, page }) => (page.mode.isEditing || fields.title.value) && <Text field={fields.title} />;',
    'const A = ({ fields, isEditing }) => isEditing || fields.title.value ? <Text field={fields.title} /> : null;',
    // Condition on a different field than the one rendered.
    'const A = ({ fields }) => fields.showTitle.value && <Text field={fields.title} />;',
    // Non-SDK component.
    'const A = ({ fields }) => fields.title.value && <Heading field={fields.title} />;',
    // Ternary with content in both branches.
    'const A = ({ fields }) => fields.title.value ? <Text field={fields.title} /> : <span>Untitled</span>;',
  ],
  invalid: [
    {
      code: 'const A = ({ fields }) => <div>{fields.title.value && <Text field={fields.title} tag="h2" />}</div>;',
      errors: [{ messageId: 'hidden', data: { field: 'fields.title' } }],
    },
    {
      code: 'const A = (props) => props.fields.body?.value && <section><RichText field={props.fields.body} /></section>;',
      errors: [{ messageId: 'hidden', data: { field: 'props.fields.body' } }],
    },
    {
      code: 'const A = ({ fields }) => fields.image?.value?.src ? <Image field={fields.image} /> : null;',
      errors: [{ messageId: 'hidden', data: { field: 'fields.image' } }],
    },
    {
      code: 'const A = ({ fields }) => !fields.cta.value.href ? null : <Link field={fields.cta} />;',
      errors: [{ messageId: 'hidden', data: { field: 'fields.cta' } }],
    },
    {
      // Destructured fields.
      code: 'const A = ({ fields: { title } }) => !!title.value && <Text field={title} />;',
      errors: [{ messageId: 'hidden', data: { field: 'title' } }],
    },
    {
      // TypeScript non-null assertions.
      code: 'const A = ({ fields }: Props) => fields.date!.value && <DateField field={fields.date!} />;',
      errors: [{ messageId: 'hidden', data: { field: 'fields.date' } }],
    },
    {
      // Custom field components via options.
      code: 'const A = ({ fields }) => fields.title.value && <MyText field={fields.title} />;',
      options: [{ components: ['MyText'] }],
      errors: [{ messageId: 'hidden', data: { field: 'fields.title' } }],
    },
  ],
});

tester.run('no-empty-early-return', rules['no-empty-early-return'], {
  valid: [
    // Missing datasource: leave to withDatasourceCheck().
    'function Hero({ fields }) { if (!fields) return null; return <Text field={fields.title} />; }',
    'function Hero(props) { if (!props.fields) return null; return <div />; }',
    // Editing-aware.
    'function Hero({ fields, page }) { if (!page.mode.isEditing && !fields.title.value) return null; return <Text field={fields.title} />; }',
    'function List({ fields }) { const { page } = useSitecore(); if (!fields.items.length && !page.mode.isEditing) return null; return <ul />; }',
    // Not a component (no JSX).
    'function getTitle(fields) { if (!fields.title.value) return null; return fields.title.value; }',
    // Returns content, not nothing.
    'function Hero({ fields }) { if (!fields.title.value) return <p>No title</p>; return <h1 />; }',
  ],
  invalid: [
    {
      code: 'function Hero({ fields }) { if (!fields.title.value) return null; return <Text field={fields.title} />; }',
      errors: [{ messageId: 'vanishes', data: { field: 'fields.title.value' } }],
    },
    {
      code: 'const List = (props) => { if (!props.fields.items?.length) { return null; } return <ul />; };',
      errors: [{ messageId: 'vanishes', data: { field: 'props.fields.items.length' } }],
    },
    {
      code: 'const Promo = ({ fields }) => { if (fields.image.value.src === "") return undefined; return <Image field={fields.image} />; };',
      errors: [{ messageId: 'vanishes', data: { field: 'fields.image.value.src' } }],
    },
    {
      code: 'function Card({ fields: { heading } }) { if (!heading?.value) return null; return <Text field={heading} />; }',
      errors: [{ messageId: 'vanishes', data: { field: 'heading.value' } }],
    },
  ],
});
