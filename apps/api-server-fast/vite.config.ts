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
      checkSafe: {
        command:
          'cd ../react-router && vp exec react-router typegen && cd ../../packages/eslint-local-rules && vp exec tsc -p tsconfig.json && cd ../../apps/api-server-fast && vp check && cd ../react-router && REACT_ROUTER_TEST_TASK=true vp exec vitest run --root .',
      },
    },
  },
});
