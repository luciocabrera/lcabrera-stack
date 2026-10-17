/**
 * The decisions behind `vp run evals:baseline`: which runner a suite uses,
 * what the arguments mean, when the tree is too dirty to describe a commit,
 * when a baseline may be continued, what a run cut off by the session limit
 * does to the command, and the order the effects run in. Every effect arrives as an argument, so
 * the refusals are testable without a model, a database or a dirty checkout.
 * Usage: imported by `run-baseline.mjs`.
 */
import { parseArgs } from 'node:util';

import { wholeNumberProblem } from './agent-sessions.mjs';
import { BASELINE_ID_VARIABLE, SESSION_LIMIT_EXIT } from './run-envelope.mjs';

export const BASELINE_RUNNERS = {
  'skill-quality': {
    path: 'skill-quality/verify-skill-quality.mjs',
    takesModel: true,
  },
  skills: { path: 'skills/verify-skill-triggers.mjs', takesModel: true },
  'verifier-fixtures': {
    path: 'verifier-fixtures/verify-verifier-verdicts.mjs',
    takesModel: false,
  },
  'verifier-tooled': {
    path: 'verifier-fixtures/verify-verifier-tooled.mjs',
    takesModel: false,
  },
};

const PREFIX = 'evals:baseline:';

const INTERRUPT_CODES = { SIGINT: 130, SIGTERM: 143 };

const INTERRUPT_STATUSES = new Set(Object.values(INTERRUPT_CODES));

const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu;

const MIN_CHUNK_RUNS = 1;

const refused = (message) => ({ message: `${PREFIX} ${message}`, ok: false });

const isBaselineRunner = (suite) => Object.hasOwn(BASELINE_RUNNERS, suite);

const suiteProblem = (suite) => {
  if (suite === undefined) {
    return '--suite is required';
  }
  return isBaselineRunner(suite)
    ? null
    : `--suite must be one of ${Object.keys(BASELINE_RUNNERS).join(', ')}; got "${suite}"`;
};

const modelProblem = ({ model, suite }) =>
  model === undefined ||
  !isBaselineRunner(suite) ||
  BASELINE_RUNNERS[suite].takesModel
    ? null
    : `the ${suite} runner fixes its own model, so --model does not apply`;

const runsOf = ({ defaultRuns, runs }) =>
  runs === undefined ? defaultRuns : Number(runs);

const runsProblem = (given) =>
  given === undefined
    ? null
    : wholeNumberProblem({ minimum: MIN_CHUNK_RUNS, value: given });

const baselineIdProblem = (baselineId) =>
  baselineId === undefined || UUID.test(baselineId)
    ? null
    : `--baseline-id must be the uuid a baseline was started under; got "${baselineId}"`;

