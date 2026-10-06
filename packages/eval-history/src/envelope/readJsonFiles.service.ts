import type { HashingFileSystem } from '../hashing/hashing.types.ts';

import { readFileSet } from '../hashing/readFileSet.service.ts';

type ReadJsonFilesArgs = {
  readonly directory: string;
  readonly fileSystem?: HashingFileSystem;
};

export const readJsonFiles = async (args: ReadJsonFilesArgs) => {
  const files = await readFileSet(args);
  const decoder = new TextDecoder();

  return new Map(
    files
      .filter(({ path }) => path.endsWith('.json'))
      .map(({ bytes, path }): readonly [string, unknown] => [
        path,
        JSON.parse(typeof bytes === 'string' ? bytes : decoder.decode(bytes)),
      ]),
  );
};
