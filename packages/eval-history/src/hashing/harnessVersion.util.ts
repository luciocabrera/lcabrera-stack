import type { HashedFile } from './hashing.types.ts';

import { fileSetHash } from './fileSetHash.util.ts';
import { HARNESS_VERSION_LENGTH } from './hashing.constants.ts';

export const harnessVersion = (files: readonly HashedFile[]) =>
  fileSetHash(files).slice(0, HARNESS_VERSION_LENGTH);
