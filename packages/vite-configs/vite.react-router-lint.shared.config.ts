import type { OxlintConfig } from 'vite-plus/lint';

import { mergeOxlintConfig } from './vite.config-merge.util.ts';
import { frontendLintSharedConfig } from './vite.frontend-lint.shared.config.ts';

export const reactRouterLintSharedConfig: OxlintConfig = {
  ...frontendLintSharedConfig,
  ignorePatterns: [
    '.react-router/',
    'build/',
    'out/',
    'dist/',
    'miscelanious/',
    'node_modules/',
    '../../packages/eslint-local-rules/',
    'guidelines/playwright_config.ts',
    'scripts/',
    'utils/',
  ],
  overrides: [
    ...(frontendLintSharedConfig.overrides ?? []),
    {
      files: [
        '**/root.ts',
        '**/root.tsx',
        'src/root.tsx',
        'src/root/**/index.ts',
        'src/routes/**/index.tsx',
      ],
      rules: {
        'react/only-export-components': 'off',
      },
    },
    {
      files: ['src/entry.server.tsx'],
      rules: {
        'func-style': 'off',
        'local-rules/destructuring-for-functions': 'off',
      },
    },
  ],
};

type CreateReactRouterLintConfigArgs = Partial<
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

export const createReactRouterLintConfig = (
  overrides: CreateReactRouterLintConfigArgs = {},
): OxlintConfig => mergeOxlintConfig(reactRouterLintSharedConfig, overrides);
