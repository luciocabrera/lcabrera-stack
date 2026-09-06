/**
 * The one GitHub read the operator makes, and the two conformance checks that
 * cannot come from GitHub at all.
 *
 * Why one GraphQL round trip instead of a `gh pr list` plus a `gh pr view` per
 * PR: the queue must be judged from a single consistent snapshot. Facts gathered
 * PR-by-PR drift while the pass runs — a check finishes, a thread is resolved —
 * and an order derived from a mixture of before and after is an order nobody can
 * re-derive from the log.
 *
 * The GraphQL is also load-bearing for policy E4: review-thread resolution state
 * is not in the REST payload `gh pr view --json comments` returns, so a REST-only
 * probe reports a PR with open threads as clean. That is the §6 "pick a probe
 * that discriminates" trap in its most expensive form.
 *
 * It carries the merge-queue state for the same reason. `gh pr view --json` has
 * no field for it at all, and a pull request the queue has ejected keeps its own
 * required checks green — so every REST probe reads it as eligible, which is the
 * shape of the defect the queue was installed to fix. E11 and S11 in the policy
 * are what these fields feed.
 *
 * Governed by .claude/rules/scripts.md.
 */
import {
  validatePrBody,
  validatePrTitle,
} from '../../packages/repo-standards/scripts/commit-convention.mjs';
import { runGh } from '../../packages/repo-standards/scripts/gh-exec.mjs';

const QUEUE_QUERY = `
query($owner:String!, $repo:String!, $limit:Int!) {
  repository(owner:$owner, name:$repo) {
    pullRequests(states:OPEN, first:$limit, orderBy:{field:CREATED_AT, direction:ASC}) {
      nodes {
        number title url body isDraft mergeable mergeStateStatus reviewDecision
        headRefName baseRefName
        isInMergeQueue isMergeQueueEnabled
        mergeQueueEntry { state position }
        timelineItems(last:1, itemTypes:[ADDED_TO_MERGE_QUEUE_EVENT, REMOVED_FROM_MERGE_QUEUE_EVENT]) {
          nodes {
            __typename
            ... on RemovedFromMergeQueueEvent { createdAt reason }
          }
        }
        author { login }
        files(first:100) { nodes { path additions deletions } }
        reviewThreads(first:50) {
          nodes {
            id isResolved isOutdated
            comments(first:1) { nodes { author { login } body path line } }
          }
        }
        commits(last:1) {
          nodes {
            commit {
              committedDate
              statusCheckRollup {
                state
                contexts(first:100) {
                  nodes {
                    __typename
                    ... on CheckRun { name status conclusion detailsUrl }
                    ... on StatusContext { context state targetUrl }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`;

export const resolveRepository = () => {
  const nameWithOwner = runGh([
    'repo',
    'view',
    '--json',
    'nameWithOwner',
    '--jq',
    '.nameWithOwner',
  ]);
  const [owner, repo] = nameWithOwner.split('/');
  return { owner, repo };
};

const fetchOnce = ({ limit, owner, repo }) => {
  const raw = runGh([
    'api',
    'graphql',
    '-f',
    `query=${QUEUE_QUERY}`,
    '-f',
    `owner=${owner}`,
    '-f',
    `repo=${repo}`,
    '-F',
    `limit=${limit}`,
  ]);
  return JSON.parse(raw).data?.repository?.pullRequests?.nodes ?? [];
};

const pause = (ms) =>
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

const unsettled = (nodes) =>
  nodes.some((node) => (node.mergeable ?? 'UNKNOWN') === 'UNKNOWN');

export const fetchQueue = ({ attempts = 3, limit, owner, repo }) => {
  const nodes = fetchOnce({ limit, owner, repo });
  if (attempts <= 1 || nodes.length === 0 || !unsettled(nodes)) {
    return nodes;
  }
  pause(1500);
  return fetchQueue({ attempts: attempts - 1, limit, owner, repo });
};

export const checkConformance = (pr, workspaces) => ({
  body: validatePrBody(pr.body).errors,
  title: validatePrTitle(pr.title, { workspaces }).errors,
});

const CLOSING_KEYWORD =
  /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/gi;

export const linkedIssues = (pr) => [
  ...new Set([...pr.body.matchAll(CLOSING_KEYWORD)].map((m) => Number(m[1]))),
];
