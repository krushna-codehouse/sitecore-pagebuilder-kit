import type { ESLint, Linter } from 'eslint';
import noConditionalFieldRender from './rules/no-conditional-field-render.js';
import noEmptyEarlyReturn from './rules/no-empty-early-return.js';

const rules = {
  'no-conditional-field-render': noConditionalFieldRender,
  'no-empty-early-return': noEmptyEarlyReturn,
};

const plugin = {
  meta: { name: 'eslint-plugin-sitecore-pagebuilder', version: '0.1.0' },
  rules,
  configs: {} as Record<string, Linter.Config>,
} satisfies ESLint.Plugin;

plugin.configs.recommended = {
  name: 'sitecore-pagebuilder/recommended',
  plugins: { 'sitecore-pagebuilder': plugin },
  rules: {
    'sitecore-pagebuilder/no-conditional-field-render': 'warn',
    'sitecore-pagebuilder/no-empty-early-return': 'warn',
  },
};

export { rules };
export default plugin;
