// Spawning git under the same discipline the rest of this repo applies, and
// for the same two reasons — restated here rather than imported, because a
// published package cannot depend on the repo tooling it was extracted from:
//
// - **`cwd` does not select the repository — `GIT_DIR` does.** Git resolves
//   that variable and its six relatives ahead of the working directory, and
//   exports them to every hook and everything a hook spawns. A scanner asked
//   for the git root of the project it is scanning would confidently answer
//   about a different one. This matters more here than almost anywhere: these
//   runners are spawned by an orchestrator, and the answer becomes every
//   finding's `location_path`.
// - **PATH is pinned to fixed system directories**, and the binary is named
//   outright, so a writable directory earlier in the inherited PATH cannot
//   shadow the real git (Sonar S4036).
//
// The originating repo's `scripts/lib/git-exec.test.mjs` asserts this variable
// list agrees with its other copies, so the duplication cannot drift.

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

/** Fixed, non-writable system directories — never the inherited PATH. */
const TRUSTED_DIRECTORIES = ['/usr/local/bin', '/usr/bin', '/bin'];
const TRUSTED_PATH = TRUSTED_DIRECTORIES.join(':');

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

/** The git binary as an absolute path from a fixed directory, or undefined. */
export const gitBinary = () =>
  TRUSTED_DIRECTORIES.map((directory) => `${directory}/git`).find((path) =>
    existsSync(path),
  );

/**
 * Trimmed stdout, or `undefined` when git fails for any reason — a missing
 * binary, a path that is not a repository, no permission. Every caller here
 * already treats an absent answer as "this scope is not in a git worktree".
 */
export const runGit = ({ args, cwd }) => {
  const binary = gitBinary();
  if (binary === undefined) return undefined;
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
