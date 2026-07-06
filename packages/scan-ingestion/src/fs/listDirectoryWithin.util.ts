import type { Dirent } from 'node:fs';

import { readdirSync } from 'node:fs';

import { resolvePathWithin } from './resolvePathWithin.util.ts';

type ListDirectoryWithinArgs = {
  readonly baseDirectory: string;
  readonly targetPath: string;
};

/**
 * Lists a directory (with file types) only after `resolvePathWithin` has
 * proven the resolved path cannot escape `baseDirectory`.
 */
export const listDirectoryWithin = ({
  baseDirectory,
  targetPath,
}: ListDirectoryWithinArgs): readonly Dirent[] => {
  const validatedPath = resolvePathWithin({ baseDirectory, targetPath });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- validatedPath is path.resolve'd and containment-checked against the trusted baseDirectory by resolvePathWithin above
  return readdirSync(validatedPath, { withFileTypes: true });
};
