import { describe, expect, it } from 'vite-plus/test';

import { columnsNamed } from './columnsNamed.util.ts';
import { EXCLUDED_COLUMNS } from './queries.constants.ts';
import { subjectRunsQuery } from './subjectRunsQuery.util.ts';

const publicColumns = new Set([
  'eval_run.model_id',
  'eval_run.run_id',
  'eval_run.started_at',
  'eval_run.suite',
  'eval_subject.id',
  'eval_subject.kind',
  'eval_subject.name',
  'eval_subject_version.content_hash',
  'eval_subject_version.id',
  'eval_subject_version.subject_id',
  'eval_task.id',
  'eval_task.task_key',
  'eval_task_version.id',
  'eval_task_version.task_id',
  'eval_trial.id',
  'eval_trial.outcome',
  'eval_trial.run_id',
  'eval_trial.subject_version_id',
  'eval_trial.task_version_id',
]);

const SUBJECT_SCOPE = {
  kind: 'subject',
  limit: 30,
  subjectKind: 'skill',
  subjectName: 'react-19',
} as const;

describe('subjectRunsQuery', () => {
  it('reads one subject over its newest runs', () => {
    const query = subjectRunsQuery({ publicColumns, scope: SUBJECT_SCOPE });

    expect(query.values).toEqual(['skill', 'react-19', 30]);
    expect(query.text).toContain(
      'where subject.kind::text = $1 and subject.name = $2',
    );
    expect(query.text).toContain('limit $3');
  });

  it('reads every subject over the recent runs of each suite', () => {
    const query = subjectRunsQuery({
      publicColumns,
      scope: { kind: 'recent', perSuite: 20 },
    });

    expect(query.values).toEqual([20]);
    expect(query.text).toContain('where ranked.recency <= $1');
    expect(query.text).not.toContain('subject.name = $2');
  });

  it('links each cell to a failing trial before any other', () => {
    const { text } = subjectRunsQuery({ publicColumns, scope: SUBJECT_SCOPE });

    expect(text).toContain(
      "min(trial.id) filter (where trial.outcome = 'fail')",
    );
  });

  it.each([
    { scope: SUBJECT_SCOPE },
    { scope: { kind: 'recent', perSuite: 5 } as const },
  ])(
    'reads no base table outside its projection ($scope.kind)',
    ({ scope }) => {
      const { text } = subjectRunsQuery({ publicColumns, scope });

      expect(text).not.toMatch(/from evals\.\w+ (?!\))/u);
      expect(columnsNamed({ columns: EXCLUDED_COLUMNS, sql: text })).toEqual(
        [],
      );
    },
  );

  it('stops at a content hash that is no longer public', () => {
    const withoutHash = new Set(
      [...publicColumns].filter(
        (column) => column !== 'eval_subject_version.content_hash',
      ),
    );

    expect(() =>
      subjectRunsQuery({ publicColumns: withoutHash, scope: SUBJECT_SCOPE }),
    ).toThrow(/content_hash is not on the public allow-list/u);
  });
});
