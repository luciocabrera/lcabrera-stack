import { createCustomRulesLintConfig } from '@repo/vite-configs/eslint-custom-rules';

export default await createCustomRulesLintConfig({
  ignorePatterns: ['src/components/Tooltip/Tooltip.stylex.ts'],
  tsconfigRootDir: import.meta.dirname,
});
