/**
 * Pure event→status mapping for the Planning board sync. Kept separate from the
 * effectful runner (`sync-project-status.mjs`) so it is importable and testable
 * without triggering any GraphQL — the same split as `coordination-board.mjs` vs
 * `verify-coordination.mjs`. See `.claude/rules/scripts.md`.
 */

const DRAFT_TRANSITIONS = new Set(['opened', 'reopened', 'converted_to_draft']);

/**
 * Issue events, mapped by action.
 *
 * `closed` is here because the PR path alone was not enough: a PR moves the
 * issues it closes through `closingIssuesReferences`, so an issue closed by
 * hand — or by a PR that never wrote `Resolves #n` — kept whatever status it
 * had. That is almost always **In Progress**, since self-assigning is what put
 * it there, and a stale In Progress is the worst of the four to be wrong in: it
 * reads as "someone is on this", so the next agent skips available work. Two
 * cards were sitting like that when this was found (#249, #255).
 *
 * An issue closed as *not planned* also lands on Done. With four columns there
 * is no truthful home for it, Done is the least-wrong, and it is what GitHub's
 * own built-in workflow does.
 *
 * `reopened` returns it to the backlog rather than to In Progress — mirroring
 * what an unmerged PR does. Assigning is what says someone has started, and
 * that transition already exists.
 *
 * (Prose here says "the backlog" rather than naming the column, because Sonar
 * S1135 reads the bare word in a comment as an unfinished-task marker. The
 * header below follows the same convention, and did before this change.)
 */
const ISSUE_STATUS = new Map([
  ['assigned', 'In Progress'],
  ['closed', 'Done'],
  ['reopened', 'Todo'],
]);

/**
 * The Status name an event should set, or `undefined` for "ignore":
 *   issue assigned            → In Progress   (self-assign = "I've started")
 *   issue closed              → Done
 *   issue reopened            → back to the backlog
 *   PR opened/reopened draft  → In Progress
 *   PR ready for review       → In Review
 *   PR converted to draft     → In Progress
 *   PR merged                 → Done
 *   PR closed unmerged        → back to the backlog
 */
export const targetStatus = ({ eventName, payload }) => {
  if (eventName === 'issues') {
    return ISSUE_STATUS.get(payload.action);
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
