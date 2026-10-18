export const trimSnapshotsQuery = (keptPerSubject: number) => ({
  text: `with ranked as (
  select id, row_number() over (
    partition by subject_id order by first_seen_at desc, id desc
  ) as position
  from evals.eval_subject_version
  where content is not null
),
trimmed as (
  update evals.eval_subject_version version
  set content = null
  from ranked
  where ranked.id = version.id
    and ranked.position > $1::integer
  returning version.id
)
select count(*)::integer as count from trimmed`,
  values: [keptPerSubject],
});
