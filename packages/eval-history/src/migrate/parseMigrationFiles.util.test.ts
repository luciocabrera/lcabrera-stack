import { describe, expect, it } from 'vite-plus/test';

import { parseMigrationFiles } from './parseMigrationFiles.util.ts';

describe('parseMigrationFiles', () => {
  it('orders the SQL files by version and ignores other files', () => {
    const migrations = parseMigrationFiles([
      { bytes: 'b', path: '0010-later.sql' },
      { bytes: 'notes', path: 'README.md' },
      { bytes: 'a', path: '0002-earlier.sql' },
    ]);

    expect(migrations.map(({ name }) => name)).toEqual([
      '0002-earlier.sql',
      '0010-later.sql',
    ]);
  });

  it('rejects two files with one version', () => {
    expect(() =>
      parseMigrationFiles([
        { bytes: 'a', path: '0003-one.sql' },
        { bytes: 'b', path: '0003-two.sql' },
      ]),
    ).toThrow(/share version 3/);
  });
});
