/**
 * The eslint pass for `evals/`, a code directory outside every workspace.
 * Every other path is ignored, root `scripts/` included, so a file outside every workspace that resolves
 * this config is not linted by it (ADR-136).
 */
import { createBaseCustomRulesLintConfig } from '@lcabrera/vite-config/eslint-base-custom-rules';

export default createBaseCustomRulesLintConfig({
  ignorePatterns: ['*', '!evals/'],
  toolingScriptPatterns: ['evals/**/*.mjs'],
  tsconfigRootDir: import.meta.dirname,
});
