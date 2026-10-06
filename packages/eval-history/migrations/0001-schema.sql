create type evals.outcome as enum ('pass', 'fail', 'error', 'timeout', 'skipped');
create type evals.trigger as enum ('local', 'ci-pr', 'ci-push', 'ci-scheduled', 'ci-manual', 'baseline');
create type evals.run_status as enum ('complete', 'partial', 'aborted');
create type evals.subject_kind as enum ('skill', 'rule', 'agent', 'prompt');
create type evals.task_kind as enum ('trigger', 'near-miss', 'fixture', 'quality', 'rule-check');
create type evals.task_set as enum ('regression', 'capability');
create type evals.annotation_kind as enum ('model-change', 'harness-change', 'incident', 'note');

create table evals.suite (
  name text primary key
);

insert into evals.suite (name) values
  ('rules-consistency'), ('skills'), ('verifier-fixtures'), ('verifier-tooled'), ('skill-quality');

create table evals.eval_run (
  id bigint generated always as identity primary key,
  run_id uuid not null unique,
  project text not null default 'lcabrera-stack',
  suite text not null references evals.suite (name),
  trigger evals.trigger not null,
  actor text not null,
  branch text not null,
  git_sha char(40) not null,
  git_dirty boolean not null,
  pr_number integer,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  status evals.run_status not null,
  model_id text,
  harness_version text not null,
  sdk_version text,
  baseline_id uuid,
  catalog_hash char(64),
  schema_version smallint not null,
  settings jsonb not null check (jsonb_typeof(settings) = 'object'),
  env jsonb not null check (jsonb_typeof(env) = 'object'),
  totals jsonb not null check (jsonb_typeof(totals) = 'object'),
  envelope_sha256 char(64) not null,
  ingested_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table evals.eval_subject (
  id bigint generated always as identity primary key,
  kind evals.subject_kind not null,
  name text not null,
  path text not null,
  created_at timestamptz not null default now(),
  unique (kind, name)
);

create table evals.eval_subject_version (
  id bigint generated always as identity primary key,
  subject_id bigint not null references evals.eval_subject (id),
  content_hash char(64) not null,
  first_seen_sha char(40) not null,
  first_seen_at timestamptz not null,
  content text,
  created_at timestamptz not null default now(),
  unique (subject_id, content_hash)
);

create table evals.eval_task (
  id bigint generated always as identity primary key,
  suite text not null references evals.suite (name),
  subject_id bigint not null references evals.eval_subject (id),
  task_key text not null,
  kind evals.task_kind not null,
  task_set evals.task_set not null,
  source text check (source in ('incident')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (suite, task_key)
);

create table evals.eval_task_version (
  id bigint generated always as identity primary key,
  task_id bigint not null references evals.eval_task (id),
  task_hash char(64) not null,
  fixture_hash char(64),
  expected_hash char(64),
  judge_prompt_hash char(64),
  agent_prompt_hash char(64),
  created_at timestamptz not null default now(),
  unique nulls not distinct (task_id, task_hash, fixture_hash, expected_hash, judge_prompt_hash, agent_prompt_hash)
);

create table evals.eval_trial (
  id bigint generated always as identity primary key,
  run_id uuid not null references evals.eval_run (run_id) on delete cascade,
  task_version_id bigint not null references evals.eval_task_version (id),
  subject_version_id bigint not null references evals.eval_subject_version (id),
  trial_index smallint not null check (trial_index >= 0),
  outcome evals.outcome not null,
  error_class text,
  queued_at timestamptz not null,
  started_at timestamptz,
  first_token_at timestamptz,
  finished_at timestamptz,
  duration_ms integer,
  duration_api_ms integer,
  turns smallint,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  tokens_cache_read integer not null default 0,
  tokens_cache_write integer not null default 0,
  cost_usd_reported numeric(12, 6),
  cost_usd_computed numeric(12, 6),
  transcript_uri text,
  transcript_sha char(64),
  transcript_bytes integer,
  transcript_expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (run_id, task_version_id, trial_index),
  check (outcome <> 'error' or error_class is not null)
);

create table evals.eval_trial_detail (
  trial_id bigint primary key references evals.eval_trial (id) on delete cascade,
  detail_schema text not null,
  detail jsonb not null check (jsonb_typeof(detail) = 'object')
);

create table evals.eval_tool_call (
  trial_id bigint not null references evals.eval_trial (id) on delete cascade,
  seq smallint not null,
  tool text not null,
  input_summary text,
  at timestamptz,
  primary key (trial_id, seq)
);

create table evals.eval_baseline (
  id bigint generated always as identity primary key,
  baseline_id uuid not null,
  suite text not null references evals.suite (name),
  model_id text not null,
  subject_id bigint references evals.eval_subject (id),
  metric text not null check (metric in ('pass_rate', 'quality_overall')),
  git_sha char(40) not null,
  n_runs smallint not null check (n_runs >= 2),
  mean double precision not null,
  stddev double precision not null,
  computed_at timestamptz not null default now(),
  unique nulls not distinct (baseline_id, subject_id, metric)
);

create table evals.eval_annotation (
  id bigint generated always as identity primary key,
  at timestamptz not null,
  kind evals.annotation_kind not null,
  text text not null,
  author text not null,
  created_at timestamptz not null default now()
);

create table evals.model_price (
  model_id text not null,
  valid_from timestamptz not null,
  usd_per_mtok_in numeric(10, 4) not null,
  usd_per_mtok_out numeric(10, 4) not null,
  usd_per_mtok_cache_read numeric(10, 4) not null,
  usd_per_mtok_cache_write numeric(10, 4) not null,
  primary key (model_id, valid_from)
);

create index eval_run_suite_started on evals.eval_run (suite, started_at desc);
create index eval_run_git_sha on evals.eval_run (git_sha);
create index eval_run_branch_suite on evals.eval_run (branch, suite, started_at desc);
create index eval_trial_task_run on evals.eval_trial (task_version_id, run_id);
create index eval_trial_not_pass on evals.eval_trial (run_id) where outcome <> 'pass';
create index eval_trial_transcript_expiry on evals.eval_trial (transcript_expires_at) where transcript_uri is not null;
