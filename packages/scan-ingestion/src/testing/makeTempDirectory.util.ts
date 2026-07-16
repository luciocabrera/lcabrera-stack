import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { canonicalRealPath } from '../fs/canonicalRealPath.util.ts';

/**
 * Test-only helper: creates a unique temp directory under the OS temp root
 * and returns its canonical (realpath'd) absolute path, so assertions
 * against paths the code under test canonicalizes compare equal.
 */
export const makeTempDirectory = (prefix: string): string => {
  const temporaryDirectory = mkdtempSync(path.join(tmpdir(), prefix));
  return canonicalRealPath(temporaryDirectory);
};
