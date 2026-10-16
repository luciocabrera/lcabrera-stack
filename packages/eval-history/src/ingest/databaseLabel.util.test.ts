import { describe, expect, it } from 'vite-plus/test';

import { databaseLabel } from './databaseLabel.util.ts';

describe('databaseLabel', () => {
  it('names host, port and database, never the credentials', () => {
    expect(
      databaseLabel('postgres://user:secret@db.example:6543/eval_history'),
    ).toBe('db.example:6543/eval_history');
  });

  it('falls back to the default port', () => {
    expect(databaseLabel('postgresql://user@localhost/evals')).toBe(
      'localhost:5432/evals',
    );
  });
});
