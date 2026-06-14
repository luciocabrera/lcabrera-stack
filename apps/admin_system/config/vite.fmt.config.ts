import { createFmtConfig } from '@repo/vite-configs/fmt';

export const fmtConfig = createFmtConfig({
  ignorePatterns: [
    '.react-router/',
    'build/',
    'miscelanious/',
    '../../packages/eslint-local-rules/',
  ],
});
