import { describe, expect, it } from 'vite-plus/test';

import {
  agentBody,
  definiteNotMet,
  describeJudgement,
  describeRun,
  judgeFixture,
  renderDispatch,
  runCount,
  verdictOf,
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

describe('describeRun', () => {
  it('says so when a run wrote no verdict line', () => {
    expect(
      describeRun({ error: undefined, notMet: [2], verdict: undefined }),
    ).toBe('not-met [2], verdict (no verdict line)');
    expect(describeRun({ error: 'boom', notMet: [] })).toBe('error: boom');
  });
});
