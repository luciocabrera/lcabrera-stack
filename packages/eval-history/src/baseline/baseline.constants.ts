export const BASELINE_SUITES = [
  'skill-quality',
  'skills',
  'verifier-fixtures',
  'verifier-tooled',
] as const;

export const BASELINE_METRICS = ['pass_rate', 'quality_overall'] as const;

export const BASELINE_METRIC_BY_SUITE = {
  'skill-quality': 'quality_overall',
  skills: 'pass_rate',
  'verifier-fixtures': 'pass_rate',
  'verifier-tooled': 'pass_rate',
} as const satisfies Record<
  (typeof BASELINE_SUITES)[number],
  (typeof BASELINE_METRICS)[number]
>;

export const SUBJECT_KINDS = ['skill', 'rule', 'agent', 'prompt'] as const;

export const SELECT_SUBJECT_ID_SQL = `
select id from evals.eval_subject where kind = $1 and name = $2`;

export const INSERT_BASELINE_SQL = `
insert into evals.eval_baseline (
  baseline_id, suite, model_id, subject_id, metric, git_sha, n_runs, mean,
  stddev
) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;

export const SELECT_LATEST_BASELINE_SQL = `
select distinct on (b.subject_id, b.metric)
  b.baseline_id as "baselineId",
  b.suite,
  b.model_id as "modelId",
  s.kind as "subjectKind",
  s.name as "subjectName",
  b.metric,
  b.git_sha as "gitSha",
  b.n_runs as "nRuns",
  b.mean,
  b.stddev
from evals.eval_baseline b
left join evals.eval_subject s on s.id = b.subject_id
where b.suite = $1 and b.model_id = $2
order by b.subject_id, b.metric, b.computed_at desc, b.id desc`;
