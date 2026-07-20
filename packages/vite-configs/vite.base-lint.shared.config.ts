import type { OxlintConfig } from 'vite-plus/lint';

import { mergeOxlintConfig } from './viteConfigMerge.util.ts';

const LOCAL_RULES_SPECIFIER = '../../packages/eslint-local-rules/index.js';

export const baseLintSharedConfig: OxlintConfig = {
  categories: {
    correctness: 'warn',
  },
  env: {
    builtin: true,
    es2026: true,
  },
  jsPlugins: [
    { name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' },
    'eslint-plugin-security',
  ],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  overrides: [
    {
      env: {
        node: true,
      },
      files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
      rules: {
        'no-console': 'off',
        'unicorn/prefer-module': 'off',
      },
    },
    {
      env: {
        browser: true,
      },
      files: ['**/*.ts', '**/*.tsx'],
      jsPlugins: [
        {
          name: 'local-rules',
          specifier: LOCAL_RULES_SPECIFIER,
        },
      ],
      plugins: [
        'oxc',
        'typescript',
        'import',
        'unicorn',
        'node',
        'promise',
        'eslint',
        'vitest',
        'react',
        'jsx-a11y',
        'react-perf',
      ],
    },
    {
      files: ['eslint.config.js', 'eslint.config.mjs'],
      rules: {
        'unicorn/no-null': 'off',
      },
    },
  ],
  plugins: [
    'oxc',
    'typescript',
    'import',
    'unicorn',
    'node',
    'promise',
    'eslint',
    'vitest',
  ],
};

type CreateBaseLintConfigArgs = Partial<
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

export const createBaseLintConfig = (
  overrides: CreateBaseLintConfigArgs = {},
): OxlintConfig => mergeOxlintConfig(baseLintSharedConfig, overrides);
