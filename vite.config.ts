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
  },
});
