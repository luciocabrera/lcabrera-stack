import { describe, expect, it } from 'vite-plus/test';

import {
  regressionFindingKey,
  regressionFindingLabel,
} from './regressionFindingLabel.util';

type RateArgs = {
  readonly k: number;
  readonly lower: number;
  readonly n: number;
};

const rate = ({ k, lower, n }: RateArgs) =>
  ({ k, kind: 'rate', lower, n, rate: k / n, upper: 1 }) as const;

const REACT = { kind: 'skill', name: 'react-19' } as const;

const STORE = { kind: 'skill', name: 'store-pattern' } as const;

const FLIP = {
  failed: 2,
  kind: 'flip',
  subject: REACT,
  taskKey: 'skills/react-19/trigger-1',
  trials: 3,
} as const;

const mean = (subject: typeof REACT | typeof STORE) =>
  ({ kind: 'mean', mean: 3.2, subject, threshold: 3.5 }) as const;

describe('regressionFindingLabel', () => {
  it('names a flipped task with its subject and failed trials', () => {
    expect(regressionFindingLabel(FLIP)).toBe(
      'skill react-19: skills/react-19/trigger-1 failed 2 of 3 trials after passing every trial the run before',
    );
  });

  it('puts the suite pass rate against the lower bound of the run before', () => {
    expect(
      regressionFindingLabel({
        kind: 'rate',
        main: rate({ k: 9, lower: 0.6, n: 10 }),
        pr: rate({ k: 3, lower: 0.1, n: 10 }),
      }),
    ).toBe(
      'the suite pass rate 30% (3/10) over its non-flaky regression tasks, below 60%, the lower bound of the run before at 90% (9/10)',
    );
  });

  it('says when a side has too few trials for a rate', () => {
    expect(
      regressionFindingLabel({
        kind: 'rate',
        main: { k: 1, kind: 'insufficient', n: 2 },
        pr: { k: 0, kind: 'insufficient', n: 2 },
      }),
    ).toBe(
      'the suite pass rate 0/2, too few trials for a rate over its non-flaky regression tasks, below the run before',
    );
  });

  it("names a scored subject's mean against its threshold", () => {
    expect(regressionFindingLabel(mean(STORE))).toBe(
      'skill store-pattern: mean judge score 3.20, below 3.50, the baseline mean less 2 standard deviations',
    );
  });

  it('names the suite when a finding has no subject', () => {
    expect(regressionFindingLabel({ ...FLIP, subject: undefined })).toMatch(
      /^the suite as a whole: /u,
    );
  });
});

const RATE_FINDING = {
  kind: 'rate',
  main: rate({ k: 9, lower: 0.6, n: 10 }),
  pr: rate({ k: 3, lower: 0.1, n: 10 }),
} as const;

describe('regressionFindingKey', () => {
  it('keeps two subjects with the same kind of finding apart', () => {
    const findings = [mean(REACT), mean(STORE), FLIP, RATE_FINDING];
    const keys = findings.map((finding) => regressionFindingKey(finding));

    expect(new Set(keys).size).toBe(findings.length);
  });
});
