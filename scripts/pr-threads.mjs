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
  parseRepository,
} from './lib/cli-input.mjs';
import { errorMessage } from './lib/error-message.mjs';
import { runGh } from './lib/gh-exec.mjs';
import { formatThreads, summarizeThreads } from './lib/pr-threads.mjs';

const USAGE =
  'Usage: vp run pr:threads -- [--pr <number>] [--repo <owner/name>] [--json] [--resolve <thread-id>]';

const THREADS_QUERY = `
query($owner:String!, $repo:String!, $number:Int!) {
  repository(owner:$owner, name:$repo) {
    pullRequest(number:$number) {
      isDraft url
      reviewThreads(first:100) {
        nodes {
          id isResolved isOutdated
          comments(first:1) { nodes { author { login } body path line } }
        }
      }
    }
  }
}`;

const RESOLVE_MUTATION = `
mutation($thread:ID!) {
  resolveReviewThread(input:{threadId:$thread}) { thread { isResolved } }
}`;

const repositoryOf = () =>
  parseRepository(
    flagValue('--repo') ??
      process.env.GITHUB_REPOSITORY ??
      runGh([
        'repo',
        'view',
        '--json',
        'nameWithOwner',
        '--jq',
        '.nameWithOwner',
      ]),
  );

/**
 * `undefined` when nothing named a pull request, so the caller can print usage.
 * A `--pr` that is present but malformed throws instead of becoming `NaN` in a
 * query variable, where the only symptom is an empty result.
 */
const pullNumberOf = () => {
  const flag = flagValue('--pr');
  if (flag !== undefined) {
    return parsePullNumber(flag);
  }
  try {
    return parsePullNumber(
      runGh(['pr', 'view', '--json', 'number', '--jq', '.number']),
    );
  } catch {
    return undefined;
  }
};

const fetchThreads = ({ number, owner, repo }) => {
  const raw = runGh([
    'api',
    'graphql',
    '-f',
    `query=${THREADS_QUERY}`,
    '-F',
    `owner=${owner}`,
    '-F',
    `repo=${repo}`,
    '-F',
    `number=${number}`,
  ]);
  const pullRequest = JSON.parse(raw)?.data?.repository?.pullRequest;
  if (pullRequest === null || pullRequest === undefined) {
    throw new Error(`${owner}/${repo}#${number} could not be read`);
  }
  return pullRequest;
};

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
  const threadId = flagValue('--resolve');
  if (threadId !== undefined) {
    if (!resolveThread(threadId)) {
      console.error(`${threadId} is not resolved — GitHub did not confirm it.`);
      process.exitCode = 1;
      return;
    }
    console.log(`Resolved ${threadId}.`);
    return;
  }

  const number = pullNumberOf();
  if (number === undefined) {
    console.error(
      `${USAGE}\n\nGive --pr, or run on a branch that has a pull request.`,
    );
    process.exitCode = 1;
    return;
  }
  const repository = repositoryOf();
  const [owner, repo] = repository.split('/');

  const pullRequest = fetchThreads({ number, owner, repo });
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
