import { createCustomRulesLintConfig } from '@repo/vite-configs/eslint-custom-rules';

export default await createCustomRulesLintConfig({
  enforceServerClientImportBoundary: true,
  enforceUiPublicImportBoundary: true,
  tsconfigRootDir: import.meta.dirname,
});
