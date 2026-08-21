/**
 * Review payloads for `./copilot-review.test.mjs`, in both shapes the gate reads.
 *
 * A sibling module rather than literals in the test because the test file crossed
 * the 350-line ceiling `.claude/rules/scripts.md` sets and `vp run scripts:verify`
 * enforces — and because these builders are the part with a reason to be shared:
 * anything else asserting on the gate's inputs should use the same shapes rather
 * than invent a third.
 *
 * BOTH API SHAPES ARE HERE ON PURPOSE. REST (`/pulls/{n}/reviews`, what the
 * workflow fetches) spells the reviewer `…[bot]` and carries `commit_id`;
 * GraphQL (`gh pr view --json reviews`, what the documented reproduction prints)
 * drops the suffix and carries `commit.oid`. A filter written for one silently
 * matches nothing on the other, so the test exercises both.
 *
 * Governed by .claude/rules/scripts.md.
 */

/** The head of the #671 sequence, and the commit it superseded. */
export const HEAD = 'dd8fb7867fa4cc57044c6c6808313528d7d7e0d3';
export const EARLIER = 'ff868c68f40fcd9740ea16cb313b37e5f10cd9b5';

/** A REST review — the shape `GET /pulls/{n}/reviews` returns. */
export const restReview = ({
  commit = HEAD,
  login = 'copilot-pull-request-reviewer[bot]',
  state = 'COMMENTED',
  submitted = '2026-08-14T08:20:53Z',
} = {}) => ({
  commit_id: commit,
  state,
  submitted_at: submitted,
  user: { login },
});

/** The same review as `gh pr view --json reviews` prints it (the issue's repro). */
export const graphqlReview = ({
  commit = HEAD,
  login = 'copilot-pull-request-reviewer',
  state = 'COMMENTED',
  submitted = '2026-08-14T08:20:53Z',
} = {}) => ({
  author: { login },
  commit: { oid: commit },
  state,
  submittedAt: submitted,
});

/**
 * A review from the in-workflow Claude reviewer.
 *
 * The login is the Claude General Reviewer GitHub App's own, which is the point
 * of #865: it used to be `github-actions[bot]`, the default GITHUB_TOKEN
 * identity, shared with every other workflow here.
 */
export const claudeReview = ({
  commit = HEAD,
  state = 'COMMENTED',
  submitted = '2026-08-20T10:15:11Z',
} = {}) =>
  restReview({
    commit,
    login: 'claude-general-reviewer[bot]',
    state,
    submitted,
  });
