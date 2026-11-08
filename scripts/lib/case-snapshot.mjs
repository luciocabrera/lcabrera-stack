/**
 * The commit a false-positive case is judged at. HEAD when it holds the
 * flagged lines; otherwise a snapshot of the working tree made with
 * `git stash create`, which writes a commit object without running a hook and
 * without moving a ref, so a line the pre-commit hook refuses can still reach
 * the panel. ADR-147 is the policy.
 */
import { execFileSync } from 'node:child_process';
import process from 'node:process';

import { buildGitEnv } from '../../packages/repo-standards/scripts/git-exec.mjs';
import { hashLines } from './false-positive-markers.mjs';
import { systemBinary } from './panel-tree.mjs';

const git = ({ args, root }) =>
  execFileSync(systemBinary('git'), args, {
    cwd: root,
    encoding: 'utf8',
    env: buildGitEnv(process.env),
    maxBuffer: 2 ** 28,
  });

export const textAt = ({ file, root, sha }) => {
  try {
    return git({ args: ['cat-file', 'blob', `${sha}:${file}`], root });
  } catch {
    return undefined;
  }
};

export const stashSnapshot = ({ root }) =>
  git({ args: ['stash', 'create'], root }).trim();

const holds = ({ code, text }) =>
  text !== undefined &&
  hashLines(text.split('\n').slice(code.start - 1, code.end)) ===
    code.content_hash;

const STAGE_IT =
  'git stash create keeps only tracked files, so stage a new file with git add, which runs no hook, and open the case again';

export const caseCommit = ({ code, file, head, snapshot, textAt: at }) => {
  if (holds({ code, text: at(head) })) return { sha: head, snapshot: false };
  const sha = snapshot();
  if (sha === '') {
    throw new Error(
      `HEAD does not hold the flagged lines of ${file}, and there is nothing to snapshot: no tracked file differs from HEAD. ${STAGE_IT}.`,
    );
  }
  if (!holds({ code, text: at(sha) })) {
    throw new Error(
      `neither HEAD nor the working-tree snapshot ${sha} holds the flagged lines of ${file}. ${STAGE_IT}.`,
    );
  }
  return { sha, snapshot: true };
};
