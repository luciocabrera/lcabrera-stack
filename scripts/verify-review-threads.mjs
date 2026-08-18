/**
 * Publishes a commit status saying how many review threads still hold a pull
 * request open.
 *
 * Why a status when the ruleset already enforces this: the
 * `required_review_thread_resolution` rule blocks the merge but says so only in
 * the merge box, which nobody is looking at once the checks go green. The agent
 * that opened the pull request has stopped, and the block is discovered
 * whenever a human next opens the queue — 70 minutes, on #780. A status turns "silently blocked" into a red
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
 * Exit codes: 0 = the status reported, whatever it says — an unresolved thread
 * is a `failure` status and still exit 0, because the gate reports rather than
 * failing the build. 1 = this run could not do its job: the pull request or its
 * head was unreadable, or publishing the status threw.
 *
 * Governed by .claude/rules/scripts.md.
 */
import process from 'node:process';

import { errorMessage } from './lib/error-message.mjs';
import { fetchPullRequestThreads } from './lib/pr-threads-api.mjs';
import {
  decideThreadStatus,
  STATUS_CONTEXT,
  summarizeThreads,
} from './lib/pr-threads.mjs';
import {
  publishGateStatus,
  resolveGateTarget,
} from './lib/review-gate-status.mjs';

const USAGE =
  'usage: node scripts/verify-review-threads.mjs --pr <number> ' +
  '[--repo <owner/name>] [--dry-run] [--if-changed]';

/** What was read, so the verdict is diagnosable from the run log alone. */
const describeThreads = (threads) =>
  `${threads.total} review thread(s), ${threads.unresolved.length} unresolved` +
  (threads.unresolved.length === 0
    ? ''
    : `: ${threads.unresolved.map((one) => one.path || '(no path)').join(', ')}`);

const main = () => {
  const target = resolveGateTarget(USAGE);
  if (target === undefined) {
    process.exitCode = 1;
    return;
  }

  const { number, repository } = target;
  const pullRequest = fetchPullRequestThreads({ number, repository });
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
  console.log(
    publishGateStatus({
      context: STATUS_CONTEXT,
      description,
      repository,
      sha: headSha,
      state,
    }),
  );
};

try {
  main();
} catch (error) {
  console.error(`verify-review-threads: ${errorMessage(error)}`);
  process.exitCode = 1;
}
