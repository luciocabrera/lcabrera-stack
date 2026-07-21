import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import perfectionist from 'eslint-plugin-perfectionist';
import security from 'eslint-plugin-security';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import localRules from '../eslint-local-rules/index.js';

// Generic (non-React) variant of eslint.custom-rules.shared.config.mjs for
// API servers, node services, and library packages: same core stack and
// local architectural rules, without the React/StyleX layers. Plugins here
// are static imports resolved from @repo/vite-configs' own node_modules —
// consuming workspaces only need `eslint` itself.
const GLOBAL_IGNORES = [
  '.react-router/**',
  'build/**',
  'coverage/**',
  'dist/**',
  'miscelanious/**',
  'node_modules/**',
  'scripts/**',
];

const createTypescriptLanguageOptions = (tsconfigRootDir) => ({
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  parserOptions: {
    sourceType: 'module',
    tsconfigRootDir,
  },
});

export const createBaseCustomRulesLintConfig = ({
  ignorePatterns = [],
  tsconfigRootDir = process.cwd(),
} = {}) => {
  return [
    {
      // A directive that suppresses nothing is worse than no directive: it
      // reports zero findings, exactly like compliant code, while its `--`
      // comment keeps describing a problem that no longer exists. Thirteen had
      // accumulated across the repo, four of them claiming to hold back
      // `no-console` in a logger that no rule was flagging.
      //
      // This WAS off, for a real reason: Oxlint honours `eslint-disable`
      // comments too, so a directive eslint calls "unused" may be the only
      // thing suppressing an Oxlint finding of the same name — and `--fix`
      // would silently delete it. Five such directives existed, spelled
      // `typescript-eslint/unbound-method` (no `@`, which eslint does not
      // recognise but Oxlint does).
      //
      // Those five now say `oxlint-disable-next-line`, which names the engine
      // that actually consumes them, and every workspace verifies clean. The
      // ambiguity that made this unsafe is therefore what the rule now
      // enforces: `eslint-disable` is for ESLint findings, `oxlint-disable` for
      // Oxlint's. "Unused" means the directive is either dead (delete it) or an
      // Oxlint directive wearing the wrong name (respell it).
      linterOptions: {
        reportUnusedDisableDirectives: 'error',
      },
    },
    // 1. Core ESLint
    eslint.configs.recommended,
    security.configs.recommended,
    unicorn.configs.recommended,

    // 2. Sorting (Perfectionist)
    perfectionist.configs['recommended-natural'],

    // 3. Formatting (Prettier - must be last to disable conflicts)
    eslintConfigPrettier,

    ...(Array.isArray(tseslint.configs.recommended)
      ? tseslint.configs.recommended
      : [tseslint.configs.recommended]),

    {
      rules: {
        // Escalated from the plugin's default `warn` so the bulk-suppression
        // baseline (eslint-suppressions.json) covers the inherited findings
        // and NEW occurrences fail the gate (suppressions only apply to
        // error-severity rules).
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
        // Its auto-fixer rewrites http:// to https:// inside string literals,
        // which silently corrupts test fixtures and local-dev URLs (a fixture
        // asserting that an http origin is rejected became https and the test
        // inverted). Localhost/dev URLs in this repo are legitimate http.
        'unicorn/prefer-https': 'off',
        'unicorn/prefer-query-selector': 'off',
        'unicorn/prevent-abbreviations': 'off',
      },
    },
    // 4. JavaScript files configuration (Node.js config/tooling files)
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
    // 5. TypeScript sources + local architectural rules
    {
      files: ['**/*.ts', '**/*.tsx'],
      languageOptions: createTypescriptLanguageOptions(tsconfigRootDir),
      plugins: {
        '@typescript-eslint': tseslint.plugin,
        'local-rules': localRules,
        'typescript-eslint': tseslint.plugin,
      },
      rules: {
        '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
        'func-style': ['error', 'expression'],
        // clean-import-paths strips import extensions — a bundler-resolution
        // convention. Base-factory workspaces run TS natively (node
        // --experimental-strip-types) or compile with tsc NodeNext, where
        // explicit .ts/.js extensions are REQUIRED. Never enable it here.
        'local-rules/destructuring-for-functions': 'error',
        'local-rules/filename-convention': 'error',
        'local-rules/merge-duplicate-imports': 'error',
        'local-rules/no-inline-type-imports': 'error',
        'local-rules/type-suffix-naming': 'error',
      },
    },
  ];
};
