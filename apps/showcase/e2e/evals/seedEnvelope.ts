import type { RunEnvelope } from '@repo/eval-history/envelope/envelope.types';

import { runEnvelopeSchema } from '@repo/eval-history/envelope/envelope.schema';
import { createHash } from 'node:crypto';

export type SeedRun = {
  readonly baselineId?: string;
  readonly branch: string;
  readonly catalog?: string;
  readonly contentVersion?: Readonly<Record<string, string>>;
  readonly isCostReported?: boolean;
  readonly modelId: string;
  readonly runId: string;
  readonly scores?: Readonly<Record<string, SeedScore>>;
  readonly startedAt: string;
  readonly suite: SeedSuite;
  readonly tasks: readonly SeedTask[];
  readonly trials: Readonly<Record<string, readonly SeedTrial[]>>;
};

export type SeedScore = {
  readonly dimensions: Readonly<Record<string, number>>;
  readonly overall: number;
};

export type SeedSuite = RunEnvelope['run']['suite'];

export type SeedTask = {
  readonly expectedSkill?: string;
  readonly key: string;
  readonly kind: RunEnvelope['tasks'][number]['kind'];
  readonly subject: {
    readonly kind: RunEnvelope['subjects'][number]['kind'];
    readonly name: string;
  };
};

export type SeedTrial =
  | 'fail'
  | 'pass'
  | 'skipped'
  | 'timeout'
  | `error:${string}`;

type DetailArgs = Omit<TrialArgs, 'position' | 'trialIndex'>;

type TrialArgs = {
  readonly position: number;
  readonly run: SeedRun;
  readonly task: SeedTask;
  readonly trial: SeedTrial;
  readonly trialIndex: number;
};

const JSON_NULL: unknown = JSON.parse('null');

const TRIAL_COST_USD = 0.12;

const TOKENS = { cache_read: 100, cache_write: 20, input: 1000, output: 200 };

export const seedHash = (text: string) =>
  createHash('sha256').update(text).digest('hex');

export const seedGitSha = (runId: string) =>
  seedHash(`commit:${runId}`).slice(0, 40);

const isError = (trial: SeedTrial): trial is `error:${string}` =>
  trial.startsWith('error:');

const outcomeOf = (trial: SeedTrial) => (isError(trial) ? 'error' : trial);

const triggerOf = ({ baselineId, branch }: SeedRun) => {
  if (baselineId !== undefined) {
    return 'baseline';
  }

  return branch === 'main' ? 'ci-scheduled' : 'ci-pr';
};

const invokedOf = ({ task, trial }: Omit<DetailArgs, 'run'>) => {
  if (trial === 'pass') {
    return task.kind === 'trigger' ? [task.expectedSkill ?? ''] : [];
  }

  return trial === 'fail' && task.kind === 'near-miss'
    ? [task.expectedSkill ?? '']
    : [];
};

const scoreOf = ({ run, task }: Omit<DetailArgs, 'trial'>) => {
  const score = run.scores?.[task.key];

  if (score === undefined) {
    throw new Error(`no judge score for ${task.key} in ${run.runId}`);
  }

  return score;
};

const detailOf = ({ run, task, trial }: DetailArgs) => {
  switch (run.suite) {
    case 'rules-consistency': {
      return { check: 'indexed', findings: [], schema: 'rules/1' };
    }
    case 'skill-quality': {
      const { dimensions, overall } = scoreOf({ run, task });

      return {
        dimensions: Object.entries(dimensions).map(([name, score]) => ({
          feedback: `Scored ${String(score)} on ${name}.`,
          name,
          score,
        })),
        judge_model: run.modelId,
        overall,
        problem: JSON_NULL,
        reply_sha256: seedHash(`${run.runId}:${task.key}:reply`),
        schema: 'quality/1',
        summary: `Overall ${String(overall)}.`,
      };
    }
    case 'skills': {
      return {
        expected_skill: task.expectedSkill ?? '',
        fixture_read: true,
        init_tools: ['Read', 'Skill'],
        invoked: invokedOf({ task, trial }),
        schema: 'skills/1',
        should_trigger: task.kind === 'trigger',
      };
    }
    default: {
      return {
        expected_not_met: [],
        fixture: task.key,
        matched: trial === 'pass',
        not_met: trial === 'pass' ? [] : [1],
        schema: 'verifier/1',
        verdict: trial === 'pass' ? 'PASS' : 'FAIL',
      };
    }
  }
};

const at = ({
  milliseconds,
  startedAt,
}: {
  readonly milliseconds: number;
  readonly startedAt: string;
}) => new Date(Date.parse(startedAt) + milliseconds).toISOString();

