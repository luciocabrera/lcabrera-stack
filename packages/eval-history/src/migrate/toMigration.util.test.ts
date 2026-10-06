import { describe, expect, it } from 'vite-plus/test';

import { contentHash } from '../hashing/contentHash.util.ts';
import { toMigration } from './toMigration.util.ts';

describe('toMigration', () => {
  it('takes the version from the file name and hashes the normalized text', () => {
    const migration = toMigration({
      bytes: new TextEncoder().encode('create table a ();\r\n'),
      path: '0007-add-a.sql',
    });

    expect(migration).toEqual({
      name: '0007-add-a.sql',
      sha256: contentHash('create table a ();\n'),
      sql: 'create table a ();\r\n',
      version: 7,
    });
  });

  it('accepts text bytes as they are', () => {
    expect(toMigration({ bytes: 'select 1;', path: '0001-one.sql' }).sql).toBe(
      'select 1;',
    );
  });

  it.each([
    '1-short.sql',
    '0001_underscore.sql',
    '0001-Upper.sql',
    'nested/0001-a.sql',
  ])('rejects %s and names it', (path) => {
    expect(() => toMigration({ bytes: '', path })).toThrow(path);
  });
});
