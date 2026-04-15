import { defineConfig } from 'vite-plus';
import { createApiLintConfig } from '../../config/vite.api-lint.shared.config.ts';
import { createFmtConfig } from '../../config/vite.fmt.shared.config.ts';

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
