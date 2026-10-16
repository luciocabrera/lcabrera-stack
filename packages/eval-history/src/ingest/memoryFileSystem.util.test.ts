import { describe, expect, it } from 'vite-plus/test';

import { memoryFileSystem } from './memoryFileSystem.util.ts';

const fileSystem = memoryFileSystem({ '/runs/skills/a.json': '{}' });

describe('memoryFileSystem', () => {
  it('lists the files under a directory', async () => {
    const [entry] = await fileSystem.readdir('/runs');

    expect([entry?.name, entry?.parentPath, entry?.isFile()]).toEqual([
      'a.json',
      '/runs/skills',
      true,
    ]);
  });

  it('tells a file from a directory and reads a file', async () => {
    const file = await fileSystem.stat('/runs/skills/a.json');
    const directory = await fileSystem.stat('/runs');
    const bytes = await fileSystem.readFile('/runs/skills/a.json');

    expect([file.isFile(), directory.isFile()]).toEqual([true, false]);
    expect(new TextDecoder().decode(bytes)).toBe('{}');
  });

  it('throws ENOENT for a path it does not hold', async () => {
    await expect(fileSystem.stat('/absent')).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(fileSystem.readFile('/absent')).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });
});
