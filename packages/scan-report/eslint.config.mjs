import { createBaseCustomRulesLintConfig } from '@lcabrera/vite-config/eslint-base-custom-rules';

export default createBaseCustomRulesLintConfig({
  tsconfigRootDir: import.meta.dirname,
});
