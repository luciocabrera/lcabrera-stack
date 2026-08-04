// Relative import (not '@repo/vite-configs/...'): vite-configs now depends on
// this package for the rules themselves, so declaring vite-configs back as a
// devDependency would create a workspace cycle that breaks every recursive
// `vp run -r` task graph. @lcabrera/utils resolves the same cycle the same way.
//
// `ignorePatterns: ['index.js']` used to sit here for the hand-written runtime
// forwarder that re-exported the compiled plugin. `vp pack` replaced it, and
// `dist` is already in the shared ignore list.
import { createBaseCustomRulesLintConfig } from '../vite-configs/eslint.base-custom-rules.shared.config.mjs';

export default createBaseCustomRulesLintConfig({
  tsconfigRootDir: import.meta.dirname,
});
