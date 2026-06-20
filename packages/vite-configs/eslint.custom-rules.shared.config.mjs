import { createRequire } from 'node:module';

import localRules from '../eslint-local-rules/index.js';

const workspaceRequire = createRequire(`${process.cwd()}/package.json`);
const tseslint = await import(workspaceRequire.resolve('typescript-eslint'));
// const tseslint = tseslintImport.default ?? tseslintImport;
const perfectionist = await import(
  workspaceRequire.resolve('eslint-plugin-perfectionist')
);
// const perfectionist = perfectionistImport.default ?? perfectionistImport;
const stylexPlugin = await import(
  workspaceRequire.resolve('@stylexjs/eslint-plugin')
);

const eslint = await import(workspaceRequire.resolve('@eslint/js'));

const eslintConfigPrettier = await import(
  workspaceRequire.resolve('eslint-config-prettier/flat')
);

const reactDom = await import(
  workspaceRequire.resolve('eslint-plugin-react-dom')
);

const reactHooks = await import(
  workspaceRequire.resolve('eslint-plugin-react-hooks')
);

const reactRefresh = await import(
  workspaceRequire.resolve('eslint-plugin-react-refresh')
);

const reactX = await import(workspaceRequire.resolve('eslint-plugin-react-x'));

const security = await import(
  workspaceRequire.resolve('eslint-plugin-security')
);

const unicorn = await import(workspaceRequire.resolve('eslint-plugin-unicorn'));
// const stylexPlugin = stylexPluginImport.default ?? stylexPluginImport;

// import eslint from '@eslint/js';
// import stylex from '@stylexjs/eslint-plugin';
// import eslintConfigPrettier from 'eslint-config-prettier/flat';
// import perfectionist from 'eslint-plugin-perfectionist';
// import reactDom from 'eslint-plugin-react-dom';
// import reactHooks from 'eslint-plugin-react-hooks';
// import reactRefresh from 'eslint-plugin-react-refresh';
// import reactX from 'eslint-plugin-react-x';
// import security from 'eslint-plugin-security';
// import unicorn from 'eslint-plugin-unicorn';
// import { defineConfig, globalIgnores } from 'eslint/config';
// import globals from 'globals';
// import tseslint from 'typescript-eslint';

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
  // 1. Core ESLint
  eslint.configs.recommended,
  // Add security recommended config here (good spot: after core but before styling/sorting)
  security.configs.recommended,
  unicorn.configs.recommended,

  // 2. React Hooks and Refresh
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.recommended,
  // Other configs...
  // Enable lint rules for React
  reactX.configs['recommended-typescript'],
  // Enable lint rules for React DOM
  reactDom.configs.recommended,

  // 3. Sorting (Perfectionist)
  perfectionist.configs['recommended-natural'],

  // 4. Formatting (Prettier - Must be last to disable conflicts)
  eslintConfigPrettier,

  tseslint.configs.recommended,

  // 5. JavaScript files configuration (for Node.js server files, etc.)
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/prevent-abbreviations': 'off',
    },
  },
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
    plugins: {
      '@stylexjs': stylexPlugin,
      perfectionist,
    },
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
