import { fileURLToPath, URL } from 'node:url';

import { createFmtConfig } from '@repo/vite-configs/fmt';
import { createApiLintConfig } from '@repo/vite-configs/api-lint';
import { defineConfig } from 'vite-plus';

const fmtConfig = createFmtConfig();
const lintConfig = createApiLintConfig();

export default defineConfig({
  fmt: fmtConfig,
  lint: lintConfig,
  resolve: {
    alias: {
      '@repo/agent-runner': fileURLToPath(new URL('src', import.meta.url)),
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
});
