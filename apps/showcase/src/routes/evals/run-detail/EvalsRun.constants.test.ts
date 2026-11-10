import { TRIAL_SORT_EXPRESSIONS } from '@repo/eval-history/queries/queries.constants';
import { describe, expect, it } from 'vite-plus/test';

import { routeMatch } from '../utils/pageHeader.fixtures';
import { COLUMNS, EVALS_RUN_HANDLE } from './EvalsRun.constants';

describe('the trial table columns', () => {
  it('offers sorting only on a column the trial query can order by', () => {
    const sortable = COLUMNS.filter(({ isSortable }) => isSortable !== false);

    expect(
      sortable
        .map(({ key }) => String(key))
        .filter((key) => !Object.hasOwn(TRIAL_SORT_EXPRESSIONS, key)),
    ).toEqual([]);
    expect(sortable.length).toBeGreaterThan(0);
  });
});

describe('the run page breadcrumb', () => {
  it('names the run the route matched, after a link to the overview', () => {
    expect(
      EVALS_RUN_HANDLE.breadcrumb(
        routeMatch({ params: { runId: 'r1' }, pathname: '/evals/runs/r1' }),
      ),
    ).toEqual([{ label: 'Evals', to: '/evals' }, { label: 'run r1' }]);
  });

  it('names no run when the route matched none', () => {
    expect(
      EVALS_RUN_HANDLE.breadcrumb(routeMatch({ params: {}, pathname: '/' }))[1],
    ).toEqual({
      label: 'run ',
    });
  });
});
