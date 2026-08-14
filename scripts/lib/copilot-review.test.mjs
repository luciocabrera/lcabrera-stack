import { describe, expect, it } from 'vite-plus/test';

import {
  copilotReviews,
  decideReviewStatus,
  isCopilotReviewer,
  latestCopilotReview,
  STATUS_CONTEXT,
} from './copilot-review.mjs';

// The gate this file covers is fail-closed, so every assertion below is written
// to be able to fail. The load-bearing one is the #671 sequence: a review of an
// earlier commit must never read as success, and a test that only ever exercises
// the happy path cannot tell a working comparison from one that returns
// `success` unconditionally.

/** GitHub's commit-status API truncates a description past this. */
const DESCRIPTION_LIMIT = 140;

const HEAD = 'dd8fb7867fa4cc57044c6c6808313528d7d7e0d3';
const EARLIER = 'ff868c68f40fcd9740ea16cb313b37e5f10cd9b5';

/** A REST review — the shape `GET /pulls/{n}/reviews` returns. */
const restReview = ({
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
const graphqlReview = ({
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

describe('recognising the reviewer', () => {
  it('accepts both spellings of the Copilot reviewer login', () => {
    expect(isCopilotReviewer('copilot-pull-request-reviewer[bot]')).toBe(true);
    expect(isCopilotReviewer('copilot-pull-request-reviewer')).toBe(true);
    expect(isCopilotReviewer('Copilot-Pull-Request-Reviewer[bot]')).toBe(true);
  });

  it('rejects everyone else, including a non-string login', () => {
    expect(isCopilotReviewer('luciocabrera')).toBe(false);
    expect(isCopilotReviewer('copilot')).toBe(false);
    expect(isCopilotReviewer('not-copilot-pull-request-reviewer')).toBe(false);
    expect(isCopilotReviewer(undefined)).toBe(false);
  });
});

describe('which reviews count', () => {
  it('keeps only Copilot reviews that were actually submitted', () => {
    const reviews = [
      restReview({ login: 'luciocabrera' }),
      restReview({ state: 'DISMISSED' }),
      restReview({ state: 'PENDING' }),
      restReview({ state: 'UNRECOGNISED_FUTURE_STATE' }),
      restReview(),
    ];
    expect(copilotReviews(reviews)).toEqual([restReview()]);
  });

  it('takes the newest by submission time, not by array position', () => {
    const newest = restReview({
      commit: HEAD,
      submitted: '2026-08-14T08:47:27Z',
    });
    const oldest = restReview({
      commit: EARLIER,
      submitted: '2026-08-14T08:20:53Z',
    });
    expect(latestCopilotReview([newest, oldest])).toBe(newest);
    expect(latestCopilotReview([oldest, newest])).toBe(newest);
  });

  it('breaks a timestamp tie on chronological array order', () => {
    const first = restReview({ commit: EARLIER });
    const second = restReview({ commit: HEAD });
    expect(latestCopilotReview([first, second])).toBe(second);
  });
});

describe('the head-versus-review comparison', () => {
  it('is success once a Copilot review names the head commit', () => {
    expect(
      decideReviewStatus({ headSha: HEAD, reviews: [restReview()] }),
    ).toMatchObject({ state: 'success' });
  });

  it('is success from the GraphQL payload shape too', () => {
    expect(
      decideReviewStatus({ headSha: HEAD, reviews: [graphqlReview()] }),
    ).toMatchObject({ state: 'success' });
  });

  it('compares SHAs case-insensitively', () => {
    expect(
      decideReviewStatus({
        headSha: HEAD.toUpperCase(),
        reviews: [restReview()],
      }),
    ).toMatchObject({ state: 'success' });
  });

  it('is not success when the only Copilot review is an earlier commit', () => {
    // #671, exactly: reviewed ff868c68 at 08:20:53Z, head advanced to dd8fb786
    // at 08:44:15Z, and no re-review followed.
    const status = decideReviewStatus({
      headSha: HEAD,
      reviews: [restReview({ commit: EARLIER })],
    });
    expect(status.state).toBe('pending');
    expect(status.description).toContain('ff868c6');
  });

  it('is not success when a human reviewed the head and Copilot did not', () => {
    const status = decideReviewStatus({
      headSha: HEAD,
      reviews: [restReview({ login: 'luciocabrera' })],
    });
    expect(status.state).toBe('pending');
  });

  it('is not success when the only review naming the head was dismissed', () => {
    const status = decideReviewStatus({
      headSha: HEAD,
      reviews: [
        restReview({ commit: EARLIER, submitted: '2026-08-14T08:20:53Z' }),
        restReview({ state: 'DISMISSED', submitted: '2026-08-14T08:47:27Z' }),
      ],
    });
    expect(status.state).toBe('pending');
  });

  it('drops back off success when the head moves past a reviewed commit', () => {
    const reviews = [restReview({ commit: EARLIER })];
    expect(decideReviewStatus({ headSha: EARLIER, reviews }).state).toBe(
      'success',
    );
    expect(decideReviewStatus({ headSha: HEAD, reviews }).state).toBe(
      'pending',
    );
  });

  it('stays pending when the head is rewound to an older reviewed commit', () => {
    // A force-push back to an already-reviewed commit leaves the newest review
    // naming something else. Pending, not success — `review_on_push` re-reviews
    // the rewound head, so this resolves on its own rather than deadlocking.
    const status = decideReviewStatus({
      headSha: EARLIER,
      reviews: [
        restReview({ commit: EARLIER, submitted: '2026-08-14T08:20:53Z' }),
        restReview({ commit: HEAD, submitted: '2026-08-14T08:47:27Z' }),
      ],
    });
    expect(status.state).toBe('pending');
  });
});

describe('a review arriving against a commit that is no longer the head', () => {
  it('fails rather than waits — nothing further is coming on its own', () => {
    const stale = restReview({ commit: EARLIER });
    const status = decideReviewStatus({
      headSha: HEAD,
      reviews: [stale],
      triggeringReview: stale,
    });
    expect(status.state).toBe('failure');
    expect(status.description).toContain('no longer the head');
  });

  it('still succeeds when a newer Copilot review covers the head', () => {
    const stale = restReview({
      commit: EARLIER,
      submitted: '2026-08-14T08:20:53Z',
    });
    const fresh = restReview({ submitted: '2026-08-14T08:47:27Z' });
    expect(
      decideReviewStatus({
        headSha: HEAD,
        reviews: [stale, fresh],
        triggeringReview: stale,
      }).state,
    ).toBe('success');
  });

  it('waits instead of failing when the trigger was a human review', () => {
    const human = restReview({ commit: EARLIER, login: 'luciocabrera' });
    expect(
      decideReviewStatus({
        headSha: HEAD,
        reviews: [human],
        triggeringReview: human,
      }).state,
    ).toBe('pending');
  });
});

describe('the status it publishes', () => {
  it('names a state and a reason for every input, including no reviews', () => {
    const cases = [
      { headSha: HEAD },
      { headSha: HEAD, isDraft: true },
      { headSha: HEAD, reviews: [restReview()] },
      { headSha: HEAD, reviews: [restReview({ commit: EARLIER })] },
      {
        headSha: HEAD,
        reviews: [restReview({ commit: EARLIER })],
        triggeringReview: restReview({ commit: EARLIER }),
      },
    ];
    for (const input of cases) {
      const status = decideReviewStatus(input);
      expect(['success', 'pending', 'failure']).toContain(status.state);
      expect(status.description.length).toBeGreaterThan(0);
      expect(status.description.length).toBeLessThanOrEqual(DESCRIPTION_LIMIT);
    }
  });

  it('says a draft is waiting on being marked ready, not on Copilot', () => {
    expect(
      decideReviewStatus({ headSha: HEAD, isDraft: true }).description,
    ).toContain('marked ready');
  });

  it('publishes under the context the ruleset would require by name', () => {
    expect(STATUS_CONTEXT).toBe('Copilot review complete');
  });
});
