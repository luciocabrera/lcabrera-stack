/**
 * Pure event→status mapping for the Planning board sync. Kept separate from the
 * effectful runner (`sync-project-status.mjs`) so it is importable and testable
 * without triggering any GraphQL — the same split as `coordination-board.mjs` vs
 * `verify-coordination.mjs`. See `.claude/rules/scripts.md`.
 */

const DRAFT_TRANSITIONS = new Set(['opened', 'reopened', 'converted_to_draft']);

/**
 * The Status name an event should set, or `undefined` for "ignore":
 *   issue assigned            → In Progress   (self-assign = "I've started")
 *   PR opened/reopened draft  → In Progress
 *   PR ready for review       → In Review
 *   PR converted to draft     → In Progress
 *   PR merged                 → Done
 *   PR closed unmerged        → Todo
 */
export const targetStatus = ({ eventName, payload }) => {
  if (eventName === 'issues') {
    return payload.action === 'assigned' ? 'In Progress' : undefined;
  }
  if (eventName !== 'pull_request' && eventName !== 'pull_request_target') {
    return undefined;
  }
  const { action, pull_request: pr } = payload;
  if (action === 'closed') {
    return pr.merged ? 'Done' : 'Todo';
  }
  if (action === 'ready_for_review') {
    return 'In Review';
  }
  if (DRAFT_TRANSITIONS.has(action)) {
    return pr.draft ? 'In Progress' : 'In Review';
  }
  return undefined;
};
