import localRules from '@lcabrera/eslint-plugin';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  BARREL_SYNTAX_RESTRICTIONS,
  REACT_TYPE_IMPORT_PATHS,
  STATE_LIBRARY_IMPORT_PATTERNS,
  TEST_RUNNER_IMPORT_PATTERNS,
} from './eslint.restrictions.shared.mjs';
import {
  createNodeScriptFileConfig,
  SHARED_PLUGIN_RULE_SEVERITIES,
} from './eslint.rules.shared.mjs';

/**
 * The two restriction-table shapes this factory accepts. Declared here rather
 * than imported from the tables module: `vp pack` emits this file's `.d.mts`
 * from these annotations, and a cross-module `@typedef` does not survive that.
 *
 * @typedef {{ readonly message: string, readonly selector: string }} RestrictedSyntaxEntry
 *   One `no-restricted-syntax` entry: an ESLint selector and what to say.
 * @typedef {{ readonly group: readonly string[], readonly message: string }} RestrictedImportPattern
 *   One `no-restricted-imports` pattern entry: specifier globs and what to say.
 */

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
    const packageJson = workspaceRequire(packageJsonPath);
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

    return pathToFileURL(
      path.resolve(path.dirname(packageJsonPath), entryPoint),
    ).href;
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
  'node_modules/**',
  'scripts/**',
  'utils/**',
];

/**
 * The React/StyleX flat config, with the caller's own import boundaries mixed in.
 *
 * `publicImportBoundaryPatterns` and `serverOnlySyntaxRestrictions` are tables
 * rather than the on/off switches this took before publication: the tables they
 * used to switch on named `@lcabrera/ui` and `@lcabrera/server`, which no
 * consumer outside this repo has (ADR-069). Pass the generic tables from
 * `@lcabrera/vite-config/eslint-restrictions` composed with your own — a second
 * `no-restricted-syntax` block would replace this one's value wholesale.
 * Omitting `serverOnlySyntaxRestrictions` omits the server/client block
 * entirely, which is what a package with no client bundle wants.
 *
 * The annotations are load-bearing, not decoration: `vp pack` derives this
 * package's published `.d.mts` from them, and without them every array option
 * is inferred from its `[]` default as `never[]` — a type that rejects the one
 * thing a consumer is supposed to pass.
 *
 * @param {{
 *   ignorePatterns?: readonly string[],
 *   publicImportBoundaryPatterns?: readonly RestrictedImportPattern[],
 *   serverOnlySyntaxRestrictions?: readonly RestrictedSyntaxEntry[],
 *   tsconfigRootDir?: string,
 * }} [options]
 */
export const createCustomRulesLintConfig = async ({
  ignorePatterns = [],
  publicImportBoundaryPatterns = [],
  serverOnlySyntaxRestrictions = [],
  tsconfigRootDir = process.cwd(),
} = {}) => {
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
      linterOptions: {
        reportUnusedDisableDirectives: 'error',
      },
    },
    eslint.configs.recommended,
    security.configs.recommended,
    unicorn.configs.recommended,

    reactHooks.configs.flat.recommended,
    reactRefresh.configs.recommended,
    {
      files: ['**/root.ts', '**/root.tsx'],
      rules: {
        'react-refresh/only-export-components': 'off',
      },
    },
    reactX.configs['recommended-typescript'],
    reactDom.configs.recommended,

    perfectionist.configs['recommended-natural'],

    eslintConfigPrettier,

    ...(Array.isArray(tseslint.configs.recommended)
      ? tseslint.configs.recommended
      : [tseslint.configs.recommended]),

    {
      rules: {
        ...SHARED_PLUGIN_RULE_SEVERITIES,
        'react-x/set-state-in-effect': 'error',
      },
    },
    createNodeScriptFileConfig({ globals }),
    {
      ignores: [...GLOBAL_IGNORES, ...ignorePatterns],
    },
    {
      files: ['src/**/*.ts', 'src/**/*.tsx'],
      rules: {
        'no-restricted-syntax': ['error', ...BARREL_SYNTAX_RESTRICTIONS],
      },
    },
    ...(serverOnlySyntaxRestrictions.length > 0
      ? [
          {
            files: ['src/**/*.ts', 'src/**/*.tsx'],
            ignores: [
              'src/entry.server.tsx',
              'src/**/*.server.ts',
              'src/**/*.server.tsx',
              'src/**/.server/**',
            ],
            rules: {
              'no-restricted-syntax': [
                'error',
                ...serverOnlySyntaxRestrictions,
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
        'local-rules/domain-folder-filename': 'error',
        'local-rules/filename-convention': 'error',
        'local-rules/merge-duplicate-imports': 'error',
        'local-rules/no-explanatory-comments': 'error',
        'local-rules/no-habit-return-types': 'error',
        'local-rules/no-inline-type-imports': 'error',
        'local-rules/readonly-props': 'error',
        'local-rules/type-suffix-naming': 'error',
        'no-restricted-imports': [
          'error',
          {
            paths: REACT_TYPE_IMPORT_PATHS,
            patterns: [
              ...publicImportBoundaryPatterns,
              ...STATE_LIBRARY_IMPORT_PATTERNS,
              ...TEST_RUNNER_IMPORT_PATTERNS,
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
