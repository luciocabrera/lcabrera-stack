import { describe, expect, it } from 'vite-plus/test';

import { findingLine } from './findingLine.util.ts';

const labels = { a: 'main', b: 'feat/x' };

describe('findingLine', () => {
  it('gives the rate and the lower bound it fell below', () => {
    expect(
      findingLine({
        finding: {
          kind: 'rate',
          main: { k: 12, kind: 'rate', lower: 0.757, n: 12, rate: 1, upper: 1 },
          pr: {
            k: 9,
            kind: 'rate',
            lower: 0.47,
            n: 12,
            rate: 0.75,
            upper: 0.91,
          },
        },
        labels,
      }),
    ).toBe(
      "- the suite pass rate: 75.0% on feat/x, below 75.7%, the lower bound of main's Wilson interval",
    );
  });

  it('names the subject and the task of a flip', () => {
    expect(
      findingLine({
        finding: {
          failed: 2,
          kind: 'flip',
          subject: { kind: 'skill', name: 'epic' },
          taskKey: 'epic/trigger',
          trials: 3,
        },
        labels,
      }),
    ).toBe(
      '- skill `epic`: `epic/trigger` failed 2 of 3 counted trials on feat/x after passing every trial on main',
    );
  });

  it('gives the mean and the threshold of a scored finding', () => {
    expect(
      findingLine({
        finding: {
          kind: 'mean',
          mean: 3,
          subject: { kind: 'skill', name: 'unslop' },
          threshold: 3.5,
        },
        labels,
      }),
    ).toBe(
      '- skill `unslop`: mean judge score 3.00 on feat/x, below 3.50, the baseline mean less `scored.sigma` standard deviations',
    );
  });
});
