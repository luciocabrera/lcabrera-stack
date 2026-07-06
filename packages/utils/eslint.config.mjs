// Relative import (not '@repo/vite-configs/...'): vite-configs depends on
// this package, so declaring vite-configs back as a devDependency creates a
// workspace cycle that breaks every recursive `vp run -r` task graph.
import { createBaseCustomRulesLintConfig } from '../vite-configs/eslint.base-custom-rules.shared.config.mjs';

export default createBaseCustomRulesLintConfig({
  tsconfigRootDir: import.meta.dirname,
});
