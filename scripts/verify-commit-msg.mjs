/**
 * Validates a commit message against the repo's Conventional-Commit standard —
 * the single spec in `./lib/commit-convention.mjs`. One validator, two callers:
 *   - the `.vite-hooks/commit-msg` git hook (arg = the commit-message file path),
 *     giving every author instant local feedback before the commit is created;
 *   - the `pr-standards.yml` CI job, which pipes each non-merge commit in the PR
 *     range in on stdin (arg `-`), so nothing non-conforming reaches main even
 *     when the hook was bypassed with `--no-verify`.
 *
 * Merge, git-revert and `fixup!`/`squash!` messages are skipped. Only the subject
 * (header) line is validated; bodies, `BREAKING CHANGE:` footers and the
 * `Co-Authored-By:` trailer are never inspected or rejected.
 *
 * Usage:
 *   node scripts/verify-commit-msg.mjs <path-to-message-file>
 *   node scripts/verify-commit-msg.mjs -        (read the message from stdin)
 *
 * Exit codes: 0 = valid or skipped (warnings allowed), 1 = a rule was broken.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateCommitMessage } from './lib/commit-convention.mjs';
import { reportWarnings } from './lib/report-warnings.mjs';
import { deriveWorkspaceScopes } from './lib/workspace-scopes.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');

const readMessage = (source) =>
  source === '-' ? readFileSync(0, 'utf8') : readFileSync(source, 'utf8');

const main = () => {
  const source = process.argv[2];
  if (source === undefined) {
    console.error(
      'Usage: node scripts/verify-commit-msg.mjs <message-file | ->',
    );
    process.exitCode = 1;
    return;
  }

  const workspaces = deriveWorkspaceScopes(REPO_ROOT);
  const { skipped, errors, warnings } = validateCommitMessage(
    readMessage(source),
    { workspaces },
  );

  if (skipped) {
    return;
  }

  if (warnings.length > 0) {
    reportWarnings(warnings);
  }

  if (errors.length > 0) {
    console.error(
      'Commit message does not follow the Conventional Commit standard:\n',
    );
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    console.error(
      '\nFormat: `type(scope): subject` (e.g. `feat(ui): add column resize`). ' +
        'See the commit-and-pr skill or scripts/lib/commit-convention.mjs.',
    );
    process.exitCode = 1;
    return;
  }

  console.log('Commit message follows the Conventional Commit standard.');
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
