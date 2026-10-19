import { describe, expect, it } from 'vite-plus/test';

import { EVALS_READER_ROLE, EVALS_WRITER_ROLE } from './migrate.constants.ts';
import { readsViews } from './readsViews.util.ts';

describe('readsViews', () => {
  it('is true for a role granted the views of a schema', () => {
    expect(readsViews(EVALS_READER_ROLE)).toBe(true);
  });

  it('is false for a role granted only tables', () => {
    expect(readsViews(EVALS_WRITER_ROLE)).toBe(false);
  });
});
