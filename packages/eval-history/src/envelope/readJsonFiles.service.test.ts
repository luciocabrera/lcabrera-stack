import { describe, expect, it } from 'vite-plus/test';

import type { HashingFileSystem } from '../hashing/hashing.types.ts';

import { readJsonFiles } from './readJsonFiles.service.ts';

const fakeFileSystem: HashingFileSystem = {
  readdir: async () => [
    { isFile: () => true, name: 'a.json', parentPath: '/data' },
    { isFile: () => true, name: 'notes.md', parentPath: '/data' },
  ],
  readFile: async (file) =>
    new TextEncoder().encode(file.endsWith('.json') ? '{"ok":true}' : '#'),
};

describe('readJsonFiles', () => {
  it('parses every JSON file below the directory, keyed by relative path', async () => {
    const files = await readJsonFiles({
      directory: '/data',
      fileSystem: fakeFileSystem,
    });

    expect([...files]).toEqual([['a.json', { ok: true }]]);
  });
});
