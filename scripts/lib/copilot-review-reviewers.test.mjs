import { describe, expect, it } from 'vite-plus/test';

import {
  decideReviewStatus,
  isAcceptedReviewer,
  isCopilotReviewer,
} from './copilot-review.mjs';
import {
  claudeReview,
  EARLIER,
  HEAD,
  restReview,
} from './copilot-review-fixtures.mjs';

// The reviewer set half of the gate, split from `./copilot-review.test.mjs` when
// that file crossed the 350-line ceiling `vp run scripts:verify` enforces. The
// seam is a real one rather than an arbitrary cut: everything here is about WHO
// counts, and everything left there is about WHICH COMMIT was reviewed.
//
// Both halves are written to be able to fail. Removing the second reviewer from
// `ACCEPTED_REVIEWERS` fails nine of the assertions below; reverting the
// per-reviewer comparison to newest-across-the-set fails two more.

describe('which reviewers the gate accepts', () => {
  it('accepts both named reviewers, in either API spelling', () => {
    expect(isAcceptedReviewer('copilot-pull-request-reviewer[bot]')).toBe(true);
    expect(isAcceptedReviewer('copilot-pull-request-reviewer')).toBe(true);
    expect(isAcceptedReviewer('github-actions[bot]')).toBe(true);
    expect(isAcceptedReviewer('github-actions')).toBe(true);
  });

  it('accepts nobody else — the set is names, not a shape', () => {
    // Each of these would be admitted by a rule the accepted set deliberately
    // does not use: a `[bot]` suffix test, a substring match, a regex over bot
    // logins. A new reviewer has to be an edit someone made on purpose.
    expect(isAcceptedReviewer('dependabot[bot]')).toBe(false);
    expect(isAcceptedReviewer('sonarqubecloud[bot]')).toBe(false);
    expect(isAcceptedReviewer('github-actions-runner[bot]')).toBe(false);
    expect(isAcceptedReviewer('not-github-actions')).toBe(false);
    expect(isAcceptedReviewer('luciocabrera')).toBe(false);
    expect(isAcceptedReviewer(undefined)).toBe(false);
  });

  it('keeps the Copilot test narrow, because the suppressed reader depends on it', () => {
    // `copilot-suppressed.mjs` parses Copilot's own review markup, which no other
    // reviewer emits. Widening this would send it hunting for a `Suppressed
    // comments` block in reviews that never contain one.
    expect(isCopilotReviewer('copilot-pull-request-reviewer[bot]')).toBe(true);
    expect(isCopilotReviewer('github-actions[bot]')).toBe(false);
  });
});

