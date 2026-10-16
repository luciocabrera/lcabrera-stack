import { describe, expect, it } from 'vite-plus/test';

import { databaseUrl } from './databaseUrl.util.ts';

const SERVER = 'postgres://admin@localhost:5432/postgres';

describe('databaseUrl', () => {
  it('keeps the URL it is given when asked for nothing else', () => {
    expect(databaseUrl({ url: SERVER })).toBe(SERVER);
  });

  it('points the URL at another database on the same server', () => {
    expect(databaseUrl({ database: 'scratch', url: SERVER })).toBe(
      'postgres://admin@localhost:5432/scratch',
    );
  });

  it('connects as another user with that user’s password', () => {
    expect(
      databaseUrl({
        database: 'scratch',
        password: 'secret',
        url: SERVER,
        user: 'reader',
      }),
    ).toBe('postgres://reader:secret@localhost:5432/scratch');
  });
});
