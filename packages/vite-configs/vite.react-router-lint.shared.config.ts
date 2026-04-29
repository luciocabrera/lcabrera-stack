import type { OxlintConfig } from 'vite-plus/lint';

import { frontendLintSharedConfig } from './vite.frontend-lint.shared.config.ts';

export const reactRouterLintSharedConfig: OxlintConfig = {
  ...frontendLintSharedConfig,
  ignorePatterns: [
    '.react-router/',
    'build/',
    'out/',
    'dist/',
    'miscelanious/',
    'node_modules/',
    '../../packages/eslint-local-rules/',
    'guidelines/playwright_config.ts',
    'scripts/',
    'utils/',
    'src/utils/performance/renderTracker.util.ts',
  ],
  overrides: [
    ...(frontendLintSharedConfig.overrides ?? []),
    {
      files: [
        'src/root.tsx',
        'src/root/**/index.ts',
        'src/routes/**/index.tsx',
      ],
      rules: {
        'react/only-export-components': 'off',
      },
    },
  ],
};
