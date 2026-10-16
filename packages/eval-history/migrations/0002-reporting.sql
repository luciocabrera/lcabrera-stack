create index eval_trial_subject_version on evals.eval_trial (subject_version_id);

create view evals.v_task_pass_rate as
select
  run.run_id,
  run.suite,
  run.started_at,
  run.model_id,
  task.task_key,
  task.kind,
  task.task_set,
  task_version.task_hash,
  (count(*) filter (where trial.outcome in ('pass', 'fail')))::integer as n,
  (count(*) filter (where trial.outcome = 'pass'))::integer as k,
  bool_or(trial.outcome = 'pass') as pass_at_k,
  bool_or(trial.outcome = 'pass') and not bool_or(trial.outcome = 'fail') as pass_hat_k
from evals.eval_trial trial
join evals.eval_run run on run.run_id = trial.run_id
join evals.eval_task_version task_version on task_version.id = trial.task_version_id
join evals.eval_task task on task.id = task_version.task_id
group by run.id, run.run_id, task.id, task.task_key, task_version.id;

create view evals.v_subject_trend as
select
  subject.kind as subject_kind,
  subject.name as subject_name,
  run.run_id,
  run.suite,
  run.started_at,
  run.model_id,
  subject_version.content_hash,
  (count(*) filter (where trial.outcome in ('pass', 'fail')))::integer as n,
  (count(*) filter (where trial.outcome = 'pass'))::integer as k
from evals.eval_trial trial
join evals.eval_run run on run.run_id = trial.run_id
join evals.eval_subject_version subject_version on subject_version.id = trial.subject_version_id
join evals.eval_subject subject on subject.id = subject_version.subject_id
group by subject.id, subject.kind, subject.name, run.id, run.run_id, subject_version.id;

create function evals.flaky_tasks(run_window integer)
returns table (
  suite text,
  task_key text,
  runs integer,
  disagreeing integer,
  disagree_fraction double precision
)
language sql
stable
as $$
  with per_run as (
    select
      task.id as task_id,
      task.suite,
      task.task_key,
      run.started_at,
      (count(*) filter (where trial.outcome = 'pass')) > 0
        and (count(*) filter (where trial.outcome = 'fail')) > 0 as disagrees
    from evals.eval_trial trial
    join evals.eval_run run on run.run_id = trial.run_id
    join evals.eval_task_version task_version on task_version.id = trial.task_version_id
    join evals.eval_task task on task.id = task_version.task_id
    group by task.id, run.id
  ),
  recent as (
    select
      per_run.*,
      row_number() over (partition by per_run.task_id order by per_run.started_at desc) as recency
    from per_run
  )
  select
    recent.suite,
    recent.task_key,
    count(*)::integer,
    (count(*) filter (where recent.disagrees))::integer,
    (count(*) filter (where recent.disagrees))::double precision / count(*)
  from recent
  where recent.recency <= flaky_tasks.run_window
  group by recent.task_id, recent.suite, recent.task_key
$$;

create function evals.run_compare(a uuid, b uuid)
returns table (
  suite text,
  task_key text,
  subject_kind evals.subject_kind,
  subject_name text,
  outcomes_a evals.outcome[],
  outcomes_b evals.outcome[],
  n_a integer,
  k_a integer,
  n_b integer,
  k_b integer,
  task_hash_a text,
  task_hash_b text,
  fixture_hash_a text,
  fixture_hash_b text,
  expected_hash_a text,
  expected_hash_b text,
  judge_prompt_hash_a text,
  judge_prompt_hash_b text,
  agent_prompt_hash_a text,
  agent_prompt_hash_b text,
  content_hash_a text,
  content_hash_b text
)
language sql
stable
as $$
  with side as (
    select
      trial.run_id,
      task.id as task_id,
      task.suite,
      task.task_key,
      subject.kind as subject_kind,
      subject.name as subject_name,
      array_agg(trial.outcome order by trial.trial_index) as outcomes,
      (count(*) filter (where trial.outcome in ('pass', 'fail')))::integer as n,
      (count(*) filter (where trial.outcome = 'pass'))::integer as k,
      task_version.task_hash::text as task_hash,
      task_version.fixture_hash::text as fixture_hash,
      task_version.expected_hash::text as expected_hash,
      task_version.judge_prompt_hash::text as judge_prompt_hash,
      task_version.agent_prompt_hash::text as agent_prompt_hash,
      subject_version.content_hash::text as content_hash
    from evals.eval_trial trial
    join evals.eval_task_version task_version on task_version.id = trial.task_version_id
    join evals.eval_task task on task.id = task_version.task_id
    join evals.eval_subject_version subject_version on subject_version.id = trial.subject_version_id
    join evals.eval_subject subject on subject.id = subject_version.subject_id
    where trial.run_id in (run_compare.a, run_compare.b)
    group by trial.run_id, task.id, task_version.id, subject_version.id, subject.id
  ),
  side_a as (
    select * from side where side.run_id = run_compare.a
  ),
  side_b as (
    select * from side where side.run_id = run_compare.b
  )
  select
    coalesce(side_a.suite, side_b.suite),
    coalesce(side_a.task_key, side_b.task_key),
    coalesce(side_a.subject_kind, side_b.subject_kind),
    coalesce(side_a.subject_name, side_b.subject_name),
    side_a.outcomes,
    side_b.outcomes,
    side_a.n,
    side_a.k,
    side_b.n,
    side_b.k,
    side_a.task_hash,
    side_b.task_hash,
    side_a.fixture_hash,
    side_b.fixture_hash,
    side_a.expected_hash,
    side_b.expected_hash,
    side_a.judge_prompt_hash,
    side_b.judge_prompt_hash,
    side_a.agent_prompt_hash,
    side_b.agent_prompt_hash,
    side_a.content_hash,
    side_b.content_hash
  from side_a
  full join side_b on side_b.task_id = side_a.task_id
$$;
