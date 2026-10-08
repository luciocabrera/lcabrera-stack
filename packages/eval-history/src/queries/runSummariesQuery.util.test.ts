import { describe, expect, it } from 'vite-plus/test';

import { columnsNamed } from './columnsNamed.util.ts';
import { EXCLUDED_COLUMNS } from './queries.constants.ts';
import { runSummariesQuery } from './runSummariesQuery.util.ts';

const publicColumns = new Set([
  ...[
    'run_id',
    'suite',
    'trigger',
    'branch',
    'git_sha',
    'git_dirty',
    'pr_number',
    'started_at',
    'finished_at',
    'status',
    'model_id',
    'harness_version',
    'sdk_version',
  ].map((column) => `eval_run.${column}`),
  'eval_trial.cost_usd_reported',
  'eval_trial.outcome',
  'eval_trial.run_id',
]);

describe('runSummariesQuery', () => {
  it('ranks the recent runs of each suite and keeps the newest', () => {
    const query = runSummariesQuery({
      publicColumns,
      scope: { kind: 'recent', perSuite: 30 },
    });

    expect(query.values).toEqual([30]);
    expect(query.text).toContain('where ranked.recency <= $1');
  });

  it('selects one run by id', () => {
    const query = runSummariesQuery({
      publicColumns,
      scope: { kind: 'run', runId: 'run-a' },
    });

    expect(query.values).toEqual(['run-a']);
    expect(query.text).toContain('where run.run_id = $1');
  });

  it('reads the base tables only through their projections', () => {
    const { text } = runSummariesQuery({
      publicColumns,
      scope: { kind: 'recent', perSuite: 30 },
    });

    expect(text).not.toMatch(/from evals\.\w+ (?!\))/u);
    expect(columnsNamed({ columns: EXCLUDED_COLUMNS, sql: text })).toEqual([]);
  });

  it('refuses to build when a column it reads stops being public', () => {
    const narrowed = new Set(publicColumns);

    narrowed.delete('eval_run.branch');

    expect(() =>
      runSummariesQuery({
        publicColumns: narrowed,
        scope: { kind: 'recent', perSuite: 30 },
      }),
    ).toThrow('eval_run.branch is not on the public allow-list');
  });
});
