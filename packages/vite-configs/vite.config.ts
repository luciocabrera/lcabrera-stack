import { defineConfig } from 'vite-plus';

import { createFmtConfig } from './src/vite.fmt.shared.config.ts';
import { createPackConfig } from './src/vite.pack.shared.config.ts';
import { VITEST_COVERAGE_FLAGS } from './src/vite.run.shared.config.ts';

// Relative imports (not `@lcabrera/vite-config/...`): a package cannot resolve
// its own published subpaths through its own `exports` map without the self-link
// pnpm only creates for a dependency, and this is the package that defines them.
const packConfig = createPackConfig();

export default defineConfig({
  fmt: createFmtConfig(),
  pack: {
    ...packConfig,
    // The two ESLint flat configs and their restriction tables are `.mjs` —
    // flat config is JavaScript, and the TypeScript half of the lint stack is
    // `@lcabrera/eslint-plugin`. tsdown builds them alongside the `.ts`
    // factories; `allowJs` in the generated tsconfig is what makes it emit
    // their `.d.mts` too, without which each subpath resolves untyped and
    // `attw:verify` fails.
    entry: ['src/**/*.ts', 'src/**/*.mjs', '!src/**/*.test.ts'],
  },
  run: {
    tasks: {
      test: {
        cache: false,
        command: 'node node_modules/vitest/vitest.mjs run',
      },
      'test:coverage': {
        cache: false,
        command: `node node_modules/vitest/vitest.mjs run ${VITEST_COVERAGE_FLAGS}`,
      },
    },
  },
});
