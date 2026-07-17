import { defineConfig } from 'vite-plus';

import { createFmtConfig } from '@repo/vite-configs/fmt';

const fmtConfig = createFmtConfig({
  ignorePatterns: ['.react-router/', 'build/', 'miscelanious/'],
});

export default defineConfig({
  fmt: fmtConfig,
  lint: { options: { typeAware: true, typeCheck: true } },
  run: {
    tasks: {
      build: {
        // Orchestrator — individual package tasks handle their own caching
        cache: false,
        command: 'vp run -r build',
      },
    },
  },
  staged: {
    '*': 'vp check --fix',
    // `vp check` is fmt + Oxlint + tsgolint and knows nothing about Biome, so
    // without this entry the Biome gate would only ever fail in CI — after the
    // commit it was supposed to block. Check-only on purpose: unlike the
    // `--fix` above, a Biome autofix here could rewrite a staged file after it
    // was reviewed, so a violation fails the commit and `vp run lint:biome`
    // applies the fix deliberately.
    '*.{ts,tsx,mjs,cjs}': 'biome lint --no-errors-on-unmatched',
  },
});
