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
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateCommitMessage } from './lib/commit-convention.mjs';
import { resolveGitDir } from './lib/git-dir.mjs';
import { reportWarnings } from './lib/report-warnings.mjs';
import { readTextWithin } from './lib/safe-read.mjs';
import { deriveWorkspaceScopes } from './lib/workspace-scopes.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');

/**
 * Roots the message file may legitimately come from. Git owns `COMMIT_EDITMSG`,
 * and in a linked worktree it lives under the primary checkout's
 * `.git/worktrees/<name>/` — outside this working tree — so the git directory
 * is admitted alongside the repo root. Everything else is still refused.
 */
const allowedRoots = () => [resolveGitDir(REPO_ROOT)].filter(Boolean);

const readMessage = (source) =>
  source === '-'
    ? readFileSync(0, 'utf8')
    : readTextWithin(source, REPO_ROOT, allowedRoots());

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

/**
 * Containment cases for the message-file argument. The worktree case is the
 * regression this guards: it is invisible from a primary checkout, where
 * `COMMIT_EDITMSG` happens to sit inside the repo root anyway.
 */
const containmentCases = () => {
  const gitDir = resolveGitDir(REPO_ROOT);
  const reads = (path, roots) => {
    try {
      readTextWithin(path, REPO_ROOT, roots);
      return true;
    } catch (error) {
      return !error.message.startsWith('refusing to read');
    }
  };
  return [
    {
      label: 'git directory resolves for this checkout',
      ok: gitDir !== undefined,
    },
    {
      label: "a worktree's COMMIT_EDITMSG is admitted",
      ok: reads(join(gitDir ?? REPO_ROOT, 'COMMIT_EDITMSG'), allowedRoots()),
    },
    {
      label: 'traversal outside every root is refused',
      ok: !reads(join(REPO_ROOT, '..', '..', 'etc', 'passwd'), allowedRoots()),
    },
    {
      label: 'the git directory is not admitted without opting in',
      ok:
        gitDir === undefined ||
        gitDir.startsWith(REPO_ROOT + sep) ||
        !reads(join(gitDir, 'COMMIT_EDITMSG'), []),
    },
  ];
};

const validationCases = () => {
  const errorsFor = (message) =>
    validateCommitMessage(message, {
      workspaces: deriveWorkspaceScopes(REPO_ROOT),
    }).errors.length;
  return [
    {
      label: 'a conforming subject is accepted',
      ok: errorsFor('feat(ui): add column resize') === 0,
    },
    {
      label: 'a non-conforming subject is rejected',
      ok: errorsFor('just some words') > 0,
    },
  ];
};

const runSelftest = () => {
  const results = [...containmentCases(), ...validationCases()];
  for (const result of results) {
    console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.label}`);
  }
  const passed = results.filter((result) => result.ok).length;
  console.log(`\n${passed}/${results.length} self-test cases passed`);
  return passed === results.length ? 0 : 1;
};

try {
  if (process.argv.includes('--selftest')) {
    process.exitCode = runSelftest();
  } else {
    main();
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
