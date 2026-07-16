import { runGit } from './runGit.util.ts';

export type GitMetadata = {
  readonly gitBranch: string | undefined;
  readonly gitCommitSha: string | undefined;
};

type ReadGitMetadataArgs = {
  readonly cwd: string;
};

/**
 * Stamps an ad hoc run with its branch/SHA (ADR-028) — the surviving
 * remnant of matchProject.util.ts's resolveProjectPath: project identity
 * moved to an explicit projectId, so the git-root walk and path
 * canonicalization retired with the local_path model. Returns undefineds
 * outside a git work tree (synced snapshots carry no .git).
 */
export const readGitMetadata = ({ cwd }: ReadGitMetadataArgs): GitMetadata => ({
  gitBranch: runGit({ cwd, gitArgs: ['rev-parse', '--abbrev-ref', 'HEAD'] }),
  gitCommitSha: runGit({ cwd, gitArgs: ['rev-parse', 'HEAD'] }),
});