const readArgs = (argv) => {
  try {
    return {
      ok: true,
      values: parseArgs({
        args: argv,
        options: {
          'baseline-id': { type: 'string' },
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
  const { 'baseline-id': baselineId, model, runs: given, suite } = read.values;
  const runs = runsOf({ defaultRuns, runs: given });
  const problem = [
    suiteProblem(suite),
    modelProblem({ model, suite }),
    runsProblem(given),
    baselineIdProblem(baselineId),
  ].find((found) => found !== null);
  return problem === undefined
    ? { baselineId, model, ok: true, runs, suite }
    : refused(problem);
};

const spanProblem = ({ asked, label, prior }) => {
  const others = prior.filter((value) => value !== asked);
  return others.length === 0
    ? null
    : `baseline ${label.baselineId} was started on ${label.noun} ${others.join(', ')}, and this run is on ${label.noun} ${asked}; a baseline spans one ${label.noun}, so start a new one`;
};

const headProblem = (gitSha) =>
  gitSha === undefined
    ? 'could not read the commit at HEAD, so it cannot tell whether this run continues the baseline'
    : null;

const priorProblem = ({ baselineId, prior, suite }) =>
  prior.gitShas.length === 0
    ? `no readable run of baseline ${baselineId} is under the ${suite} results, so there is nothing to continue; leave out --baseline-id to start one`
    : null;

const continuedModel = ({ model, prior, suite }) =>
  BASELINE_RUNNERS[suite].takesModel ? (model ?? prior.modelIds[0]) : undefined;

const modelSpanProblem = ({ baselineId, model, prior }) =>
  model === undefined
    ? null
    : spanProblem({
        asked: model,
        label: { baselineId, noun: 'model' },
        prior: prior.modelIds,
      });

export const continuation = ({ baselineId, gitSha, model, prior, suite }) => {
  const continued = continuedModel({ model, prior, suite });
  const problem = [
    headProblem(gitSha),
    priorProblem({ baselineId, prior, suite }),
    spanProblem({
      asked: gitSha,
      label: { baselineId, noun: 'commit' },
      prior: prior.gitShas,
    }),
    modelSpanProblem({ baselineId, model: continued, prior }),
  ].find((found) => found !== null);
  return problem === undefined
    ? { model: continued, ok: true, priorFiles: prior.files }
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

const stopped = ({ effects, index, problems, total }) => {
  for (const problem of problems) {
    effects.error(`${PREFIX} ${problem}`);
  }
  effects.error(
    `${PREFIX} stopped after run ${index} of ${total} rather than spend the rest on a failing harness; no baseline was written`,
  );
  return 1;
};

const problemsBeforeNextRun = ({ args, effects, index, priorFiles, total }) =>
  index < total
    ? effects.checkRuns({ ...args, exclude: priorFiles, runs: index })
    : [];

const runOne = ({ args, effects, index, total }) => {
  effects.log(`${PREFIX} run ${index} of ${total}`);
  const ran = effects.runOnce(args);
  const code = interruptCode(ran);
  if (code !== null) {
    effects.error(
      `${PREFIX} interrupted during run ${index}; no baseline was written`,
    );
    return { code, kind: 'ended' };
  }
  return { kind: ran.status === SESSION_LIMIT_EXIT ? 'limited' : 'ran' };
};

const runSuite = async ({ args, effects, priorFiles, total }) => {
  const indexes = Array.from({ length: total }, (_, offset) => offset + 1);
  for (const index of indexes) {
    const ran = runOne({ args, effects, index, total });
    if (ran.kind !== 'ran') {
      return { ...ran, index };
    }
    const problems = await problemsBeforeNextRun({
      args,
      effects,
      index,
      priorFiles,
      total,
    });
    if (problems.length > 0) {
      return {
        code: stopped({ effects, index, problems, total }),
        kind: 'ended',
      };
    }
  }
  return { index: total, kind: 'done' };
};

const continued = async ({ effects, parsed }) => {
  if (parsed.baselineId === undefined) {
    return {
      ...parsed,
      baselineId: effects.mintId(),
      ok: true,
      priorFiles: [],
    };
  }
  const decided = continuation({
    baselineId: parsed.baselineId,
    gitSha: effects.gitHead(),
    model: parsed.model,
    prior: await effects.baselineSoFar({
      baselineId: parsed.baselineId,
      suite: parsed.suite,
    }),
    suite: parsed.suite,
  });
  return decided.ok ? { ...parsed, ...decided } : decided;
};

const localChecks = ({ argv, defaultRuns, effects }) => {
  const parsed = parseBaselineArgs({ argv, defaultRuns });
  if (!parsed.ok) {
    return parsed;
  }
  const dirty = dirtyTreeProblem(effects.gitStatus());
  return dirty === null ? parsed : { message: dirty, ok: false };
};

const preflight = async ({ argv, defaultRuns, effects }) => {
  const parsed = localChecks({ argv, defaultRuns, effects });
  const baseline = parsed.ok ? await continued({ effects, parsed }) : parsed;
  if (!baseline.ok) {
    return baseline;
  }
  const database = await effects.probeDatabase();
  return database.ok ? baseline : database;
};

const startLine = ({ baselineId, priorFiles, runs, suite }) =>
  priorFiles.length === 0
    ? `${PREFIX} baseline ${baselineId}: ${runs} runs of ${suite}`
    : `${PREFIX} baseline ${baselineId}: ${runs} more runs of ${suite}, after the ${priorFiles.length} it holds`;

const limitedLine = ({ baselineId, index, runs }) =>
  `${PREFIX} run ${index} of ${runs} was cut off by the session limit, so it is left out and no run after it was started; once the limit resets, continue with --baseline-id ${baselineId}`;

const recordChunk = async ({ effects, ended, parsed }) => {
  const { baselineId, priorFiles, runs, suite } = parsed;
  const isLimited = ended.kind === 'limited';
  if (isLimited) {
    effects.error(limitedLine({ baselineId, index: ended.index, runs }));
  }
  const recorded = await effects.record({
    baselineId,
    earlier: priorFiles,
    runs: priorFiles.length + ended.index,
    suite,
  });
  return isLimited ? SESSION_LIMIT_EXIT : recorded;
};

export const runBaseline = async ({ argv, defaultRuns, effects }) => {
  const parsed = await preflight({ argv, defaultRuns, effects });
  if (!parsed.ok) {
    effects.error(parsed.message);
    return 1;
  }
  effects.log(startLine(parsed));
  const ended = await runSuite({
    args: {
      baselineId: parsed.baselineId,
      model: parsed.model,
      suite: parsed.suite,
    },
    effects,
    priorFiles: parsed.priorFiles,
    total: parsed.runs,
  });
  return ended.kind === 'ended'
    ? ended.code
    : recordChunk({ effects, ended, parsed });
};
