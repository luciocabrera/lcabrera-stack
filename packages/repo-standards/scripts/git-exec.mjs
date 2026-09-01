/**
 * Runs `git` for the root tooling scripts, under the same environment
 * discipline the rest of the repo applies to spawned git.
 *
 * Why this exists rather than a bare `execFileSync('git', …)`:
 *
 * - **`cwd` does not select the repository — `GIT_DIR` does.** Git resolves
 *   that variable (and its six relatives) ahead of the working directory, and
 *   exports them to every hook and everything a hook spawns. A script that
 *   reads one repository while another is named by the environment answers
 *   confidently about the wrong one. The same inheritance has twice damaged
 *   this repository outright (#270/#271): a test fixture's `git init`
 *   inherited a linked worktree's `GIT_DIR` and git guessed the repo was bare.
 * - **PATH is pinned to fixed system directories** so a writable directory
 *   earlier in the inherited PATH cannot shadow the real `git` binary
 *   (Sonar S4036).
 *
 * The variable list is duplicated by necessity — a shell hook, a TypeScript
 * package util, a published package's runner and this module cannot import from
 * each other. `git-exec.test.mjs` asserts every copy agrees, so they cannot
 * drift.
 *
 * Most root scripts deliberately avoid subprocesses entirely and read `.git`
 * directly (see `git-dir.mjs`). Use this only where that is impractical —
 * reading blobs out of another branch needs git's object store, which means
 * decompressing packfiles by hand otherwise.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const TRUSTED_DIRECTORIES = ['/usr/local/bin', '/usr/bin', '/bin'];
const TRUSTED_PATH = TRUSTED_DIRECTORIES.join(':');

const gitBinary = () =>
  TRUSTED_DIRECTORIES.map((directory) => `${directory}/git`).find((path) =>
    existsSync(path),
  );

export const GIT_REPOSITORY_VARIABLES = [
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_COMMON_DIR',
  'GIT_DIR',
  'GIT_INDEX_FILE',
  'GIT_NAMESPACE',
  'GIT_OBJECT_DIRECTORY',
  'GIT_WORK_TREE',
];

export const buildGitEnv = (env) => ({
  ...Object.fromEntries(
    Object.entries(env).filter(
      ([name]) => !GIT_REPOSITORY_VARIABLES.includes(name),
    ),
  ),
  PATH: TRUSTED_PATH,
});

export const runGit = ({ args, cwd }) => {
  const binary = gitBinary();
  if (binary === undefined) {
    return undefined;
  }
  try {
    return execFileSync(binary, args, {
      cwd,
      encoding: 'utf8',
      env: buildGitEnv(process.env),
      maxBuffer: 8 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
};

export const runGitStatus = ({ args, cwd }) => {
  const binary = gitBinary();
  if (binary === undefined) {
    return { status: null, stdout: '' };
  }
  try {
    const stdout = execFileSync(binary, args, {
      cwd,
      encoding: 'utf8',
      env: buildGitEnv(process.env),
      maxBuffer: 8 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return { status: 0, stdout: stdout.trim() };
  } catch (error) {
    return {
      status: typeof error.status === 'number' ? error.status : null,
      stdout: String(error.stdout ?? '').trim(),
    };
  }
};
