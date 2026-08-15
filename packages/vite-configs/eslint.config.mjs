import { createBaseCustomRulesLintConfig } from './src/eslint.base-custom-rules.shared.config.mjs';

export default createBaseCustomRulesLintConfig({
  tsconfigRootDir: import.meta.dirname,
});
