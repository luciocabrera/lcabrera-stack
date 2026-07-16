import { mkdirSync } from 'node:fs';

import { resolvePathWithin } from './resolvePathWithin.util.ts';

type MakeDirectoryWithinArgs = {
  readonly baseDirectory: string;
  readonly targetPath: string;
};

/**
 * Recursively creates a directory only after `resolvePathWithin` has proven
 * the resolved path cannot escape `baseDirectory`. Returns the validated
 * absolute path of the created directory.
 */
export const makeDirectoryWithin = ({
  baseDirectory,
  targetPath,
}: MakeDirectoryWithinArgs): string => {
  const validatedPath = resolvePathWithin({ baseDirectory, targetPath });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- validatedPath is path.resolve'd and containment-checked against the trusted baseDirectory by resolvePathWithin above
  mkdirSync(validatedPath, { recursive: true });
  return validatedPath;
};
