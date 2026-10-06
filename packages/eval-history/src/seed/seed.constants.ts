const SYNTHETIC_PROJECT = 'synthetic';

export const SYNTHETIC_PRIVATE_TEXT = 'synthetic-private-text';

export const SYNTHETIC_SHAPE = {
  nights: 365,
  subjects: 7,
  trialsPerTask: 3,
} as const;

const PARAMETERS = `
with p as (
  select
    $1::date as ends_on,
    $2::integer as nights,
    $3::integer as subjects,
    $4::integer as trials,
    $5::text as private_text
)`;

const hex = (expression: string) =>
  `encode(sha256(convert_to(${expression}, 'UTF8')), 'hex')`;

const SUBJECTS_SQL = `${PARAMETERS}
insert into evals.eval_subject (kind, name, path)
select 'skill', format('synthetic-skill-%s', lpad(s::text, 2, '0')), format('synthetic/%s/SKILL.md', p.private_text)
from p, generate_series(1, p.subjects) as s`;

const SUBJECT_VERSIONS_SQL = `${PARAMETERS},
subject as (
  select id, name, row_number() over (order by name)::integer as s
  from evals.eval_subject
  where name like 'synthetic-skill-%'
)
insert into evals.eval_subject_version (subject_id, content_hash, first_seen_sha, first_seen_at, content)
select
  subject.id,
  ${hex("subject.name || ':' || v")},
  substr(${hex("'sha:' || subject.name || ':' || v")}, 1, 40),
  p.ends_on - p.nights + greatest(v * 60 - subject.s * 13, 1),
  p.private_text
from p, subject, generate_series((1 + subject.s * 13) / 60, (p.nights + subject.s * 13) / 60) as v`;

const TASKS_SQL = `${PARAMETERS}
insert into evals.eval_task (suite, subject_id, task_key, kind, task_set)
select 'skills', subject.id, format('skills/%s/%s-1', subject.name, task_kind), task_kind::evals.task_kind, 'regression'
from p, evals.eval_subject subject, unnest(array['trigger', 'near-miss']) as task_kind
where subject.name like 'synthetic-skill-%'`;

const TASK_VERSIONS_SQL = `${PARAMETERS}
insert into evals.eval_task_version (task_id, task_hash, fixture_hash)
select task.id, ${hex('task.task_key')}, ${hex("task.task_key || ':fixture'")}
from p, evals.eval_task task
where task.task_key like 'skills/synthetic-skill-%'`;

const RUNS_SQL = `${PARAMETERS}
insert into evals.eval_run (
  run_id, project, suite, trigger, actor, branch, git_sha, git_dirty, started_at, finished_at,
  status, model_id, harness_version, schema_version, settings, env, totals, envelope_sha256
)
select
  md5('synthetic-run:' || night)::uuid,
  '${SYNTHETIC_PROJECT}',
  'skills',
  'ci-scheduled',
  p.private_text,
  'main',
  substr(${hex("'commit:' || night")}, 1, 40),
  false,
  (p.ends_on - (p.nights - night))::timestamp at time zone 'UTC' + interval '2 hours',
  (p.ends_on - (p.nights - night))::timestamp at time zone 'UTC' + interval '2 hours 40 minutes',
  'complete',
  case when night <= p.nights / 2 then 'synthetic-model-a' else 'synthetic-model-b' end,
  'synthetic',
  1,
  jsonb_build_object('argv', jsonb_build_array(p.private_text), 'runs', p.trials),
  jsonb_build_object('node', 'synthetic'),
  '{}'::jsonb,
  ${hex("'envelope:' || night")}
from p, generate_series(1, p.nights) as night`;

const TRIALS_SQL = `${PARAMETERS},
night as (
  select
    night,
    md5('synthetic-run:' || night)::uuid as run_id,
    (p.ends_on - (p.nights - night))::timestamp at time zone 'UTC' + interval '2 hours' as started_at
  from p, generate_series(1, p.nights) as night
),
task as (
  select
    task_version.id as task_version_id,
    task.task_key,
    subject.name as subject_name,
    subject.id as subject_id,
    (dense_rank() over (order by subject.name))::integer as s,
    (array[250, 128, 40])[1 + (row_number() over (order by task.task_key))::integer % 3] as pass_below
  from evals.eval_task task
  join evals.eval_task_version task_version on task_version.task_id = task.id
  join evals.eval_subject subject on subject.id = task.subject_id
  where task.task_key like 'skills/synthetic-skill-%'
),
roll as (
  select
    night.run_id,
    night.started_at,
    task.task_version_id,
    subject_version.id as subject_version_id,
    trial_index,
    task.pass_below,
    sha256(convert_to(night.run_id::text || task.task_key || trial_index, 'UTF8')) as dice
  from p, night, task, generate_series(0, p.trials - 1) as trial_index,
    evals.eval_subject_version subject_version
  where subject_version.subject_id = task.subject_id
    and subject_version.content_hash = ${hex("task.subject_name || ':' || ((night.night + task.s * 13) / 60)")}
)
insert into evals.eval_trial (
  run_id, task_version_id, subject_version_id, trial_index, outcome, error_class,
  queued_at, started_at, finished_at, duration_ms, duration_api_ms, turns,
  tokens_in, tokens_out, cost_usd_reported, cost_usd_computed,
  transcript_uri, transcript_sha, transcript_bytes, transcript_expires_at
)
select
  roll.run_id,
  roll.task_version_id,
  roll.subject_version_id,
  roll.trial_index,
  case
    when get_byte(roll.dice, 1) < 4 then 'error'
    when get_byte(roll.dice, 0) < roll.pass_below then 'pass'
    else 'fail'
  end::evals.outcome,
  case when get_byte(roll.dice, 1) < 4 then 'synthetic_error' end,
  roll.started_at + roll.trial_index * interval '1 second',
  roll.started_at + roll.trial_index * interval '1 second',
  roll.started_at + roll.trial_index * interval '1 second' + get_byte(roll.dice, 2) * interval '100 milliseconds',
  1000 + get_byte(roll.dice, 2) * 100,
  800 + get_byte(roll.dice, 2) * 80,
  1 + get_byte(roll.dice, 3) % 6,
  2000 + get_byte(roll.dice, 4) * 10,
  200 + get_byte(roll.dice, 5),
  get_byte(roll.dice, 6) / 1000.0,
  get_byte(roll.dice, 6) / 1000.0,
  format('file:///%s/%s-%s.json', p.private_text, roll.run_id, roll.trial_index),
  encode(roll.dice, 'hex'),
  4096,
  roll.started_at + interval '90 days'
from p, roll`;

export const SYNTHETIC_HISTORY_STATEMENTS = [
  SUBJECTS_SQL,
  SUBJECT_VERSIONS_SQL,
  TASKS_SQL,
  TASK_VERSIONS_SQL,
  RUNS_SQL,
  TRIALS_SQL,
];
