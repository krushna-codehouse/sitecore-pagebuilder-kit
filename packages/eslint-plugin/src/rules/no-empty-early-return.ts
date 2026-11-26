import type { Rule } from 'eslint';
import { collectFieldChecks, mentionsEditing, rendersNothing, walk, type AnyNode, type RuleModule } from '../utils.js';

/**
 * Flags components that return nothing when a field is empty, without
 * checking for Page Builder first:
 *
 *   if (!fields.title.value) return null;
 *   if (!props.fields.items?.length) return null;
 *
 * On the live site that's fine, but in Page Builder the whole component
 * disappears and authors have nothing to click to fill it in.
 * A bare `if (!fields) return null` is left alone; use the SDK's
 * withDatasourceCheck() for missing datasources.
 */
const rule: RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow returning nothing for empty fields without handling Page Builder editing',
      recommended: true,
      url: 'https://github.com/Krushna285/sitecore-pagebuilder-kit/blob/main/packages/eslint-plugin/README.md#no-empty-early-return',
    },
    schema: [],
    messages: {
      vanishes:
        "This component returns nothing when '{{field}}' is empty, so it disappears in Page Builder. Check page.mode.isEditing first, or keep rendering so authors can fill the field in.",
    },
  },

  create(context) {
    const sourceCode = context.sourceCode;

    const returnsNothing = (statement: AnyNode): boolean => {
      if (!statement) return false;
      if (statement.type === 'ReturnStatement') return rendersNothing(statement.argument);
      if (statement.type === 'BlockStatement') {
        const last = statement.body[statement.body.length - 1];
        return Boolean(last) && last.type === 'ReturnStatement' && rendersNothing(last.argument);
      }
      return false;
    };

    const containsJsx = (fn: AnyNode): boolean => {
      let found = false;
      walk(fn.body, sourceCode, (n) => {
        if (found) return false;
        if (n.type === 'JSXElement' || n.type === 'JSXFragment') found = true;
      });
      return found;
    };

    const enclosingFunction = (node: AnyNode): AnyNode => {
      let current = node.parent;
      while (current) {
        if (
          current.type === 'FunctionDeclaration' ||
          current.type === 'FunctionExpression' ||
          current.type === 'ArrowFunctionExpression'
        ) {
          return current;
        }
        current = current.parent;
      }
      return null;
    };

    return {
      IfStatement(node: AnyNode) {
        if (!returnsNothing(node.consequent)) return;
        const fn = enclosingFunction(node);
        if (!fn || !containsJsx(fn)) return;
        if (mentionsEditing(node.test, sourceCode)) return;
        const checks = collectFieldChecks(node.test, sourceCode);
        if (checks.length === 0) return;
        context.report({ node, messageId: 'vanishes', data: { field: checks[0] } });
      },
    } as Rule.RuleListener;
  },
};

export default rule;
