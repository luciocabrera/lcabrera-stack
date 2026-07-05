import { createCustomRulesLintConfig } from '@repo/vite-configs/eslint-custom-rules';

export default await createCustomRulesLintConfig({
  tsconfigRootDir: import.meta.dirname,
});
