import { describe, expect, it } from 'vite-plus/test';

import {
  gateArgs,
  openPullRequestNumbers,
  outcomeLine,
  publishedStatus,
  shouldPublishStatus,
  sweepSummary,
} from './review-gate-reconcile.mjs';
import { readRepoFile } from './workflow-inspect.mjs';

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

describe('the argv the sweep hands each gate', () => {
  // Asserted on the ARGV rather than on the effect, deliberately: both entries
  // below are invisible in the outcome of getting them wrong — a sweep missing
  // `--if-changed` still reports "ok" on every line while quietly re-posting an
  // identical status every pass, and one missing `--repo` still works whenever
  // the gate happens to resolve the same repository by itself. An end-to-end
  // test would need a live pull request and would still not fail on the second.
  const args = () =>
    gateArgs({
      number: 738,
      repository: 'luciocabrera/vite-react-compiler',
      script: '/repo/scripts/copilot-review-status.mjs',
    });

  it('is exactly this, so a silent addition or removal shows up here', () => {
    expect(args()).toEqual([
      '/repo/scripts/copilot-review-status.mjs',
      '--pr',
      '738',
      '--repo',
      'luciocabrera/vite-react-compiler',
      '--if-changed',
    ]);
  });

  it('always passes --if-changed, which IS the sweep’s idempotence', () => {
    expect(args()).toContain('--if-changed');
  });

  it('tells the gate which repository the sweep listed', () => {
    const argv = args();
    expect(argv[argv.indexOf('--repo') + 1]).toBe(
      'luciocabrera/vite-react-compiler',
    );
  });

  it('stringifies the number, so 738 and "738" build one argv', () => {
    expect(
      gateArgs({ number: '738', repository: 'o/r', script: 's.mjs' }),
    ).toEqual(gateArgs({ number: 738, repository: 'o/r', script: 's.mjs' }));
  });

  it('appends the caller’s extra flags after its own', () => {
    expect(
      gateArgs({
        extraArgs: ['--dry-run'],
        number: 738,
        repository: 'o/r',
        script: 's.mjs',
      }).at(-1),
    ).toBe('--dry-run');
  });

  it('is what the sweep actually spawns — not a parallel definition', () => {
    // The assertions above are worth nothing if the sweep builds its own argv
    // beside them, so this pins the wiring: one child spawn in that file, and it
    // takes the argv from `gateArgs`.
    const source = readRepoFile('scripts/reconcile-review-gates.mjs');
    expect(source.match(/execFileSync\(/g)).toHaveLength(1);
    expect(source).toMatch(/execFileSync\(\s*process\.execPath,\s*args\b/);
    expect(source).toMatch(/const args = gateArgs\(/);
  });
});

// `--pr '#738'` used to become `NaN` and reach `pulls/NaN`: a 404 per gate and
// nothing naming the input. The parsers that fix it live in `cli-input.mjs` and
// are unit-tested there — but unwiring a CALL leaves those tests green, so the
// call sites are what these assert. A `parsePullNumber(` with a paren appears
// only at a call site; the import lists the name without one.
//
// The gate scripts no longer parse for themselves: `review-gate-status.mjs`
// resolves the pull request and the repository for both of them, so the call
// site moved rather than disappearing. Splitting the list keeps the property
// exact — one file must hold the calls, and a delegating gate must be shown to
// reach them rather than to have dropped them.
describe('the scripts that take a pull request on the command line', () => {
  const PARSE_DIRECTLY = [
    'scripts/reconcile-review-gates.mjs',
    'scripts/verify-agent-review.mjs',
    'scripts/lib/review-gate-status.mjs',
  ];

  const DELEGATE = [
    'scripts/copilot-review-status.mjs',
    'scripts/pr-threads.mjs',
    'scripts/verify-review-threads.mjs',
  ];

  for (const script of PARSE_DIRECTLY) {
    it(`${script} parses --pr and --repo instead of using them raw`, () => {
      const source = readRepoFile(script);
      expect(source).toMatch(/parsePullNumber\(/);
      expect(source).toMatch(/parseRepository\(/);
    });
  }

  for (const script of DELEGATE) {
    it(`${script} takes both from review-gate-status, never from argv`, () => {
      const source = readRepoFile(script);
      // Either entry point counts: the gates take the whole target through
      // `resolveGateTarget`, while `pr-threads.mjs` calls the two resolvers
      // itself because it also falls back to the current branch. What matters
      // is that the parsing happens in the shared module, not here.
      expect(source).toMatch(
        /import \{[^}]*(?:resolveGateTarget|resolvePullNumber)[^}]*\} from '\.\/lib\/review-gate-status\.mjs'/s,
      );
      // The failure this forbids: a script that reaches past the shared
      // resolver and reads the flag itself, which is how one of them would
      // drift back to an unparsed `#738`.
      expect(source).not.toMatch(/flagValue\('--pr'\)/);
      expect(source).not.toMatch(/flagValue\('--repo'\)/);
    });
  }

  it('the sweep parses both before it can read or publish anything', () => {
    // Specifically these two call sites, because the failure they prevent is a
    // sweep that runs both gates against `#NaN` — or, for a typo, one that falls
    // through and reconciles every open pull request.
    const source = readRepoFile(PARSE_DIRECTLY[0]);
    expect(source).toMatch(/parseRepository\(resolveRepository\(\)\)/);
    expect(source).toMatch(/parsePullNumber\(only\)/);
    // `\b` is load-bearing: `Number(only)` is a substring of
    // `parsePullNumber(only)`, so without it this negative can never hold — the
    // same shared-anchor mistake this file's other tests were rewritten to avoid.
    expect(source).not.toMatch(/\bNumber\(only\)/);
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

  // #868. The sweep runs from the default branch, so on a pull request that
  // changes what a gate decides it is judging that pull request with the code it
  // is replacing — measured on #866, where one head and one review list produced
  // opposite verdicts from the two copies. These pin the asymmetry: a `success`
  // can be re-described but not weakened.
  it('never weakens a success it may not have computed', () => {
    expect(shouldPublishStatus({ current: success, next: pending })).toBe(
      false,
    );
    expect(
      shouldPublishStatus({
        current: success,
        next: {
          description: 'Copilot reviewed a08de9e, no longer the head.',
          state: 'failure',
        },
      }),
    ).toBe(false);
  });

  it('still refreshes a success whose description went stale', () => {
    // Not blanket-frozen: naming a different reviewer is the signal that makes a
    // reviewer monoculture visible, so it must survive the rule above.
    expect(
      shouldPublishStatus({
        current: success,
        next: {
          description:
            'Reviewed by copilot-pull-request-reviewer[bot] at a08de9e.',
          state: 'success',
        },
      }),
    ).toBe(true);
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
