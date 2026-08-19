/**
 * Validates a GitHub issue description against the repo standard — the single
 * spec in `./lib/commit-convention.mjs`, which also holds the commit, PR and
 * branch rules.
 *
 * Why this exists: nothing checked issue bodies, and the cost was issues with
 * no reproduction, no scope and no acceptance criteria. An issue like that has
 * to be investigated from scratch before anyone can act on it, which is the
 * work the issue was supposed to have already recorded.
 *
 * Runs in `.github/workflows/issue-standards.yml` on `issues: [opened, edited]`,
 * which passes the body through the environment (`ISSUE_BODY`) so untrusted
 * text never reaches a shell.
 *
 * Usage:
 *   ISSUE_BODY=… node scripts/verify-issue-body.mjs
 *   node scripts/verify-issue-body.mjs --body-file issue.md
 *
 * Exit codes: 0 = valid, 1 = a required section is missing.
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { flagValue } from './cli-input.mjs';
import { validateIssueBody } from './commit-convention.mjs';
import { readTextWithin } from './safe-read.mjs';
import { resolveHostRoot } from './host-root.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});

const main = () => {
  const bodyFile = flagValue('--body-file');
  const body =
    bodyFile === undefined
      ? (process.env.ISSUE_BODY ?? '')
      : readTextWithin(bodyFile, REPO_ROOT);

  const { errors } = validateIssueBody(body);

  if (errors.length > 0) {
    console.error('Issue does not follow the repo standard:\n');
    for (const error of errors) {
      console.error(`  • ${error}`);
    }
    console.error(
      '\nFill in the template — every section, "None" where it does not apply:',
    );
    console.error('  .github/ISSUE_TEMPLATE/standard_issue.md\n');
    process.exitCode = 1;
    return;
  }

  console.log('Issue follows the repo standard.');
};

main();
