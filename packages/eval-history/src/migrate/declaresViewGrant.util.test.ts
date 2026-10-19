import { describe, expect, it } from 'vite-plus/test';

import { declaresViewGrant } from './declaresViewGrant.util.ts';
import { EVALS_READER_ROLE, EVALS_WRITER_ROLE } from './migrate.constants.ts';

describe('declaresViewGrant', () => {
  it('is true for a role whose grants name all views in a schema', () => {
    expect(declaresViewGrant(EVALS_READER_ROLE)).toBe(true);
  });

  it('is false for a role whose grants name no views target, though its table grant covers views', () => {
    expect(declaresViewGrant(EVALS_WRITER_ROLE)).toBe(false);
  });
});
