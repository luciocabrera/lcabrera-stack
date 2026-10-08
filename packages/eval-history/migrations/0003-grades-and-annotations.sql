create table evals.eval_human_grade (
  trial_id bigint not null references evals.eval_trial (id),
  dimension text not null,
  score smallint not null check (score between 1 and 5),
  grader text not null,
  graded_at timestamptz not null default now(),
  primary key (trial_id, dimension, grader)
);

create index eval_annotation_at on evals.eval_annotation (at);

alter table evals.eval_trial_detail
  add constraint eval_trial_detail_quality_names_judge_model
  check (detail_schema <> 'quality/1' or coalesce(detail ->> 'judge_model', '') <> '');

create function evals.require_judge_prompt_hash()
returns trigger
language plpgsql
as $$
begin
  if new.detail_schema = 'quality/1' and exists (
    select 1
    from evals.eval_trial trial
    join evals.eval_task_version task_version on task_version.id = trial.task_version_id
    where trial.id = new.trial_id and task_version.judge_prompt_hash is null
  ) then
    raise exception 'quality trial % has no judge prompt hash on its task version', new.trial_id
      using errcode = 'check_violation';
  end if;

  return new;
end
$$;

create trigger eval_trial_detail_judge_prompt_hash
before insert or update on evals.eval_trial_detail
for each row execute function evals.require_judge_prompt_hash();

create view evals.v_judge_agreement as
select
  grade.trial_id,
  trial.run_id,
  task.task_key,
  grade.dimension,
  detail.detail ->> 'judge_model' as judge_model,
  task_version.judge_prompt_hash::text as judge_prompt_hash,
  judged.score as judge_score,
  grade.score::integer as human_score,
  grade.graded_at
from evals.eval_human_grade grade
join evals.eval_trial trial on trial.id = grade.trial_id
join evals.eval_task_version task_version on task_version.id = trial.task_version_id
join evals.eval_task task on task.id = task_version.task_id
join evals.eval_trial_detail detail on detail.trial_id = grade.trial_id and detail.detail_schema = 'quality/1'
join lateral (
  select (dimension.value ->> 'score')::double precision as score
  from jsonb_array_elements(detail.detail -> 'dimensions') dimension
  where dimension.value ->> 'name' = grade.dimension
  limit 1
) judged on true;
