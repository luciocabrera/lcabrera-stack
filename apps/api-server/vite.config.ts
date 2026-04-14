import { defineConfig } from 'vite-plus';
import { createApiLintConfig } from '../../config/vite.api-lint.shared.config.ts';

const lintConfig = createApiLintConfig();

export default defineConfig({
  lint: lintConfig,
  run: {
    tasks: {
      build: {
        command: 'tsc -p ../shared/tsconfig.json && tsc -p tsconfig.json',
        cache: true,
      },
    },
  },
});
