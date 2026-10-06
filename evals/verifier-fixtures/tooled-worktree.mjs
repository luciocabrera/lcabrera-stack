/**
 * The scratch worktree a tooled verifier fixture runs in: made from the base
 * commit, with the fixture committed, dependencies installed and env files in
 * place, checked afterwards for anything the verifier changed, and removed.
 * Usage: imported by verify-verifier-tooled.mjs.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { runGit } from '../../packages/repo-standards/scripts/git-exec.mjs';

import { nextAdrNumber, withAdrNumber } from './tooled-fixtures.mjs';

const REPO_ROOT = resolve('.');
const VP_BIN = join(REPO_ROOT, 'node_modules', '.bin', 'vp');
const IDENTITY = [
  '-c',
  'core.hooksPath=/dev/null',
  '-c',
  'user.name=verifier-eval',
  '-c',
  'user.email=verifier-eval@example.invalid',
];

export const git = (args, cwd = REPO_ROOT) => {
  const output = runGit({ args, cwd });
  if (output === undefined) {
    throw new Error(`git ${args.join(' ')} failed in ${cwd}`);
  }
  return output;
};

const vp = (args, cwd) =>
  execFileSync(VP_BIN, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });

const applyPatch = ({ text, worktree }) => {
  const patch = `${worktree}.diff`;
  writeFileSync(patch, text);
  try {
    git(['apply', patch], worktree);
  } finally {
    rmSync(patch, { force: true });
  }
};

const applyFixture = ({ diff, worktree }) => {
  const number = nextAdrNumber(
    readdirSync(join(worktree, 'docs', 'decisions')),
  );
  const text = withAdrNumber({ diff, number });
  applyPatch({ text, worktree });
  git(['add', '-A'], worktree);
  git(
    [...IDENTITY, 'commit', '-q', '-m', 'test(evals): verifier fixture'],
    worktree,
  );
  return text;
};

export const prepare = ({ base, branch, diff, worktree }) => {
  git(['worktree', 'add', '-q', '-b', branch, worktree, base]);
  const applied = applyFixture({ diff, worktree });
  vp(['install', '--frozen-lockfile'], worktree);
  vp(['run', 'typegen:all'], worktree);
  vp(['run', 'worktree:env'], worktree);
  return { applied, head: git(['rev-parse', 'HEAD'], worktree) };
};

export const treeProblem = ({ before, head, worktree }) => {
  const dirty = git(['status', '--porcelain'], worktree);
  if (dirty !== '') return `the worktree was left dirty: ${dirty}`;
  if (git(['rev-parse', 'HEAD'], worktree) !== head)
    return 'the worktree HEAD moved';
  return git(['status', '--porcelain']) === before
    ? undefined
    : 'the main checkout changed during the run';
};

export const cleanUp = ({ branch, keep, worktree }) => {
  if (keep) return;
  runGit({ args: ['worktree', 'remove', '--force', worktree], cwd: REPO_ROOT });
  runGit({ args: ['worktree', 'prune'], cwd: REPO_ROOT });
  runGit({ args: ['branch', '-D', branch], cwd: REPO_ROOT });
  rmSync(worktree, { force: true, recursive: true });
};
