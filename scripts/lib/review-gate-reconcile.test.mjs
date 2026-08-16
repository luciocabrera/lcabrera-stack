import { describe, expect, it } from 'vite-plus/test';

import {
  openPullRequestNumbers,
  outcomeLine,
  publishedStatus,
  shouldPublishStatus,
  sweepSummary,
} from './review-gate-reconcile.mjs';

// The sweep exists to correct a status nobody recomputed, so every assertion
// here is written to be able to fail on the shape that would make it useless:
// a selection that leaked a head SHA, a "publish" decision that always says
// yes (the sweep then rewrites every status every half hour and idempotence is
// a claim rather than a property), and one that always says no (the sweep
// corrects nothing and looks exactly as healthy).

const HEAD = 'ba4876dc51c6eb0f55401d60676e4fb215f4c015';
const CONTEXT = 'Copilot review complete';

/** One entry of the combined-status payload for a commit. */
const statusEntry = ({
  context = CONTEXT,
  created = '2026-08-16T09:00:00Z',
  description = 'Waiting for Copilot review of ba4876d.',
  state = 'pending',
} = {}) => ({ context, created_at: created, description, state });

describe('choosing what to sweep', () => {
  it('flattens the pages gh --slurp returns, ascending and deduped', () => {
    expect(
      openPullRequestNumbers([
        [{ number: 738 }, { number: 735 }],
        [{ number: 735 }, { number: 617 }],
      ]),
    ).toEqual([617, 735, 738]);
  });

  it('hands on numbers only, never the head SHA sitting beside them', () => {
    // The load-bearing one. A SHA read here and used later is a SHA that can
    // stop being the head between the listing and the publish, which is the one
    // way a reconcile could publish a stale verdict of its own.
    const selected = openPullRequestNumbers([
      [{ head: { sha: HEAD }, number: 738 }],
    ]);
    expect(selected).toEqual([738]);
    expect(JSON.stringify(selected)).not.toContain(HEAD);
  });

  it('keeps drafts and fork pull requests', () => {
    expect(
      openPullRequestNumbers([
        [
          { draft: true, number: 738 },
          { head: { repo: { fork: true } }, number: 739 },
        ],
      ]),
    ).toEqual([738, 739]);
  });

  it('survives a payload that is not a list of pull requests', () => {
    expect(openPullRequestNumbers(undefined)).toEqual([]);
    expect(
      openPullRequestNumbers([[{ number: 0 }, { number: null }, {}]]),
    ).toEqual([]);
  });
});

describe('reading what is already published', () => {
  it('finds the entry for the context and lowercases its state', () => {
    expect(
      publishedStatus(
        {
          statuses: [
            statusEntry({ context: 'Other' }),
            statusEntry({ state: 'SUCCESS' }),
          ],
        },
        CONTEXT,
      ),
    ).toEqual({
      description: 'Waiting for Copilot review of ba4876d.',
      state: 'success',
    });
  });

  it('takes the newest when a context somehow appears twice', () => {
    expect(
      publishedStatus(
        {
          statuses: [
            statusEntry({
              created: '2026-08-16T09:00:00Z',
              description: 'old',
            }),
            statusEntry({
              created: '2026-08-16T10:00:00Z',
              description: 'new',
            }),
          ],
        },
        CONTEXT,
      ).description,
    ).toBe('new');
  });

  it('is undefined when nothing is published under that context', () => {
    expect(publishedStatus({ statuses: [] }, CONTEXT)).toBeUndefined();
    expect(publishedStatus(undefined, CONTEXT)).toBeUndefined();
  });
});

describe('deciding whether to publish', () => {
  const pending = {
    description: 'Waiting for Copilot review of ba4876d.',
    state: 'pending',
  };
  const success = {
    description: 'Copilot reviewed ba4876d, the current head.',
    state: 'success',
  };

  it('publishes when the head carries no status for the context yet', () => {
    expect(shouldPublishStatus({ current: undefined, next: pending })).toBe(
      true,
    );
  });

  it('corrects a status the missed event left behind', () => {
    expect(shouldPublishStatus({ current: pending, next: success })).toBe(true);
  });

  it('publishes nothing when the head already says exactly this', () => {
    // Idempotence, and "a pull request with no reviews is unaffected" — both are
    // this one rule. The event path already published the waiting state; the
    // sweep recomputes it and has nothing to add.
    expect(shouldPublishStatus({ current: pending, next: pending })).toBe(
      false,
    );
    expect(shouldPublishStatus({ current: success, next: success })).toBe(
      false,
    );
  });

  it('notices a description change under an unchanged state', () => {
    expect(
      shouldPublishStatus({
        current: pending,
        next: {
          description: "Copilot's latest review is of a08de9e.",
          state: 'pending',
        },
      }),
    ).toBe(true);
  });

  it('never downgrades a terminal state to pending', () => {
    // `failure` means a run WATCHED a review land against a superseded commit.
    // The sweep sees only that the newest review is not of the head, which is
    // the state that produced the failure — republishing pending over it would
    // turn a red check yellow and read as progress.
    expect(
      shouldPublishStatus({
        current: {
          description: 'Copilot reviewed a08de9e, no longer the head.',
          state: 'failure',
        },
        next: pending,
      }),
    ).toBe(false);
    expect(
      shouldPublishStatus({
        current: { description: 'something went wrong', state: 'error' },
        next: pending,
      }),
    ).toBe(false);
  });

  it('still upgrades a terminal state once the review catches up', () => {
    expect(
      shouldPublishStatus({
        current: {
          description: 'Copilot reviewed a08de9e, no longer the head.',
          state: 'failure',
        },
        next: success,
      }),
    ).toBe(true);
  });

  it('publishes nothing when nothing was computed', () => {
    expect(shouldPublishStatus({ current: pending, next: undefined })).toBe(
      false,
    );
    expect(shouldPublishStatus()).toBe(false);
  });
});

describe('what the sweep reports', () => {
  it('marks a failed gate run so it cannot be skimmed past', () => {
    expect(
      outcomeLine({
        gate: 'copilot-review',
        number: 738,
        ok: false,
        output: 'gh api failed',
      }),
    ).toBe('#738 copilot-review: FAILED — gh api failed');
  });

  it('counts what it swept, so "swept nothing" cannot look like "all clear"', () => {
    const summary = sweepSummary({
      pullRequests: [735, 738],
      results: [
        { gate: 'copilot-review', number: 735, ok: true, output: 'ok' },
        { gate: 'agent-review', number: 735, ok: false, output: 'boom' },
      ],
    });
    expect(summary.failures).toHaveLength(1);
    expect(summary.text).toContain('2 pull request(s)');
    expect(summary.text).toContain('1 failure(s)');
  });

  it('says zero out loud rather than reporting an empty success', () => {
    expect(sweepSummary({ pullRequests: [], results: [] }).text).toContain(
      'Reconciled 0 pull request(s)',
    );
  });
});
