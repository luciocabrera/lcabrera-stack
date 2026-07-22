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
 *   this repository outright — see the `ingestion/git/` section of
 *   `packages/scan-ingestion/ARCHITECTURE.md`.
 * - **PATH is pinned to fixed system directories** so a writable directory
 *   earlier in the inherited PATH cannot shadow the real `git` binary
 *   (Sonar S4036).
 *
 * The variable list is duplicated in three places by necessity — a shell hook,
 * a TypeScript package util, and this module cannot import from each other.
 * `git-exec.test.mjs` asserts all three agree, so the copies cannot drift.
 *
 * Most root scripts deliberately avoid subprocesses entirely and read `.git`
 * directly (see `git-dir.mjs`). Use this only where that is impractical —
 * reading blobs out of another branch needs git's object store, which means
 * decompressing packfiles by hand otherwise.
 */
import { execFileSync } from 'node:child_process';

/** Fixed, non-writable system directories — never the inherited PATH. */
const TRUSTED_PATH = '/usr/local/bin:/usr/bin:/bin';

/**
 * Every variable through which git can be told which repository to operate on.
 * `GIT_CEILING_DIRECTORIES` and `GIT_DISCOVERY_ACROSS_FILESYSTEM` are
 * deliberately absent: they only ever make discovery stricter.
 */
export const GIT_REPOSITORY_VARIABLES = [
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_COMMON_DIR',
  'GIT_DIR',
  'GIT_INDEX_FILE',
  'GIT_NAMESPACE',
  'GIT_OBJECT_DIRECTORY',
  'GIT_WORK_TREE',
];

/** A denylist, not an allowlist — git still needs HOME, the locale, and so on. */
export const buildGitEnv = (env) => ({
  ...Object.fromEntries(
    Object.entries(env).filter(
      ([name]) => !GIT_REPOSITORY_VARIABLES.includes(name),
    ),
  ),
  PATH: TRUSTED_PATH,
});

/**
 * Trimmed stdout, or `undefined` when git fails for any reason — a missing
 * binary, a missing ref, no network. Callers decide what an absent answer
 * means; none of them should treat it as "nothing to report".
 */
export const runGit = ({ args, cwd }) => {
  try {
    return execFileSync('git', args, {
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
