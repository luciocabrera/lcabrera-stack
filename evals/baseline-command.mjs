/**
 * The decisions behind `vp run evals:baseline`: which runner a suite uses,
 * what the arguments mean, when the tree is too dirty to describe a commit,
 * and the order the effects run in. Every effect arrives as an argument, so
 * the refusals are testable without a model, a database or a dirty checkout.
 * Usage: imported by `run-baseline.mjs`.
 */
import { parseArgs } from 'node:util';

import { BASELINE_ID_VARIABLE } from './run-envelope.mjs';

export const BASELINE_RUNNERS = {
  'skill-quality': 'skill-quality/verify-skill-quality.mjs',
  skills: 'skills/verify-skill-triggers.mjs',
  'verifier-fixtures': 'verifier-fixtures/verify-verifier-verdicts.mjs',
  'verifier-tooled': 'verifier-fixtures/verify-verifier-tooled.mjs',
};

const MODEL_SUITES = new Set(['skill-quality', 'skills']);

const PREFIX = 'evals:baseline:';

const INTERRUPT_CODES = { SIGINT: 130, SIGTERM: 143 };

const INTERRUPT_STATUSES = new Set(Object.values(INTERRUPT_CODES));

const refused = (message) => ({ message: `${PREFIX} ${message}`, ok: false });

const suiteProblem = (suite) => {
  if (suite === undefined) {
    return '--suite is required';
  }
  return Object.hasOwn(BASELINE_RUNNERS, suite)
    ? null
    : `--suite must be one of ${Object.keys(BASELINE_RUNNERS).join(', ')}; got "${suite}"`;
};

const modelProblem = ({ model, suite }) =>
  model === undefined || MODEL_SUITES.has(suite)
    ? null
    : `the ${suite} runner fixes its own model, so --model does not apply`;

const runsOf = ({ defaultRuns, runs }) =>
  runs === undefined ? defaultRuns : Number(runs);

const runsProblem = ({ given, runs }) =>
  Number.isInteger(runs) && runs >= 2
    ? null
    : `--runs must be a whole number of at least 2; got "${given}"`;

const readArgs = (argv) => {
  try {
    return {
      ok: true,
      values: parseArgs({
        args: argv,
        options: {
          model: { type: 'string' },
          runs: { type: 'string' },
          suite: { type: 'string' },
        },
      }).values,
    };
  } catch (error) {
    return refused(error instanceof Error ? error.message : String(error));
  }
};

export const parseBaselineArgs = ({ argv, defaultRuns }) => {
  const read = readArgs(argv);
  if (!read.ok) {
    return read;
  }
  const { model, runs: given, suite } = read.values;
  const runs = runsOf({ defaultRuns, runs: given });
  const problem = [
    suiteProblem(suite),
    modelProblem({ model, suite }),
    runsProblem({ given, runs }),
  ].find((found) => found !== null);
  return problem === undefined
    ? { model, ok: true, runs, suite }
    : refused(problem);
};

export const runnerArgs = ({ model }) =>
  model === undefined ? [] : ['--model', model];

export const dirtyTreeProblem = (porcelain) => {
  if (porcelain === undefined) {
    return `${PREFIX} could not read git status, so it cannot tell whether the tree is clean`;
  }
  const changed = porcelain
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
  return changed.length === 0
    ? null
    : [
        `${PREFIX} the working tree is dirty, so a baseline would not describe any commit. Commit or discard these first:`,
        ...changed.map((line) => `  ${line}`),
      ].join('\n');
};

const signalCode = (signal) => INTERRUPT_CODES[signal] ?? 1;

export const interruptCode = ({ signal, status }) => {
  if (signal) {
    return signalCode(signal);
  }
  return INTERRUPT_STATUSES.has(status) ? status : null;
};

export const runEnvironment = ({ baselineId, env }) => ({
  ...env,
  [BASELINE_ID_VARIABLE]: baselineId,
});

const runSuite = ({ args, effects, total }) => {
  const indexes = Array.from({ length: total }, (_, offset) => offset + 1);
  for (const index of indexes) {
    effects.log(`${PREFIX} run ${index} of ${total}`);
    const code = interruptCode(effects.runOnce(args));
    if (code !== null) {
      effects.error(
        `${PREFIX} interrupted during run ${index}; no baseline was written`,
      );
      return code;
    }
  }
  return null;
};

const preflight = async ({ argv, defaultRuns, effects }) => {
  const parsed = parseBaselineArgs({ argv, defaultRuns });
  if (!parsed.ok) {
    return parsed;
  }
  const dirty = dirtyTreeProblem(effects.gitStatus());
  if (dirty !== null) {
    return { message: dirty, ok: false };
  }
  const database = await effects.probeDatabase();
  return database.ok ? parsed : database;
};

export const runBaseline = async ({ argv, defaultRuns, effects }) => {
  const parsed = await preflight({ argv, defaultRuns, effects });
  if (!parsed.ok) {
    effects.error(parsed.message);
    return 1;
  }
  const baselineId = effects.mintId();
  effects.log(
    `${PREFIX} baseline ${baselineId}: ${parsed.runs} runs of ${parsed.suite}`,
  );
  const interrupted = runSuite({
    args: { baselineId, model: parsed.model, suite: parsed.suite },
    effects,
    total: parsed.runs,
  });
  return (
    interrupted ?? (await effects.record({ baselineId, suite: parsed.suite }))
  );
};
