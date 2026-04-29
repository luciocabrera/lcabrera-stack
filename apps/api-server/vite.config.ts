import { defineConfig } from 'vite-plus';
import { createApiLintConfig } from '@repo/vite-configs/api-lint';
import { createFmtConfig } from '@repo/vite-configs/fmt';

const fmtConfig = createFmtConfig();
const lintConfig = createApiLintConfig();

export default defineConfig({
  fmt: fmtConfig,
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
