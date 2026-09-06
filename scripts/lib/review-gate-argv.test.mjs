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

import {
  gateArgs,
  PROTECT_SUCCESS_FLAG,
} from '../../packages/repo-standards/scripts/review-gate-reconcile.mjs';
import { readRepoFile } from './workflow-inspect.mjs';

describe('the argv the sweep hands each gate', () => {
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
    const source = readRepoFile(
      'packages/repo-standards/scripts/review-gate-status.mjs',
    );
    expect(source).toMatch(
      /protectSuccess:\s*process\.argv\.includes\(PROTECT_SUCCESS_FLAG\)/,
    );
    expect(source).not.toMatch(/'--protect-success'/);
  });

  it('only lets a gate opt in if its script can read the flag', () => {
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
    'packages/repo-standards/scripts/review-gate-status.mjs',
  ];

  const DELEGATE = [
    'scripts/copilot-review-status.mjs',
    'packages/repo-standards/scripts/pr-threads.mjs',
    'packages/repo-standards/scripts/verify-review-threads.mjs',
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
      expect(source).toMatch(
        /import \{[^}]*(?:resolveGateTarget|resolvePullNumber)[^}]*\} from '(?:\.\.\/packages\/repo-standards\/scripts|\.)\/review-gate-status\.mjs'/s,
      );
      expect(source).not.toMatch(/flagValue\('--pr'\)/);
      expect(source).not.toMatch(/flagValue\('--repo'\)/);
    });
  }

  it('the sweep parses both before it can read or publish anything', () => {
    const source = readRepoFile(PARSE_DIRECTLY[0]);
    expect(source).toMatch(/parseRepository\(resolveRepository\(\)\)/);
    expect(source).toMatch(/parsePullNumber\(only\)/);
    expect(source).not.toMatch(/\bNumber\(only\)/);
  });
});
