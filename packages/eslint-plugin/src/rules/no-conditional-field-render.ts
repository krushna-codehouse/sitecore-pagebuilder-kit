import type { Rule } from 'eslint';
import {
  DEFAULT_FIELD_COMPONENTS,
  collectRenderedFields,
  collectValueReads,
  mentionsEditing,
  rendersNothing,
  type AnyNode,
  type RuleModule,
} from '../utils.js';

interface Options {
  components?: string[];
}

/**
 * Flags conditions on a field's value that wrap the Content SDK component
 * rendering the same field:
 *
 *   {fields.title.value && <Text field={fields.title} />}
 *   {fields.image?.value?.src ? <Image field={fields.image} /> : null}
 *
 * In Page Builder the SDK renders an empty-field placeholder so authors can
 * fill the field in, but the condition removes the component first.
 */
const rule: RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hiding a Sitecore field component behind a check on its own value',
      recommended: true,
      url: 'https://github.com/Krushna285/sitecore-pagebuilder-kit/blob/main/packages/eslint-plugin/README.md#no-conditional-field-render',
    },
    schema: [
      {
        type: 'object',
        properties: {
          components: { type: 'array', items: { type: 'string' }, uniqueItems: true },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      hidden:
        "'{{field}}' is hidden when empty, so authors can't fill it in Page Builder. Wrap it in <FieldGuard field={{{field}}}> or render the field component without the condition.",
    },
  },

  create(context) {
    const options = (context.options[0] ?? {}) as Options;
    const components = [...DEFAULT_FIELD_COMPONENTS, ...(options.components ?? [])];
    const sourceCode = context.sourceCode;

    const check = (node: AnyNode, test: AnyNode, rendered: AnyNode[]) => {
      if (mentionsEditing(test, sourceCode)) return;
      const reads = collectValueReads(test, sourceCode);
      if (reads.size === 0) return;
      for (const branch of rendered) {
        for (const field of collectRenderedFields(branch, sourceCode, components)) {
          if (reads.has(field)) {
            context.report({ node, messageId: 'hidden', data: { field } });
            return;
          }
        }
      }
    };

    return {
      LogicalExpression(node: AnyNode) {
        if (node.operator !== '&&') return;
        check(node, node.left, [node.right]);
      },
      ConditionalExpression(node: AnyNode) {
        if (rendersNothing(node.alternate)) check(node, node.test, [node.consequent]);
        else if (rendersNothing(node.consequent)) check(node, node.test, [node.alternate]);
      },
    } as Rule.RuleListener;
  },
};

export default rule;
