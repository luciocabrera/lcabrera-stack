create function evals.flaky_tasks(run_window integer, excluded_runs uuid[])
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
    where run.run_id <> all (flaky_tasks.excluded_runs)
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

create or replace function evals.flaky_tasks(run_window integer)
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
  select * from evals.flaky_tasks(flaky_tasks.run_window, '{}'::uuid[])
$$;
