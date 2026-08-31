/**
 * Flattens one GitHub GraphQL pull-request node into the fact record the rest of
 * the PR queue operator reasons over.
 *
 * Why this exists: the raw shape answers "are this PR's checks green?" four
 * levels down a chain that can be null at every step, and answers "are its
 * review threads settled?" in a field the REST `gh pr view` does not return at
 * all. Every consumer that re-walks that shape is another place the walk can be
 * quietly wrong — and a wrong walk here fails toward "clean", which is the
 * direction that merges something it should not.
 *
 * The merge-queue fields are the same trap one level worse. A pull request the
 * queue has ejected keeps its own checks green — the failure belongs to the
 * merge group's commit — so every rollup reads it as ready. `summarizeQueue` is
 * what makes E11 and S11 decidable; `docs/tooling/merge-queue.md` has the shape
 * of that failure and ADR-098 the decision.
 *
 * Two shapes the flattening absorbs rather than trusts. A CheckRun still
 * running carries `conclusion: null` and its real state in `status`, so reading
 * `conclusion` alone renders an in-flight check as an empty state — neither
 * pending nor failed, and so through every filter. And every field of the fact
 * record is defaulted, because a GraphQL node with a null branch is a real
 * response rather than a reason to throw partway through a queue.
 *
 * Governed by .claude/rules/scripts.md. The rules it serves are §2 and §6 of
 * .claude/pr-queue-policy.md.
 */

import { summarizeThreads } from './pr-threads.mjs';

const PENDING_STATES = new Set([
  'ACTION_REQUIRED',
  'EXPECTED',
  'IN_PROGRESS',
  'PENDING',
  'QUEUED',
  'REQUESTED',
  'WAITING',
]);

const FAILED_STATES = new Set([
  'CANCELLED',
  'ERROR',
  'FAILURE',
  'STALE',
  'STARTUP_FAILURE',
  'TIMED_OUT',
]);

export const normalizeCheck = (node) =>
  node.__typename === 'CheckRun'
    ? {
        name: node.name ?? 'unnamed check',
        state: node.conclusion ?? node.status ?? 'UNKNOWN',
        url: node.detailsUrl ?? '',
      }
    : {
        name: node.context ?? 'unnamed status',
        state: node.state ?? 'UNKNOWN',
        url: node.targetUrl ?? '',
      };

export const summarizeChecks = (contexts) => {
  const all = (contexts ?? []).map(normalizeCheck);
  return {
    all,
    failed: all.filter((check) => FAILED_STATES.has(check.state)),
    pending: all.filter((check) => PENDING_STATES.has(check.state)),
  };
};

export { summarizeThreads };

export const summarizeQueue = (node) => {
  const latest = node.timelineItems?.nodes?.[0];
  const ejected =
    latest?.__typename === 'RemovedFromMergeQueueEvent' ? latest : undefined;
  return {
    ejectedAt: ejected?.createdAt ?? '',
    ejectedReason: ejected?.reason ?? '',
    enabled: node.isMergeQueueEnabled === true,
    position: node.mergeQueueEntry?.position ?? undefined,
    queued: node.isInMergeQueue === true,
    state: node.mergeQueueEntry?.state ?? '',
  };
};

export const summarizeFiles = (nodes) =>
  (nodes ?? []).map((file) => ({
    additions: file.additions ?? 0,
    deletions: file.deletions ?? 0,
    path: file.path ?? '',
  }));

export const toFacts = (node) => {
  const files = summarizeFiles(node.files?.nodes);
  const rollup = node.commits?.nodes?.[0]?.commit?.statusCheckRollup;
  return {
    author: node.author?.login ?? 'unknown',
    baseRefName: node.baseRefName ?? '',
    body: node.body ?? '',
    checks: summarizeChecks(rollup?.contexts?.nodes),
    files,
    headCommittedAt: node.commits?.nodes?.[0]?.commit?.committedDate ?? '',
    headRefName: node.headRefName ?? '',
    isDraft: node.isDraft === true,
    mergeable: node.mergeable ?? 'UNKNOWN',
    mergeStateStatus: node.mergeStateStatus ?? 'UNKNOWN',
    number: node.number,
    queue: summarizeQueue(node),
    reviewDecision: node.reviewDecision ?? '',
    size: files.reduce((sum, file) => sum + file.additions + file.deletions, 0),
    threads: summarizeThreads(node.reviewThreads?.nodes),
    title: node.title ?? '',
    url: node.url ?? '',
  };
};

export const toQueue = (nodes) => (nodes ?? []).map(toFacts);
