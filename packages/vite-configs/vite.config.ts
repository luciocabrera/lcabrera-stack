import { defineConfig } from 'vite-plus';

import { createPackConfig } from './src/vite.pack.shared.config.ts';
import { VITEST_COVERAGE_FLAGS } from './src/vite.run.shared.config.ts';

const packConfig = createPackConfig();

export default defineConfig({
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
        command: 'vp test run',
      },
      'test:coverage': {
        cache: false,
        command: `vp test run ${VITEST_COVERAGE_FLAGS}`,
      },
    },
  },
});
