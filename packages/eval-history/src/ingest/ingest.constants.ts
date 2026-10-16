export const ENVELOPE_FILE_PATTERN =
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}\.json$/u;

export const INGEST_CONNECT_TIMEOUT_MS = 5000;

export const TRANSCRIPT_RETENTION_DAYS = 90;

export const INSERT_RUN_SQL = `
insert into evals.eval_run (
  run_id, project, suite, trigger, actor, branch, git_sha, git_dirty,
  pr_number, started_at, finished_at, status, model_id, harness_version,
  sdk_version, baseline_id, catalog_hash, schema_version, settings, env,
  totals, envelope_sha256
) values (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
  $17, $18, $19, $20, $21, $22
)
on conflict (run_id) do nothing
returning run_id`;

export const SELECT_RUN_SHA_SQL = `
select envelope_sha256 from evals.eval_run where run_id = $1`;

export const UPSERT_SUBJECT_SQL = `
with subject as (
  insert into evals.eval_subject (kind, name, path)
  values ($1, $2, $3)
  on conflict (kind, name) do update set path = excluded.path
  returning id
)
insert into evals.eval_subject_version as version (
  subject_id, content_hash, first_seen_sha, first_seen_at
)
select id, $4, $5, $6 from subject
on conflict (subject_id, content_hash) do update set
  first_seen_sha = case
    when excluded.first_seen_at < version.first_seen_at
      then excluded.first_seen_sha
    else version.first_seen_sha
  end,
  first_seen_at = least(version.first_seen_at, excluded.first_seen_at)
returning id, subject_id`;

export const UPSERT_TASK_SQL = `
with task as (
  insert into evals.eval_task (
    suite, subject_id, task_key, kind, task_set, source, tags
  )
  values ($1, $2, $3, $4, $5, $6, $7)
  on conflict (suite, task_key) do update set
    subject_id = excluded.subject_id,
    kind = excluded.kind,
    task_set = excluded.task_set,
    source = excluded.source,
    tags = excluded.tags
  returning id
)
insert into evals.eval_task_version as version (
  task_id, task_hash, fixture_hash, expected_hash, judge_prompt_hash,
  agent_prompt_hash
)
select id, $8, $9, $10, $11, $12 from task
on conflict (
  task_id, task_hash, fixture_hash, expected_hash, judge_prompt_hash,
  agent_prompt_hash
) do update set task_hash = excluded.task_hash
returning id`;

export const INSERT_TRIAL_SQL = `
with trial as (
  insert into evals.eval_trial (
    run_id, task_version_id, subject_version_id, trial_index, outcome,
    error_class, queued_at, started_at, first_token_at, finished_at,
    duration_ms, duration_api_ms, turns, tokens_in, tokens_out,
    tokens_cache_read, tokens_cache_write, cost_usd_reported, transcript_uri,
    transcript_sha, transcript_bytes, transcript_expires_at
  )
  values (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
    $17, $18, $19, $20, $21, $22
  )
  returning id
),
detail as (
  insert into evals.eval_trial_detail (trial_id, detail_schema, detail, judge_model)
  select id, $23, $24, $25 from trial
)
insert into evals.eval_judge_score (trial_id, dimension, score)
select trial.id, judged.dimension, judged.score
from trial
cross join unnest($26::text[], $27::smallint[]) as judged (dimension, score)`;
