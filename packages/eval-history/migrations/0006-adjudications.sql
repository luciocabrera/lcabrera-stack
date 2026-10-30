create type evals.adjudication_outcome as enum ('dismissed', 'fixed', 'split', 'escalated');
create type evals.verifier_role as enum ('judge', 'adversary');
create type evals.finding_verdict as enum ('REAL', 'FALSE_POSITIVE');
create type evals.ground_truth_source as enum ('lucio', 'upstream-fix', 'reopened');

create table evals.adjudication_case (
  case_id text primary key,
  finding_id text not null,
  analyzer text not null,
  rule text not null,
  file text not null,
  content_hash char(64) not null,
  base_sha char(40) not null,
  head_sha char(40) not null,
  pr integer check (pr > 0),
  outcome evals.adjudication_outcome not null,
  created_at timestamptz not null,
  schema_version integer not null,
  envelope_sha256 char(64) not null
);

create index adjudication_case_rule on evals.adjudication_case (analyzer, rule);

create table evals.adjudication_verdict (
  case_id text not null references evals.adjudication_case (case_id) on delete cascade,
  verifier_role evals.verifier_role not null,
  model text not null,
  agent_prompt_hash char(64) not null,
  verdict evals.finding_verdict not null,
  evidence text not null,
  duration_ms integer not null check (duration_ms >= 0),
  tokens_in integer not null check (tokens_in >= 0),
  tokens_out integer not null check (tokens_out >= 0),
  cost_usd numeric(12, 6) check (cost_usd >= 0),
  primary key (case_id, verifier_role, model)
);

create table evals.adjudication_ground_truth (
  id bigint generated always as identity primary key,
  case_id text not null references evals.adjudication_case (case_id) on delete cascade,
  truth evals.finding_verdict not null,
  source evals.ground_truth_source not null,
  note text,
  recorded_at timestamptz not null default now(),
  constraint adjudication_ground_truth_reopened_is_real
    check (source <> 'reopened' or truth = 'REAL')
);

create index adjudication_ground_truth_latest
  on evals.adjudication_ground_truth (case_id, recorded_at desc, id desc);

create view evals.v_adjudication_accuracy with (security_invoker = true) as
with latest_truth as (
  select distinct on (ground_truth.case_id)
    ground_truth.case_id,
    ground_truth.truth
  from evals.adjudication_ground_truth ground_truth
  order by ground_truth.case_id, ground_truth.recorded_at desc, ground_truth.id desc
)
select
  verdict.model,
  verdict.verifier_role,
  count(*)::integer as verdicts,
  (count(*) filter (where verdict.verdict = latest_truth.truth))::integer as correct,
  (count(*) filter (
    where verdict.verdict = 'FALSE_POSITIVE' and latest_truth.truth = 'REAL'
  ))::integer as missed_real,
  (count(*) filter (
    where verdict.verdict = 'REAL' and latest_truth.truth = 'FALSE_POSITIVE'
  ))::integer as false_alarms,
  (count(*) filter (where verdict.verdict = latest_truth.truth))::double precision
    / count(*) as accuracy
from evals.adjudication_verdict verdict
join latest_truth on latest_truth.case_id = verdict.case_id
group by verdict.model, verdict.verifier_role;
