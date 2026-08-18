/**
 * Publishes a commit status saying how many review threads still hold a pull
 * request open.
 *
 * Why a status when the ruleset already enforces this: `required_review_thread_
 * resolution` blocks the merge but says so only in the merge box, which nobody
 * is looking at once the checks go green. The agent that opened the pull request
 * has stopped, and the block is discovered whenever a human next opens the
 * queue — 70 minutes, on #780. A status turns "silently blocked" into a red
 * check next to the others, which is the surface an author already reads.
 *
 * Deliberately not a required context. The ruleset is the enforcement; this is
 * the report, so a stale status can never be the thing that stops a merge.
 * Promotion is #698.
 *
 * Decisions are pure in `./lib/pr-threads.mjs`. It reads the head and the
 * threads together and posts against the head it read, never against a SHA
 * carried in from an event payload or a queue listing.
 *
 * Usage (from the repo root):
 *   vp run review-threads:verify -- --pr 780
 *   vp run review-threads:verify -- --pr 780 --dry-run
 *
 * Exit codes: 0 = the status reported (whatever it says); 1 = the pull request
 * could not be read. The gate reports; it does not fail the build.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { readFileSync } from 'node:fs';
import process from 'node:process';

import {
  flagValue,
  parsePullNumber,
  parseRepository,
} from './lib/cli-input.mjs';
import { errorMessage } from './lib/error-message.mjs';
import { runGh } from './lib/gh-exec.mjs';
import {
  decideThreadStatus,
  STATUS_CONTEXT,
  summarizeThreads,
} from './lib/pr-threads.mjs';
import {
  publishedStatus,
  shouldPublishStatus,
} from './lib/review-gate-reconcile.mjs';

const USAGE =
  'usage: node scripts/verify-review-threads.mjs --pr <number> ' +
  '[--repo <owner/name>] [--dry-run] [--if-changed]';

const HEAD_AND_THREADS = `
query($owner:String!, $repo:String!, $number:Int!) {
  repository(owner:$owner, name:$repo) {
    pullRequest(number:$number) {
      isDraft
      headRefOid
      reviewThreads(first:100) {
        nodes {
          id isResolved isOutdated
          comments(first:1) { nodes { author { login } body path line } }
        }
      }
    }
  }
}`;

/** The Actions event payload, or `undefined` outside Actions. */
const readEventPayload = () => {
  const path = process.env.GITHUB_EVENT_PATH;
  return path === undefined || path === ''
    ? undefined
    : JSON.parse(readFileSync(path, 'utf8'));
};

const resolveRepository = (payload) =>
  parseRepository(
    flagValue('--repo') ??
      process.env.GITHUB_REPOSITORY ??
      payload?.repository?.full_name ??
      runGh([
        'repo',
        'view',
        '--json',
        'nameWithOwner',
        '--jq',
        '.nameWithOwner',
      ]),
  );

/** `undefined` when nothing named a pull request — the caller prints usage. */
const resolvePullNumber = (payload) => {
  const raw = flagValue('--pr') ?? payload?.pull_request?.number;
  return raw === undefined ? undefined : parsePullNumber(raw);
};

/** The head and the threads in one read, so both describe the same commit. */
const fetchPullRequest = (repository, number) => {
  const [owner, repo] = repository.split('/');
  const raw = runGh([
    'api',
    'graphql',
    '-f',
    `query=${HEAD_AND_THREADS}`,
    '-F',
    `owner=${owner}`,
    '-F',
    `repo=${repo}`,
    '-F',
    `number=${number}`,
  ]);
  return JSON.parse(raw)?.data?.repository?.pullRequest ?? undefined;
};

/** The run that decided this status, so the check links to its own reasoning. */
const runUrl = () => {
  const { GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_SERVER_URL } = process.env;
  return GITHUB_RUN_ID === undefined
    ? undefined
    : `${GITHUB_SERVER_URL ?? 'https://github.com'}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;
};

const postStatus = ({ description, repository, sha, state }) => {
  const target = runUrl();
  runGh([
    'api',
    '--method',
    'POST',
    `repos/${repository}/statuses/${sha}`,
    '-f',
    `state=${state}`,
    '-f',
    `context=${STATUS_CONTEXT}`,
    '-f',
    `description=${description}`,
    ...(target === undefined ? [] : ['-f', `target_url=${target}`]),
  ]);
};

/** What was read, so the verdict is diagnosable from the run log alone. */
const describeThreads = (threads) =>
  `${threads.total} review thread(s), ${threads.unresolved.length} unresolved` +
  (threads.unresolved.length === 0
    ? ''
    : `: ${threads.unresolved.map((one) => one.path || '(no path)').join(', ')}`);

/** What is published under this context on `sha` right now, or `undefined`. */
const fetchPublishedStatus = (repository, sha) =>
  publishedStatus(
    JSON.parse(
      runGh(['api', `repos/${repository}/commits/${sha}/status?per_page=100`]),
    ),
    STATUS_CONTEXT,
  );

const main = () => {
  const payload = readEventPayload();
  const number = resolvePullNumber(payload);
  if (number === undefined) {
    console.error(`${USAGE}\n\nGive --pr, or run inside a pull-request event.`);
    process.exitCode = 1;
    return;
  }

  const repository = resolveRepository(payload);
  const pullRequest = fetchPullRequest(repository, number);
  const headSha = pullRequest?.headRefOid;
  if (typeof headSha !== 'string' || headSha === '') {
    console.error(
      `Could not read the head commit of ${repository}#${number} — refusing to post a status against an unknown SHA.`,
    );
    process.exitCode = 1;
    return;
  }

  const threads = summarizeThreads(pullRequest.reviewThreads?.nodes);
  const { description, state } = decideThreadStatus({
    isDraft: pullRequest.isDraft === true,
    threads,
  });

  console.log(`${repository}#${number} head ${headSha}`);
  console.log(describeThreads(threads));
  console.log(`${STATUS_CONTEXT}: ${state} — ${description}`);

  if (
    process.argv.includes('--if-changed') &&
    !shouldPublishStatus({
      current: fetchPublishedStatus(repository, headSha),
      next: { description, state },
    })
  ) {
    console.log(`Unchanged on ${headSha}: nothing was posted.`);
    return;
  }
  if (process.argv.includes('--dry-run')) {
    console.log('--dry-run: nothing was posted.');
    return;
  }
  postStatus({ description, repository, sha: headSha, state });
  console.log(`Posted to ${repository}/statuses/${headSha}.`);
};

try {
  main();
} catch (error) {
  console.error(`verify-review-threads: ${errorMessage(error)}`);
  process.exitCode = 1;
}
