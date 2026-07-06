import { createApiLintConfig } from '@repo/vite-configs/api-lint';
import { createFmtConfig } from '@repo/vite-configs/fmt';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite-plus';

const fmtConfig = createFmtConfig();
const lintConfig = createApiLintConfig();

export default defineConfig({
  fmt: fmtConfig,
  lint: lintConfig,
  resolve: {
    alias: {
      '@repo/scan-ingestion': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
  run: {
    tasks: {
      test: {
        cache: false,
        command:
          'node --env-file-if-exists=../../docker/local/.env --env-file-if-exists=.env node_modules/vitest/vitest.mjs run',
      },
    },
  },
});
