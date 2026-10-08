import { describe, expect, it } from 'vite-plus/test';

import { EVALS_READER_ROLE } from './migrate.constants.ts';
import { ungrantedRoleLines } from './ungrantedRoleLines.util.ts';

describe('ungrantedRoleLines', () => {
  it('names the role, then each privilege it lacks on each object', () => {
    expect(
      ungrantedRoleLines({
        lacking: [
          { object: 'schema evals', privilege: 'usage' },
          { object: 'table evals.eval_run', privilege: 'select' },
        ],
        role: EVALS_READER_ROLE,
      }),
    ).toEqual([
      'evals:migrate: role evals_reader still lacks these privileges after the grant; run evals:migrate as the role that owns the evals objects:',
      '  usage on schema evals',
      '  select on table evals.eval_run',
    ]);
  });
});
