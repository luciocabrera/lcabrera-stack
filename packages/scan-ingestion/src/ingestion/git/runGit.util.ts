import { execFileSync } from 'node:child_process';

// Restrict command lookup to fixed, non-writable system directories so a
// writable (potentially attacker-controlled) directory earlier in the
// inherited PATH cannot shadow the real `git` binary (Sonar S4036).
const TRUSTED_PATH = '/usr/local/bin:/usr/bin:/bin';

type RunGitArgs = {
  readonly cwd: string;
  readonly gitArgs: readonly string[];
};

/**
 * Runs a git subcommand and returns its trimmed stdout, or undefined when
 * git fails (not a repo, missing binary, invalid ref). execFileSync (no
 * shell) — cwd traces back to user-influenced input.
 */
export const runGit = ({ cwd, gitArgs }: RunGitArgs) => {
  try {
    return execFileSync('git', gitArgs, {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, PATH: TRUSTED_PATH },
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
};
