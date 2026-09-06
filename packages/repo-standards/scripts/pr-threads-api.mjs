/**
 * The one read both review-thread consumers make: a pull request's threads,
 * together with the head they belong to.
 *
 * Why one query for two callers: `pr-threads.mjs` reports to a person and
 * `verify-review-threads.mjs` publishes a commit status, but a status is only
 * honest if it describes the same commit the threads were read against — so the
 * head and the threads have to arrive together, in one response. Two queries
 * drifting apart is how a gate ends up reporting about a commit that stopped
 * being the head while it was working.
 *
 * Thread resolution state is not in any REST payload, so this is GraphQL rather
 * than `gh pr view --json`: a REST-only probe reports a pull request with open
 * threads as clean, which is the "pick a probe that discriminates" trap in its
 * most expensive form.
 *
 * gh is the only effect here; the shaping is pure in `./pr-threads.mjs`.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { runGh } from './gh-exec.mjs';

const THREADS_QUERY = `
query($owner:String!, $repo:String!, $number:Int!) {
  repository(owner:$owner, name:$repo) {
    pullRequest(number:$number) {
      isDraft url headRefOid
      reviewThreads(first:100) {
        nodes {
          id isResolved isOutdated
          comments(first:1) { nodes { author { login } body path line } }
        }
      }
    }
  }
}`;

export const fetchPullRequestThreads = ({ number, repository }) => {
  const [owner, repo] = repository.split('/');
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
  return JSON.parse(raw)?.data?.repository?.pullRequest ?? undefined;
};
