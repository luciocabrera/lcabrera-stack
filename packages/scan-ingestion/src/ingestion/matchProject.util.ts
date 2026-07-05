import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { basename } from 'node:path';

const runGit = (args: readonly string[], cwd: string): string | undefined => {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
};

type ResolveProjectPathArgs = {
  readonly localPath: string;
};

export type ResolvedProjectPath = {
  readonly canonicalPath: string;
  readonly gitBranch: string | undefined;
  readonly gitCommitSha: string | undefined;
  readonly projectName: string;
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
  const gitRoot = runGit(['rev-parse', '--show-toplevel'], localPath);
  const canonicalPath = realpathSync(gitRoot ?? localPath);

  return {
    canonicalPath,
    gitBranch: runGit(['rev-parse', '--abbrev-ref', 'HEAD'], canonicalPath),
    gitCommitSha: runGit(['rev-parse', 'HEAD'], canonicalPath),
    projectName: basename(canonicalPath),
  };
};
