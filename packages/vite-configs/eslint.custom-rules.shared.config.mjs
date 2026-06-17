import { createRequire } from 'node:module';

import localRules from '../eslint-local-rules/index.js';

const workspaceRequire = createRequire(`${process.cwd()}/package.json`);
const tseslintImport = await import(
  workspaceRequire.resolve('typescript-eslint')
);
const tseslint = tseslintImport.default ?? tseslintImport;
const perfectionistImport = await import(
  workspaceRequire.resolve('eslint-plugin-perfectionist')
);
const perfectionist = perfectionistImport.default ?? perfectionistImport;
const stylexPluginImport = await import(
  workspaceRequire.resolve('@stylexjs/eslint-plugin')
);
const stylexPlugin = stylexPluginImport.default ?? stylexPluginImport;

const TYPESCRIPT_LANGUAGE_OPTIONS = {
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    sourceType: 'module',
  },
};

const GLOBAL_IGNORES = [
  '.react-router/**',
  'build/**',
  'coverage/**',
  'dist/**',
  'miscelanious/**',
  'node_modules/**',
  'scripts/**',
  'utils/**',
];

export const createCustomRulesLintConfig = ({ ignorePatterns = [] } = {}) => [
  {
    ignores: [...GLOBAL_IGNORES, ...ignorePatterns],
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: TYPESCRIPT_LANGUAGE_OPTIONS,
    plugins: {
      '@stylexjs': stylexPlugin,
      'typescript-eslint': tseslint.plugin,
      '@typescript-eslint': tseslint.plugin,
      'local-rules': localRules,
      perfectionist,
    },
    rules: {
      '@stylexjs/sort-keys': 'warn',
      '@stylexjs/valid-styles': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      'func-style': ['error', 'expression'],
      'local-rules/clean-import-paths': 'error',
      'local-rules/destructuring-for-functions': 'error',
      'local-rules/merge-duplicate-imports': 'error',
      'local-rules/no-inline-type-imports': 'error',
      'local-rules/type-suffix-naming': 'error',
      'perfectionist/sort-imports': [
        'error',
        {
          order: 'asc',
          type: 'natural',
        },
      ],
    },
  },
  {
    files: ['src/entry.server.tsx'],
    rules: {
      'func-style': 'off',
      'local-rules/destructuring-for-functions': 'off',
    },
  },
  {
    files: ['src/**/*.stylex.ts'],
    rules: {
      'local-rules/destructuring-for-functions': 'off',
      'perfectionist/sort-object-types': 'off',
      'perfectionist/sort-objects': 'off',
    },
  },
  {
    files: [
      'src/**/*.component.tsx',
      'src/**/*.errorBoundary.tsx',
      'src/**/*.layout.tsx',
    ],
    languageOptions: TYPESCRIPT_LANGUAGE_OPTIONS,
    plugins: {
      'local-rules': localRules,
    },
    rules: {
      'local-rules/no-type-definitions-in-components': 'error',
      'local-rules/single-component-export': 'error',
    },
  },
];
