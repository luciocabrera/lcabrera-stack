import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
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

const UI_PUBLIC_IMPORT_BOUNDARY_PATTERNS = [
  {
    group: ['@repo/ui/src/**'],
    message:
      'Do not import from @repo/ui source internals. Use @repo/ui public exports or supported subpaths.',
  },
  {
    group: ['@repo/ui/**/index', '@repo/ui/**/index.*'],
    message:
      'Do not import @repo/ui index files directly. Use the folder path or @repo/ui root exports.',
  },
  {
    group: [
      '@repo/ui/**/*.component',
      '!@repo/ui/components/Settings/Settings.component',
    ],
    message:
      'Do not import component implementation files directly from @repo/ui. Import from @repo/ui root exports or component barrels.',
  },
];

// Runtime database access is server-only. Match the whole `@repo/server/db`
// import path — not individual utils, which drift as they are added and removed —
// plus the raw `pg` driver, and cover both direct imports and barrel re-exports.
// Type-only imports are erased at compile time, so they stay allowed (e.g. the
// `query-builder.types` the pure `db/query-builder/*` builders share); the guard is
// on runtime access, which is what pulls the DB connection into the bundle.
const SERVER_ONLY_DB_MESSAGE =
  'Direct database access is server-only (the pg driver and @repo/server/db runtime helpers). Move this import to a `.server.ts` file or a `.server/` directory — or reach it through a server-only module.';

const DB_IMPORT_BOUNDARY_RESTRICTIONS = [
  'ImportDeclaration',
  'ExportAllDeclaration',
  'ExportNamedDeclaration',
].flatMap((declaration) => {
  const kind =
    declaration === 'ImportDeclaration' ? 'importKind' : 'exportKind';

  return [
    String.raw`${declaration}[${kind}!='type'][source.value=/^@repo\/server\/db\//]`,
    `${declaration}[${kind}!='type'][source.value='pg']`,
  ].map((selector) => ({ message: SERVER_ONLY_DB_MESSAGE, selector }));
});

const CLIENT_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS = [
  {
    message:
      'Node built-ins are server-only. Move this import/export to server files.',
    selector: 'ExportAllDeclaration[source.value=/^node:/]',
  },
  {
    message:
      'Node built-ins are server-only. Move this import/export to server files.',
    selector: 'ExportNamedDeclaration[source.value=/^node:/]',
  },
  {
    message:
      'Node built-ins are server-only. Move this import/export to server files.',
    selector: 'ImportDeclaration[source.value=/^node:/]',
  },
  {
    message:
      'Server-only UI helpers must be imported via @repo/ui/server from server entry files only.',
    selector:
      "ImportDeclaration[source.value='@repo/ui/entry/createHandleRequest.util']",
  },
  {
    message:
      'The @repo/ui/server entrypoint is server-only and must not be imported from client/shared files.',
    selector: "ImportDeclaration[source.value='@repo/ui/server']",
  },
  ...DB_IMPORT_BOUNDARY_RESTRICTIONS,
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
        'local-rules/type-suffix-naming': 'error',
        ...(enforceUiPublicImportBoundary && {
          'no-restricted-imports': [
            'error',
            {
              patterns: UI_PUBLIC_IMPORT_BOUNDARY_PATTERNS,
            },
          ],
        }),
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
