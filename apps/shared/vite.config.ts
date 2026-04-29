import { defineConfig } from 'vite-plus';
import { createApiLintConfig } from '@repo/vite-configs/api-lint';

const lintConfig = createApiLintConfig();

export default defineConfig({
  lint: lintConfig,
  run: {
    tasks: {
      build: {
        command: 'tsc -p tsconfig.json',
        cache: true,
      },
    },
  },
});
