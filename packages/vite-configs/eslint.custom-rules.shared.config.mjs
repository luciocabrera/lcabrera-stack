import { createRequire } from 'node:module';

import localRules from '../eslint-local-rules/index.js';

const workspaceRequire = createRequire(`${process.cwd()}/package.json`);
const tseslintImport = await import(
  workspaceRequire.resolve('typescript-eslint')
);
const tseslint = tseslintImport.default ?? tseslintImport;

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

export const createCustomRulesLintConfig = () => [
  {
    ignores: GLOBAL_IGNORES,
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: TYPESCRIPT_LANGUAGE_OPTIONS,
    plugins: {
      'typescript-eslint': tseslint.plugin,
      '@typescript-eslint': tseslint.plugin,
      'local-rules': localRules,
    },
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      'func-style': ['error', 'expression'],
      'local-rules/destructuring-for-functions': 'error',
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
