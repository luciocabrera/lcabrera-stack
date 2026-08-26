import { createFmtConfig } from '@lcabrera/vite-config/fmt';

export const fmtConfig = createFmtConfig({
  ignorePatterns: [
    '.react-router/',
    'build/',
    '../../packages/eslint-local-rules/',
  ],
});
