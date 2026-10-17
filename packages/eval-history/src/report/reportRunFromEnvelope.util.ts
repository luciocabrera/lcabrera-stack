import type { RunEnvelope } from '../envelope/envelope.types.ts';

import { subjectKey } from './subjectKey.util.ts';

export const reportRunFromEnvelope = ({
  run,
  subjects,
  tasks,
  trials,
}: RunEnvelope) => {
  const trialledKeys = new Set(trials.map(({ task_key }) => task_key));
  const trialledTasks = tasks.filter(({ task_key }) =>
    trialledKeys.has(task_key),
  );
  const trialledSubjects = new Set(
    trialledTasks.map(({ subject }) => subjectKey(subject)),
  );

  return {
    branch: run.branch,
    catalogHash: run.catalog_hash ?? undefined,
    costUsdReported: run.totals.cost_usd_reported ?? undefined,
    durationsMs: trials
      .map(({ duration_ms }) => duration_ms)
      .filter((duration) => duration !== null),
    gitSha: run.git_sha,
    harnessVersion: run.harness_version,
    modelId: run.model_id ?? undefined,
    runId: run.run_id,
    status: run.status,
    subjects: subjects
      .filter((subject) => trialledSubjects.has(subjectKey(subject)))
      .map(({ content_hash, kind, name }) => ({
        contentHash: content_hash,
        kind,
        name,
      })),
    suite: run.suite,
    tasks: trialledTasks.map((task) => ({
      agentPromptHash: task.agent_prompt_hash ?? undefined,
      expectedHash: task.expected_hash ?? undefined,
      fixtureHash: task.fixture_hash ?? undefined,
      judgePromptHash: task.judge_prompt_hash ?? undefined,
      outcomes: trials
        .filter(({ task_key }) => task_key === task.task_key)
        .toSorted((left, right) => left.trial_index - right.trial_index)
        .map(({ outcome }) => outcome),
      taskHash: task.task_hash,
      taskKey: task.task_key,
    })),
  };
};
