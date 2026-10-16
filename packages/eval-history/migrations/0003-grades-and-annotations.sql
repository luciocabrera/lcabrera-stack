do $$
declare
  offending record;
begin
  select trial_detail.trial_id, problem.reason
  into offending
  from evals.eval_trial_detail trial_detail
  cross join lateral (
    select 'names no judge_model' as reason
    where coalesce(trial_detail.detail ->> 'judge_model', '') = ''
    union all
    select 'has no judge prompt hash on its task version'
    from evals.eval_trial trial
    join evals.eval_task_version task_version on task_version.id = trial.task_version_id
    where trial.id = trial_detail.trial_id and task_version.judge_prompt_hash is null
    union all
    select 'holds no dimensions array'
    where jsonb_typeof(trial_detail.detail -> 'dimensions') is distinct from 'array'
    union all
    select 'scores a dimension without a name, or outside the whole numbers 1 to 5'
    from jsonb_array_elements(
      case
        when jsonb_typeof(trial_detail.detail -> 'dimensions') = 'array'
          then trial_detail.detail -> 'dimensions'
        else '[]'::jsonb
      end
    ) dimension
    where coalesce(dimension ->> 'name', '') = ''
      or case
        when jsonb_typeof(dimension -> 'score') = 'number'
          then (dimension ->> 'score')::numeric not in (1, 2, 3, 4, 5)
        else true
      end
    union all
    select 'scores a dimension more than once'
    from jsonb_array_elements(
      case
        when jsonb_typeof(trial_detail.detail -> 'dimensions') = 'array'
          then trial_detail.detail -> 'dimensions'
        else '[]'::jsonb
      end
    ) dimension
    group by dimension ->> 'name'
    having count(*) > 1
  ) problem
  where trial_detail.detail_schema = 'quality/1'
  order by trial_detail.trial_id
  limit 1;

  if found then
    raise exception 'quality trial % %; fix that row before applying 0003-grades-and-annotations.sql',
      offending.trial_id, offending.reason
      using errcode = 'check_violation';
  end if;
end
$$;

alter table evals.eval_trial_detail add column judge_model text;

update evals.eval_trial_detail
set judge_model = detail ->> 'judge_model'
where detail ->> 'judge_model' is not null;

alter table evals.eval_trial_detail
  add constraint eval_trial_detail_quality_names_judge_model
    check (detail_schema <> 'quality/1' or coalesce(judge_model, '') <> ''),
  add constraint eval_trial_detail_judge_model_matches_detail
    check (judge_model is not distinct from detail ->> 'judge_model');

create table evals.eval_judge_score (
  trial_id bigint not null,
  dimension text not null,
  score smallint not null,
  primary key (trial_id, dimension)
);

insert into evals.eval_judge_score (trial_id, dimension, score)
select trial_detail.trial_id, dimension ->> 'name', (dimension ->> 'score')::smallint
from evals.eval_trial_detail trial_detail
cross join lateral jsonb_array_elements(trial_detail.detail -> 'dimensions') dimension
where trial_detail.detail_schema = 'quality/1';

alter table evals.eval_judge_score
  add constraint eval_judge_score_score_check check (score between 1 and 5),
  add constraint eval_judge_score_trial_id_fkey
    foreign key (trial_id) references evals.eval_trial (id) on delete cascade;

create table evals.eval_human_grade (
  trial_id bigint not null,
  dimension text not null,
  score smallint not null check (score between 1 and 5),
  grader text not null,
  graded_at timestamptz not null default now(),
  primary key (trial_id, dimension, grader),
  foreign key (trial_id, dimension)
    references evals.eval_judge_score (trial_id, dimension) on delete cascade
);

create index eval_annotation_at on evals.eval_annotation (at);

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
  trial_detail.judge_model,
  task_version.judge_prompt_hash::text as judge_prompt_hash,
  judged.score::integer as judge_score,
  grade.score::integer as human_score,
  grade.graded_at
from evals.eval_human_grade grade
join evals.eval_judge_score judged
  on judged.trial_id = grade.trial_id and judged.dimension = grade.dimension
join evals.eval_trial trial on trial.id = grade.trial_id
join evals.eval_trial_detail trial_detail on trial_detail.trial_id = grade.trial_id
join evals.eval_task_version task_version on task_version.id = trial.task_version_id
join evals.eval_task task on task.id = task_version.task_id;
