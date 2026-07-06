import { writeFileSync } from 'node:fs';

import { resolvePathWithin } from './resolvePathWithin.util.ts';

type WriteTextFileWithinArgs = {
  readonly baseDirectory: string;
  readonly content: string;
  readonly targetPath: string;
};

/**
 * Writes a UTF-8 text file only after `resolvePathWithin` has proven the
 * resolved path cannot escape `baseDirectory`.
 */
export const writeTextFileWithin = ({
  baseDirectory,
  content,
  targetPath,
}: WriteTextFileWithinArgs): void => {
  const validatedPath = resolvePathWithin({ baseDirectory, targetPath });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- validatedPath is path.resolve'd and containment-checked against the trusted baseDirectory by resolvePathWithin above
  writeFileSync(validatedPath, content, 'utf8');
};
