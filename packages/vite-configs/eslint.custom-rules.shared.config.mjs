import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import localRules from '../eslint-local-rules/index.js';

// Resolved from tsconfigRootDir (each consuming app's own directory), never
// process.cwd() — process.cwd() is a single, fixed value for the entire
// lifetime of whatever process imports this module. That's harmless for
// this repo's own `eslint .` package.json scripts (each `cd`s into one
// app's directory before running, so cwd always matches the app being
// linted), but breaks for any single long-lived process serving multiple
// apps — e.g. an editor's ESLint extension, which stays running for the
// whole workspace and never re-execs per app. In that scenario
// process.cwd() lands on the workspace root, which has none of these
// plugins as direct dependencies (they're only installed under each app's
// own node_modules), so resolution either fails outright or falls back to
// an inconsistent module instance — which is what actually produces the
// "multiple candidate TSConfigRootDirs" symptom, not just a missing
// tsconfigRootDir parser option (that fix alone wasn't sufficient).
const resolveWorkspaceImportSpecifier = (workspaceRequire, specifier) => {
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

const importFromWorkspace = async (workspaceRequire, specifier) => {
  return await import(
    resolveWorkspaceImportSpecifier(workspaceRequire, specifier)
  );
};

const createTypescriptLanguageOptions = (tseslint, tsconfigRootDir) => ({
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    sourceType: 'module',
    tsconfigRootDir,
  },
});

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

export const createCustomRulesLintConfig = async ({
  ignorePatterns = [],
  tsconfigRootDir = process.cwd(),
} = {}) => {
  // Scoped to tsconfigRootDir, not process.cwd() — see the comment above
  // resolveWorkspaceImportSpecifier for why this distinction is the actual
  // fix, not just a style preference.
  const workspaceRequire = createRequire(`${tsconfigRootDir}/package.json`);
  const fromWorkspace = (specifier) =>
    importFromWorkspace(workspaceRequire, specifier);

  const tseslintImport = await fromWorkspace('typescript-eslint');
  const tseslint = tseslintImport.default ?? tseslintImport;

  const perfectionistImport = await fromWorkspace(
    'eslint-plugin-perfectionist',
  );
  const perfectionist = perfectionistImport.default ?? perfectionistImport;

  const stylexPluginImport = await fromWorkspace('@stylexjs/eslint-plugin');
  const stylexPlugin = stylexPluginImport.default ?? stylexPluginImport;

  const eslintImport = await fromWorkspace('@eslint/js');
  const eslint = eslintImport.default ?? eslintImport;

  const eslintConfigPrettierImport = await fromWorkspace(
    'eslint-config-prettier/flat',
  );
  const eslintConfigPrettier =
    eslintConfigPrettierImport.default ?? eslintConfigPrettierImport;

  const reactDomImport = await fromWorkspace('eslint-plugin-react-dom');
  const reactDom = reactDomImport.default ?? reactDomImport;

  const reactHooksImport = await fromWorkspace('eslint-plugin-react-hooks');
  const reactHooks = reactHooksImport.default ?? reactHooksImport;

  const reactRefreshImport = await fromWorkspace('eslint-plugin-react-refresh');
  const reactRefresh = reactRefreshImport.default ?? reactRefreshImport;

  const reactXImport = await fromWorkspace('eslint-plugin-react-x');
  const reactX = reactXImport.default ?? reactXImport;

  const securityImport = await fromWorkspace('eslint-plugin-security');
  const security = securityImport.default ?? securityImport;

  const unicornImport = await fromWorkspace('eslint-plugin-unicorn');
  const unicorn = unicornImport.default ?? unicornImport;

  const globalsImport = await fromWorkspace('globals');
  const globals = globalsImport.default ?? globalsImport;

  return [
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
      languageOptions: createTypescriptLanguageOptions(
        tseslint,
        tsconfigRootDir,
      ),
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
      languageOptions: createTypescriptLanguageOptions(
        tseslint,
        tsconfigRootDir,
      ),
      plugins: {
        'local-rules': localRules,
      },
      rules: {
        'local-rules/no-type-definitions-in-components': 'error',
        'local-rules/single-component-export': 'error',
      },
    },
  ];
};
