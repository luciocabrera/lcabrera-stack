import { createCustomRulesLintConfig } from '@repo/vite-configs/eslint-custom-rules';

export default createCustomRulesLintConfig({
  tsconfigRootDir: import.meta.dirname,
});
