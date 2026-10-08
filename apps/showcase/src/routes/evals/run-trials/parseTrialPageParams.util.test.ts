import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { describe, expect, it } from 'vite-plus/test';

import { EVALS_TRIALS_PAGE_LIMIT } from '../constants/evalsDashboard.constants';
import { parseTrialPageParams } from './parseTrialPageParams.util';

const parse = (query: string) =>
  parseTrialPageParams(new URLSearchParams(query));

describe('parseTrialPageParams', () => {
  it('reads the window and the sort the table client sends', () => {
    expect(
      parse(
        'limit=25&skip=50&sort=[{"columnKey":"durationMs","direction":"desc"}]',
      ),
    ).toEqual({
      limit: 25,
      offset: 50,
      sorting: [{ column: 'durationMs', direction: 'desc' }],
    });
  });

  it('falls back to the first page at the table page size', () => {
    expect(parse('')).toEqual({
      limit: INITIAL_PAGE_SIZE,
      offset: 0,
      sorting: [],
    });
  });

  it('clamps the window to the endpoint ceiling and to one row', () => {
    expect(parse('limit=999999').limit).toBe(EVALS_TRIALS_PAGE_LIMIT);
    expect(parse('limit=0').limit).toBe(1);
  });

  it('ignores a sort that is not a list', () => {
    expect(parse('sort={"durationMs":"desc"}').sorting).toEqual([]);
  });
});
