import { normalizeText } from './normalizeText.util.ts';
import { sha256Hex } from './sha256Hex.util.ts';

export const contentHash = (input: string | Uint8Array) =>
  sha256Hex(normalizeText(input));
