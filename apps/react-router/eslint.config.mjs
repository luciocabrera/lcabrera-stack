import { createCustomRulesLintConfig } from '@repo/vite-configs/eslint-custom-rules';

export default createCustomRulesLintConfig({
  ignorePatterns: ['src/components/Tooltip/Tooltip.stylex.ts'],
});
