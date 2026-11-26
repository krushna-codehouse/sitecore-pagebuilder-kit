import type { Rule, SourceCode } from 'eslint';

/** ESTree nodes, including JSX and TypeScript nodes the core types don't model. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyNode = any;

/** Content SDK components that render a Sitecore field through a `field` prop. */
export const DEFAULT_FIELD_COMPONENTS = ['Text', 'RichText', 'Image', 'NextImage', 'Link', 'DateField', 'File'];

/** Calls `visit` on `node` and every descendant. Return false from `visit` to skip children. */
export function walk(node: AnyNode, sourceCode: SourceCode, visit: (n: AnyNode) => boolean | void): void {
  if (!node || typeof node.type !== 'string') return;
  if (visit(node) === false) return;
  const keys = sourceCode.visitorKeys[node.type] ?? [];
  for (const key of keys) {
    const child = node[key];
    if (Array.isArray(child)) child.forEach((c) => walk(c, sourceCode, visit));
    else walk(child, sourceCode, visit);
  }
}

/** Source text with optional chaining, non-null assertions and whitespace removed. */
export function normalize(node: AnyNode, sourceCode: SourceCode): string {
  return sourceCode
    .getText(node)
    .replace(/\s+/g, '')
    .replace(/\?\./g, '.')
    .replace(/!(?=[.\[]|$)/g, '');
}

const propertyName = (member: AnyNode): string | undefined =>
  member.property?.type === 'Identifier' && !member.computed
    ? member.property.name
    : member.property?.type === 'Literal'
      ? String(member.property.value)
      : undefined;

const unwrap = (node: AnyNode): AnyNode => {
  let current = node;
  while (current && (current.type === 'TSNonNullExpression' || current.type === 'ChainExpression')) {
    current = current.expression;
  }
  return current;
};

/**
 * Finds every `X.value` read inside `node` and returns the normalized text of `X`.
 * `fields.title.value`, `fields.title?.value?.src` and `!!title.value` all yield the field expression.
 */
export function collectValueReads(node: AnyNode, sourceCode: SourceCode): Set<string> {
  const reads = new Set<string>();
  walk(node, sourceCode, (n) => {
    if (n.type === 'MemberExpression' && propertyName(n) === 'value') {
      reads.add(normalize(unwrap(n.object), sourceCode));
    }
  });
  return reads;
}

const jsxName = (name: AnyNode): string | undefined => {
  if (!name) return undefined;
  if (name.type === 'JSXIdentifier') return name.name;
  if (name.type === 'JSXMemberExpression') return name.property?.name;
  return undefined;
};

/** Normalized `field={...}` expressions of Content SDK field components inside `node`. */
export function collectRenderedFields(node: AnyNode, sourceCode: SourceCode, components: string[]): Set<string> {
  const rendered = new Set<string>();
  walk(node, sourceCode, (n) => {
    if (n.type !== 'JSXOpeningElement') return;
    const name = jsxName(n.name);
    if (!name || !components.includes(name)) return;
    for (const attr of n.attributes ?? []) {
      if (
        attr.type === 'JSXAttribute' &&
        attr.name?.name === 'field' &&
        attr.value?.type === 'JSXExpressionContainer'
      ) {
        rendered.add(normalize(unwrap(attr.value.expression), sourceCode));
      }
    }
  });
  return rendered;
}

/** True for `null`, `undefined`, `false` and `''`: branches that render nothing. */
export function rendersNothing(node: AnyNode): boolean {
  const n = unwrap(node);
  if (!n) return true;
  if (n.type === 'Literal') return n.value === null || n.value === false || n.value === '';
  return n.type === 'Identifier' && n.name === 'undefined';
}

/** True when the expression mentions `isEditing` (e.g. `page.mode.isEditing`). */
export function mentionsEditing(node: AnyNode, sourceCode: SourceCode): boolean {
  let found = false;
  walk(node, sourceCode, (n) => {
    if (found) return false;
    if (n.type === 'Identifier' && /^is(Editing|PageEditing|EditMode)$/.test(n.name)) found = true;
    if (n.type === 'MemberExpression' && /^(isEditing|pageEditing)$/.test(propertyName(n) ?? '')) found = true;
  });
  return found;
}

/**
 * Finds reads of component fields deeper than `fields` itself, such as
 * `fields.items`, `props.fields.items.length` or `fields.title.value`.
 * A bare `fields` / `props.fields` check (a missing datasource) is not included.
 */
export function collectFieldChecks(node: AnyNode, sourceCode: SourceCode): string[] {
  const checks: string[] = [];
  walk(node, sourceCode, (n) => {
    if (n.type !== 'MemberExpression') return;
    const text = normalize(n, sourceCode);
    const parts = text.split('.');
    const index = parts.indexOf('fields');
    if (index >= 0 && parts.length > index + 1) {
      checks.push(text);
      return false;
    }
    if (propertyName(n) === 'value') {
      checks.push(text);
      return false;
    }
  });
  return checks;
}

export type RuleModule = Rule.RuleModule;
