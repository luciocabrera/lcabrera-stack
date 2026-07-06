import { readFileSync } from 'node:fs';

import { resolvePathWithin } from './resolvePathWithin.util.ts';

type ReadTextFileWithinArgs = {
  readonly baseDirectory: string;
  readonly targetPath: string;
};

/**
 * Reads a UTF-8 text file only after `resolvePathWithin` has proven the
 * resolved path cannot escape `baseDirectory`.
 */
export const readTextFileWithin = ({
  baseDirectory,
  targetPath,
}: ReadTextFileWithinArgs): string => {
  const validatedPath = resolvePathWithin({ baseDirectory, targetPath });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- validatedPath is path.resolve'd and containment-checked against the trusted baseDirectory by resolvePathWithin above
  return readFileSync(validatedPath, 'utf8');
};
