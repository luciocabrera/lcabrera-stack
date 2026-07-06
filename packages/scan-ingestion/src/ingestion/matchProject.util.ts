import { execFileSync } from 'node:child_process';
import path from 'node:path';

import { canonicalRealPath } from '../fs/canonicalRealPath.util.ts';

// Restrict command lookup to fixed, non-writable system directories so a
// writable (potentially attacker-controlled) directory earlier in the
// inherited PATH cannot shadow the real `git` binary (Sonar S4036).
const TRUSTED_PATH = '/usr/local/bin:/usr/bin:/bin';

type RunGitArgs = {
  readonly cwd: string;
  readonly gitArgs: readonly string[];
};

const runGit = ({ cwd, gitArgs }: RunGitArgs): string | undefined => {
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

export type ResolvedProjectPath = {
  readonly canonicalPath: string;
  readonly gitBranch: string | undefined;
  readonly gitCommitSha: string | undefined;
  readonly projectName: string;
};

type ResolveProjectPathArgs = {
  readonly localPath: string;
};

/**
 * Resolves the ad hoc interactive-session path to a stable, canonical
 * project identity: `git rev-parse --show-toplevel` (falling back to
 * localPath itself outside a git repo) then realpath-canonicalized, since
 * that's the projects.local_path unique-constraint key. Uses execFileSync
 * (no shell) rather than a string-interpolated shell command — localPath
 * ultimately traces back to user input (project registration).
 */
export const resolveProjectPath = ({
  localPath,
}: ResolveProjectPathArgs): ResolvedProjectPath => {
  const gitRoot = runGit({
    cwd: localPath,
    gitArgs: ['rev-parse', '--show-toplevel'],
  });
  const canonicalPath = canonicalRealPath(gitRoot ?? localPath);

  return {
    canonicalPath,
    gitBranch: runGit({
      cwd: canonicalPath,
      gitArgs: ['rev-parse', '--abbrev-ref', 'HEAD'],
    }),
    gitCommitSha: runGit({
      cwd: canonicalPath,
      gitArgs: ['rev-parse', 'HEAD'],
    }),
    projectName: path.basename(canonicalPath),
  };
};
