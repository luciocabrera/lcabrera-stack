/**
 * The sweep's wiring: the argv it hands each gate, and the call sites that turn
 * a `--pr` into a number. Split from `review-gate-reconcile.test.mjs`, which
 * owns the decisions those arguments feed.
 *
 * Every assertion here is written to fail on a shape that is invisible in the
 * outcome of getting it wrong — a flag that stopped being passed, or a parser
 * that stopped being called, both leave a sweep that still reports "ok".
 */
import { describe, expect, it } from 'vite-plus/test';

import { gateArgs, PROTECT_SUCCESS_FLAG } from './review-gate-reconcile.mjs';
import { readRepoFile } from './workflow-inspect.mjs';

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
      repository: 'luciocabrera/lcabrera-stack',
      script: '/repo/scripts/copilot-review-status.mjs',
    });

  it('is exactly this, so a silent addition or removal shows up here', () => {
    expect(args()).toEqual([
      '/repo/scripts/copilot-review-status.mjs',
      '--pr',
      '738',
      '--repo',
      'luciocabrera/lcabrera-stack',
      '--if-changed',
    ]);
  });

  it('always passes --if-changed, which IS the sweep’s idempotence', () => {
    expect(args()).toContain('--if-changed');
  });

  it('tells the gate which repository the sweep listed', () => {
    const argv = args();
    expect(argv[argv.indexOf('--repo') + 1]).toBe(
      'luciocabrera/lcabrera-stack',
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

  it('is exactly this when a gate opts in, so the flag cannot go missing', () => {
    expect(
      gateArgs({
        number: 738,
        protectSuccess: true,
        repository: 'luciocabrera/lcabrera-stack',
        script: '/repo/scripts/copilot-review-status.mjs',
      }),
    ).toEqual([
      '/repo/scripts/copilot-review-status.mjs',
      '--pr',
      '738',
      '--repo',
      'luciocabrera/lcabrera-stack',
      '--if-changed',
      PROTECT_SUCCESS_FLAG,
    ]);
  });

  it('hands the gate the flag the gate itself reads', () => {
    // The two sides used to spell the string separately, and a rename of either
    // one left the whole suite green while every gate quietly went unprotected
    // — the argv test above asserts the default, and the roster test only reads
    // the text of `GATES`. Sharing the constant is what fixes it; this asserts
    // the read side still reads it rather than growing its own copy back.
    const source = readRepoFile('scripts/lib/review-gate-status.mjs');
    expect(source).toMatch(
      /protectSuccess:\s*process\.argv\.includes\(PROTECT_SUCCESS_FLAG\)/,
    );
    expect(source).not.toMatch(/'--protect-success'/);
  });

  it('only lets a gate opt in if its script can read the flag', () => {
    // `--protect-success` is read inside `publishGateStatus`. A gate that posts
    // its own status instead — `verify-agent-review.mjs` does — would take the
    // flag and ignore it, which is the same silent no-op this flag already had
    // once. The roster test next door pins WHICH gates opt in; this pins that
    // opting in can do anything at all.
    const sweep = readRepoFile('scripts/reconcile-review-gates.mjs');
    const optedIn = [...sweep.matchAll(/\{[^}]*script:\s*'([\w.-]+)'[^}]*\}/gu)]
      .filter((entry) => entry[0].includes('protectSuccess'))
      .map((entry) => entry[1]);

    expect(optedIn).not.toHaveLength(0);
    for (const script of optedIn) {
      expect(readRepoFile(`scripts/${script}`)).toContain('publishGateStatus');
    }
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
