import type { HashedFile } from './hashing.types.ts';

import { compareCodeUnits } from './compareCodeUnits.util.ts';
import { contentHash } from './contentHash.util.ts';
import { sha256Hex } from './sha256Hex.util.ts';

export const fileSetHash = (files: readonly HashedFile[]) =>
  sha256Hex(
    files
      .map(({ bytes, path }) => `${path}\0${contentHash(bytes)}\n`)
      .toSorted(compareCodeUnits)
      .join(''),
  );
