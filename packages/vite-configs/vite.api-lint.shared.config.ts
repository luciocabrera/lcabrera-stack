import type { OxlintConfig } from 'vite-plus/lint';

import { createBaseLintConfig } from './vite.base-lint.shared.config.ts';

/**
 * Shared lint configuration used by server-side TypeScript packages.
 */
export const createApiLintConfig = (
  overrides: Parameters<typeof createBaseLintConfig>[0] = {},
): OxlintConfig => createBaseLintConfig(overrides);
