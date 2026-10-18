import type { RunJudgeScore, RunSummary, RunTrial } from './queries.types.ts';

type RunProjectionArgs = {
  readonly run: RunSummary;
  readonly scores: readonly RunJudgeScore[];
  readonly trials: readonly RunTrial[];
};

export const runProjection = ({ run, scores, trials }: RunProjectionArgs) => {
  const scoresByTrial = Map.groupBy(scores, ({ trialId }) => trialId);
  const tasks = new Map(
    trials.map((trial) => [
      trial.taskKey,
      {
        kind: trial.taskKind,
        subject: { kind: trial.subjectKind, name: trial.subjectName },
        task_key: trial.taskKey,
      },
    ]),
  );

  return {
    run: {
      branch: run.branch,
      finished_at: run.finishedAt.toISOString(),
      git_sha: run.gitSha,
      model_id: run.modelId,
      run_id: run.runId,
      started_at: run.startedAt.toISOString(),
      status: run.status,
      suite: run.suite,
      trigger: run.trigger,
    },
    tasks: tasks.values().toArray(),
    trials: trials.map((trial) => ({
      detail: {
        dimensions: (scoresByTrial.get(trial.trialId) ?? []).map(
          ({ dimension, score }) => ({ name: dimension, score }),
        ),
        expected_skill: trial.expectedSkill,
        invoked: trial.invoked,
        overall: trial.overall,
        verdict: trial.verdict,
      },
      duration_ms: trial.durationMs,
      error_class: trial.errorClass,
      outcome: trial.outcome,
      task_key: trial.taskKey,
      trial_index: trial.trialIndex,
    })),
  };
};
