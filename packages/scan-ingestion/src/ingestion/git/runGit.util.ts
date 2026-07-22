import { execFileSync } from 'node:child_process';

import { buildGitChildEnv } from './buildGitChildEnv.util.ts';

type RunGitArgs = {
  readonly cwd: string;
  readonly gitArgs: readonly string[];
};

/**
 * Runs a git subcommand and returns its trimmed stdout, or undefined when
 * git fails (not a repo, missing binary, invalid ref). execFileSync (no
 * shell) — cwd traces back to user-influenced input.
 *
 * The environment is rebuilt rather than inherited (`buildGitChildEnv`), so
 * `cwd` is genuinely what picks the repository. Passing `process.env` through
 * would let an ambient `GIT_DIR` override it, and the caller would get a
 * confident answer about the wrong repository instead of an error.
 */
export const runGit = ({ cwd, gitArgs }: RunGitArgs) => {
  try {
    return execFileSync('git', gitArgs, {
      cwd,
      encoding: 'utf8',
      env: buildGitChildEnv({ env: process.env }),
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return;
  }
};
