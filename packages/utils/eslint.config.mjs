// Relative import (not '@repo/vite-configs/...'): vite-configs depends on
// this package, so declaring vite-configs back as a devDependency creates a
// workspace cycle that breaks every recursive `vp run -r` task graph.
import { createBaseCustomRulesLintConfig } from '../vite-configs/eslint.base-custom-rules.shared.config.mjs';

export default [
  ...createBaseCustomRulesLintConfig({
    tsconfigRootDir: import.meta.dirname,
  }),
  {
    // @repo/utils deliberately uses kebab-case for its `.util` files — it is
    // the ONE documented exception to the camelCase-for-function-modules
    // convention that `local-rules/filename-convention` enforces everywhere
    // else (see .claude/rules/typescript.md). This is a convention choice, not
    // a silenced finding.
    files: ['**/*.util.ts', '**/*.util.test.ts'],
    rules: {
      'local-rules/filename-convention': 'off',
    },
  },
];
