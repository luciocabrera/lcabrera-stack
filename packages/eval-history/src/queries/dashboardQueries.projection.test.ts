import { describe, expect, it } from 'vite-plus/test';

import { columnsNamed } from './columnsNamed.util.ts';
import { qualityBaselinesQuery } from './qualityBaselinesQuery.util.ts';
import { qualityScoresQuery } from './qualityScoresQuery.util.ts';
import { EXCLUDED_COLUMNS } from './queries.constants.ts';
import { runHealthQuery } from './runHealthQuery.util.ts';
import { taskTrialsQuery } from './taskTrialsQuery.util.ts';
import { triggerConfusionQuery } from './triggerConfusionQuery.util.ts';

const COLUMNS_BY_TABLE = {
  eval_baseline: [
    'baseline_id',
    'computed_at',
    'id',
    'metric',
    'model_id',
    'subject_id',
    'suite',
  ],
  eval_judge_score: ['dimension', 'score', 'trial_id'],
  eval_run: [
    'baseline_id',
    'harness_version',
    'model_id',
    'run_id',
    'started_at',
    'suite',
  ],
  eval_subject: ['id', 'kind', 'name'],
  eval_subject_version: ['id', 'subject_id'],
  eval_task: ['id', 'kind', 'suite', 'task_key', 'task_set'],
  eval_task_version: ['id', 'task_id'],
  eval_trial: [
    'error_class',
    'id',
    'outcome',
    'run_id',
    'subject_version_id',
    'task_version_id',
    'trial_index',
  ],
  eval_trial_detail: ['trial_id'],
};

const publicColumns = new Set(
  Object.entries(COLUMNS_BY_TABLE).flatMap(([table, columns]) =>
    columns.map((column) => `${table}.${column}`),
  ),
);

const runIds = ['00000000-0000-4000-8000-000000000001'];

describe('the dashboard queries over a set of runs', () => {
  it.each([
    {
      name: 'qualityBaselines',
      query: qualityBaselinesQuery({ publicColumns }),
    },
    {
      name: 'qualityScores',
      query: qualityScoresQuery({ publicColumns, runIds }),
    },
    { name: 'runHealth', query: runHealthQuery({ publicColumns, runIds }) },
    { name: 'taskTrials', query: taskTrialsQuery({ publicColumns, runIds }) },
    {
      name: 'triggerConfusion',
      query: triggerConfusionQuery({ publicColumns, runIds }),
    },
  ])('$name reads no base table outside its projection', ({ query }) => {
    expect(query.text).not.toMatch(/from evals\.\w+ (?!\))/u);
    expect(
      columnsNamed({ columns: EXCLUDED_COLUMNS, sql: query.text }),
    ).toEqual([]);
  });
});
