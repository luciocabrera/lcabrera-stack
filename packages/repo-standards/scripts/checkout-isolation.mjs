/**
 * Decides whether a checkout is the shared primary clone parked on a feature
 * branch — the failure `docs/coordination/README.md` calls "the exact failure
 * this rule exists to stop".
 *
 * Why this exists: the rule was prose with no checker, and it drifted. A feature
 * branch in the shared clone moves `HEAD` under every other agent working there,
 * so the next command anyone runs is silently on someone else's branch. Prose
 * did not hold for `commands:verify`, `docs:verify` or `suppressions:verify`
 * either; this is the same remedy applied to the coordination rule.
 *
 * Two constraints shape the decision, and both are why this is a pure function
 * over facts rather than an inline check:
 *
 *   - **CI is exempt, and must be.** `actions/checkout` produces a primary
 *     checkout on a feature branch for every PR, so an unconditional guard fails
 *     100% of CI runs. That is not the failure being guarded against: a runner
 *     is ephemeral and single-purpose, with no second agent to disturb. The
 *     prevention that does work everywhere is `coordination:claim` defaulting to
 *     a worktree; this is the backstop for when someone bypasses it.
 *
 *   - **A dirty tree gets a warning, not a failure.** `coordination:verify` runs
 *     inside `check:push`, which the pre-push hook runs, so a hard failure here
 *     blocks the push. The README's remedy — "`git checkout main` is always
 *     safe" — holds only when nothing is uncommitted. Failing a dirty tree would
 *     leave someone with work they cannot push and no clean way out, which is
 *     how a gate teaches people to bypass it.
 */

import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { isExemptBranch } from './branch-exemption.mjs';
import { runGit } from './git-exec.mjs';

/**
 * @param {object} facts
 * @param {boolean} facts.isPrimary   `.git` is a directory (see git-dir.mjs)
 * @param {string}  facts.branch      current branch, '' when detached
 * @param {string} [facts.defaultBranch]  the configured trunk; `main` when the
 *   caller has no config to read, which is the value every gate defaulted to
 *   before it was configurable
 * @param {boolean} facts.isDirty     any uncommitted tracked change
 * @param {boolean} facts.underCI     running on a CI runner
 * @returns {{severity: 'problem'|'warning', message: string} | undefined}
 */
export const checkoutIsolationFinding = ({
  branch,
  defaultBranch = 'main',
  isDirty,
  isPrimary,
  underCI,
}) => {
  if (underCI || !isPrimary || isExemptBranch({ branch, defaultBranch })) {
    return undefined;
  }

  const shared = `the primary checkout is on \`${branch}\`, not \`${defaultBranch}\``;
  const why =
    'a feature branch here moves HEAD under every other agent in this clone';

  return isDirty
    ? {
        message:
          `${shared} — ${why}. It has uncommitted changes, so switching is not ` +
          `safe to do for you: commit or stash them, then \`git checkout ${defaultBranch}\` ` +
          'and redo the work in a worktree (`coordination:claim` makes one).',
        severity: 'warning',
      }
    : {
        message:
          `${shared} — ${why}. The tree is clean, so \`git checkout ${defaultBranch}\` is ` +
          'safe. Work in a worktree instead: `vp run coordination:claim -- ' +
          '<id> "<title>" --new-issue` (worktrees are the default).',
        severity: 'problem',
      };
};

export const readCheckoutFacts = (repoRoot) => {
  const gitEntry = join(repoRoot, '.git');
  const status = runGit({
    args: ['status', '--porcelain', '--untracked-files=no'],
    cwd: repoRoot,
  });

  return {
    branch: runGit({ args: ['branch', '--show-current'], cwd: repoRoot }) ?? '',
    isDirty: status === undefined || status !== '',
    isPrimary: existsSync(gitEntry) && statSync(gitEntry).isDirectory(),
    underCI: process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true',
  };
};
