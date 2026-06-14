import { defineConfig } from 'vite-plus';

import { createFmtConfig } from '@repo/vite-configs/fmt';

const fmtConfig = createFmtConfig({
  ignorePatterns: ['.react-router/', 'build/', 'miscelanious/'],
});

export default defineConfig({
  fmt: fmtConfig,
  lint: { options: { typeAware: true, typeCheck: true } },
  staged: {
    '*': 'vp check --fix',
  },
});
