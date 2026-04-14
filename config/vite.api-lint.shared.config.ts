import type { OxlintConfig } from 'vite-plus/lint';

const LOCAL_RULES_SPECIFIER = '../../packages/eslint-local-rules/index.js';

/**
 * Shared lint configuration used by server-side TypeScript packages.
 */
export const createApiLintConfig = (): OxlintConfig => ({
  env: {
    builtin: true,
    es2026: true,
  },
  options: {
    typeAware: true,
    typeCheck: true,
  },
  overrides: [
    {
      env: {
        node: true,
      },
      files: ['**/*.ts'],
      jsPlugins: [
        {
          name: 'local-rules',
          specifier: LOCAL_RULES_SPECIFIER,
        },
      ],
      rules: {
        'local-rules/destructuring-for-functions': 'warn',
        'local-rules/merge-duplicate-imports': 'error',
        'local-rules/no-inline-type-imports': 'error',
        'local-rules/type-suffix-naming': 'error',
      },
    },
  ],
});
