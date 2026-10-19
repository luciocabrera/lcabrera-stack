type PruneTranscriptsQueryArgs = {
  readonly keptBranch: string;
  readonly now: Date;
  readonly retentionDays: number;
};

export const pruneTranscriptsQuery = ({
  keptBranch,
  now,
  retentionDays,
}: PruneTranscriptsQueryArgs) => ({
  text: `with pruned as (
  update evals.eval_trial trial
  set transcript_uri = null,
    transcript_sha = null,
    transcript_bytes = null,
    transcript_expires_at = null
  from evals.eval_run run
  where run.run_id = trial.run_id
    and trial.transcript_uri is not null
    and coalesce(
      trial.transcript_expires_at,
      run.finished_at + make_interval(days => $2::integer)
    ) <= $1::timestamptz
    and run.branch <> $3
    and run.trigger <> 'baseline'
    and run.baseline_id is null
  returning trial.id
)
select count(*)::integer as count from pruned`,
  values: [now.toISOString(), retentionDays, keptBranch],
});
