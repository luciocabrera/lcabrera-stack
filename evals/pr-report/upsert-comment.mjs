#!/usr/bin/env node
/**
 * Keeps one eval report comment on a pull request: edits the comment that
 * carries the hidden marker, or posts it when there is none, so a new push
 * updates the report instead of adding another. Needs GH_TOKEN.
 * Usage (from the repo root): node evals/pr-report/upsert-comment.mjs
 *   --repo <owner/name> --pr <number> --body-file <path inside the repository or RUNNER_TEMP>
 *   [--only-existing]  edit the comment if there is one, and post none otherwise
 * Exit codes: 0 = posted or edited, 1 = bad input or a failed gh call.
 */
import { parseArgs } from 'node:util';

import { runGh } from '../../packages/repo-standards/scripts/gh-exec.mjs';
import { readTextWithin } from '../../packages/repo-standards/scripts/safe-read.mjs';
import {
  COMMENT_MARKER,
  reportCommentOf,
  upsertOptionProblems,
  upsertRequest,
} from './comment-body.mjs';

const readOptions = () => {
  const { values } = parseArgs({
    options: {
      'body-file': { type: 'string' },
      'only-existing': { default: false, type: 'boolean' },
      pr: { type: 'string' },
      repo: { type: 'string' },
    },
  });
  const problems = upsertOptionProblems(values);
  if (problems.length > 0) {
    throw new Error(problems.join('; '));
  }
  return values;
};

const main = () => {
  const values = readOptions();
  const body = readTextWithin(
    values['body-file'],
    process.cwd(),
    [process.env.RUNNER_TEMP].filter(Boolean),
  );
  if (!body.startsWith(COMMENT_MARKER)) {
    throw new Error(`the body does not start with ${COMMENT_MARKER}`);
  }
  const pages = JSON.parse(
    runGh([
      'api',
      '--paginate',
      '--slurp',
      `repos/${values.repo}/issues/${values.pr}/comments?per_page=100`,
    ]),
  );
  const request = upsertRequest({
    body,
    existing: reportCommentOf(pages),
    onlyExisting: values['only-existing'],
    pr: values.pr,
    repo: values.repo,
  });
  if (request.args !== undefined) {
    runGh(request.args);
  }
  console.log(request.summary);
};

try {
  main();
} catch (error) {
  console.error(
    `upsert-comment: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}
