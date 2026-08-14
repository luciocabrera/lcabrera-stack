import { createCustomRulesLintConfig } from '@lcabrera/vite-config/eslint-custom-rules';

export default await createCustomRulesLintConfig({
  tsconfigRootDir: import.meta.dirname,
});
