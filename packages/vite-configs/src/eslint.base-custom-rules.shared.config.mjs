import eslint from '@eslint/js';
import localRules from '@lcabrera/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import perfectionist from 'eslint-plugin-perfectionist';
import security from 'eslint-plugin-security';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { TEST_RUNNER_IMPORT_PATTERNS } from './eslint.restrictions.shared.mjs';
import {
  createNodeScriptFileConfig,
  SHARED_PLUGIN_RULE_SEVERITIES,
} from './eslint.rules.shared.mjs';

const GLOBAL_IGNORES = [
  '.react-router/**',
  'build/**',
  'coverage/**',
  'dist/**',
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

/**
 * The annotation is load-bearing, not decoration: `vp pack` derives this
 * package's published `.d.mts` from it, and without it `ignorePatterns` is
 * inferred from its `[]` default as `never[]` — a type that rejects every value
 * a consumer would pass.
 *
 * @param {{
 *   ignorePatterns?: readonly string[],
 *   tsconfigRootDir?: string,
 * }} [options]
 */
export const createBaseCustomRulesLintConfig = ({
  ignorePatterns = [],
  tsconfigRootDir = process.cwd(),
} = {}) => {
  return [
    {
      linterOptions: {
        reportUnusedDisableDirectives: 'error',
      },
    },
    eslint.configs.recommended,
    security.configs.recommended,
    unicorn.configs.recommended,

    perfectionist.configs['recommended-natural'],

    eslintConfigPrettier,

    ...(Array.isArray(tseslint.configs.recommended)
      ? tseslint.configs.recommended
      : [tseslint.configs.recommended]),

    { rules: { ...SHARED_PLUGIN_RULE_SEVERITIES } },
    createNodeScriptFileConfig({ globals }),
    {
      ignores: [...GLOBAL_IGNORES, ...ignorePatterns],
    },
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
        'local-rules/destructuring-for-functions': 'error',
        'local-rules/domain-folder-filename': 'error',
        'local-rules/filename-convention': 'error',
        'local-rules/merge-duplicate-imports': 'error',
        'local-rules/no-explanatory-comments': 'error',
        'local-rules/no-habit-return-types': 'error',
        'local-rules/no-inline-type-imports': 'error',
        'local-rules/type-suffix-naming': 'error',
        'no-restricted-imports': [
          'error',
          { patterns: [...TEST_RUNNER_IMPORT_PATTERNS] },
        ],
      },
    },
  ];
};
