import tseslint from 'typescript-eslint';

import localRules from '../../packages/eslint-local-rules/index.js';

export default [
  {
    ignores: [
      '.react-router/**',
      'build/**',
      'coverage/**',
      'dist/**',
      'miscelanious/**',
      'node_modules/**',
      'scripts/**',
      'utils/**',
    ],
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        sourceType: 'module',
      },
    },
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
    files: [
      'src/**/*.component.tsx',
      'src/**/*.errorBoundary.tsx',
      'src/**/*.layout.tsx',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        sourceType: 'module',
      },
    },
    plugins: {
      'local-rules': localRules,
    },
    rules: {
      'local-rules/no-type-definitions-in-components': 'error',
      'local-rules/single-component-export': 'error',
    },
  },
];
