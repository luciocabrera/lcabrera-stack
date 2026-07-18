/**
 * Validates a pull request's title and description against the repo standard —
 * the single spec in `./lib/commit-convention.mjs`, the same one the commit-msg
 * hook uses. The title must be a Conventional-Commit header (it is the
 * human-facing summary and the squash-fallback subject); the description must
 * contain the required sections that `.github/pull_request_template.md` lays out.
 * The `🤖` footer and `Co-Authored-By:` trailer are neither required nor rejected.
 *
 * Runs in `.github/workflows/pr-standards.yml`, which passes the PR title and
 * body through the environment (`PR_TITLE` / `PR_BODY`) so no untrusted PR text
 * ever reaches a shell. Locally, pass `--title "<t>"` and `--body-file <path>` to
 * simulate a PR without opening one.
 *
 * Usage:
 *   PR_TITLE=… PR_BODY=… node scripts/verify-pr.mjs
 *   node scripts/verify-pr.mjs --title "feat(ci): x" --body-file body.md
 *
 * Exit codes: 0 = valid (warnings allowed), 1 = a rule was broken.
 */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validatePrBody, validatePrTitle } from './lib/commit-convention.mjs';
import { reportWarnings } from './lib/report-warnings.mjs';
import { readTextWithin } from './lib/safe-read.mjs';
import { deriveWorkspaceScopes } from './lib/workspace-scopes.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');

const flagValue = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
};

const readInputs = () => {
  const title = flagValue('--title') ?? process.env.PR_TITLE ?? '';
  const bodyFile = flagValue('--body-file');
  const body =
    bodyFile === undefined
      ? (process.env.PR_BODY ?? '')
      : readTextWithin(bodyFile, REPO_ROOT);
  return { title, body };
};

const main = () => {
  const { title, body } = readInputs();
  const workspaces = deriveWorkspaceScopes(REPO_ROOT);

  const titleResult = validatePrTitle(title, { workspaces });
  const bodyResult = validatePrBody(body);
  const errors = [...titleResult.errors, ...bodyResult.errors];
  const warnings = [...titleResult.warnings, ...bodyResult.warnings];

  if (warnings.length > 0) {
    reportWarnings(warnings);
  }

  if (errors.length > 0) {
    console.error('Pull request does not follow the repo standard:\n');
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    console.error(
      '\nTitle format: `type(scope): subject`. Description: fill in ' +
        '.github/pull_request_template.md. See the commit-and-pr skill.',
    );
    process.exitCode = 1;
    return;
  }

  console.log('Pull request title and description follow the repo standard.');
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
