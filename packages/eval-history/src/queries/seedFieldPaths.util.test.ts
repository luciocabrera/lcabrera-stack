import { describe, expect, it } from 'vite-plus/test';

import { compareCodeUnits } from '../hashing/compareCodeUnits.util.ts';
import { seedFieldPaths } from './seedFieldPaths.util.ts';

describe('seedFieldPaths', () => {
  it('names the free-string fields of a column that the allow-list leaves out', () => {
    expect(seedFieldPaths('eval_run.settings')).toEqual(['argv']);
    expect(seedFieldPaths('eval_run.env')).toEqual([]);
  });

  it('walks into the lists inside the trial detail', () => {
    expect(
      seedFieldPaths('eval_trial_detail.detail').toSorted(compareCodeUnits),
    ).toEqual([
      'dimensions[].feedback',
      'findings',
      'fixture',
      'init_tools',
      'problem',
      'summary',
    ]);
  });

  it('seeds nothing in a column whose fields all pass', () => {
    expect(seedFieldPaths('eval_run.totals')).toEqual([]);
  });
});
