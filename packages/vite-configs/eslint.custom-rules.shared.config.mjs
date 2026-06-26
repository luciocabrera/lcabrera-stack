import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import localRules from '../eslint-local-rules/index.js';

const workspaceRequire = createRequire(`${process.cwd()}/package.json`);
const resolveWorkspaceImportSpecifier = (specifier) => {
  try {
    return workspaceRequire.resolve(specifier);
  } catch (error) {
    if (
      !error ||
      typeof error !== 'object' ||
      !('code' in error) ||
      error.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED'
    ) {
      throw error;
    }

    const packageJsonPath = workspaceRequire.resolve(
      `${specifier}/package.json`,
    );
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const rootExport = packageJson.exports?.['.'];

    let entryPoint;
    if (typeof rootExport === 'string') {
      entryPoint = rootExport;
    } else if (rootExport && typeof rootExport === 'object') {
      entryPoint =
        rootExport.import ?? rootExport.default ?? rootExport.require;
    }

    entryPoint ??= packageJson.module ?? packageJson.main;

    if (typeof entryPoint !== 'string') {
      throw error;
    }

    return pathToFileURL(resolve(dirname(packageJsonPath), entryPoint)).href;
  }
};

const importFromWorkspace = async (specifier) => {
  return await import(resolveWorkspaceImportSpecifier(specifier));
};

const tseslintImport = await importFromWorkspace('typescript-eslint');
const tseslint = tseslintImport.default ?? tseslintImport;

const perfectionistImport = await importFromWorkspace(
  'eslint-plugin-perfectionist',
);
const perfectionist = perfectionistImport.default ?? perfectionistImport;

const stylexPluginImport = await importFromWorkspace('@stylexjs/eslint-plugin');
const stylexPlugin = stylexPluginImport.default ?? stylexPluginImport;

const eslintImport = await importFromWorkspace('@eslint/js');
const eslint = eslintImport.default ?? eslintImport;

const eslintConfigPrettierImport = await importFromWorkspace(
  'eslint-config-prettier/flat',
);
const eslintConfigPrettier =
  eslintConfigPrettierImport.default ?? eslintConfigPrettierImport;

const reactDomImport = await importFromWorkspace('eslint-plugin-react-dom');
const reactDom = reactDomImport.default ?? reactDomImport;

const reactHooksImport = await importFromWorkspace('eslint-plugin-react-hooks');
const reactHooks = reactHooksImport.default ?? reactHooksImport;

const reactRefreshImport = await importFromWorkspace(
  'eslint-plugin-react-refresh',
);
const reactRefresh = reactRefreshImport.default ?? reactRefreshImport;

const reactXImport = await importFromWorkspace('eslint-plugin-react-x');
const reactX = reactXImport.default ?? reactXImport;

const securityImport = await importFromWorkspace('eslint-plugin-security');
const security = securityImport.default ?? securityImport;

const unicornImport = await importFromWorkspace('eslint-plugin-unicorn');
const unicorn = unicornImport.default ?? unicornImport;
const globalsImport = await importFromWorkspace('globals');
const globals = globalsImport.default ?? globalsImport;
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
  {
    files: ['**/root.ts', '**/root.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  // Other configs...
  // Enable lint rules for React
  reactX.configs['recommended-typescript'],
  // Enable lint rules for React DOM
  reactDom.configs.recommended,

  // 3. Sorting (Perfectionist)
  perfectionist.configs['recommended-natural'],

  // 4. Formatting (Prettier - Must be last to disable conflicts)
  eslintConfigPrettier,

  ...(Array.isArray(tseslint.configs.recommended)
    ? tseslint.configs.recommended
    : [tseslint.configs.recommended]),

  {
    rules: {
      'unicorn/consistent-boolean-name': [
        'error',
        {
          prefixes: {
            are: true,
          },
        },
      ],
      'unicorn/name-replacements': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-array-reduce': 'off',
      'security/detect-object-injection': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/prefer-query-selector': 'off',
      'unicorn/prefer-observer-apis': 'off',
    },
  },
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
    },
    rules: {
      'local-rules/destructuring-for-functions': 'off',
      'perfectionist/sort-object-types': 'off',
      'perfectionist/sort-objects': 'off',
      'unicorn/no-null': 'off',
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
