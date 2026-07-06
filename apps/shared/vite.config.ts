import { createApiLintConfig } from '@repo/vite-configs/api-lint';
import { defineConfig } from 'vite-plus';

const lintConfig = createApiLintConfig();

export default defineConfig({
  lint: lintConfig,
  run: {
    tasks: {
      build: {
        cache: true,
        command: 'tsc -p tsconfig.json',
      },
      test: {
        cache: false,
        command: 'node node_modules/vitest/vitest.mjs run',
      },
    },
  },
  test: {
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
