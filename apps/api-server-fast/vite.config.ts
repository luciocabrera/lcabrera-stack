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
          'cd ../../apps/react-router && vp exec react-router typegen && cd ../../packages/eslint-local-rules && vp exec tsc -p tsconfig.json && cd ../.. && vp check && REACT_ROUTER_TEST_TASK=true node /home/lucio/workspaces/vite-react-compiler/apps/react-router/node_modules/vitest/vitest.mjs run --root /home/lucio/workspaces/vite-react-compiler/apps/react-router',
      },
    },
  },
});
