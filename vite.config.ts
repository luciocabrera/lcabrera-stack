import { defineConfig } from 'vite-plus';

import { createFmtConfig } from './config/vite.fmt.shared.config.ts';

const fmtConfig = createFmtConfig([
  '.react-router/',
  'build/',
  'miscelanious/',
]);

export default defineConfig({
  fmt: fmtConfig,
  lint: { options: { typeAware: true, typeCheck: true } },
  staged: {
    '*': 'vp check --fix',
  },
});
