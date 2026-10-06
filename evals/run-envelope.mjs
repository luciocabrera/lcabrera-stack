/**
 * The pure half of the run envelope every eval runner writes: what the CI
 * environment says about the run, a session's metrics as one trial, the
 * totals over the trials with the pass rate's Wilson interval, the line that
 * prints it, and the envelope itself. The shape is the schema in
 * `@repo/eval-history` (ADR-131); the effects live in `run-record.mjs`.
 * Usage: imported by `run-record.mjs` and each suite's envelope module.
 */
import {
  ENVELOPE_SCHEMA_VERSION,
  OUTCOMES,
} from '@repo/eval-history/envelope/envelope.constants';
import { countOutcomes } from '@repo/eval-history/stats/countOutcomes.util';
import { wilson } from '@repo/eval-history/stats/wilson.util';

import { withoutSeparator } from './agent-sessions.mjs';

const TRIGGER_BY_EVENT = {
  merge_group: 'ci-push',
  pull_request: 'ci-pr',
  pull_request_target: 'ci-pr',
  push: 'ci-push',
  schedule: 'ci-scheduled',
  workflow_dispatch: 'ci-manual',
};

const PULL_REF = /^refs\/pull\/(\d+)\//u;

export const triggerOf = (env) =>
  env.GITHUB_ACTIONS === 'true'
    ? (TRIGGER_BY_EVENT[env.GITHUB_EVENT_NAME] ?? 'ci-manual')
    : 'local';

export const prNumberOf = (env) => {
  const digits = PULL_REF.exec(env.GITHUB_REF ?? '')?.[1];
  return digits === undefined ? null : Number(digits);
};

export const branchOf = ({ env, head }) =>
  env.GITHUB_HEAD_REF || env.GITHUB_REF_NAME || head;

export const actorOf = ({ email, env, user }) =>
  env.GITHUB_ACTOR || email?.split('@')[0] || user;

export const environmentOf = ({ arch, env, node, os }) => ({
  arch,
  ci_runner: env.RUNNER_NAME ?? null,
  node,
  os,
});

export const isoAt = (epochMs) =>
  epochMs === undefined ? null : new Date(epochMs).toISOString();

const TOKEN_FIELDS = ['cache_read', 'cache_write', 'input', 'output'];

export const tokensOf = (tokens) =>
  Object.fromEntries(
    TOKEN_FIELDS.map((field) => [field, tokens?.[field] ?? 0]),
  );

const outcomeOf = ({ error, passed }) => {
  if (error !== undefined) {
    return 'error';
  }
  return passed ? 'pass' : 'fail';
};

const errorClassOf = ({ error, fallbackClass, metrics }) =>
  error === undefined ? null : (metrics?.error_class ?? fallbackClass);

const pickReported = (metrics, fields) =>
  Object.fromEntries(fields.map((field) => [field, metrics[field] ?? null]));

const REPORTED_FIELDS = [
  'cost_usd_reported',
  'duration_api_ms',
  'duration_ms',
  'finished_at',
  'first_token_at',
  'started_at',
  'turns',
];

const reportedOf = ({ metrics = {}, queuedAt }) => ({
  ...pickReported(metrics, REPORTED_FIELDS),
  model_usage: metrics.model_usage ?? {},
  queued_at: metrics.queued_at ?? isoAt(queuedAt),
  tokens: tokensOf(metrics.tokens),
});

export const sessionTrial = ({
  detail,
  error,
  fallbackClass = 'harness',
  metrics,
  passed,
  queuedAt,
  taskKey,
  transcript = null,
  trialIndex,
}) => ({
  ...reportedOf({ metrics, queuedAt }),
  detail,
  error_class: errorClassOf({ error, fallbackClass, metrics }),
  outcome: outcomeOf({ error, passed }),
  task_key: taskKey,
  transcript,
  trial_index: trialIndex,
});

const outcomeCounts = (trials) =>
  Object.fromEntries(
    OUTCOMES.map((outcome) => [
      outcome,
      trials.filter((trial) => trial.outcome === outcome).length,
    ]),
  );

const NO_RATE = { lower: null, rate: null, upper: null };

