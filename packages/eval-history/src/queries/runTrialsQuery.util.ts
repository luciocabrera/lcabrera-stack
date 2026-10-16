import type { TrialSort } from './queries.types.ts';

import { projectedRelation } from './projectedRelation.util.ts';
import { TRIAL_SORT_EXPRESSIONS } from './queries.constants.ts';

type RunTrialsQueryArgs = {
  readonly limit: number;
  readonly offset: number;
  readonly publicColumns: ReadonlySet<string>;
  readonly runId: string;
  readonly sorting: readonly TrialSort[];
  readonly trialId?: string;
};

export const runTrialsQuery = ({
  limit,
  offset,
  publicColumns,
  runId,
  sorting,
  trialId,
}: RunTrialsQueryArgs) => {
  const relation = (
    target: Omit<Parameters<typeof projectedRelation>[0], 'publicColumns'>,
  ) => projectedRelation({ ...target, publicColumns });
  const sortExpressions: Readonly<Record<string, string>> =
    TRIAL_SORT_EXPRESSIONS;
  const orderBy = [
    ...sorting
      .filter(({ column }) => Object.hasOwn(sortExpressions, column))
      .map(
        ({ column, direction }) =>
          `${sortExpressions[column] ?? ''} ${direction === 'desc' ? 'desc' : 'asc'} nulls last`,
      ),
    'task.task_key',
    'trial.trial_index',
    'trial.id',
  ];
  const from = `from ${relation({
    columns: [
      'id',
      'run_id',
      'task_version_id',
      'subject_version_id',
      'trial_index',
      'outcome',
      'error_class',
      'duration_ms',
      'turns',
      'tokens_in',
      'tokens_out',
      'cost_usd_reported',
    ],
    table: 'eval_trial',
  })} trial
join ${relation({ columns: ['id', 'task_id'], table: 'eval_task_version' })} task_version on task_version.id = trial.task_version_id
join ${relation({ columns: ['id', 'task_key', 'kind', 'task_set'], table: 'eval_task' })} task on task.id = task_version.task_id
join ${relation({ columns: ['id', 'subject_id'], table: 'eval_subject_version' })} subject_version on subject_version.id = trial.subject_version_id
join ${relation({ columns: ['id', 'kind', 'name'], table: 'eval_subject' })} subject on subject.id = subject_version.subject_id
left join ${relation({
    columns: [
      'trial_id',
      'detail.expected_skill',
      'detail.invoked',
      'detail.verdict',
      'detail.overall',
    ],
    table: 'eval_trial_detail',
  })} detail on detail.trial_id = trial.id
where trial.run_id = $1${trialId === undefined ? '' : ' and trial.id = $2'}`;
  const filterValues = trialId === undefined ? [runId] : [runId, trialId];

  return {
    count: {
      text: `select count(*)::integer as total
${from}`,
      values: filterValues,
    },
    page: {
      text: `select
  trial.id::text as "trialId",
  task.task_key as "taskKey",
  task.kind as "taskKind",
  task.task_set as "taskSet",
  subject.kind as "subjectKind",
  subject.name as "subjectName",
  trial.trial_index as "trialIndex",
  trial.outcome,
  trial.error_class as "errorClass",
  trial.duration_ms as "durationMs",
  trial.turns,
  trial.tokens_in as "tokensIn",
  trial.tokens_out as "tokensOut",
  trial.cost_usd_reported::double precision as "costUsd",
  detail.detail_expected_skill as "expectedSkill",
  detail.detail_invoked as "invoked",
  detail.detail_verdict as "verdict",
  detail.detail_overall as "overall"
${from}
order by ${orderBy.join(', ')}
limit $${String(filterValues.length + 1)} offset $${String(filterValues.length + 2)}`,
      values: [...filterValues, limit, offset],
    },
  };
};
