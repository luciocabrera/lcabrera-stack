/**
 * Lists the review threads still holding a pull request, and resolves one.
 *
 * Why it exists: `required_review_thread_resolution` is on for `main`, so a
 * single open thread blocks the merge — and nothing tells the author. The agent
 * stops at "pushed, gate green", and the pull request waits until a human looks
 * at the queue. #780 sat 70 minutes that way. `gh` has no command for this
 * (thread state is not in any REST payload, and `resolveReviewThread` is a
 * GraphQL mutation keyed by a node id), which is why the step is skipped.
 *
 * It does not resolve anything on its own. Addressing a comment is a judgement
 * — fix the code, or reply saying why it is already correct — and only the agent
 * that made it can say which happened. This reports, and resolves the one id you
 * hand it once you have.
 *
 * Decisions are pure in `./lib/pr-threads.mjs`; gh is the only effect here.
 *
 * Usage (from the repo root):
 *   vp run pr:threads                       # the PR for the current branch
 *   vp run pr:threads -- --pr 780
 *   vp run pr:threads -- --pr 780 --json
 *   vp run pr:threads -- --resolve PRRT_kwDO…   # after you have replied
 *
 * Exit codes: 0 = no unresolved threads (or a resolve succeeded); 1 = threads
 * remain, or the pull request could not be read. Non-zero on "threads remain"
 * on purpose: this is meant to be the last thing a finishing agent runs.
 *
 * Governed by .claude/rules/scripts.md.
 */
import process from 'node:process';

import {
  flagValue,
  parsePullNumber,
  parseThreadId,
} from '../packages/repo-standards/scripts/cli-input.mjs';
import { errorMessage } from '../packages/repo-standards/scripts/error-message.mjs';
import { runGh } from './lib/gh-exec.mjs';
import { fetchPullRequestThreads } from './lib/pr-threads-api.mjs';
import { formatThreads, summarizeThreads } from './lib/pr-threads.mjs';
import {
  resolvePullNumber,
  resolveRepository,
} from './lib/review-gate-status.mjs';

/**
 * The pull request for the branch checked out here, or `undefined`.
 *
 * Only consulted when `--pr` named none: the point of the bare command is that
 * an agent finishing work does not have to look its own number up.
 */
const pullForCurrentBranch = () => {
  try {
    return parsePullNumber(
      runGh(['pr', 'view', '--json', 'number', '--jq', '.number']),
    );
  } catch {
    // Either gh found no pull request for this branch, or it printed something
    // that is not one (`null` on a branch with none). Both mean "no PR" here,
    // and neither may reach the query as `NaN`.
    return undefined;
  }
};

const USAGE =
  'Usage: vp run pr:threads -- [--pr <number>] [--repo <owner/name>] [--json] [--resolve <thread-id>]';

const RESOLVE_MUTATION = `
mutation($thread:ID!) {
  resolveReviewThread(input:{threadId:$thread}) { thread { isResolved } }
}`;

/** Resolve one thread. Reports what GitHub says it became, never what we asked. */
const resolveThread = (threadId) => {
  const raw = runGh([
    'api',
    'graphql',
    '-f',
    `query=${RESOLVE_MUTATION}`,
    '-f',
    `thread=${threadId}`,
  ]);
  return (
    JSON.parse(raw)?.data?.resolveReviewThread?.thread?.isResolved === true
  );
};

const main = () => {
  // Presence, not value: `flagValue` returns undefined for a trailing flag, so
  // a bare `--resolve` would otherwise fall through and list threads instead —
  // silently doing the opposite of what an action-shaped command was asked for.
  const wantsResolve = process.argv.includes('--resolve');
  const threadId = flagValue('--resolve');
  if (wantsResolve && threadId === undefined) {
    console.error(`${USAGE}\n\n--resolve needs a thread id.`);
    process.exitCode = 1;
    return;
  }
  if (threadId !== undefined) {
    if (!resolveThread(parseThreadId(threadId))) {
      console.error(`${threadId} is not resolved — GitHub did not confirm it.`);
      process.exitCode = 1;
      return;
    }
    console.log(`Resolved ${threadId}.`);
    return;
  }

  const number = resolvePullNumber() ?? pullForCurrentBranch();
  if (number === undefined) {
    console.error(
      `${USAGE}\n\nGive --pr, or run on a branch that has a pull request.`,
    );
    process.exitCode = 1;
    return;
  }
  const repository = resolveRepository();

  const pullRequest = fetchPullRequestThreads({ number, repository });
  if (pullRequest === undefined) {
    console.error(`${repository}#${number} could not be read.`);
    process.exitCode = 1;
    return;
  }
  const threads = summarizeThreads(pullRequest.reviewThreads?.nodes);

  if (process.argv.includes('--json')) {
    console.log(
      JSON.stringify(
        { ...threads, isDraft: pullRequest.isDraft === true, number },
        undefined,
        2,
      ),
    );
  } else {
    for (const line of formatThreads({ number, repository, threads })) {
      console.log(line);
    }
  }
  process.exitCode = threads.unresolved.length === 0 ? 0 : 1;
};

try {
  main();
} catch (error) {
  console.error(`pr-threads: ${errorMessage(error)}`);
  process.exitCode = 1;
}
