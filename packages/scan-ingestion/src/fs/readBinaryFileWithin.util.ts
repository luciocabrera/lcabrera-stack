import { readFileSync } from 'node:fs';

import { resolvePathWithin } from './resolvePathWithin.util.ts';

type ReadBinaryFileWithinArgs = {
  readonly baseDirectory: string;
  readonly targetPath: string;
};

/**
 * Reads a file as raw bytes, only after `resolvePathWithin` has proven the
 * resolved path cannot escape `baseDirectory`. The binary counterpart of
 * readTextFileWithin — used by the CLI archive packer (ADR-029), where a
 * utf-8 read would corrupt binary assets.
 */
export const readBinaryFileWithin = ({
  baseDirectory,
  targetPath,
}: ReadBinaryFileWithinArgs) => {
  const validatedPath = resolvePathWithin({ baseDirectory, targetPath });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- validatedPath is path.resolve'd and containment-checked against the trusted baseDirectory by resolvePathWithin above
  return new Uint8Array(readFileSync(validatedPath));
};
