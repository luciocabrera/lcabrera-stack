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
 * Governed by .claude/rules/scripts.md.
 */
import {
  validatePrBody,
  validatePrTitle,
} from '../../packages/repo-standards/scripts/commit-convention.mjs';
import { runGh } from './gh-exec.mjs';

const QUEUE_QUERY = `
query($owner:String!, $repo:String!, $limit:Int!) {
  repository(owner:$owner, name:$repo) {
    pullRequests(states:OPEN, first:$limit, orderBy:{field:CREATED_AT, direction:ASC}) {
      nodes {
        number title url body isDraft mergeable mergeStateStatus reviewDecision
        headRefName baseRefName
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

/** `owner/repo` for the checkout this runs in. */
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

/** Every open PR, as raw GraphQL nodes, from one snapshot. */
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

/** Blocks the thread without a timer — this is a CLI pass, not a server. */
const pause = (ms) =>
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/** True while GitHub has not finished computing a PR's mergeability. */
const unsettled = (nodes) =>
  nodes.some((node) => (node.mergeable ?? 'UNKNOWN') === 'UNKNOWN');

/**
 * The queue, with mergeability actually resolved.
 *
 * GitHub computes `mergeable` lazily: the first query after a quiet period
 * returns `UNKNOWN` for every PR and *starts* the computation, and a second one
 * moments later returns the real answer. Without this retry the operator reads a
 * whole healthy queue as E2/`WAIT` and does nothing on its first run of the day —
 * a false clean pass, which §6 names as the failure mode to design against.
 * Persisting `UNKNOWN` is a real answer and still maps to WAIT.
 */
export const fetchQueue = ({ attempts = 3, limit, owner, repo }) => {
  const nodes = fetchOnce({ limit, owner, repo });
  if (attempts <= 1 || nodes.length === 0 || !unsettled(nodes)) {
    return nodes;
  }
  pause(1500);
  return fetchQueue({ attempts: attempts - 1, limit, owner, repo });
};

/**
 * Policy E6 and E7, checked in-process against the repo's own single spec rather
 * than by shelling out to the verify scripts that wrap it. Same rules, no second
 * copy to drift, and no temp file — `verify-pr.mjs` only reads a body from a path
 * inside the repo, so a spawned check would have to write one first.
 */
export const checkConformance = (pr, workspaces) => ({
  body: validatePrBody(pr.body).errors,
  title: validatePrTitle(pr.title, { workspaces }).errors,
});

/** The issues a merged PR would close, as declared by the body's keywords. */
const CLOSING_KEYWORD =
  /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/gi;

export const linkedIssues = (pr) => [
  ...new Set([...pr.body.matchAll(CLOSING_KEYWORD)].map((m) => Number(m[1]))),
];
