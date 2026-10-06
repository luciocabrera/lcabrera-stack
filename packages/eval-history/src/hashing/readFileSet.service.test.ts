import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import type { HashingFileSystem } from './hashing.types.ts';

import { readFileSet } from './readFileSet.service.ts';

const root = path.join(path.sep, 'skills', 'alpha');

type EntryArgs = {
  readonly file?: boolean;
  readonly name: string;
  readonly parentPath: string;
};

const entry = ({ file = true, name, parentPath }: EntryArgs) => ({
  isFile: () => file,
  name,
  parentPath,
});

const fakeFileSystem: HashingFileSystem = {
  readdir: async () => [
    entry({ name: 'SKILL.md', parentPath: root }),
    entry({ file: false, name: 'references', parentPath: root }),
    entry({
      name: 'note.md',
      parentPath: path.join(root, 'references', 'deep'),
    }),
  ],
  readFile: async (file) => new TextEncoder().encode(`bytes of ${file}`),
};

describe('readFileSet', () => {
  it('reads every file below the directory with a forward-slash relative path', async () => {
    const files = await readFileSet({
      directory: root,
      fileSystem: fakeFileSystem,
    });

    expect(files.map(({ path: file }) => file)).toEqual([
      'SKILL.md',
      'references/deep/note.md',
    ]);
    expect(new TextDecoder().decode(files[0]?.bytes)).toBe(
      `bytes of ${path.join(root, 'SKILL.md')}`,
    );
  });

  it('reads the real file system by default', async () => {
    const directory = fileURLToPath(new URL('.', import.meta.url));
    const files = await readFileSet({ directory });

    expect(files.map(({ path: file }) => file)).toContain(
      'readFileSet.service.test.ts',
    );
  });
});
