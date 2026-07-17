import { defineConfig } from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      build: {
        cache: true,
        command: 'tsc -p tsconfig.build.json',
        // Exclude emitted JS from the input fingerprint — tsc writes to build/,
        // and tracking its own output as an input causes guaranteed cache misses.
        input: [{ auto: true }, '!build/**'],
      },
      test: {
        cache: false,
        command: 'node node_modules/vitest/vitest.mjs run --passWithNoTests',
      },
    },
  },
});
