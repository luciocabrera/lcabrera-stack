import { createCustomRulesLintConfig } from '@lcabrera/vite-config/eslint-custom-rules';
import {
  NODE_BUILTIN_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS,
  PG_DRIVER_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS,
} from '@lcabrera/vite-config/eslint-restrictions';

import {
  REPO_SERVER_ONLY_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS,
  UI_PUBLIC_IMPORT_BOUNDARY_PATTERNS,
} from '../../eslint.restrictions.repo.mjs';

const baseConfig = await createCustomRulesLintConfig({
  ignorePatterns: ['src/components/Tooltip/Tooltip.stylex.ts'],
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

export default [
  ...baseConfig,
  {
    // security/detect-unsafe-regex guards against ReDoS on untrusted input;
    // the babel include pattern here only ever tests build-time file paths
    // (trusted, bounded), and safe-regex flags any "contains" lookahead, so
    // no equivalent rewrite can satisfy it. --no-inline-config forbids an
    // inline disable, hence this file-scoped override.
    files: ['config/vite.plugins.config.ts'],
    rules: { 'security/detect-unsafe-regex': 'off' },
  },
];
