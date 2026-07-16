import { createBaseCustomRulesLintConfig } from '@repo/vite-configs/eslint-base-custom-rules';

export default createBaseCustomRulesLintConfig({
  tsconfigRootDir: import.meta.dirname,
});
