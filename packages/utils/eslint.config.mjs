import { createBaseCustomRulesLintConfig } from '@lcabrera/vite-config/eslint-base-custom-rules';

export default [
  ...createBaseCustomRulesLintConfig({
    tsconfigRootDir: import.meta.dirname,
  }),
  {
    // @lcabrera/utils deliberately uses kebab-case for its `.util` files — the ONE
    // documented exception to the camelCase-for-function-modules convention
    // (see .claude/rules/typescript.md). Rather than turning the rule off, pass
    // its `suffixCase` option so a camelCase `.util` here still FAILS the gate:
    // the convention is asserted, not silenced (Non-Negotiable Rule 11).
    files: ['**/*.util.ts', '**/*.util.test.ts'],
    rules: {
      'local-rules/filename-convention': [
        'error',
        { suffixCase: { util: 'kebab-case' } },
      ],
    },
  },
];
