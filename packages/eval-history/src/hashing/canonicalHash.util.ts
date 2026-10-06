import { canonicalJson } from './canonicalJson.util.ts';
import { contentHash } from './contentHash.util.ts';

export const canonicalHash = (value: unknown) =>
  contentHash(canonicalJson(value));
