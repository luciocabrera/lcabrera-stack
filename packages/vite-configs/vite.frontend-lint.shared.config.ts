import type { OxlintConfig } from 'vite-plus/lint';

import { createBaseLintConfig } from './vite.base-lint.shared.config.ts';
import { mergeOxlintConfig } from './vite.config-merge.util.ts';

const LOCAL_RULES_SPECIFIER = '../../packages/eslint-local-rules/index.js';

const BASE_LINT_CONFIG = createBaseLintConfig();

export const frontendLintSharedConfig: OxlintConfig = {
  ...BASE_LINT_CONFIG,
  jsPlugins: [
    ...(BASE_LINT_CONFIG.jsPlugins ?? []),
    'eslint-plugin-react-x',
    'eslint-plugin-react-dom',
  ],
  overrides: [
    ...(BASE_LINT_CONFIG.overrides ?? []),
    {
      env: {
        browser: true,
      },
      files: ['**/*.ts', '**/*.tsx'],
      jsPlugins: [
        '@stylexjs/eslint-plugin',
        {
          name: 'local-rules',
          specifier: LOCAL_RULES_SPECIFIER,
        },
      ],
      rules: {
        '@stylexjs/sort-keys': 'warn',
        '@stylexjs/valid-styles': 'error',
        'local-rules/no-type-definitions-in-components': 'error',
        'local-rules/single-component-export': 'error',
      },
    },
    {
      files: ['**/*.stylex.ts'],
      jsPlugins: [
        'eslint-plugin-perfectionist',
        {
          name: 'local-rules',
          specifier: LOCAL_RULES_SPECIFIER,
        },
      ],
      rules: {
        'local-rules/destructuring-for-functions': 'off',
        'perfectionist/sort-object-types': 'off',
        'perfectionist/sort-objects': 'off',
        'unicorn/no-null': 'off',
      },
    },
  ],
  plugins: [
    ...(BASE_LINT_CONFIG.plugins ?? []),
    'react',
    'jsx-a11y',
    'react-perf',
  ],
  rules: {
    ...BASE_LINT_CONFIG.rules,
    'react-dom/no-dangerously-set-innerhtml': 'warn',
    'react-dom/no-dangerously-set-innerhtml-with-children': 'error',
    'react-dom/no-find-dom-node': 'error',
    'react-dom/no-flush-sync': 'error',
    'react-dom/no-hydrate': 'error',
    'react-dom/no-namespace': 'error',
    'react-dom/no-render': 'error',
    'react-dom/no-render-return-value': 'error',
    'react-dom/no-script-url': 'warn',
    'react-dom/no-unsafe-iframe-sandbox': 'warn',
    'react-dom/no-use-form-state': 'error',
    'react-dom/no-void-elements-with-children': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-x/component-hook-factories': 'error',
    'react-x/error-boundaries': 'error',
    'react-x/exhaustive-deps': 'warn',
    'react-x/jsx-key-before-spread': 'warn',
    'react-x/jsx-no-comment-textnodes': 'warn',
    'react-x/no-access-state-in-setstate': 'error',
    'react-x/no-array-index-key': 'warn',
    'react-x/no-children-count': 'warn',
    'react-x/no-children-for-each': 'warn',
    'react-x/no-children-map': 'warn',
    'react-x/no-children-only': 'warn',
    'react-x/no-children-to-array': 'warn',
    'react-x/no-clone-element': 'warn',
    'react-x/no-component-will-mount': 'error',
    'react-x/no-component-will-receive-props': 'error',
    'react-x/no-component-will-update': 'error',
    'react-x/no-context-provider': 'warn',
    'react-x/no-create-ref': 'error',
    'react-x/no-direct-mutation-state': 'error',
    'react-x/no-forward-ref': 'warn',
    'react-x/no-missing-key': 'error',
    'react-x/no-nested-component-definitions': 'error',
    'react-x/no-nested-lazy-component-declarations': 'error',
    'react-x/no-redundant-should-component-update': 'error',
    'react-x/no-set-state-in-component-did-mount': 'warn',
    'react-x/no-set-state-in-component-did-update': 'warn',
    'react-x/no-set-state-in-component-will-update': 'warn',
    'react-x/no-unnecessary-use-prefix': 'warn',
    'react-x/no-unsafe-component-will-mount': 'warn',
    'react-x/no-unsafe-component-will-receive-props': 'warn',
    'react-x/no-unsafe-component-will-update': 'warn',
    'react-x/no-unused-class-component-members': 'warn',
    'react-x/no-use-context': 'warn',
    'react-x/purity': 'warn',
    'react-x/rules-of-hooks': 'error',
    'react-x/set-state-in-effect': 'warn',
    'react-x/set-state-in-render': 'error',
    'react-x/unsupported-syntax': 'error',
    'react-x/use-memo': 'error',
    'react-x/use-state': 'warn',
    'react/only-export-components': ['error', {}],
  },
  settings: {
    'react-x': {
      importSource: 'react',
      polymorphicPropName: 'as',
      version: 'detect',
    },
  },
};

type CreateFrontendLintConfigArgs = Partial<
  Pick<
    OxlintConfig,
    | 'categories'
    | 'env'
    | 'ignorePatterns'
    | 'jsPlugins'
    | 'options'
    | 'overrides'
    | 'plugins'
    | 'rules'
    | 'settings'
  >
>;

export const createFrontendLintConfig = (
  overrides: CreateFrontendLintConfigArgs = {},
): OxlintConfig => mergeOxlintConfig(frontendLintSharedConfig, overrides);
