/**
 * Validates a git branch name against the repo standard — the single spec in
 * `./lib/commit-convention.mjs`, the same file the commit-msg hook and the PR
 * gate read. The shape is `<type>/<issue-number>-<kebab-description>`, with
 * `<type>` drawn from the SAME list commits use, so there is one vocabulary
 * rather than two words for one idea.
 *
 * The issue number is the point of the rule: it is what ties a branch back to
 * the context that justified it. `main` and `release-*` are exempt — they are
 * not topic branches.
 *
 * Runs in `.vite-hooks/pre-push` (before anything leaves the machine) and in
 * `.github/workflows/pr-standards.yml` (so a push that skipped the hook with
 * `--no-verify` still fails). Reads the branch from `--branch`, then
 * `BRANCH_NAME`, then `git rev-parse --abbrev-ref HEAD`.
 *
 * Usage:
 *   node scripts/verify-branch-name.mjs
 *   node scripts/verify-branch-name.mjs --branch feat/123-add-pagination
 *
 * Exit codes: 0 = valid or exempt, 1 = does not conform.
 */
import { readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { flagValue } from './lib/cli-input.mjs';
import { validateBranchName } from './lib/commit-convention.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');

/** Resolves the git directory, following the `gitdir:` pointer a linked
 *  worktree uses in place of a `.git` directory. */
const gitDirectory = () => {
  const dotGit = join(REPO_ROOT, '.git');
  if (statSync(dotGit, { throwIfNoEntry: false })?.isDirectory() === true) {
    return dotGit;
  }
  const pointer = readFileSync(dotGit, 'utf8').trim();
  const target = pointer.replace(/^gitdir:\s*/, '');
  return isAbsolute(target) ? target : resolve(dirname(dotGit), target);
};

/**
 * Reads the checked-out branch from `.git/HEAD` rather than shelling out to
 * `git rev-parse`. No subprocess means no PATH to trust — a `git` resolved
 * through an inherited PATH can be shadowed by a writable directory earlier in
 * it — and nothing to scrub: the `GIT_DIR` family redirects the git BINARY, not
 * a file read, so the class of bug behind #270 cannot apply here either.
 *
 * A detached HEAD holds a raw sha; it is returned as-is and fails validation,
 * which is correct — you cannot push a detached HEAD to a branch by accident.
 */
const currentBranch = () => {
  try {
    const head = readFileSync(join(gitDirectory(), 'HEAD'), 'utf8').trim();
    const ref = /^ref:\s*refs\/heads\/(?<branch>.+)$/.exec(head);
    return ref?.groups.branch ?? head;
  } catch {
    return '';
  }
};

const main = () => {
  const branch =
    flagValue('--branch') ?? process.env.BRANCH_NAME ?? currentBranch();
  const { errors, exempt } = validateBranchName(branch);

  if (errors.length > 0) {
    console.error('Branch name does not follow the repo standard:\n');
    for (const error of errors) {
      console.error(`  • ${error}`);
    }
    console.error('\nRename it before pushing:');
    console.error(`  git branch -m <type>/<issue>-<kebab-description>\n`);
    process.exitCode = 1;
    return;
  }

  console.log(
    exempt
      ? `Branch "${branch}" is exempt from the naming rule.`
      : `Branch name follows the repo standard: ${branch}`,
  );
};

main();
