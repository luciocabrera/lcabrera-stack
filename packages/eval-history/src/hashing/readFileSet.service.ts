import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { HashingFileSystem } from './hashing.types.ts';

const NODE_FILE_SYSTEM: HashingFileSystem = { readdir, readFile };

type ReadFileSetArgs = {
  readonly directory: string;
  readonly fileSystem?: HashingFileSystem;
};

export const readFileSet = async ({
  directory,
  fileSystem = NODE_FILE_SYSTEM,
}: ReadFileSetArgs) => {
  const entries = await fileSystem.readdir(directory, {
    recursive: true,
    withFileTypes: true,
  });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name));

  return Promise.all(
    files.map(async (file) => ({
      bytes: await fileSystem.readFile(file),
      path: path.relative(directory, file).split(path.sep).join('/'),
    })),
  );
};
