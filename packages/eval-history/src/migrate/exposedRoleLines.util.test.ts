import { describe, expect, it } from 'vite-plus/test';

import { exposedRoleLines } from './exposedRoleLines.util.ts';
import { EVALS_READER_ROLE } from './migrate.constants.ts';

describe('exposedRoleLines', () => {
  it('says the migrations stay applied, then names each view and function', () => {
    const [heading, ...objects] = exposedRoleLines({
      definerFunctions: ['evals.probe'],
      definerViews: ['evals.v_a', 'evals.v_b'],
      role: EVALS_READER_ROLE,
    });

    expect(heading).toContain('role evals_reader');
    expect(heading).toContain(
      'The migrations above are applied and stay recorded',
    );
    expect(objects).toEqual([
      '  view evals.v_a without security_invoker',
      '  view evals.v_b without security_invoker',
      '  function evals.probe is security definer',
    ]);
  });
});
