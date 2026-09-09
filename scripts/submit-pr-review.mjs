/**
 * Posts a COMMENT review from body + findings files.
 *
 * Why this exists: the in-workflow reviewers (Claude, Grok) used to inline the
 * same submit shell. Copying it made Sonar's duplicated-lines gate fail the
 * second reviewer. The model still writes files; this script checks the head,
 * builds the payload through `build-review-payload.mjs`, and posts it.
 *
 *   node scripts/submit-pr-review.mjs \
 *     --body <md> --findings <json> [--placeholder <text>]
 *
 * Env: GH_TOKEN, HEAD_SHA, PR_NUMBER, REPOSITORY.
 *
 * Exit 0: posted, or the head moved and nothing was posted.
 * Exit 1: no body, leftover placeholder, or the API call failed.
 *
 * Governed by .claude/rules/scripts.md.
 */

import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';

import { errorMessage } from '../packages/repo-standards/scripts/error-message.mjs';
import { runGh } from '../packages/repo-standards/scripts/gh-exec.mjs';
import { readTextWithin } from '../packages/repo-standards/scripts/safe-read.mjs';
import { writeTextWithin } from '../packages/repo-standards/scripts/safe-write.mjs';
import { flattenPages, refuseReason } from './lib/review-submit.mjs';

const REPO_ROOT = process.cwd();

const OPTIONS = {
  body: { type: 'string' },
  findings: { type: 'string' },
  placeholder: { type: 'string' },
};

const readOptional = (path) => {
  if (typeof path !== 'string' || path === '') {
    return undefined;
  }
  try {
    return readTextWithin(path, REPO_ROOT);
  } catch {
    return undefined;
  }
};

const requiredEnv = (name) => {
  const value = process.env[name];
  if (typeof value !== 'string' || value === '') {
    throw new Error(`${name} is missing`);
  }
  return value;
};

const main = () => {
  const { values } = parseArgs({ options: OPTIONS });
  const reason = refuseReason({
    body: readOptional(values.body),
    placeholder: values.placeholder,
  });
  if (reason !== undefined) {
    console.error(
      '::error::The review step wrote no review body, so there is nothing to submit. A run that reviews nothing must not report success.',
    );
    return 1;
  }

  const repository = requiredEnv('REPOSITORY');
  const prNumber = requiredEnv('PR_NUMBER');
  const headSha = requiredEnv('HEAD_SHA');

  const pull = JSON.parse(
    runGh(['api', `repos/${repository}/pulls/${prNumber}`]),
  );
  const current = pull?.head?.sha;
  if (current !== headSha) {
    console.log(
      `::notice::Head moved from ${headSha} to ${current} while this run was working — not posting a review of a superseded commit.`,
    );
    return 0;
  }

  const pages = JSON.parse(
    runGh([
      'api',
      '--paginate',
      '--slurp',
      `repos/${repository}/pulls/${prNumber}/files?per_page=100`,
    ]),
  );
  writeTextWithin(
    'pull-request-files.json',
    JSON.stringify(flattenPages(pages)),
    REPO_ROOT,
  );

  const payloadArgs = [
    'scripts/build-review-payload.mjs',
    '--body',
    values.body,
    '--files',
    'pull-request-files.json',
    '--commit',
    headSha,
    '--out',
    'review-payload.json',
  ];
  if (typeof values.findings === 'string' && values.findings !== '') {
    payloadArgs.push('--findings', values.findings);
  }
  execFileSync(process.execPath, payloadArgs, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });

  const submitted = JSON.parse(
    runGh([
      'api',
      `repos/${repository}/pulls/${prNumber}/reviews`,
      '--input',
      'review-payload.json',
    ]),
  );
  console.log(
    `submitted review ${submitted.id} against ${submitted.commit_id}`,
  );
  return 0;
};

try {
  process.exitCode = main();
} catch (error) {
  console.error(`::error::submit-pr-review: ${errorMessage(error)}`);
  process.exitCode = 1;
}
