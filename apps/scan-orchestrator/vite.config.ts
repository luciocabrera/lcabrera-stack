import { createApiLintConfig } from '@repo/vite-configs/api-lint';
import { createFmtConfig } from '@repo/vite-configs/fmt';
import { defineConfig } from 'vite-plus';

const fmtConfig = createFmtConfig();
const lintConfig = createApiLintConfig();

export default defineConfig({
  fmt: fmtConfig,
  lint: lintConfig,
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
