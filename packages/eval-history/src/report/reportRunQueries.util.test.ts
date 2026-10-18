import { describe, expect, it } from 'vite-plus/test';

import { reportRunQueries } from './reportRunQueries.util.ts';

const RUN_ID = '00000000-0000-4000-8000-000000000001';

describe('reportRunQueries', () => {
  const queries = reportRunQueries(RUN_ID);

  it('binds the run id to every statement', () => {
    expect(
      [queries.run, queries.subjects, queries.tasks].map(
        ({ values }) => values,
      ),
    ).toEqual([[RUN_ID], [RUN_ID], [RUN_ID]]);
  });

  it('reads the run and the median inputs by run id', () => {
    expect(queries.run.text).toContain('from evals.eval_run run');
    expect(queries.run.text).toContain('where run.run_id = $1');
    expect(queries.run.text).toContain(
      'where trial.run_id = run.run_id and trial.duration_ms is not null',
    );
    expect(queries.run.text).toContain(
      `(run.totals ->> 'cost_usd_reported')::double precision as "costUsdReported"`,
    );
  });

  it("reaches subjects and tasks only through the run's trials", () => {
    expect(queries.subjects.text).toContain('from evals.eval_trial trial');
    expect(queries.subjects.text).toContain(
      'on subject_version.id = trial.subject_version_id',
    );
    expect(queries.subjects.text).toContain('where trial.run_id = $1');
    expect(queries.tasks.text).toContain('from evals.eval_trial trial');
    expect(queries.tasks.text).toContain(
      'on task_version.id = trial.task_version_id',
    );
    expect(queries.tasks.text).toContain('where trial.run_id = $1');
  });

  it("orders each task's outcomes by trial index and keys them by task", () => {
    expect(queries.tasks.text).toContain(
      'array_agg(trial.outcome::text order by trial.trial_index) as outcomes',
    );
    expect(queries.tasks.text).toContain(
      'group by task.id, task.task_key, task_version.id',
    );
  });

  it("reads each task's set and subject, and the judge score of each passed quality trial", () => {
    expect(queries.tasks.text).toContain('task.task_set::text as set');
    expect(queries.tasks.text).toContain(
      'join evals.eval_subject subject on subject.id = task.subject_id',
    );
    expect(queries.tasks.text).toContain(
      'left join evals.eval_trial_detail detail on detail.trial_id = trial.id',
    );
    expect(queries.tasks.text).toContain(
      "filter (where trial.outcome = 'pass' and detail.detail_schema = 'quality/1')",
    );
  });

  it('aliases every column to the field the reader expects', () => {
    const aliases = [
      queries.run.text,
      queries.subjects.text,
      queries.tasks.text,
    ].flatMap((text) =>
      text
        .matchAll(/ as "(\w+)"/gu)
        .map(([, alias]) => alias)
        .toArray(),
    );

    expect(aliases).toEqual([
      'runId',
      'gitSha',
      'modelId',
      'harnessVersion',
      'catalogHash',
      'costUsdReported',
      'durationsMs',
      'contentHash',
      'taskKey',
      'subjectKind',
      'subjectName',
      'taskHash',
      'fixtureHash',
      'expectedHash',
      'judgePromptHash',
      'agentPromptHash',
    ]);
  });
});
