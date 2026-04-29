import type { OxlintConfig } from 'vite-plus/lint';

import { baseLintSharedConfig } from './vite.base-lint.shared.config.ts';

/**
 * Shared lint configuration used by server-side TypeScript packages.
 */
export const createApiLintConfig = (): OxlintConfig => ({
  ...baseLintSharedConfig,
});
