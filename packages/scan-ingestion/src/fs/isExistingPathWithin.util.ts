import { existsSync } from 'node:fs';

import { resolvePathWithin } from './resolvePathWithin.util.ts';

type IsExistingPathWithinArgs = {
  readonly baseDirectory: string;
  readonly targetPath: string;
};

/**
 * Existence check only after `resolvePathWithin` has proven the resolved
 * path cannot escape `baseDirectory`.
 */
export const isExistingPathWithin = ({
  baseDirectory,
  targetPath,
}: IsExistingPathWithinArgs): boolean => {
  const validatedPath = resolvePathWithin({ baseDirectory, targetPath });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- validatedPath is path.resolve'd and containment-checked against the trusted baseDirectory by resolvePathWithin above
  return existsSync(validatedPath);
};
