import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import localRules from '../eslint-local-rules/index.js';
import {
  BARREL_SYNTAX_RESTRICTIONS,
  CLIENT_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS,
  REACT_TYPE_IMPORT_PATHS,
  STATE_LIBRARY_IMPORT_PATTERNS,
  UI_PUBLIC_IMPORT_BOUNDARY_PATTERNS,
} from './eslint.restrictions.shared.mjs';

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
  enforceServerClientImportBoundary = false,
  enforceUiPublicImportBoundary = false,
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
    {
      // Oxlint consumes eslint-disable comments too — eslint must never
      // remove directives it considers "unused" (they may be suppressing an
      // oxlint rule of the same name), so unused-directive reporting is off.
      linterOptions: {
        reportUnusedDisableDirectives: 'off',
      },
    },
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
        // Escalated from the plugins' default `warn` so the bulk-suppression
        // baseline (eslint-suppressions.json) covers inherited findings and
        // NEW occurrences fail the gate (suppressions only apply to
        // error-severity rules).
        'react-x/set-state-in-effect': 'error',
        'security/detect-non-literal-fs-filename': 'error',
        'security/detect-non-literal-regexp': 'error',
        'security/detect-object-injection': 'off',
        'security/detect-unsafe-regex': 'error',
        'unicorn/consistent-boolean-name': [
          'error',
          {
            prefixes: {
              are: true,
            },
          },
        ],
        'unicorn/filename-case': 'off',
        'unicorn/name-replacements': 'off',
        'unicorn/no-array-reduce': 'off',
        // Auto-fixer rewrites http:// string literals to https://, silently
        // corrupting test fixtures and local-dev URLs — see the base factory.
        'unicorn/prefer-https': 'off',
        'unicorn/prefer-query-selector': 'off',
        'unicorn/prevent-abbreviations': 'off',
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
      // Always on, and deliberately BEFORE the server/client boundary block:
      // flat config replaces a rule wholesale on a later match, so the boundary
      // block composes these restrictions into its own value. `.server` files,
      // which that block ignores, still land here.
      files: ['src/**/*.ts', 'src/**/*.tsx'],
      rules: {
        'no-restricted-syntax': ['error', ...BARREL_SYNTAX_RESTRICTIONS],
      },
    },
    ...(enforceServerClientImportBoundary
      ? [
          {
            files: ['src/**/*.ts', 'src/**/*.tsx'],
            ignores: [
              'src/entry.server.tsx',
              'src/**/*.server.ts',
              'src/**/*.server.tsx',
              // A `.server/` directory is a React Router server-only module
              // (every file inside is stripped from the client bundle), so the
              // server-only import bans do not apply to its contents — the same
              // exemption the `.server.ts` suffix gets.
              'src/**/.server/**',
            ],
            rules: {
              'no-restricted-syntax': [
                'error',
                ...CLIENT_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS,
                ...BARREL_SYNTAX_RESTRICTIONS,
              ],
            },
          },
        ]
      : []),
    {
      files: ['src/**/*.ts', 'src/**/*.tsx'],
      languageOptions: createTypescriptLanguageOptions(
        tseslint,
        tsconfigRootDir,
      ),
      plugins: {
        '@stylexjs': stylexPlugin,
        '@typescript-eslint': tseslint.plugin,
        'local-rules': localRules,
        'typescript-eslint': tseslint.plugin,
      },
      rules: {
        '@stylexjs/sort-keys': 'warn',
        '@stylexjs/valid-styles': 'error',
        '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
        'func-style': ['error', 'expression'],
        'local-rules/clean-import-paths': 'error',
        'local-rules/destructuring-for-functions': 'error',
        'local-rules/filename-convention': 'error',
        'local-rules/merge-duplicate-imports': 'error',
        'local-rules/no-inline-type-imports': 'error',
        // One value per rule: ESLint flat config replaces a rule wholesale when
        // a later config sets it again, so every restriction that applies to
        // these files is composed here rather than split across blocks.
        'local-rules/readonly-props': 'error',
        'local-rules/type-suffix-naming': 'error',
        'no-restricted-imports': [
          'error',
          {
            paths: REACT_TYPE_IMPORT_PATHS,
            patterns: [
              ...(enforceUiPublicImportBoundary
                ? UI_PUBLIC_IMPORT_BOUNDARY_PATTERNS
                : []),
              ...STATE_LIBRARY_IMPORT_PATTERNS,
            ],
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
        'src/**/*.error-boundary.tsx',
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