export const passRateOf = ({ regressionConfig, trials }) => {
  const { k, n } = countOutcomes(trials.map(({ outcome }) => outcome));
  const estimate = wilson({
    k,
    minN: regressionConfig.minTrialsForRate,
    n,
    z: regressionConfig.z,
  });
  return estimate.kind === 'rate'
    ? {
        k,
        lower: estimate.lower,
        n,
        rate: estimate.rate,
        upper: estimate.upper,
      }
    : { ...NO_RATE, k, n };
};

const percent = (share) => `${(share * 100).toFixed(1)}%`;

const excludedNote = (excluded) =>
  excluded === 0 ? '' : `; ${excluded} error, timeout or skipped not counted`;

export const passRateLine = ({ regressionConfig, totals }) => {
  const { k, lower, n, rate, upper } = totals.pass_rate;
  const counts = `n=${n}, ${k} passed`;
  const excluded = excludedNote(totals.trials - n);
  return rate === null
    ? `Pass rate: insufficient data (${counts}; a rate needs ${regressionConfig.minTrialsForRate} counted trials${excluded})`
    : `Pass rate: ${percent(rate)} (${counts}; Wilson interval ${percent(lower)}–${percent(upper)} at z=${regressionConfig.z}${excluded})`;
};

const summedTokens = (trials) =>
  Object.fromEntries(
    TOKEN_FIELDS.map((field) => [
      field,
      trials.reduce((total, { tokens }) => total + tokens[field], 0),
    ]),
  );

const reportedCostTotal = ({ costFree, trials }) => {
  if (costFree) {
    return 0;
  }
  const costs = trials
    .map(({ cost_usd_reported }) => cost_usd_reported)
    .filter((cost) => cost !== null);
  return costs.length === 0
    ? null
    : costs.reduce((total, cost) => total + cost, 0);
};

export const runTotals = ({
  costFree,
  durationMs,
  regressionConfig,
  trials,
}) => ({
  by_outcome: outcomeCounts(trials),
  cost_usd_reported: reportedCostTotal({ costFree, trials }),
  duration_ms: durationMs,
  pass_rate: passRateOf({ regressionConfig, trials }),
  tokens: summedTokens(trials),
  trials: trials.length,
});

export const assembleEnvelope = ({
  finishedAt,
  identity,
  plan,
  regressionConfig,
  status,
  trials,
}) => ({
  run: {
    ...identity,
    baseline_id: null,
    catalog_hash: plan.catalogHash ?? null,
    finished_at: new Date(finishedAt).toISOString(),
    harness_version: plan.harnessVersion,
    model_id: plan.modelId ?? null,
    project: 'lcabrera-stack',
    sdk_version: plan.sdkVersion ?? null,
    settings: plan.settings,
    status,
    suite: plan.suite,
    totals: runTotals({
      costFree: plan.modelId === undefined,
      durationMs: Math.max(0, finishedAt - Date.parse(identity.started_at)),
      regressionConfig,
      trials,
    }),
  },
  schema_version: ENVELOPE_SCHEMA_VERSION,
  subjects: plan.subjects,
  tasks: plan.tasks,
  trials,
});

export const taskRecord = (task) => ({
  agent_prompt_hash: null,
  expected_hash: null,
  fixture_hash: null,
  judge_prompt_hash: null,
  set: 'regression',
  source: null,
  tags: [],
  ...task,
});

export const skillSubjects = ({ hashes, selected }) =>
  hashes.skills
    .filter(({ name }) => selected.includes(name))
    .map(({ content_hash, name }) => ({
      content_hash,
      kind: 'skill',
      name,
      path: `.github/skills/${name}`,
    }));

export const runSettings = ({
  argv,
  concurrency,
  hidden = [],
  maxTurns = null,
  runs,
  selection = [],
  tools = [],
}) => ({
  argv: withoutSeparator(argv),
  concurrency,
  hidden,
  max_turns: maxTurns,
  runs,
  selection,
  timeout_ms: null,
  tools,
});

const fieldOf = (path) => (path.length === 0 ? '(root)' : path.join('.'));

export const envelopeProblems = (issues) =>
  issues.map(({ message, path }) => `${fieldOf(path)}: ${message}`);

const RELATIVE_IMPORT = /(?:from|import)\s+'(\.{1,2}\/[^']+)'/gu;

export const relativeImports = (source) =>
  [...source.matchAll(RELATIVE_IMPORT)].map(([, specifier]) => specifier);
