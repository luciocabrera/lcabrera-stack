/**
 * Writes the run envelope every eval runner leaves behind, to
 * `.tmp/eval-results/<suite>/<run_id>.json`, with its transcripts beside it in
 * `<run_id>/`. It is written on every way out: `complete` on a normal finish,
 * `partial` when the run throws, `aborted` on SIGINT or SIGTERM, after which
 * the signal is raised again so the process ends the way it was asked to. An
 * envelope that fails the schema is not written, and the error names each field.
 * Each envelope written prints the run's pass rate, with n and its Wilson
 * interval at the thresholds in `regression.config.json`, beside its path.
 * The envelope and every transcript are scrubbed of secrets as they are
 * written, and a transcript is hashed after it, so the size and hash the
 * envelope records describe the file on disk; the envelope returned is the
 * scrubbed one that was written.
 * A complete or partial envelope is then sent to the eval-history database,
 * after the signal handlers are removed, so a signal during the send cannot
 * rewrite it; an aborted one is left for `vp run evals:ingest`.
 * Usage: imported by every runner under `evals/`.
 */
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { userInfo } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseEnvelope } from '@repo/eval-history/envelope/parseEnvelope.util';
import { harnessVersion } from '@repo/eval-history/hashing/harnessVersion.util';
import { loadRegressionConfig } from '@repo/eval-history/stats/loadRegressionConfig.service';

import { runGit } from '../packages/repo-standards/scripts/git-exec.mjs';

import {
  actorOf,
  assembleEnvelope,
  branchOf,
  envelopeProblems,
  environmentOf,
  passRateLine,
  prNumberOf,
  relativeImports,
  triggerOf,
} from './run-envelope.mjs';
import { ingestAfterRun } from './run-ingest.mjs';
import { writeScrubbed } from './transcript-scrub.mjs';

const EVALS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = dirname(EVALS_DIR);
export const RESULTS_DIR = '.tmp/eval-results';
const SHARED_MODULE = join(EVALS_DIR, 'agent-sessions.mjs');
const REGRESSION_CONFIG = join(EVALS_DIR, 'regression.config.json');
const SIGNALS = ['SIGINT', 'SIGTERM'];

const git = (args) => runGit({ args, cwd: REPO_ROOT });

export const runIdentity = ({ env = process.env, now = Date.now() } = {}) => ({
  actor: actorOf({
    email: git(['config', 'user.email']),
    env,
    user: userInfo().username,
  }),
  branch: branchOf({ env, head: git(['rev-parse', '--abbrev-ref', 'HEAD']) }),
  env: environmentOf({
    arch: process.arch,
    env,
    node: process.version,
    os: process.platform,
  }),
  git_dirty: (git(['status', '--porcelain']) ?? '') !== '',
  git_sha: git(['rev-parse', 'HEAD']) ?? '',
  pr_number: prNumberOf(env),
  run_id: randomUUID(),
  started_at: new Date(now).toISOString(),
  trigger: triggerOf(env),
});

export const sdkVersion = () => {
  const entry = fileURLToPath(
    import.meta.resolve('@anthropic-ai/claude-agent-sdk'),
  );
  return JSON.parse(readFileSync(join(dirname(entry), 'package.json'), 'utf8'))
    .version;
};

const insideEvals = (file) => !relative(EVALS_DIR, file).startsWith('..');

const importsOf = (file) =>
  relativeImports(readFileSync(file, 'utf8'))
    .map((specifier) => resolve(dirname(file), specifier))
    .filter(insideEvals);

const importClosure = (pending, seen = new Set()) => {
  const [file, ...rest] = pending;
  if (file === undefined) {
    return [...seen];
  }
  return seen.has(file)
    ? importClosure(rest, seen)
    : importClosure([...rest, ...importsOf(file)], new Set([...seen, file]));
};

export const runnerHarnessVersion = (runnerUrl) =>
  harnessVersion(
    importClosure([fileURLToPath(runnerUrl), SHARED_MODULE]).map((file) => ({
      bytes: readFileSync(file),
      path: relative(REPO_ROOT, file).replaceAll('\\', '/'),
    })),
  );

const runDirectory = ({ resultsDir, runId, suite }) =>
  join(resultsDir, suite, runId);

export const saveTranscript = ({
  env = process.env,
  name,
  resultsDir = RESULTS_DIR,
  runId,
  suite,
  text,
}) => {
  const directory = runDirectory({ resultsDir, runId, suite });
  const file = join(directory, name);
  mkdirSync(directory, { recursive: true });
  const bytes = writeScrubbed({ env, file, text });
  return {
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    uri: file.replaceAll('\\', '/'),
  };
};

export const saveEnvelope = ({
  env = process.env,
  envelope,
  resultsDir = RESULTS_DIR,
}) => {
  const parsed = parseEnvelope(envelope);
  if (!parsed.ok) {
    throw new Error(
      [
        `the ${envelope.run?.suite} run envelope failed validation:`,
        ...envelopeProblems(parsed.issues).map((problem) => `  ${problem}`),
      ].join('\n'),
    );
  }
  const directory = join(resultsDir, envelope.run.suite);
  const file = join(directory, `${envelope.run.run_id}.json`);
  mkdirSync(directory, { recursive: true });
  const bytes = writeScrubbed({
    env,
    file,
    text: `${JSON.stringify(parsed.envelope, null, 2)}\n`,
  });
  return { envelope: JSON.parse(bytes.toString('utf8')), file };
};

const reportSaved = ({ regressionConfig, saved }) => {
  console.log(
    passRateLine({ regressionConfig, totals: saved.envelope.run.totals }),
  );
  console.log(`Envelope: ${saved.file}`);
  return saved;
};

const saveOrReport = (save) => {
  try {
    return save();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return null;
  }
};

export const recordRun = async ({
  clock = Date.now,
  env = process.env,
  execute,
  identity,
  ingest = ingestAfterRun,
  plan,
  raise = (signal) => process.kill(process.pid, signal),
  regressionConfig = loadRegressionConfig({ file: REGRESSION_CONFIG }),
  resultsDir = RESULTS_DIR,
  signals = process,
}) => {
  const thresholds = await regressionConfig;
  const trials = [];
  const save = (status) =>
    reportSaved({
      regressionConfig: thresholds,
      saved: saveEnvelope({
        envelope: assembleEnvelope({
          finishedAt: clock(),
          identity,
          plan,
          regressionConfig: thresholds,
          status,
          trials,
        }),
        env,
        resultsDir,
      }),
    });
  const listeners = SIGNALS.map((signal) => [
    signal,
    () => {
      stopListening();
      saveOrReport(() => save('aborted'));
      raise(signal);
    },
  ]);
  const stopListening = () => {
    for (const [signal, listener] of listeners) {
      signals.off(signal, listener);
    }
  };
  for (const [signal, listener] of listeners) {
    signals.on(signal, listener);
  }
  const context = {
    addTrial: (trial) => trials.push(trial),
    transcript: ({ name, text }) =>
      saveTranscript({
        env,
        name,
        resultsDir,
        runId: identity.run_id,
        suite: plan.suite,
        text,
      }),
  };
  try {
    const result = await Promise.resolve()
      .then(() => execute(context))
      .catch(async (error) => {
        stopListening();
        const saved = saveOrReport(() => save('partial'));
        if (saved !== null) {
          await ingest({ file: saved.file });
        }
        throw error;
      });
    stopListening();
    const saved = save('complete');
    await ingest({ file: saved.file });
    return { ...saved, result };
  } finally {
    stopListening();
  }
};
