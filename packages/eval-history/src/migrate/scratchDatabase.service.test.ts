import { describe, expect, it } from 'vite-plus/test';

import { scratchDatabase } from './scratchDatabase.service.ts';

describe('scratchDatabase', () => {
  it('points the client at the named database on the admin server', () => {
    const { connectionString } = scratchDatabase({
      adminUrl: 'postgres://evals:pw@db.local:5434/postgres',
      name: 'evals_scratch_1',
    });

    expect(connectionString).toBe(
      'postgres://evals:pw@db.local:5434/evals_scratch_1',
    );
  });
});
