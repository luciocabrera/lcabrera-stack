/**
 * The eslint pass for `evals/`, the one code directory that is not a workspace.
 * Every other path is ignored, so a file outside every workspace that resolves
 * this config is not linted by it (ADR-135).
 */
import { createBaseCustomRulesLintConfig } from '@lcabrera/vite-config/eslint-base-custom-rules';

export default createBaseCustomRulesLintConfig({
  ignorePatterns: ['*', '!evals/'],
  toolingScriptPatterns: ['evals/**/*.mjs'],
  tsconfigRootDir: import.meta.dirname,
});
