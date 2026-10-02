import { describe, expect, it } from 'vite-plus/test';

import {
  agentBody,
  definiteNotMet,
  describeJudgement,
  judgeFixture,
  renderDispatch,
  runCount,
  sessionProblem,
  verdictOf,
  withoutSeparator,
} from './verifier-fixtures.mjs';

const report = (verdict, rows) =>
  [
    `VERDICT: ${verdict}`,
    '',
    '| # | Criterion | Outcome | Method | Falsifier |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');

describe('agentBody', () => {
  it('drops the frontmatter and keeps the body verbatim', () => {
    expect(
      agentBody('---\nname: x\ntools:\n  - Bash\n---\n\nYou certify.\n'),
    ).toBe('\nYou certify.\n');
  });
});

describe('renderDispatch', () => {
  it('fills each slot once, and does not read $ in a diff as a pattern', () => {
    expect(
      renderDispatch({
        contract: 'C',
        diff: '+`${min}` $&\n',
        issue: ' I ',
        template: '{{ issue }}/{{ diff }}/{{ contract }}',
      }),
    ).toBe('I/+`${min}` $&/C');
  });
});

describe('verdictOf', () => {
  it('reads the verdict line', () => {
    expect(verdictOf('VERDICT: FAIL\n')).toBe('FAIL');
    expect(verdictOf('**VERDICT:** FAIL')).toBeUndefined();
  });
});

describe('definiteNotMet', () => {
  it('counts a not-met outcome as a finding', () => {
    expect(
      definiteNotMet(
        report('FAIL', [
          '| 1 | Returns min | met | inspection | traced |',
          '| C3 | No suppression | **not-met** | inspection | line 12 |',
        ]),
      ),
    ).toStrictEqual([3]);
  });

  it('does not count a criterion the verifier could not check', () => {
    expect(
      definiteNotMet(
        report('FAIL', [
          '| 1 | Lint clean | not-met (unverified) | none | no tools |',
        ]),
      ),
    ).toStrictEqual([]);
  });

  it('reads the outcome cell, not a remark in the evidence cell', () => {
    expect(
      definiteNotMet(
        report('FAIL', [
          "| 3 | Lint clean | **not-met** | inspection | found a disable; I couldn't run Oxlint |",
        ]),
      ),
    ).toStrictEqual([3]);
  });

  it('reads the outcome cell, not a later cell that quotes the schema', () => {
    expect(
      definiteNotMet(
        report('FAIL', [
          '| 3 | Lint clean | **unverified** | none | the schema only allows `met` or `not-met` |',
        ]),
      ),
    ).toStrictEqual([]);
  });

  it('ignores tables that are not the criteria table', () => {
    expect(
      definiteNotMet(report('FAIL', ['| Step 4: plant | not-met |'])),
    ).toStrictEqual([]);
  });
});

describe('judgeFixture', () => {
  const clean = report('FAIL', [
    '| 1 | Lint clean | not-met (unverified) | none | no tools |',
  ]);
  const caught = report('FAIL', [
    '| 3 | No suppression | not-met | inspection | line 12 |',
  ]);

  it('passes a violation caught on the planted criterion in every run', () => {
    const judgement = judgeFixture({
      expectedNotMet: [3],
      fixture: 'suppressed-lint',
      runs: [{ report: caught }, { report: caught }],
    });
    expect(judgement.matched && judgement.stable).toBe(true);
  });

  it('fails a violation the verifier missed', () => {
    expect(
      judgeFixture({
        expectedNotMet: [3],
        fixture: 'f',
        runs: [{ report: clean }, { report: clean }],
      }).matched,
    ).toBe(false);
  });

  it('fails a plain PASS, which a run with no tools cannot have earned', () => {
    expect(
      judgeFixture({
        expectedNotMet: [],
        fixture: 'clean',
        runs: [{ report: report('PASS', []) }],
      }).matched,
    ).toBe(false);
  });

  it('marks runs that disagree as unstable', () => {
    const judgement = judgeFixture({
      expectedNotMet: [3],
      fixture: 'f',
      runs: [{ report: caught }, { report: clean }],
    });
    expect(judgement.stable).toBe(false);
    expect(describeJudgement(judgement)).toContain('runs disagree');
  });
});

describe('arguments', () => {
  it('drops the -- that vp run passes through', () => {
    expect(withoutSeparator(['--', '--runs', '3'])).toStrictEqual([
      '--runs',
      '3',
    ]);
    expect(withoutSeparator(['--runs', '3'])).toStrictEqual(['--runs', '3']);
  });

  it('refuses a run count that would judge nothing', () => {
    expect(runCount('2')).toBe(2);
    expect(() => runCount('1')).toThrow('at least 2');
    expect(() => runCount('0')).toThrow('got "0"');
    expect(() => runCount('two')).toThrow('got "two"');
  });
});

describe('a run that could not conclude', () => {
  const clean = report('FAIL', [
    '| 1 | Lint clean | not-met (unverified) | none | no tools |',
  ]);

  it('fails the clean fixture when the session errored, though it found nothing', () => {
    expect(
      judgeFixture({
        expectedNotMet: [],
        fixture: 'clean',
        runs: [
          { report: clean },
          { error: 'the session ended with error_max_turns', report: '' },
        ],
      }).matched,
    ).toBe(false);
  });

  it('fails a report with no verdict line', () => {
    expect(
      judgeFixture({
        expectedNotMet: [],
        fixture: 'clean',
        runs: [{ report: '| 1 | a | met |' }],
      }).matched,
    ).toBe(false);
  });

  it('fails any verdict that starts with PASS, prose or not', () => {
    for (const verdict of [
      'PASS — every criterion met',
      'PASS (inspection-only)',
    ]) {
      expect(
        judgeFixture({
          expectedNotMet: [],
          fixture: 'clean',
          runs: [{ report: report(verdict, []) }],
        }).matched,
      ).toBe(false);
    }
  });
});

describe('sessionProblem', () => {
  const init = (tools) => ({ subtype: 'init', tools, type: 'system' });
  const success = { subtype: 'success', type: 'result' };

  it('accepts a session with no tools that ended in success', () => {
    expect(sessionProblem([init([]), success])).toBeUndefined();
  });

  it('names the tools when the no-tools option did not take', () => {
    expect(sessionProblem([init(['Bash', 'Read']), success])).toBe(
      'the session held Bash, Read',
    );
  });

  it('reports a session that did not finish, or never said what it held', () => {
    expect(
      sessionProblem([
        init([]),
        { is_error: true, subtype: 'error_max_turns', type: 'result' },
      ]),
    ).toBe('the session ended with error_max_turns');
    expect(sessionProblem([init([])])).toBe('the session ended with no result');
    expect(sessionProblem([success])).toBe('the session reported no tools');
  });
});