const trialOf = ({ position, run, task, trial, trialIndex }: TrialArgs) => {
  const outcome = outcomeOf(trial);
  const durationMs = 8000 + ((position * 7919) % 23) * 1000;
  const cost = run.isCostReported === false ? undefined : TRIAL_COST_USD;

  return {
    cost_usd_reported: cost ?? JSON_NULL,
    detail: detailOf({ run, task, trial }),
    duration_api_ms: durationMs - 1000,
    duration_ms: durationMs,
    error_class: isError(trial) ? trial.slice('error:'.length) : JSON_NULL,
    finished_at: at({ milliseconds: durationMs, startedAt: run.startedAt }),
    first_token_at: at({ milliseconds: 1500, startedAt: run.startedAt }),
    model_usage: {
      [run.modelId]: {
        costUSD: cost ?? 0,
        inputTokens: TOKENS.input,
        outputTokens: TOKENS.output,
      },
    },
    outcome,
    queued_at: run.startedAt,
    started_at: at({ milliseconds: 100, startedAt: run.startedAt }),
    task_key: task.key,
    tokens: TOKENS,
    transcript: JSON_NULL,
    trial_index: trialIndex,
    turns: 4,
  };
};

const subjectsOf = (run: SeedRun) =>
  new Map(
    run.tasks.map(({ subject }) => [
      `${subject.kind}/${subject.name}`,
      subject,
    ]),
  )
    .values()
    .map((subject) => ({
      content_hash: seedHash(
        `${subject.name}:${run.contentVersion?.[subject.name] ?? 'v1'}`,
      ),
      kind: subject.kind,
      name: subject.name,
      path: `.github/skills/${subject.name}`,
    }))
    .toArray();

const taskOf = ({ run, task }: Omit<DetailArgs, 'trial'>) => ({
  agent_prompt_hash: JSON_NULL,
  expected_hash: JSON_NULL,
  fixture_hash:
    run.suite === 'skills' ? seedHash(`${task.key}:fixture`) : JSON_NULL,
  judge_prompt_hash:
    run.suite === 'skill-quality' ? seedHash(`${task.key}:judge`) : JSON_NULL,
  kind: task.kind,
  set: 'regression',
  source: JSON_NULL,
  subject: task.subject,
  tags: [],
  task_hash: seedHash(`${task.key}:task`),
  task_key: task.key,
});

const count = (
  trials: readonly ReturnType<typeof trialOf>[],
  outcome: string,
) => trials.filter((trial) => trial.outcome === outcome).length;

export const seedEnvelope = (run: SeedRun) => {
  const trials = run.tasks.flatMap((task, taskIndex) =>
    (run.trials[task.key] ?? []).map((trial, trialIndex) =>
      trialOf({
        position: taskIndex * 3 + trialIndex,
        run,
        task,
        trial,
        trialIndex,
      }),
    ),
  );
  const k = count(trials, 'pass');
  const n = k + count(trials, 'fail');

  return runEnvelopeSchema.parse({
    run: {
      actor: 'e2e-seed',
      baseline_id: run.baselineId ?? JSON_NULL,
      branch: run.branch,
      catalog_hash: seedHash(`catalog:${run.catalog ?? 'v1'}`),
      env: { arch: 'x64', ci_runner: JSON_NULL, node: 'v26.10.0', os: 'linux' },
      finished_at: at({ milliseconds: 300_000, startedAt: run.startedAt }),
      git_dirty: false,
      git_sha: seedGitSha(run.runId),
      harness_version: seedHash('harness').slice(0, 12),
      model_id: run.modelId,
      pr_number: JSON_NULL,
      project: 'lcabrera-stack',
      run_id: run.runId,
      sdk_version: '0.3.289',
      settings: {
        argv: [],
        concurrency: 4,
        hidden: [],
        max_turns: JSON_NULL,
        runs: 3,
        selection: [],
        timeout_ms: JSON_NULL,
        tools: ['Read', 'Skill'],
      },
      started_at: run.startedAt,
      status: 'complete',
      suite: run.suite,
      totals: {
        by_outcome: {
          error: count(trials, 'error'),
          fail: count(trials, 'fail'),
          pass: k,
          skipped: count(trials, 'skipped'),
          timeout: count(trials, 'timeout'),
        },
        cost_usd_reported:
          run.isCostReported === false
            ? JSON_NULL
            : TRIAL_COST_USD * trials.length,
        duration_ms: 300_000,
        pass_rate: {
          k,
          lower: JSON_NULL,
          n,
          rate: n > 0 ? k / n : JSON_NULL,
          upper: JSON_NULL,
        },
        tokens: {
          cache_read: TOKENS.cache_read * trials.length,
          cache_write: TOKENS.cache_write * trials.length,
          input: TOKENS.input * trials.length,
          output: TOKENS.output * trials.length,
        },
        trials: trials.length,
      },
      trigger: triggerOf(run),
    },
    schema_version: 1,
    subjects: subjectsOf(run),
    tasks: run.tasks.map((task) => taskOf({ run, task })),
    trials,
  });
};
