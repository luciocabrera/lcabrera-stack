import { createFmtConfig } from '../../../config/vite.fmt.shared.config.ts';

export const fmtConfig = createFmtConfig([
  '.react-router/',
  'build/',
  'miscelanious/',
  '../../packages/eslint-local-rules/',
]);
