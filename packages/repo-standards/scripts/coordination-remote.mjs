/**
 * Reads coordination claims that live on OTHER branches (#233).
 *
 * The register's whole job is to answer "who is working on what" before you
 * start. But `coordination:claim` creates the task file *and* the branch, then
 * commits the task onto that branch — so a claim is off-`main` from the moment
 * it exists and stays there for the life of the work. A verifier that reads
 * only the working tree therefore sees every agent's own claim and nobody
 * else's, and reports "0 warnings" during exactly the window where two live
 * branches could collide. That is a guard whose failure mode is silence: the
 * clean result is indistinguishable from having looked and found nothing.
 *
 * Committing claims straight to `main` instead was considered and does not
 * work here: `main` carries an active ruleset with six required status checks,
 * so a direct push is rejected outright (the same wall the changelog bot hit).
 * A claim would need a full PR and a green CI run before anyone else could see
 * it, which is not a claim you can make *before* you start.
 *
 * Two rules keep the result honest:
 *
 * 1. **Live branches only, decided by the remote.** Remote-tracking refs go
 *    stale silently — this checkout held 109 of them against 4 real branches,
 *    because the repo deletes branches on merge and nothing prunes locally.
 *    Reading those would resurrect long-merged claims as fresh collisions, so
 *    the branch list comes from `ls-remote` and local refs are only ever used
 *    to read contents.
 * 2. **A branch that cannot be read is reported, never skipped.** An unfetched
 *    branch is a blind spot; silently dropping it is the bug this module
 *    exists to fix.
 */

import { readConventions, readRegisters } from './config.mjs';
import { NO_BRANCH } from './coordination-overlap.mjs';
import { parseFrontmatter } from './coordination-parse.mjs';
import { runGit } from './git-exec.mjs';

const TASKS_DIR = `${readRegisters().coordinationTasksDir}/`;
const DEFAULT_BRANCH = readConventions().defaultBranch;
const HEADS_PREFIX = 'refs/heads/';

export const parseLsRemoteHeads = (stdout, defaultBranch = DEFAULT_BRANCH) =>
  String(stdout ?? '')
    .split('\n')
    .map((line) => line.split('\t'))
    .filter(([sha, ref]) => sha && ref?.startsWith(HEADS_PREFIX))
    .map(([sha, ref]) => ({ branch: ref.slice(HEADS_PREFIX.length), sha }))
    .filter(({ branch }) => branch !== defaultBranch);

const taskPathsAt = ({ cwd, git, ref }) => {
  const listed = git({
    args: ['ls-tree', '-r', '--name-only', ref, '--', TASKS_DIR],
    cwd,
  });
  return String(listed ?? '')
    .split('\n')
    .filter((path) => path.endsWith('.md') && !path.includes('/_'));
};

const claimsOnBranch = ({ cwd, git, branch, sha }) => {
  const ref = `refs/remotes/origin/${branch}`;
  const local = git({ args: ['rev-parse', '--verify', '--quiet', ref], cwd });
  if (local === undefined || local !== sha) {
    return undefined;
  }
  return taskPathsAt({ cwd, git, ref })
    .map((path) => ({
      path,
      body: git({ args: ['show', `${ref}:${path}`], cwd }),
    }))
    .filter(({ body }) => body !== undefined)
    .map(({ body, path }) => {
      const data = parseFrontmatter(body);
      const declaredOn = data?.branch ?? branch;
      return {
        branch,
        data,
        name: `${path.slice(TASKS_DIR.length)} (branch ${declaredOn})`,
      };
    });
};

export const readRemoteClaims = ({ cwd, git = runGit }) => {
  const heads = git({ args: ['ls-remote', '--heads', 'origin'], cwd });
  if (heads === undefined) {
    return {
      claims: [],
      readBranches: [],
      unavailable: true,
      unreadBranches: [],
    };
  }

  const liveBranches = parseLsRemoteHeads(heads);
  const readBranches = [];
  const unreadBranches = [];
  const claims = liveBranches.flatMap(({ branch, sha }) => {
    const found = claimsOnBranch({ branch, cwd, git, sha });
    if (found === undefined) {
      unreadBranches.push(branch);
      return [];
    }
    readBranches.push(branch);
    return found;
  });

  return {
    claims: dedupeById(
      withoutMergedBranches({
        claims,
        liveBranches: liveBranches.map(({ branch }) => branch),
      }),
    ),
    readBranches,
    unavailable: false,
    unreadBranches,
  };
};

export const withoutMergedBranches = ({ claims, liveBranches }) => {
  const live = new Set([...liveBranches, DEFAULT_BRANCH]);
  return claims.filter(({ data }) => {
    const declared = data?.branch;
    return (
      declared === undefined || NO_BRANCH.has(declared) || live.has(declared)
    );
  });
};

export const dedupeById = (claims) => {
  const byId = new Map();
  for (const claim of claims) {
    const existing = byId.get(claim.data?.id);
    if (existing === undefined || claim.branch === claim.data?.branch) {
      byId.set(claim.data?.id, claim);
    }
  }
  return [...byId.values()];
};

export const withoutLocalDuplicates = ({ localTasks, remoteClaims }) => {
  const localIds = new Set(localTasks.map(({ data }) => data.id));
  return remoteClaims.filter(({ data }) => !localIds.has(data.id));
};
