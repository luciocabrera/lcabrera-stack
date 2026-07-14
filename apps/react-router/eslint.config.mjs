import { createCustomRulesLintConfig } from '@repo/vite-configs/eslint-custom-rules';

const baseConfig = await createCustomRulesLintConfig({
  enforceUiPublicImportBoundary: true,
  ignorePatterns: ['src/components/Tooltip/Tooltip.stylex.ts'],
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
