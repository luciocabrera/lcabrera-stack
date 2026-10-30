/**
 * The command behind `repo-fallow-gate`, with every effect passed in, so the
 * whole run is testable without spawning fallow. Governed by
 * .claude/rules/scripts.md.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import { readWorkspaceGraph } from './affected-tests.mjs';
import { readChangedFiles, REPO_ROOT } from './changed-runner.mjs';
import { withoutSeparator } from './cli-input.mjs';
import { errorMessage } from './error-message.mjs';
import {
  formatFinding,
  incompleteReason,
  introducedChanges,
  parseReport,
  reportFindings,
} from './fallow-gate-report.mjs';
import {
  ANALYSES,
  fallowArgs,
  mutationArgs,
  mutationRoots,
  NEEDS_BASE,
  sourceFiles,
  toRepoPath,
  verdictSource,
} from './fallow-gate.mjs';
import { runGitStatus } from './git-exec.mjs';

export const COULD_NOT_RUN = 2;

const readInput = ({ argv, effects }) => {
  const [analysis, ...given] = withoutSeparator(argv);
  if (!ANALYSES.includes(analysis)) {
    throw new Error(
      `usage: repo-fallow-gate <${ANALYSES.join('|')}> [--] [file…]`,
    );
  }
  const listed = given.length === 0 ? effects.readStdinFiles() : given;
  const files = sourceFiles(
    listed.map((file) => toRepoPath({ file, root: effects.root })),
  ).filter((file) => effects.exists(file));
  return { analysis, files };
};

const requireBase = ({ analysis, base }) => {
  if (!base && NEEDS_BASE.has(analysis)) {
    throw new Error(
      `${analysis} gates the changed lines, so it needs the merge base in CHANGED_FILES_BASE.`,
    );
  }
};

const runFallow = ({ args, effects, stdout = 'inherit' }) => {
  const child = effects.spawn(args, stdout);
  if (child.error !== undefined) {
    throw new Error(`fallow could not start: ${errorMessage(child.error)}`);
  }
  return child;
};

const readJson = ({ args, effects }) => {
  const child = runFallow({ args, effects, stdout: 'pipe' });
  if (child.status !== 0) {
    effects.write(child.stdout ?? '');
    throw new Error(
      `fallow ${args[0]} exited ${child.status ?? 'abnormally'}.`,
    );
  }
  return parseReport(child.stdout);
};

const assertModelReady = (effects) => {
  const status = readJson({
    args: ['similar-code', 'status', '--format', 'json', '--quiet'],
    effects,
  });
  if (status.model_ready !== true) {
    throw new Error(
      'similar-code has no local model installed, so it compared nothing. Install it once with `fallow similar-code setup --local`.',
    );
  }
};

const readDiff = ({ base, effects }) => {
  const child = effects.git([
    'diff',
    '-U0',
    '--no-color',
    '--no-renames',
    base,
    '--',
  ]);
  if (child.error !== undefined || child.status !== 0) {
    throw new Error(
      `git diff against ${base} failed, so no change can be attributed.`,
    );
  }
  return child.stdout;
};

const gateOnReport = ({ analysis, base, effects, files }) => {
  if (analysis === 'similar-code') assertModelReady(effects);
  const report = readJson({ args: fallowArgs({ analysis, files }), effects });
  const incomplete = incompleteReason({ analysis, report });
  if (incomplete !== undefined) throw new Error(incomplete);
  const introduced =
    analysis === 'coverage-gaps'
      ? introducedChanges({ diff: readDiff({ base, effects }), files })
      : undefined;
  const findings = reportFindings({ analysis, introduced, report });
  if (findings.length === 0) {
    effects.write(
      `fallow ${analysis}: no finding in ${files.length} changed source file(s).\n`,
    );
    return 0;
  }
  effects.write(
    `fallow ${analysis}: ${findings.length} finding(s) in the changed files:\n\n${findings
      .map((finding) => `  ${formatFinding(finding)}\n`)
      .join('')}`,
  );
  return 1;
};

const gateOnExitCode = ({ analysis, base, effects, files }) =>
  runFallow({ args: fallowArgs({ analysis, base, files }), effects }).status ??
  COULD_NOT_RUN;

const gateOnMutation = ({ base, effects, files }) => {
  const { roots, unrooted } = mutationRoots({
    files,
    workspaceDirs: effects.workspaceDirs(),
  });
  for (const file of unrooted) {
    effects.write(
      `fallow mutation: ${file} sits in no directory with tests, so it is not mutated.\n`,
    );
  }
  return roots.reduce((worst, root) => {
    effects.write(`\nfallow mutation: ${root}\n`);
    const status =
      runFallow({ args: mutationArgs({ base, root }), effects }).status ??
      COULD_NOT_RUN;
    return Math.max(worst, status);
  }, 0);
};

const GATES = {
  'exit-code': gateOnExitCode,
  mutation: gateOnMutation,
  report: gateOnReport,
};

export const runGate = ({ argv, base, effects }) => {
  try {
    const { analysis, files } = readInput({ argv, effects });
    requireBase({ analysis, base });
    if (files.length === 0) {
      effects.write(
        `fallow ${analysis}: no changed source file, so there is nothing to check.\n`,
      );
      return 0;
    }
    return GATES[verdictSource(analysis)]({ analysis, base, effects, files });
  } catch (error) {
    effects.writeError(`repo-fallow-gate: ${errorMessage(error)}\n`);
    return COULD_NOT_RUN;
  }
};

const fallowEntry = () =>
  join(
    dirname(
      createRequire(join(REPO_ROOT, 'package.json')).resolve(
        'fallow/package.json',
      ),
    ),
    'bin',
    'fallow',
  );

const runNode = (args, stdout) => {
  try {
    return {
      status: 0,
      stdout: execFileSync(process.execPath, args, {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        maxBuffer: 2 ** 29,
        stdio: ['ignore', stdout, 'inherit'],
      }),
    };
  } catch (error) {
    return typeof error.status === 'number' || error.signal
      ? { status: error.status, stdout: error.stdout }
      : { error };
  }
};

const processEffects = (proc) => ({
  exists: (file) => existsSync(join(REPO_ROOT, file)),
  git: (args) => runGitStatus({ args, cwd: REPO_ROOT }),
  readStdinFiles: () => (proc.stdin.isTTY ? [] : readChangedFiles()),
  root: REPO_ROOT,
  spawn: (args, stdout) => runNode([fallowEntry(), ...args], stdout),
  workspaceDirs: () => readWorkspaceGraph(REPO_ROOT).map(({ dir }) => dir),
  write: (text) => proc.stdout.write(text),
  writeError: (text) => proc.stderr.write(text),
});

export const runFallowGateCommand = (proc) =>
  runGate({
    argv: proc.argv.slice(2),
    base: proc.env.CHANGED_FILES_BASE,
    effects: processEffects(proc),
  });
