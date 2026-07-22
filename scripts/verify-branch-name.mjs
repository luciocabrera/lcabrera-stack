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
import { execFileSync } from 'node:child_process';

import { validateBranchName } from './lib/commit-convention.mjs';

// GIT_DIR and friends outrank `cwd` and are exported into every hook, so a
// child git call can silently read a different repository (see #270). Strip
// them before asking git anything.
const REDIRECTING_VARS = [
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_COMMON_DIR',
  'GIT_DIR',
  'GIT_INDEX_FILE',
  'GIT_NAMESPACE',
  'GIT_OBJECT_DIRECTORY',
  'GIT_WORK_TREE',
];

const flagValue = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
};

const currentBranch = () => {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([name]) => !REDIRECTING_VARS.includes(name),
    ),
  );
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      encoding: 'utf8',
      env,
    }).trim();
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
