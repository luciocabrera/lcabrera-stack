import { describe, expect, it } from 'vite-plus/test';

import { columnsNamed } from './columnsNamed.util.ts';
import { EXCLUDED_COLUMNS } from './queries.constants.ts';
import { runHealthQuery } from './runHealthQuery.util.ts';

const publicColumns = new Set([
  'eval_trial.error_class',
  'eval_trial.outcome',
  'eval_trial.run_id',
]);

const RUNS = ['00000000-0000-4000-8000-000000000001'];

describe('runHealthQuery', () => {
  const { text, values } = runHealthQuery({ publicColumns, runIds: RUNS });

  it('counts the errors and timeouts of the runs named by error class', () => {
    expect(values).toEqual([RUNS]);
    expect(text).toContain("and trial.outcome in ('error', 'timeout')");
    expect(text).toContain(
      'group by trial.run_id, trial.outcome, trial.error_class',
    );
  });

  it('reads no base table outside its projection', () => {
    expect(text).not.toMatch(/from evals\.\w+ (?!\))/u);
    expect(columnsNamed({ columns: EXCLUDED_COLUMNS, sql: text })).toEqual([]);
  });

  it('stops at an error class that is no longer public', () => {
    expect(() =>
      runHealthQuery({
        publicColumns: new Set(['eval_trial.outcome', 'eval_trial.run_id']),
        runIds: RUNS,
      }),
    ).toThrow(/error_class is not on the public allow-list/u);
  });
});