describe('two accepted reviewers', () => {
  it('is success when only Copilot has reviewed the head', () => {
    const status = decideReviewStatus({
      headSha: HEAD,
      reviews: [restReview()],
    });
    expect(status.state).toBe('success');
    expect(status.reviewer).toBe('copilot-pull-request-reviewer[bot]');
  });

  it('is success when only the Claude reviewer has reviewed the head', () => {
    const status = decideReviewStatus({
      headSha: HEAD,
      reviews: [claudeReview()],
    });
    expect(status.state).toBe('success');
    expect(status.reviewer).toBe('github-actions[bot]');
  });

  it('is success when both have reviewed and the newest names the head', () => {
    const status = decideReviewStatus({
      headSha: HEAD,
      reviews: [
        restReview({ commit: EARLIER, submitted: '2026-08-20T09:00:00Z' }),
        claudeReview({ submitted: '2026-08-20T10:15:11Z' }),
      ],
    });
    expect(status.state).toBe('success');
    expect(status.reviewer).toBe('github-actions[bot]');
  });

  it('is SUCCESS when one reviewer covered the head and the OTHER later reviewed an older commit', () => {
    // The behaviour worth arguing about, so it is in the name rather than left to
    // be inferred. This is what a slow reviewer looks like: the head was reviewed,
    // and a re-review requested before the last push arrives afterwards, naming
    // the commit it was asked about. The head is covered — saying otherwise
    // contradicts what this status asserts, and would fire on an ordinary
    // sequence the day Copilot's credits return.
    const status = decideReviewStatus({
      headSha: HEAD,
      reviews: [
        restReview({ commit: HEAD, submitted: '2026-08-20T09:00:00Z' }),
        claudeReview({ commit: EARLIER, submitted: '2026-08-20T10:15:11Z' }),
      ],
    });
    expect(status.state).toBe('success');
    expect(status.reviewer).toBe('copilot-pull-request-reviewer[bot]');
  });

  it("is pending when a reviewer's OWN newest review moved off the head", () => {
    // The other half of per-reviewer, and the half that keeps #671 blocked: one
    // reviewer covering the head is not the same as one reviewer having covered
    // it at some point. Copilot reviewed the head and then reviewed something
    // else; its newest names the later commit, and nothing covers the head.
    const status = decideReviewStatus({
      headSha: HEAD,
      reviews: [
        restReview({ commit: HEAD, submitted: '2026-08-20T09:00:00Z' }),
        restReview({ commit: EARLIER, submitted: '2026-08-20T10:15:11Z' }),
      ],
    });
    expect(status.state).toBe('pending');
  });

  it('does not let a slow reviewer turn a covered head into a failure', () => {
    // Same sequence as above, with the late review being the one that triggered
    // the run. `failure` says "waiting will not help"; it must not be reported
    // about a head another accepted reviewer has already covered.
    const late = claudeReview({
      commit: EARLIER,
      submitted: '2026-08-20T10:15:11Z',
    });
    const status = decideReviewStatus({
      headSha: HEAD,
      reviews: [
        restReview({ commit: HEAD, submitted: '2026-08-20T09:00:00Z' }),
        late,
      ],
      triggeringReview: late,
    });
    expect(status.state).toBe('success');
  });

  it('is pending when neither reviewer has ever reviewed', () => {
    const status = decideReviewStatus({ headSha: HEAD, reviews: [] });
    expect(status.state).toBe('pending');
    expect(status.reviewer).toBeUndefined();
    expect(status.description).toContain('Waiting for a review');
  });

  it('is not satisfied by an unaccepted author who reviewed the head', () => {
    // The whole point of a named set: a reviewer nobody chose does not count,
    // however plausible its login looks next to one that does.
    for (const login of [
      'luciocabrera',
      'dependabot[bot]',
      'sonarqubecloud[bot]',
      'github-actions-runner[bot]',
    ]) {
      expect(
        decideReviewStatus({ headSha: HEAD, reviews: [restReview({ login })] })
          .state,
      ).toBe('pending');
    }
  });

  it('names the reviewer that satisfied it, so a monoculture cannot go unnoticed', () => {
    // If Copilot stops reviewing entirely, every pull request should say so on
    // its face rather than reading the same as it always did.
    expect(
      decideReviewStatus({ headSha: HEAD, reviews: [claudeReview()] })
        .description,
    ).toBe('Reviewed by github-actions[bot] at dd8fb78, the current head.');
    expect(
      decideReviewStatus({ headSha: HEAD, reviews: [restReview()] })
        .description,
    ).toBe(
      'Reviewed by copilot-pull-request-reviewer[bot] at dd8fb78, the current head.',
    );
  });

  it('names the reviewer whose stale review is still waiting', () => {
    expect(
      decideReviewStatus({
        headSha: HEAD,
        reviews: [claudeReview({ commit: EARLIER })],
      }).description,
    ).toBe(
      'github-actions[bot] last reviewed ff868c6; waiting for a review of dd8fb78.',
    );
  });

  it('fails on a stale trigger only once BOTH reviewers have spoken', () => {
    const stale = claudeReview({ commit: EARLIER });
    const status = decideReviewStatus({
      headSha: HEAD,
      reviews: [restReview({ commit: EARLIER }), stale],
      triggeringReview: stale,
    });
    expect(status.state).toBe('failure');
    expect(status.reviewer).toBe('github-actions[bot]');
    expect(status.description).toContain('no longer the head');
  });

  it('waits instead of failing while an accepted reviewer has not spoken yet', () => {
    // The ordering the per-reviewer comparison does not cover, and the reason
    // `failure` needs the extra precondition: a push lands, the in-workflow
    // reviewer is still running, and Copilot's re-review of the PREVIOUS commit
    // arrives first and fires the gate. Reporting `failure` there would claim
    // waiting cannot help while the review that helps is being written — and it
    // would stick, because the review that follows creates no workflow run.
    const staleCopilot = restReview({ commit: EARLIER });
    const status = decideReviewStatus({
      headSha: HEAD,
      reviews: [staleCopilot],
      triggeringReview: staleCopilot,
    });
    expect(status.state).toBe('pending');
  });
});
