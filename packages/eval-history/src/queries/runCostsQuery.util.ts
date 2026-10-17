import { projectedRelation } from './projectedRelation.util.ts';

type RunCostsQueryArgs = {
  readonly groupBy: 'run' | 'subject' | 'suite';
  readonly perSuite: number;
  readonly publicColumns: ReadonlySet<string>;
};

const GROUP_KEYS = {
  run: {
    columns: [
      ['priced.run_id', 'runId'],
      ['priced.suite', 'suite'],
      ['priced.started_at', 'startedAt'],
      ['priced.model_id', 'modelId'],
    ],
    order: 'priced.suite, priced.started_at desc, priced.run_id',
  },
  subject: {
    columns: [
      ['subject.kind::text', 'subjectKind'],
      ['subject.name', 'subjectName'],
    ],
    order: 'subject.kind::text, subject.name',
  },
  suite: {
    columns: [['priced.suite', 'suite']],
    order: 'priced.suite',
  },
} as const;

export const runCostsQuery = ({
  groupBy,
  perSuite,
  publicColumns,
}: RunCostsQueryArgs) => {
  const relation = (
    target: Omit<Parameters<typeof projectedRelation>[0], 'publicColumns'>,
  ) => projectedRelation({ ...target, publicColumns });
  const { columns, order } = GROUP_KEYS[groupBy];
  const keys = columns.map(([expression]) => expression).join(', ');
  const subjectJoin =
    groupBy === 'subject'
      ? `
join ${relation({ columns: ['id', 'subject_id'], table: 'eval_subject_version' })} subject_version on subject_version.id = priced.subject_version_id
join ${relation({ columns: ['id', 'kind', 'name'], table: 'eval_subject' })} subject on subject.id = subject_version.subject_id`
      : '';

  return {
    text: `with run as (
  select ranked.* from (
    select run.*, row_number() over (partition by run.suite order by run.started_at desc, run.run_id) as recency
    from ${relation({ columns: ['run_id', 'suite', 'started_at', 'model_id'], table: 'eval_run' })} run
  ) ranked
  where ranked.recency <= $1
),
priced as (
  select
    run.run_id,
    run.suite,
    run.started_at,
    run.model_id,
    trial.id,
    trial.subject_version_id,
    trial.duration_ms,
    trial.tokens_in,
    trial.tokens_out,
    trial.tokens_cache_read,
    trial.tokens_cache_write,
    trial.cost_usd_reported,
    (
      trial.tokens_in * price.usd_per_mtok_in
      + trial.tokens_out * price.usd_per_mtok_out
      + trial.tokens_cache_read * price.usd_per_mtok_cache_read
      + trial.tokens_cache_write * price.usd_per_mtok_cache_write
    ) / 1000000 as cost_usd_computed
  from run
  join ${relation({
    columns: [
      'id',
      'run_id',
      'subject_version_id',
      'duration_ms',
      'tokens_in',
      'tokens_out',
      'tokens_cache_read',
      'tokens_cache_write',
      'cost_usd_reported',
    ],
    table: 'eval_trial',
  })} trial on trial.run_id = run.run_id
  left join lateral (
    select price.*
    from ${relation({
      columns: [
        'model_id',
        'valid_from',
        'usd_per_mtok_in',
        'usd_per_mtok_out',
        'usd_per_mtok_cache_read',
        'usd_per_mtok_cache_write',
      ],
      table: 'model_price',
    })} price
    where price.model_id = run.model_id and price.valid_from <= run.started_at
    order by price.valid_from desc
    limit 1
  ) price on true
)
select
  ${columns.map(([expression, alias]) => `${expression} as "${alias}"`).join(',\n  ')},
  count(*)::integer as trials,
  sum(priced.tokens_in)::double precision as "tokensIn",
  sum(priced.tokens_out)::double precision as "tokensOut",
  sum(priced.tokens_cache_read)::double precision as "tokensCacheRead",
  sum(priced.tokens_cache_write)::double precision as "tokensCacheWrite",
  sum(priced.cost_usd_reported)::double precision as "reportedUsd",
  count(priced.cost_usd_reported)::integer as "reportedTrials",
  sum(priced.cost_usd_computed)::double precision as "computedUsd",
  count(priced.cost_usd_computed)::integer as "computedTrials",
  percentile_cont(0.5) within group (order by priced.duration_ms) as "p50Ms",
  percentile_cont(0.95) within group (order by priced.duration_ms) as "p95Ms",
  (array_agg(priced.id order by coalesce(priced.cost_usd_reported, priced.cost_usd_computed) desc nulls last, priced.id))[1]::text as "costliestTrialId",
  (array_agg(priced.id order by priced.duration_ms desc nulls last, priced.id))[1]::text as "slowestTrialId"
from priced${subjectJoin}
group by ${keys}
order by ${order}`,
    values: [perSuite],
  };
};
