import path from 'node:path';

import type { IngestFileSystem } from './ingest.types.ts';

import { compareCodeUnits } from '../hashing/compareCodeUnits.util.ts';
import { ENVELOPE_FILE_PATTERN } from './ingest.constants.ts';

type FindArgs = {
  readonly fileSystem: Pick<IngestFileSystem, 'readdir' | 'stat'>;
  readonly target: string;
};

type FindEnvelopeFilesArgs = Omit<FindArgs, 'target'> & {
  readonly paths: readonly string[];
};

const envelopesUnder = async ({ fileSystem, target }: FindArgs) => {
  const entries = await fileSystem.readdir(target, {
    recursive: true,
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isFile() && ENVELOPE_FILE_PATTERN.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .toSorted(compareCodeUnits);
};

const statOf = async ({ fileSystem, target }: FindArgs) => {
  try {
    const stats = await fileSystem.stat(target);

    return { exists: true, isFile: stats.isFile() } as const;
  } catch {
    return { exists: false, isFile: false } as const;
  }
};

const filesAt = async (args: FindArgs) => {
  const stats = await statOf(args);

  if (!stats.exists) {
    return { files: [], missing: [args.target] };
  }

  return {
    files: stats.isFile ? [args.target] : await envelopesUnder(args),
    missing: [],
  };
};

export const findEnvelopeFiles = async ({
  fileSystem,
  paths,
}: FindEnvelopeFilesArgs) => {
  const found = await Promise.all(
    paths.map((target) => filesAt({ fileSystem, target })),
  );

  return {
    files: [...new Set(found.flatMap(({ files }) => files))],
    missing: found.flatMap(({ missing }) => missing),
  };
};
