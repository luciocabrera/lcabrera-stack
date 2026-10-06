import { sortedKeysReplacer } from './sortedKeysReplacer.util.ts';

export const canonicalJson = (value: unknown) =>
  JSON.stringify(value, sortedKeysReplacer);
