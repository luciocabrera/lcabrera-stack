import { createFmtConfig } from '@repo/vite-configs/fmt';
import { createApiLintConfig } from '@repo/vite-configs/api-lint';
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
        command: 'node node_modules/vitest/vitest.mjs run',
      },
    },
  },
});
