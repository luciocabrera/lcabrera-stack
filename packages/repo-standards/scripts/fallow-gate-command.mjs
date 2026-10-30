/**
 * The command behind `repo-fallow-gate`, with every effect passed in, so the
 * whole run is testable without spawning fallow. Governed by
 * .claude/rules/scripts.md.
 */
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { readWorkspaceGraph } from './affected-tests.mjs';
import { REPO_ROOT } from './changed-runner.mjs';
import { withoutSeparator } from './cli-input.mjs';
import { errorMessage } from './error-message.mjs';
import {
  gitDiffArgs,
  introducedChanges,
  joinDiffs,
  parseDiff,
  untrackedFileDiff,
} from './fallow-gate-diff.mjs';
import {
  formatFinding,
  incompleteReason,
  parseReport,
  reportFindings,
} from './fallow-gate-report.mjs';
import {
  ANALYSES,
  binOf,
  COULD_NOT_RUN,
  fallowArgs,
  gateExit,
  mutationArgs,
  mutationRoots,
  NEEDS_BASE,
  REPOSITORY_ROOT,
  RUNS_ON_ANY_CHANGE,
  sourceFiles,
  toRepoPath,
  verdictSource,
} from './fallow-gate.mjs';
import { runGitStatus } from './git-exec.mjs';

const readInput = ({ argv, effects }) => {
  const [analysis, ...given] = withoutSeparator(argv);
  if (!ANALYSES.includes(analysis)) {
    throw new Error(
      `usage: repo-fallow-gate <${ANALYSES.join('|')}> [--] [file…]`,
    );
  }
  const listed = given.length === 0 ? effects.readStdinFiles() : given;
  const existing = listed
    .map((file) => toRepoPath({ file, root: effects.root }))
    .filter((file) => effects.exists(file));
  return { analysis, existing, files: sourceFiles(existing) };
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

const readDiff = ({ base, effects, files = [] }) => {
  const child = effects.git(gitDiffArgs({ base, files }));
  if (child.exceeded !== undefined) {
    throw new Error(
      `git diff against ${base} is larger than the ${child.exceeded} bytes this gate reads, so no change can be attributed.`,
    );
  }
  if (child.error !== undefined || child.status !== 0) {
    throw new Error(
      `git diff against ${base} failed, so no change can be attributed.`,
    );
  }
  return child.stdout;
};

const outsideDiff = ({ base, effects, files }) => {
  const tracked = readDiff({ base, effects, files });
  const listed = parseDiff(tracked);
  return joinDiffs([
    tracked,
    ...files
      .filter((file) => !listed.has(file))
      .map((path) =>
        untrackedFileDiff({ content: effects.readFile(path), path }),
      ),
  ]);
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
  gateExit({
    analysis,
    status: runFallow({ args: fallowArgs({ analysis, base, files }), effects })
      .status,
  });

const mutateRoot = ({ base, diffFile, effects, root }) => {
  effects.write(`\nfallow mutation: ${root}\n`);
  const status = gateExit({
    analysis: 'mutation',
    status: runFallow({ args: mutationArgs({ base, diffFile, root }), effects })
      .status,
  });
  if (status === COULD_NOT_RUN) {
    effects.writeError(
      `repo-fallow-gate: fallow mutation could not run in ${root}.\n`,
    );
  }
  return status;
};

const mutateOutside = ({ base, effects, outside }) => {
  effects.write(
    `\nfallow mutation: ${outside.length} changed file(s) outside every workspace, from the repository root: ${outside.join(', ')}\n`,
  );
  return effects.withTempFile(
    outsideDiff({ base, effects, files: outside }),
    (diffFile) =>
      mutateRoot({ base, diffFile, effects, root: REPOSITORY_ROOT }),
  );
};

const gateOnMutation = ({ base, effects, files }) => {
  const { outside, roots } = mutationRoots({
    files,
    workspaceDirs: effects.workspaceDirs(),
  });
  const statuses = [
    ...roots.map((root) => mutateRoot({ base, effects, root })),
    ...(outside.length === 0
      ? []
      : [mutateOutside({ base, effects, outside })]),
  ];
  return statuses.includes(1) ? 1 : Math.max(0, ...statuses);
};

const GATES = {
  'exit-code': gateOnExitCode,
  mutation: gateOnMutation,
  report: gateOnReport,
};

export const runGate = ({ argv, base, effects }) => {
  try {
    const { analysis, existing, files } = readInput({ argv, effects });
    requireBase({ analysis, base });
    const anyChange = RUNS_ON_ANY_CHANGE.has(analysis);
    if ((anyChange ? existing : files).length === 0) {
      const noun = anyChange ? 'file' : 'source file';
      effects.write(
        `fallow ${analysis}: no changed ${noun}, so there is nothing to check.\n`,
      );
      return 0;
    }
    return GATES[verdictSource(analysis)]({ analysis, base, effects, files });
  } catch (error) {
    effects.writeError(`repo-fallow-gate: ${errorMessage(error)}\n`);
    return COULD_NOT_RUN;
  }
};

const fallowEntry = () => {
  const manifestPath = createRequire(join(REPO_ROOT, 'package.json')).resolve(
    'fallow/package.json',
  );
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  return join(dirname(manifestPath), binOf({ manifest, name: 'fallow' }));
};

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

export const processEffects = (proc) => ({
  exists: (file) => existsSync(join(REPO_ROOT, file)),
  git: (args) => runGitStatus({ args, cwd: REPO_ROOT, maxBuffer: 2 ** 29 }),
  readFile: (file) => readFileSync(join(REPO_ROOT, file), 'utf8'),
  readStdinFiles: () => {
    if (proc.stdin.isTTY) {
      throw new Error(
        'no files were named and stdin is a terminal, so there is nothing to read. Pipe the changed files in, or name them after --.',
      );
    }
    return readFileSync(proc.stdin.fd, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  },
  root: REPO_ROOT,
  spawn: (args, stdout) => runNode([fallowEntry(), ...args], stdout),
  withTempFile: (content, use) => {
    const directory = mkdtempSync(join(tmpdir(), 'repo-fallow-gate-'));
    const path = join(directory, 'changes.diff');
    try {
      writeFileSync(path, content);
      return use(path);
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  },
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
