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
// counts — including recognising each reviewer, and keeping `isCopilotReviewer`
// narrower than the accepted set — and everything left there is about WHICH COMMIT
// was reviewed.
//
// Both halves are written to be able to fail. Removing the second reviewer from
// `ACCEPTED_REVIEWERS` fails nine of the assertions below; reverting the
// per-reviewer comparison to newest-across-the-set fails two more.

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

describe('which reviewers the gate accepts', () => {
  it('accepts both named reviewers, in either API spelling', () => {
    expect(isAcceptedReviewer('copilot-pull-request-reviewer[bot]')).toBe(true);
    expect(isAcceptedReviewer('copilot-pull-request-reviewer')).toBe(true);
    expect(isAcceptedReviewer('claude-general-reviewer[bot]')).toBe(true);
    expect(isAcceptedReviewer('claude-general-reviewer')).toBe(true);
  });

  it('no longer accepts the shared GITHUB_TOKEN identity', () => {
    expect(isAcceptedReviewer('github-actions[bot]')).toBe(false);
    expect(isAcceptedReviewer('github-actions')).toBe(false);
  });

  it('accepts nobody else — the set is names, not a shape', () => {
    expect(isAcceptedReviewer('dependabot[bot]')).toBe(false);
    expect(isAcceptedReviewer('sonarqubecloud[bot]')).toBe(false);
    expect(isAcceptedReviewer('github-actions-runner[bot]')).toBe(false);
    expect(isAcceptedReviewer('not-github-actions')).toBe(false);
    expect(isAcceptedReviewer('luciocabrera')).toBe(false);
    expect(isAcceptedReviewer(undefined)).toBe(false);
  });

  it('keeps the Copilot test narrow, because the suppressed reader depends on it', () => {
    expect(isCopilotReviewer('copilot-pull-request-reviewer[bot]')).toBe(true);
    expect(isCopilotReviewer('claude-general-reviewer[bot]')).toBe(false);
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
    expect(status.reviewer).toBe('claude-general-reviewer[bot]');
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
    expect(status.reviewer).toBe('claude-general-reviewer[bot]');
  });

  it('is SUCCESS when one reviewer covered the head and the OTHER later reviewed an older commit', () => {
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
    expect(
      decideReviewStatus({ headSha: HEAD, reviews: [claudeReview()] })
        .description,
    ).toBe(
      'Reviewed by claude-general-reviewer[bot] at dd8fb78, the current head.',
    );
    expect(
      decideReviewStatus({ headSha: HEAD, reviews: [restReview()] })
        .description,
    ).toBe(
      'Reviewed by copilot-pull-request-reviewer[bot] at dd8fb78, the current head.',
    );
  });

  it('names the most recent coverer when both reviewers covered the head', () => {
    const copilot = restReview({ submitted: '2026-08-20T09:00:00Z' });
    const claude = claudeReview({ submitted: '2026-08-20T10:15:11Z' });
    for (const reviews of [
      [copilot, claude],
      [claude, copilot],
    ]) {
      expect(decideReviewStatus({ headSha: HEAD, reviews }).reviewer).toBe(
        'claude-general-reviewer[bot]',
      );
    }
  });

  it('names the reviewer whose stale review is still waiting', () => {
    expect(
      decideReviewStatus({
        headSha: HEAD,
        reviews: [claudeReview({ commit: EARLIER })],
      }).description,
    ).toBe(
      'claude-general-reviewer[bot] last reviewed ff868c6; waiting for a review of dd8fb78.',
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
    expect(status.reviewer).toBe('claude-general-reviewer[bot]');
    expect(status.description).toContain('no longer the head');
  });

  it('waits instead of failing while an accepted reviewer has not spoken yet', () => {
    const staleCopilot = restReview({ commit: EARLIER });
    const status = decideReviewStatus({
      headSha: HEAD,
      reviews: [staleCopilot],
      triggeringReview: staleCopilot,
    });
    expect(status.state).toBe('pending');
  });
});
