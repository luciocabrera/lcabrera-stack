/**
 * Opens a false-positive case: re-runs the analyzer, keeps the finding only if
 * the analyzer still reports it, and writes what the blind panel reads. The
 * builder's view of the finding is not an input. Policy:
 * docs/agents/public-package-suppressions.md.
 *
 * Usage: vp run adjudicate -- <analyzer> <file>:<line>[-<end line>]:<rule> [--trace <target>] [--pr <number>]
 * Exit codes: 0 = case written; 1 = bad arguments, or the finding is not reported.
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';

import { readWorkspaceGraph } from '../packages/repo-standards/scripts/affected-tests.mjs';
import {
  CASES_DIR,
  openCase,
  UNTRACKED_CASES_DIR,
} from './lib/adjudicate-command.mjs';

const ROOT = process.cwd();

const SPAWN_OPTIONS = { encoding: 'utf8', maxBuffer: 2 ** 28 };

const settled = (child) => {
  if (child.error !== undefined) throw child.error;
  return { status: child.status, stdout: child.stdout ?? '' };
};

const run = ({ args, cwd = '.' }) =>
  settled(spawnSync('vp', args, { ...SPAWN_OPTIONS, cwd: join(ROOT, cwd) }));

const git = (args) => {
  const { status, stdout } = settled(
    spawnSync('git', args, { ...SPAWN_OPTIONS, cwd: ROOT }),
  );
  if (status !== 0) throw new Error(`git ${args.join(' ')} failed`);
  return stdout.trim();
};

const caseNames = () =>
  [CASES_DIR, UNTRACKED_CASES_DIR].flatMap((dir) =>
    existsSync(join(ROOT, dir)) ? readdirSync(join(ROOT, dir)) : [],
  );

const workspaceOf = (file) => {
  const owner = readWorkspaceGraph(ROOT)
    .map(({ dir }) => dir)
    .filter((dir) => file.startsWith(`${dir}/`))
    .toSorted((left, right) => right.length - left.length)[0];
  if (owner === undefined)
    throw new Error(
      `${file} is in no workspace, so no ESLint config governs it`,
    );
  return owner;
};

const effects = {
  caseNames,
  fallowRegistry: () =>
    JSON.parse(
      readFileSync(
        join(ROOT, 'node_modules/fallow/issue-registry.json'),
        'utf8',
      ),
    ),
  now: () => new Date().toISOString(),
  readJson: (path) => JSON.parse(readFileSync(join(ROOT, path), 'utf8')),
  readText: (path) => readFileSync(join(ROOT, path), 'utf8'),
  run,
  shas: () => ({
    base: git([
      'rev-parse',
      process.env.CHANGED_FILES_BASE ??
        git(['merge-base', 'HEAD', 'origin/main']),
    ]),
    head: git(['rev-parse', 'HEAD']),
  }),
  workspaceOf,
  write: (text) => process.stdout.write(text),
  writeJson: (path, value) => {
    mkdirSync(dirname(join(ROOT, path)), { recursive: true });
    writeFileSync(join(ROOT, path), `${JSON.stringify(value, null, 2)}\n`);
  },
};

try {
  process.exitCode = openCase({ argv: process.argv.slice(2), effects });
} catch (error) {
  process.stderr.write(
    `adjudicate: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
}
