import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite-plus';

import { fmtConfig } from './config/vite.fmt.config.ts';
import { lintConfig } from './config/vite.lint.config.ts';
import { pluginsConfig } from './config/vite.plugins.config.ts';

export default defineConfig({
  fmt: fmtConfig,
  lint: lintConfig,
  plugins: pluginsConfig,
  resolve: {
    alias: {
      // Self-referencing alias, same mechanism (and same reason) as every
      // consuming app's own '@repo/ui' resolve.alias entry — real Node
      // package-exports resolution doesn't apply here (no exports map;
      // ADR-003), and tsconfig `paths` alone only helps tsc/editors, not
      // Vite/Vitest's own bundler-level resolution.
      '@repo/ui': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
  run: {
    tasks: {
      test: {
        cache: false,
        command: 'node node_modules/vitest/vitest.mjs run',
      },
    },
  },
  test: {
    setupFiles: ['./src/utils/tests/vitest.setup.ts'],
  },
});
