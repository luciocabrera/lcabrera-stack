/**
 * Opens a false-positive case: re-runs the analyzer, keeps the finding only if
 * the analyzer still reports it, and writes what the blind panel reads. The
 * builder's view of the finding is not an input. Policy:
 * docs/agents/public-package-suppressions.md.
 *
 * Usage: vp run adjudicate -- <analyzer> <file>:<line>[-<end line>]:<rule> [--trace <target>] [--pr <number>]
 * Exit codes: 0 = case written; 1 = bad arguments, or the finding is not reported.
 */
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';
import process from 'node:process';

import { readWorkspaceGraph } from '../packages/repo-standards/scripts/affected-tests.mjs';
import { runGitStatus } from '../packages/repo-standards/scripts/git-exec.mjs';
import { readConventions } from '../packages/repo-standards/scripts/config.mjs';
import { CASES_DIR, openCase } from './lib/adjudicate-command.mjs';
import { takenCaseNames } from './lib/adjudication-case.mjs';
import { repoPath, toolEntry } from './lib/tool-paths.mjs';

const ROOT = process.cwd();

const inRepo = (path) => repoPath({ path, root: ROOT });

const run = ({ args, cwd = '.', tool }) => {
  const from = inRepo(cwd);
  try {
    return {
      status: 0,
      stdout: execFileSync(
        process.execPath,
        [toolEntry({ from, tool }), ...args],
        {
          cwd: from,
          encoding: 'utf8',
          maxBuffer: 2 ** 28,
          stdio: ['ignore', 'pipe', 'ignore'],
        },
      ),
    };
  } catch (error) {
    if (typeof error.status !== 'number') throw error;
    return { status: error.status, stdout: String(error.stdout ?? '') };
  }
};

const git = (args) => {
  const { status, stdout } = runGitStatus({ args, cwd: ROOT });
  if (status !== 0) throw new Error(`git ${args.join(' ')} failed`);
  return stdout;
};

const baseRef = () => {
  const named = process.env.CHANGED_FILES_BASE;
  if (named === undefined) return git(['merge-base', 'HEAD', 'origin/main']);
  if (named.startsWith('-')) {
    throw new Error(`CHANGED_FILES_BASE "${named}" is not a git ref`);
  }
  return named;
};

const caseNames = () =>
  takenCaseNames({
    committed: git([
      'ls-tree',
      '--name-only',
      `origin/${readConventions(ROOT).defaultBranch}`,
      '--',
      `${CASES_DIR}/`,
    ])
      .split('\n')
      .filter(Boolean),
    local: existsSync(inRepo(CASES_DIR)) ? readdirSync(inRepo(CASES_DIR)) : [],
  });

const workspaceOf = (file) => {
  const owner = readWorkspaceGraph(ROOT)
    .map(({ dir }) => dir)
    .filter((dir) => file.startsWith(`${dir}/`))
    .toSorted((left, right) => right.length - left.length)[0];
  if (owner === undefined) {
    throw new Error(
      `${file} is in no workspace, so no ESLint config governs it`,
    );
  }
  return owner;
};

const isRepoFile = (file) => {
  const path = inRepo(file);
  return existsSync(path) && statSync(path).isFile();
};

const effects = {
  caseNames,
  fallowRegistry: () =>
    JSON.parse(
      readFileSync(inRepo('node_modules/fallow/issue-registry.json'), 'utf8'),
    ),
  isRepoFile,
  now: () => new Date().toISOString(),
  readJson: (path) => JSON.parse(readFileSync(inRepo(path), 'utf8')),
  readText: (path) => readFileSync(inRepo(path), 'utf8'),
  run,
  shas: () => ({
    base: git(['rev-parse', '--verify', `${baseRef()}^{commit}`]),
    head: git(['rev-parse', '--verify', 'HEAD^{commit}']),
  }),
  workspaceOf,
  write: (text) => process.stdout.write(text),
  writeJson: (path, value) => {
    const target = inRepo(path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
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
