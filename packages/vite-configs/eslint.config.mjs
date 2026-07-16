import { createBaseCustomRulesLintConfig } from './eslint.base-custom-rules.shared.config.mjs';

export default createBaseCustomRulesLintConfig({
  tsconfigRootDir: import.meta.dirname,
});
