import { describe, expect, it } from 'vite-plus/test';

import {
  agentBody,
  definiteNotMet,
  describeJudgement,
  judgeFixture,
  renderDispatch,
  runCount,
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
      reports: [caught, caught],
    });
    expect(judgement.matched && judgement.stable).toBe(true);
  });

  it('fails a violation the verifier missed', () => {
    expect(
      judgeFixture({
        expectedNotMet: [3],
        fixture: 'f',
        reports: [clean, clean],
      }).matched,
    ).toBe(false);
  });

  it('fails a plain PASS, which a run with no tools cannot have earned', () => {
    expect(
      judgeFixture({
        expectedNotMet: [],
        fixture: 'clean',
        reports: [report('PASS', [])],
      }).matched,
    ).toBe(false);
  });

  it('marks runs that disagree as unstable', () => {
    const judgement = judgeFixture({
      expectedNotMet: [3],
      fixture: 'f',
      reports: [caught, clean],
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
    expect(() => runCount('0')).toThrow(
      '--runs must be a whole number of at least 1, got "0"',
    );
    expect(() => runCount('two')).toThrow('got "two"');
  });
});
