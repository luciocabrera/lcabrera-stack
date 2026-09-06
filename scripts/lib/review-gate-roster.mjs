/**
 * Which review gates the reconcile sweep runs, and where each one's script is,
 * relative to the repository root — the three no longer share a directory, so a
 * bare filename joined to `scripts/` silently stops resolving the moment one
 * moves into a package.
 *
 * The sweep both invokes the path and derives the gate's self-edit closure from
 * it (ADR-076, #884), and a path that resolves to nothing fails in two ways at
 * once: every run reports the gate FAILED, and its closure collapses to the
 * missing path, so the withholding that stops a gate judging its own edit never
 * fires again. It lives here rather than in the driver so the sweep and the test
 * that checks it read the same roster.
 *
 * `protectSuccess` says the gate has ANOTHER publisher, so a `success` already
 * on the head may come from better-informed code than this sweep runs (#868).
 * It is true only where a workflow also runs the gate.
 */
export const REVIEW_GATES = [
  {
    name: 'copilot-review',
    protectSuccess: true,
    script: 'scripts/copilot-review-status.mjs',
  },
  { name: 'agent-review', script: 'scripts/verify-agent-review.mjs' },
  {
    name: 'review-threads',
    script: 'packages/repo-standards/scripts/verify-review-threads.mjs',
  },
];
