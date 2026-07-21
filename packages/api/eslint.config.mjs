import { createBaseCustomRulesLintConfig } from '@repo/vite-configs/eslint-base-custom-rules';

export default [
  ...createBaseCustomRulesLintConfig({
    tsconfigRootDir: import.meta.dirname,
  }),
  {
    // @repo/api uses kebab-case for its `.util` files, matching @repo/utils —
    // the public-package convention. Rather than turning the rule off, pass its
    // `suffixCase` option so a camelCase `.util` here still FAILS the gate: the
    // convention is asserted, not silenced (Non-Negotiable Rule 11).
    files: ['**/*.util.ts', '**/*.util.test.ts'],
    rules: {
      'local-rules/filename-convention': [
        'error',
        { suffixCase: { util: 'kebab-case' } },
      ],
    },
  },
];
