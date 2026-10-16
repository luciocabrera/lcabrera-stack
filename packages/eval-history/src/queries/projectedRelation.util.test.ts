import { describe, expect, it } from 'vite-plus/test';

import { projectedRelation } from './projectedRelation.util.ts';

const publicColumns = new Set(['eval_run.run_id', 'eval_run.suite']);

describe('projectedRelation', () => {
  it('selects the public columns of one base table', () => {
    expect(
      projectedRelation({
        columns: ['run_id', 'suite'],
        publicColumns,
        table: 'eval_run',
      }),
    ).toBe('(select run_id, suite from evals.eval_run)');
  });

  it('selects an allowed jsonb field under a flattened name', () => {
    expect(
      projectedRelation({
        columns: ['settings.runs'],
        publicColumns,
        table: 'eval_run',
      }),
    ).toBe("(select settings -> 'runs' as settings_runs from evals.eval_run)");
  });

  it('selects a jsonb column whose fields all pass, whole or by field', () => {
    expect(
      projectedRelation({
        columns: ['totals', 'totals.duration_ms'],
        publicColumns,
        table: 'eval_run',
      }),
    ).toBe(
      "(select totals, totals -> 'duration_ms' as totals_duration_ms from evals.eval_run)",
    );
  });

  it('refuses a column that is not public', () => {
    expect(() =>
      projectedRelation({
        columns: ['actor'],
        publicColumns,
        table: 'eval_run',
      }),
    ).toThrow('eval_run.actor is not on the public allow-list');
  });

  it('refuses a jsonb column that is allowed only field by field', () => {
    expect(() =>
      projectedRelation({
        columns: ['settings'],
        publicColumns,
        table: 'eval_run',
      }),
    ).toThrow('eval_run.settings is not on the public allow-list');
  });

  it('refuses a jsonb field that is not on the list', () => {
    expect(() =>
      projectedRelation({
        columns: ['settings.argv'],
        publicColumns,
        table: 'eval_run',
      }),
    ).toThrow('eval_run.settings.argv is not on the public allow-list');
  });

  it('refuses a path below a top-level field', () => {
    expect(() =>
      projectedRelation({
        columns: ['detail.dimensions.name'],
        publicColumns,
        table: 'eval_trial_detail',
      }),
    ).toThrow('reaches below a top-level field');
  });

  it('refuses a name that is not a plain identifier', () => {
    expect(() =>
      projectedRelation({
        columns: ['run_id; drop table x'],
        publicColumns,
        table: 'eval_run',
      }),
    ).toThrow('is not a plain lower-case identifier');
  });
});
