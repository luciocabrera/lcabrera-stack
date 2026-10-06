import path from 'node:path';
import { describe, expect, it } from 'vite-plus/test';

import type { HashingFileSystem } from '../hashing/hashing.types.ts';

import { readMigrations } from './readMigrations.service.ts';

describe('readMigrations', () => {
  it('reads the package migrations, starting with the schema', async () => {
    const migrations = await readMigrations();

    expect(migrations[0]?.name).toBe('0001-schema.sql');
    expect(migrations.map(({ version }) => version)).toEqual(
      migrations.map((_, index) => index + 1),
    );
  });

  it('reads another directory through the given file system', async () => {
    const directory = path.join(path.sep, 'migrations');
    const fileSystem: HashingFileSystem = {
      readdir: async () => [
        { isFile: () => true, name: '0001-only.sql', parentPath: directory },
      ],
      readFile: async () => new TextEncoder().encode('select 1;'),
    };

    expect(await readMigrations({ directory, fileSystem })).toEqual([
      expect.objectContaining({ name: '0001-only.sql', sql: 'select 1;' }),
    ]);
  });
});
