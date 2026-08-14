import { createCustomRulesLintConfig } from '@lcabrera/vite-config/eslint-custom-rules';
import {
  NODE_BUILTIN_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS,
  PG_DRIVER_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS,
} from '@lcabrera/vite-config/eslint-restrictions';

import {
  REPO_SERVER_ONLY_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS,
  UI_PUBLIC_IMPORT_BOUNDARY_PATTERNS,
} from '../../eslint.restrictions.repo.mjs';

export default await createCustomRulesLintConfig({
  publicImportBoundaryPatterns: UI_PUBLIC_IMPORT_BOUNDARY_PATTERNS,
  // One composed value, not three blocks: flat config replaces
  // `no-restricted-syntax` wholesale on a later match, so a second block would
  // silently drop the first one's restrictions.
  serverOnlySyntaxRestrictions: [
    ...NODE_BUILTIN_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS,
    ...REPO_SERVER_ONLY_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS,
    ...PG_DRIVER_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS,
  ],
  tsconfigRootDir: import.meta.dirname,
});
