import { TRIAL_SORT_EXPRESSIONS } from '@repo/eval-history/queries/queries.constants';
import { describe, expect, it } from 'vite-plus/test';

import { COLUMNS } from './EvalsRun.constants';

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
