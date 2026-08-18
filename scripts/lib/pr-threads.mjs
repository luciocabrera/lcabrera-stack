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

/** How much of an opening comment the report shows before it is cut. */
const EXCERPT = 160;

/** One line, collapsed — a thread's opening comment is markdown over many. */
const excerpt = (body) => {
  const flat = body.replaceAll(/\s+/gu, ' ').trim();
  return flat.length > EXCERPT ? `${flat.slice(0, EXCERPT - 1)}…` : flat;
};

/**
 * Unresolved review threads, with the opening comment that explains each.
 *
 * `isResolved !== true` rather than `=== false` on purpose: a thread whose
 * resolution field is missing has not been shown to be settled, and policy E4
 * treats unknown as unresolved. An outdated thread still counts — the line moved,
 * the question did not. #646 merged with three `outdated=true` threads that were
 * in fact fixed in code, which is exactly the confusion this predicate refuses.
 */
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

/** `path:line`, or just the path when the comment is not anchored to a line. */
const where = (thread) =>
  thread.line === undefined ? thread.path : `${thread.path}:${thread.line}`;

/**
 * The report an author reads. One block per unresolved thread, each carrying the
 * node id, because resolving one is a GraphQL mutation keyed by that id and
 * hunting for it in a web page is the step people skip.
 */
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

/**
 * The gate's verdict.
 *
 * A draft never fails: draft is the author's own "not yet" and policy E1/A9 say
 * nothing overrules it, so an unresolved thread on WIP is expected rather than a
 * finding. The count still rides in the description, so a draft that is nearly
 * ready shows what is left without turning the checks list red.
 */
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
