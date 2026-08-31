/**
 * Review-thread facts, kept pure: which threads on a pull request are still
 * unresolved, and what a gate should say about them.
 *
 * Why this is its own module rather than prose in a checklist: the rule "address
 * every review comment, then resolve the thread" was already written down twice
 * — `.claude/pr-queue-policy.md` E4/A4 and `docs/agents/epic-orchestration.md`
 * Phase 3 — and #780 still merged 70 minutes late because neither document loads
 * for an agent finishing an ordinary pull request. A rule an agent must remember
 * to look up is one it will eventually not look up; this is the half a command
 * can answer.
 *
 * `resolveReviewThread` needs a thread's node id, which is why `summarizeThreads`
 * lives here and `pr-queue-facts.mjs` imports it: the operator and the author
 * must agree on what "unresolved" means, and two copies of that predicate would
 * be the same drift this work exists to remove.
 *
 * The I/O shells are `scripts/pr-threads.mjs` (the author's command) and
 * `scripts/verify-review-threads.mjs` (the commit-status gate).
 *
 * Governed by .claude/rules/scripts.md.
 */

/** The commit-status context this gate publishes under. One definition. */
export const STATUS_CONTEXT = 'Review threads resolved';

const EXCERPT = 160;

const excerpt = (body) => {
  const flat = body.replaceAll(/\s+/gu, ' ').trim();
  return flat.length > EXCERPT ? `${flat.slice(0, EXCERPT - 1)}…` : flat;
};

export const summarizeThreads = (nodes) => {
  const threads = nodes ?? [];
  const unresolved = threads
    .filter((thread) => thread.isResolved !== true)
    .map((thread) => {
      const opener = thread.comments?.nodes?.[0] ?? {};
      return {
        author: opener.author?.login ?? 'unknown',
        body: (opener.body ?? '').trim(),
        id: thread.id ?? '',
        isOutdated: thread.isOutdated === true,
        line: opener.line ?? undefined,
        path: opener.path ?? '',
      };
    });
  return { total: threads.length, unresolved };
};

const where = (thread) => {
  const file = thread.path === '' ? '(no file)' : thread.path;
  return thread.line === undefined ? file : `${file}:${thread.line}`;
};

export const formatThreads = ({ number, repository, threads }) => {
  if (threads.unresolved.length === 0) {
    return [
      `${repository}#${number}: no unresolved review threads (${threads.total} total).`,
    ];
  }
  return [
    `${repository}#${number}: ${threads.unresolved.length} unresolved review thread(s) of ${threads.total}.`,
    '',
    ...threads.unresolved.flatMap((thread) => [
      `• ${where(thread)}${thread.isOutdated ? '  [outdated — still counts]' : ''}`,
      `  ${thread.author}: ${excerpt(thread.body)}`,
      `  id: ${thread.id}`,
      '',
    ]),
    'Address each one — fix it, or reply saying why the code is already correct —',
    'then resolve it. See docs/agents/pr-review-threads.md.',
  ];
};

export const decideThreadStatus = ({ isDraft, threads }) => {
  const open = threads.unresolved.length;
  if (isDraft) {
    return {
      description: `Draft — ${open} unresolved thread(s), not gating yet`,
      state: 'success',
    };
  }
  if (open === 0) {
    return {
      description:
        threads.total === 0
          ? 'No review threads'
          : `All ${threads.total} review thread(s) resolved`,
      state: 'success',
    };
  }
  return {
    description: `${open} unresolved review thread(s) — address and resolve each`,
    state: 'failure',
  };
};
