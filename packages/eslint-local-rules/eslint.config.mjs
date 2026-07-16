import { createBaseCustomRulesLintConfig } from '@repo/vite-configs/eslint-base-custom-rules';

export default createBaseCustomRulesLintConfig({
  ignorePatterns: ['index.js'],
  tsconfigRootDir: import.meta.dirname,
});
